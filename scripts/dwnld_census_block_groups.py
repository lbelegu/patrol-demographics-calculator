import os
import requests
import zipfile
import io
from pathlib import Path
import geopandas as gpd

TIGER_BASE = "https://www2.census.gov/geo/tiger/TIGER2020/BG/"

def download_state_bg_folders(data_root="data"):
    """
    Auto-detect states in data/ and download block groups for each.
    """

    root = Path(data_root)
    if not root.exists():
        raise ValueError("data/ folder does not exist")

    state_folders = [p for p in root.iterdir() if p.is_dir()]

    for state_folder in state_folders:
        state = state_folder.name.upper()
        print(f"\n=== Processing state: {state} ===")

        # Output path
        output_geojson = state_folder / "census_block_groups.geojson"

        if output_geojson.exists():
            print(f"✔ Already exists for {state}, skipping")
            continue

        # TIGER/Line format: tl_2020_##_bg.zip
        # e.g. NC -> tl_2020_37_bg.zip, CA -> tl_2020_06_bg.zip
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

        if state not in fips_codes:
            print(f"❌ Unknown state abbreviation: {state}, skipping")
            continue

        fips = fips_codes[state]
        zip_name = f"tl_2020_{fips}_bg.zip"
        zip_url = TIGER_BASE + zip_name

        print(f"Downloading {zip_url} ...")
        r = requests.get(zip_url)

        if r.status_code != 200:
            print(f"❌ Failed to download for {state}: {r.status_code}")
            continue

        print("✔ Downloaded. Extracting...")

        z = zipfile.ZipFile(io.BytesIO(r.content))

        extract_dir = state_folder / "tmp_bg"
        extract_dir.mkdir(exist_ok=True)

        z.extractall(extract_dir)

        print("✔ Converting to GeoJSON...")

        shp_file = None
        for f in extract_dir.glob("*.shp"):
            shp_file = f
            break

        if shp_file is None:
            print("❌ No .shp file found after extraction")
            continue

        gdf = gpd.read_file(shp_file)
        gdf.to_file(output_geojson, driver="GeoJSON")

        print(f"✔ Saved census block groups to: {output_geojson}")

        # Cleanup
        for f in extract_dir.glob("*"):
            f.unlink()
        extract_dir.rmdir()

    print("\n=== Finished all states ===")

if __name__ == "__main__":
    download_state_bg_folders()
