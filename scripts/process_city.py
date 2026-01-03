"""
process_city.py (ACS 2023 - B03002)

Usage:
    python scripts/process_city.py --state NC --city charlotte --field DISTRICT_NAME
    python scripts/process_city.py --all --field DISTRICT_NAME
"""

import os
import sys
import time
import argparse
from pathlib import Path

import requests
import pandas as pd
import geopandas as gpd
from shapely.geometry import box
from dotenv import load_dotenv

load_dotenv()
CENSUS_API_KEY = os.getenv("CENSUS_API_KEY")
CENSUS_BASE = "https://api.census.gov/data/2023/acs/acs5"

B03002_VARS = [
    "B03002_001E", "B03002_002E", "B03002_003E", "B03002_004E",
    "B03002_005E", "B03002_006E", "B03002_007E", "B03002_008E",
    "B03002_009E", "B03002_012E",
]

MAPPING = {
    "B03002_001E": "TOTAL",
    "B03002_003E": "WHITE",
    "B03002_004E": "BLACK",
    "B03002_005E": "AMERICAN_INDIAN",
    "B03002_006E": "ASIAN",
    "B03002_007E": "PACIFIC_ISLANDER",
    "B03002_008E": "OTHER",
    "B03002_009E": "TWO_OR_MORE",
    "B03002_012E": "HISPANIC"
}

API_WAIT_SEC = 0.5

def pad_fips(code: str, length: int = 3) -> str:
    try:
        i = int(code)
        return str(i).zfill(length)
    except Exception:
        return str(code).zfill(length)

def fetch_bg_vars_for_county(state_fips, county_fips, max_retries=3):
    url = (
        f"{CENSUS_BASE}?get=NAME," + ",".join(B03002_VARS) +
        f"&for=block group:*&in=state:{state_fips}%20county:{county_fips}"
    )
    if CENSUS_API_KEY:
        url += f"&key={CENSUS_API_KEY}"

    for attempt in range(1, max_retries + 1):
        resp = requests.get(url)
        if resp.status_code == 204:
            return pd.DataFrame()
        if resp.status_code == 200:
            try:
                data = resp.json()
                df = pd.DataFrame(data[1:], columns=data[0])
                df["GEOID"] = (
                    df["state"].str.zfill(2) +
                    df["county"].str.zfill(3) +
                    df["tract"].str.zfill(6) +
                    df["block group"].str.zfill(1)
                )
                return df.drop(columns=["NAME"])
            except Exception as e:
                continue
    return pd.DataFrame()

def fetch_census_for_counties(state_fips: str, counties: list) -> pd.DataFrame:
    frames = []
    for c in counties:
        print(f"Fetching B03002 for county {c} ...")
        df = fetch_bg_vars_for_county(state_fips, c)
        if not df.empty:
            frames.append(df)
        time.sleep(API_WAIT_SEC)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()

def process_city(state: str, city: str, district_field: str):
    state, city = str(state), str(city)
    data_root = Path("data")
    state_folder = data_root / state
    
    census_bg_path = state_folder / "census_block_groups.geojson"
    police_path = state_folder / city / "police_districts.geojson"
    
    out_dir = Path("public") / "results" / state
    out_dir.mkdir(parents=True, exist_ok=True)
    output_path = out_dir / f"{city}.geojson"

    print(f"\nProcessing city '{city}' in '{state}' using field '{district_field}'")

    police_gdf = gpd.read_file(police_path).to_crs(epsg=4326)
    census_gdf = gpd.read_file(census_bg_path).to_crs(epsg=4326)

    if district_field not in police_gdf.columns:
        raise KeyError(f"Field '{district_field}' not found in {police_path}. Columns: {list(police_gdf.columns)}")

    # Normalize target field to 'DISTRICT' for internal processing
    if district_field != "DISTRICT":
        police_gdf = police_gdf.rename(columns={district_field: "DISTRICT"})
    
    police_gdf = police_gdf.dissolve(by="DISTRICT", as_index=False)

    # Reconstruct GEOID if necessary
    if "GEOID" not in census_gdf.columns:
        census_gdf["GEOID"] = (
            census_gdf["STATEFP"].astype(str).str.zfill(2) +
            census_gdf["COUNTYFP"].astype(str).str.zfill(3) +
            census_gdf["TRACTCE"].astype(str).str.zfill(6) +
            census_gdf["BLKGRPCE"].astype(str).str.zfill(1)
        )

    state_fips = str(census_gdf["GEOID"].iloc[0])[:2].zfill(2)
    police_bbox = box(*police_gdf.total_bounds)
    census_clip = census_gdf[census_gdf.intersects(police_bbox)]

    unique_counties = sorted(list({str(g)[2:5] for g in census_clip["GEOID"].astype(str)}))
    census_vars_df = fetch_census_for_counties(state_fips, unique_counties)
    census_vars_df["GEOID"] = census_vars_df["GEOID"].astype(str)

    for code, friendly in MAPPING.items():
        census_vars_df[friendly] = pd.to_numeric(census_vars_df[code], errors="coerce").fillna(0.0)

    merged_bg = census_gdf.merge(census_vars_df[["GEOID"] + list(MAPPING.values())], on="GEOID", how="left")
    
    for v in MAPPING.values():
        merged_bg[v] = merged_bg[v].fillna(0.0)

    # Spatial Areal Weighting
    clipped_bg = gpd.clip(merged_bg, police_bbox)
    overlay = gpd.overlay(clipped_bg, police_gdf[["DISTRICT", "geometry"]], how="intersection")
    
    overlay["area_m2"] = overlay.to_crs(epsg=5070).geometry.area
    bg_area_lookup = clipped_bg.to_crs(epsg=5070).set_index("GEOID").geometry.area.to_dict()
    
    overlay["bg_area_m2"] = overlay["GEOID"].map(bg_area_lookup).replace({0: 1e-9})
    overlay["weight"] = overlay["area_m2"] / overlay["bg_area_m2"]

    contrib_cols = []
    for v in MAPPING.values():
        col = f"{v}_contrib"
        overlay[col] = overlay[v] * overlay["weight"]
        contrib_cols.append(col)

    agg = overlay.groupby("DISTRICT")[contrib_cols].sum().reset_index()
    agg = agg.rename(columns={f"{v}_contrib": v for v in MAPPING.values()})

    final = police_gdf.merge(agg, on="DISTRICT", how="left").fillna(0)
    
    # Calculate Percentages
    for v in [m for m in MAPPING.values() if m != "TOTAL"]:
        final[f"{v}_PCT"] = (final[v] / final["TOTAL"]).fillna(0.0).round(3)

    final.to_crs(epsg=4326).to_file(output_path, driver="GeoJSON")
    print(f"✅ Success: {output_path}")

def process_all(district_field: str):
    root = Path("data")
    for state_folder in sorted(root.iterdir()):
        if state_folder.is_dir():
            for city_folder in sorted(state_folder.iterdir()):
                if city_folder.is_dir() and (city_folder / "police_districts.geojson").exists():
                    try:
                        process_city(state_folder.name, city_folder.name, district_field)
                    except Exception as e:
                        print(f"❌ Error in {city_folder.name}: {e}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--state", help="State code (e.g. NC)")
    parser.add_argument("--city", help="City name")
    parser.add_argument("--field", required=True, help="The GEOJSON property name for districts")
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()

    if args.all:
        process_all(args.field)
    elif args.state and args.city:
        process_city(args.state, args.city, args.field)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()