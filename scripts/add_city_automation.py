import os
import sys
import argparse
import requests
import zipfile
import io
import json
import re
import datetime
from pathlib import Path
import geopandas as gpd

# Adjust path to import sibling scripts
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

import dwnld_census_block_groups
import process_city

def download_file(url, target_folder):
    print(f"Downloading data from {url}...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers)
        r.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to download file: {e}")
        sys.exit(1)

    # Check content type or extension from url
    content_type = r.headers.get('Content-Type', '')
    
    target_file = target_folder / "police_districts.geojson"
    
    if "zip" in content_type or url.lower().endswith(".zip"):
        print("Detected ZIP file. Extracting...")
        try:
            z = zipfile.ZipFile(io.BytesIO(r.content))
            extract_dir = target_folder / "temp_extract"
            extract_dir.mkdir(exist_ok=True)
            z.extractall(extract_dir)
            
            # Find a likely spatial file (.shp, .geojson, .json)
            candidates = list(extract_dir.rglob("*.shp")) + \
                         list(extract_dir.rglob("*.geojson")) + \
                         list(extract_dir.rglob("*.json"))
            
            if not candidates:
                print("❌ No useable spatial file found in ZIP.")
                sys.exit(1)
            
            # Prefer .shp if multiple
            shp_files = [f for f in candidates if f.suffix == '.shp']
            file_to_use = shp_files[0] if shp_files else candidates[0]
            
            print(f"Converting {file_to_use.name} to GeoJSON...")
            gdf = gpd.read_file(file_to_use)
            gdf.to_crs(epsg=4326).to_file(target_file, driver='GeoJSON')
            
            # Cleanup
            import shutil
            shutil.rmtree(extract_dir)
            
        except zipfile.BadZipFile:
            print("❌ File appeared to be a zip but failed to open.")
            sys.exit(1)
    else:
        # Assume it's GeoJSON or direct file readable by geopandas
        print("Assuming direct spatial file (GeoJSON/JSON)...")
        with open(target_file, 'wb') as f:
            f.write(r.content)
            
        # Verify valid geojson
        try:
            gpd.read_file(target_file)
        except Exception:
            print("❌ Downloaded file is not valid spatial data.")
            # target_file.unlink()
            sys.exit(1)

    print(f"✅ Saved to {target_file}")

def update_frontend_config(state, city, source_url, source_date, district_field):
    print("Updating src/cities.js...")
    
    # Load the processed result to get centroid
    result_file = Path("public") / "results" / state / f"{city.lower().replace(' ', '_')}.geojson"
    if not result_file.exists():
        print(f"❌ Could not find result file: {result_file}")
        sys.exit(1)
        
    gdf = gpd.read_file(result_file)
    # create a simple centroid for the map view
    # use a rough center of the total bounds
    minx, miny, maxx, maxy = gdf.total_bounds
    center_lng = (minx + maxx) / 2
    center_lat = (miny + maxy) / 2
    
    # Format city name
    city_display = f"{city.title()}, {state.upper()}"
    city_id = f"{city.lower().replace(' ', '-')}-{state.lower()}"
    file_path = f"{state.upper()}/{city.lower().replace(' ', '_')}.geojson"
    
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    
    new_entry = {
        "id": city_id,
        "name": city_display,
        "file": file_path,
        "lat": round(center_lat, 4),
        "lng": round(center_lng, 4),
        "src": source_url,
        "district_field": district_field,
        "added_date": today_str,
        "source_date": source_date
    }
    
    js_path = Path("src/cities.js")
    content = js_path.read_text()
    
    # Use regex to find the end of the array to insert
    # Looking for the last closing brace and bracket
    # This is a bit brittle but simple for this task
    
    # We want to replace the last brace-comma-newline sequence or just insert before ];
    pattern = r"(export const CITIES = \[[\s\S]*?)(\s*\];)"
    match = re.search(pattern, content)
    
    if match:
        pre_content = match.group(1).rstrip()
        # Add comma if previous element didn't have it (it should in JS array lists usually, but check)
        if not pre_content.strip().endswith(","):
             pre_content += ","
             
        json_entry = json.dumps(new_entry, indent=8)
        
        # Remove inner braces for formatting
        inner_obj = json_entry.strip().strip("{}")
        
        new_block = f"\n    {{\n{inner_obj}\n    }}\n"
        
        updated_content = pre_content + new_block + "];\n"
        js_path.write_text(updated_content)
        print(f"✅ Added {city_display} to src/cities.js")
    else:
        print("❌ Could not parse src/cities.js to append entry.")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Automate adding a new city")
    parser.add_argument("--state", required=True)
    parser.add_argument("--city", required=True)
    parser.add_argument("--url", required=True)
    parser.add_argument("--field", required=True)
    parser.add_argument("--source", default="")
    parser.add_argument("--source_date", required=True)
    
    args = parser.parse_args()
    
    state_code = args.state.upper()
    city_slug = args.city.lower().replace(" ", "_")
    
    base_dir = Path("data") / state_code / city_slug
    base_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Download Data
    download_file(args.url, base_dir)
    
    # 2. Download Census Blocks (if needed)
    print("Checking Census Blocks...")
    dwnld_census_block_groups.download_state_bg_folders()
    
    # 3. Process City
    print("Processing Demographics...")
    process_city.process_city(state_code, city_slug, args.field)
    
    # 4. Update Frontend
    update_frontend_config(state_code, args.city, args.source or args.url, args.source_date, args.field)
    
    print("\n🎉 Automation Complete!")

if __name__ == "__main__":
    main()
