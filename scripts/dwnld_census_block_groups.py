import os
import requests
import zipfile
import io
from pathlib import Path
import geopandas as gpd

# Updated to the 2023 TIGER/Line Shapefile directory for Block Groups
TIGER_BASE = "https://www2.census.gov/geo/tiger/TIGER2023/BG/"

def download_state_bg_folders(data_root="data"):
    """
    Auto-detect states in data/ and download 2023 block groups for each.
    """
    root = Path(data_root)
    if not root.exists():
        print(f"Creating directory: {data_root}")
        root.mkdir(parents=True, exist_ok=True)

    state_folders = [p for p in root.iterdir() if p.is_dir()]

    if not state_folders:
        print("No state subdirectories found in /data. Please create folders like 'data/NC', 'data/CA', etc.")
        return

    # FIPS mapping remains consistent across years
    fips_codes = {
        "AL": "01","AK": "02","AZ": "04","AR": "05","CA": "06",
        "CO": "08","CT": "09","DE": "10","FL": "12","GA": "13",
        "HI": "15","ID": "16","IL": "17","IN": "18","IA": "19",
        "KS": "20","KY": "21","LA": "22","ME": "23","MD": "24",
        "MA": "25","MI": "26","MN": "27","MS": "28","MO": "29",
        "MT": "30","NE": "31","NV": "32","NH": "33","NJ": "34",
        "NM": "35","NY": "36","NC": "37","ND": "38","OH": "39",
        "OK": "40","OR": "41","PA": "42","RI": "44","SC": "45",
        "SD": "46","TN": "47","TX": "48","UT": "49","VT": "50",
        "VA": "51","WA": "53","WV": "54","WI": "55","WY": "56"
    }

    for state_folder in state_folders:
        state = state_folder.name.upper()
        print(f"\n=== Processing state: {state} (2023) ===")

        # Updated filename to differentiate from 2020 data
        output_geojson = state_folder / "census_block_groups_2023.geojson"

        if output_geojson.exists():
            print(f"✔ Already exists for {state}, skipping")
            continue

        if state not in fips_codes:
            print(f"❌ Unknown state abbreviation: {state}, skipping")
            continue

        fips = fips_codes[state]
        # Changed filename pattern to 2023
        zip_name = f"tl_2023_{fips}_bg.zip"
        zip_url = TIGER_BASE + zip_name

        print(f"Downloading {zip_url} ...")
        try:
            r = requests.get(zip_url, timeout=30)
            if r.status_code != 200:
                print(f"❌ Failed to download for {state}: Status {r.status_code}")
                continue
        except Exception as e:
            print(f"❌ Connection error for {state}: {e}")
            continue

        print("✔ Downloaded. Extracting and converting...")
        
        # Using a context manager for the ZipFile to ensure it closes properly
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            extract_dir = state_folder / "tmp_bg_2023"
            extract_dir.mkdir(exist_ok=True)
            z.extractall(extract_dir)

            shp_file = next(extract_dir.glob("*.shp"), None)

            if shp_file:
                gdf = gpd.read_file(shp_file)
                # Ensure we are using the standard CRS (WGS84) for GeoJSON
                if gdf.crs != "EPSG:4326":
                    gdf = gdf.to_crs("EPSG:4326")
                
                gdf.to_file(output_geojson, driver="GeoJSON")
                print(f"✔ Saved to: {output_geojson}")
            else:
                print("❌ No .shp file found after extraction")

            # Cleanup
            for f in extract_dir.glob("*"):
                f.unlink()
            extract_dir.rmdir()

    print("\n=== Finished all 2023 updates ===")

if __name__ == "__main__":
    download_state_bg_folders()