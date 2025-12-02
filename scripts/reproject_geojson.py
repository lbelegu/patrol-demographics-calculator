# reproject from EPSG:2264 to EPSG:4326
import geopandas as gpd

# original file is in EPSG:2264
gdf = gpd.read_file("raleigh_demographic_police_data.geojson")

# reproject to EPSG:4326 (WGS84)
gdf = gdf.to_crs(epsg=4326)

# save results
gdf.to_file("raleigh_demographic_police_data_wgs84.geojson", driver="GeoJSON")
