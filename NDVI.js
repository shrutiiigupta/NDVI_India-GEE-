// Defining the FAO/GAUL/2015/level0 dataset for India boundary
var indiaBoundary = ee.FeatureCollection('FAO/GAUL/2015/level0').filter(ee.Filter.eq('ADM0_NAME', 'India'));

// Defining the MODIS MOD09GA dataset for NDVI
var modis = ee.ImageCollection('MODIS/061/MOD09GA')
  .filterBounds(indiaBoundary)
  .select(['sur_refl_b01', 'sur_refl_b02']);

// Function to calculate NDVI
var calculateNDVI = function(image) {
  var ndvi = image.normalizedDifference(['sur_refl_b02', 'sur_refl_b01']).rename('NDVI');
  return image.addBands(ndvi);
};

// Mapping the NDVI calculation function over the MODIS dataset
var modisNDVI = modis.map(calculateNDVI);

// Defining time ranges for the summer and monsoon seasons in 2022
var summerRange = ee.DateRange('2022-04-01', '2022-06-30');
var monsoonRange = ee.DateRange('2022-07-01', '2022-09-30');

// Filtering images for the summer and monsoon seasons
var summerNDVI = modisNDVI.filterDate(summerRange);
var monsoonNDVI = modisNDVI.filterDate(monsoonRange);

// Calculating mean NDVI for each season
var summerMeanNDVI = summerNDVI.mean().select('NDVI').clip(indiaBoundary);
var monsoonMeanNDVI = monsoonNDVI.mean().select('NDVI').clip(indiaBoundary);

// Displaying the maps
Map.centerObject(indiaBoundary, 5);
Map.addLayer(indiaBoundary, {color: '000000'}, 'India Boundary');

//NDVI index ranges from -1 to +1 but we found the NDVI to range
//from -0.1 to 0.5 for India, so, we shrinked the range of NDVI
//to -0.1 to 0.5 to obtain a better and clear visualisation of the
//NDVI trend for India
Map.addLayer(summerMeanNDVI, {min: -0.1, max: 0.5, palette: ['A52A2A', 'FF0000', 'FFFF00', '228B22', '00FFFF', '0000FF']}, 'Summer Mean NDVI');
Map.addLayer(monsoonMeanNDVI, {min: -0.1, max: 0.5, palette: ['A52A2A', 'FF0000', 'FFFF00', '228B22', '00FFFF', '0000FF']}, 'Monsoon Mean NDVI');

// Printing the mean NDVI values
print('Summer Mean NDVI:', summerMeanNDVI);
print('Monsoon Mean NDVI:', monsoonMeanNDVI);

// Adding map legend
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px'
  }
});

var legend2 = ui.Label({
  value: 'Legend (NDVI)',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});

legend.add(legend2);

// Creating the content of the legend
var content = function(color, label) {
  
      // Creating the color boxes
      var box = ui.Label({
        style: {
          backgroundColor: '#' + color,
          
          // Setting box height and width
          padding: '9px',
          margin: '0 0 4px 0'
        }
      });
      
      // Creating the labels
      var labels = ui.Label({
        value: label,
        style: {margin: '0 0 4px 6px'}
      });
      
      return ui.Panel({
        widgets: [box, labels],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};

//  Setting legend colors
var classcolor = ['A52A2A', 'FF0000', 'FFFF00', '228B22', '00FFFF', '0000FF'];

// Setting legend labels
var labelName = ['<=0', '0 - 0.1', '0.1 - 0.2', '0.2 - 0.3', '0.3 - 0.4', '0.4 - 0.5'];

// Combining legend colour and labels
for (var i = 0; i < 6; i++) {
  legend.add(content(classcolor[i], labelName[i]));
  }  
  
// Adding legend to the map
Map.add(legend);

// Creating a time-series chart for NDVI with a lower scale
var chartSummer = ui.Chart.image.series({
  imageCollection: summerNDVI.select('NDVI'),
  region: indiaBoundary,
  reducer: ee.Reducer.mean(),
  scale: 4000, // Using a lower scale
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Summer NDVI Time Series',
  vAxis: {title: 'NDVI'},
  hAxis: {title: 'Date'},
});

var chartMonsoon = ui.Chart.image.series({
  imageCollection: monsoonNDVI.select('NDVI'),
  region: indiaBoundary,
  reducer: ee.Reducer.mean(),
  scale: 4000, // Using a lower scale
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Monsoon NDVI Time Series',
  vAxis: {title: 'NDVI'},
  hAxis: {title: 'Date'},
});

// Displaying the charts
print(chartSummer);
print(chartMonsoon);

// Exporting the final NDVI images to Google Drive
Export.image.toDrive({
  image: summerMeanNDVI,
  description: 'Summer_NDVI_2022',
  scale: 5000,
  region: indiaBoundary,
  folder: 'NDVI_Export',
  crs: 'EPSG:4326'
});

Export.image.toDrive({
  image: monsoonMeanNDVI,
  description: 'Monsoon_NDVI_2022',
  scale: 5000,
  region: indiaBoundary,
  folder: 'NDVI_Export',
  crs: 'EPSG:4326'
});