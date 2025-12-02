"""
process_city.py (ACS 2023 - B03002)

Usage:
    python scripts/process_city.py --state NC --city charlotte
    python scripts/process_city.py --all

Requirements:
    pip install geopandas pandas requests python-dotenv shapely
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

# B03002 vars we will fetch (ACS 2023 5-year)
B03002_VARS = [
    "B03002_001E",  # Total
    "B03002_002E",  # Not Hispanic or Latino
    "B03002_003E",  # White alone
    "B03002_004E",  # Black alone
    "B03002_005E",  # American Indian / Alaska Native
    "B03002_006E",  # Asian
    "B03002_007E",  # Native Hawaiian / Pacific Islander
    "B03002_008E",  # Some other race
    "B03002_009E",  # Two or more races
    "B03002_012E",  # Hispanic or Latino
]


# Map a subset of those codes to friendly category names we want in the output.
# We use the canonical single-race "alone" categories and Hispanic total
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

# expand list as we add more cities
DISTRICT_KEYWORDS = [
    "district", "dist", "dname", "name",
    "precinct", "aprec", "pd", "area", "zone",
    "ward", "division", "pct"
]

API_WAIT_SEC = 0.5

# helper functions:
def pad_fips(code: str, length: int = 3) -> str:
    try:
        i = int(code)
        return str(i).zfill(length)
    except Exception:
        return str(code).zfill(length)

# standardize district field name for each city 
def detect_district_field(gdf: gpd.GeoDataFrame) -> str:
    cols = list(gdf.columns)
    lower_map = {c.lower(): c for c in cols}
    # exact match
    for kw in DISTRICT_KEYWORDS:
        if kw in lower_map:
            return lower_map[kw]
    # partial match
    for kw in DISTRICT_KEYWORDS:
        for lc, real in lower_map.items():
            if kw in lc:
                return real
    # fallback: first object/string column
    string_cols = [c for c in cols if gdf[c].dtype == object]
    if string_cols:
        print(f"[warn] No district-like field detected; using first string column '{string_cols[0]}'")
        return string_cols[0]
    raise RuntimeError(f"Could not detect district field. Available columns: {cols}")


# Census fetch functions (ACS 2023 - block-group):
def fetch_bg_vars_for_county(state_fips, county_fips, max_retries=3):
    """
    Downloads ACS 2023 5-year B03002 for a single county.
    Returns EMPTY DataFrame for counties with 204.
    Reconstructs GEOID since ACS does not return it.
    """
    url = (
        f"https://api.census.gov/data/2023/acs/acs5"
        f"?get=NAME," + ",".join(B03002_VARS) +
        f"&for=block group:*&in=state:{state_fips}%20county:{county_fips}"
    )

    for attempt in range(1, max_retries + 1):
        resp = requests.get(url)

        # 204 = no block groups
        if resp.status_code == 204:
            print(f"  ➤ County {county_fips} has no block groups (204). Skipping.")
            return pd.DataFrame()

        # 200 = usable response
        if resp.status_code == 200:
            try:
                data = resp.json()
                df = pd.DataFrame(data[1:], columns=data[0])

                # Reconstruct GEOID
                df["GEOID"] = (
                    df["state"].str.zfill(2) +
                    df["county"].str.zfill(3) +
                    df["tract"].str.zfill(6) +
                    df["block group"].str.zfill(1)
                )

                df = df.drop(columns=["NAME"])

                return df

            except Exception as e:
                print(f"  ⚠️ JSON parse error for county {county_fips} attempt {attempt}: {e}")
                continue

        # Any other non-200 response
        print(f"  ⚠️ Census API error (county {county_fips}) attempt {attempt}: "
              f"{resp.status_code} {resp.text}")

    raise RuntimeError(f"Census API failed for county {county_fips} after retries.")

# get the census data for multiple counties
def fetch_census_for_counties(state_fips: str, counties: list) -> pd.DataFrame:
    frames = []
    for c in counties:
        print(f"Fetching B03002 for county {c} ...")
        df = fetch_bg_vars_for_county(state_fips, c)
        frames.append(df)
        time.sleep(API_WAIT_SEC)
    combined = pd.concat(frames, ignore_index=True)
    return combined


# Core pipeline:
def process_city(state: str, city: str):
    state = str(state)
    city = str(city)
    data_root = Path("data")
    state_folder = data_root / state
    if not state_folder.exists():
        raise FileNotFoundError(f"State folder not found: {state_folder}")

    census_bg_path = state_folder / "census_block_groups.geojson"
    police_path = state_folder / city / "police_districts.geojson"
    if not census_bg_path.exists():
        raise FileNotFoundError(f"Missing census_block_groups.geojson: {census_bg_path}")
    if not police_path.exists():
        raise FileNotFoundError(f"Missing police_districts.geojson for {city}: {police_path}")

    out_dir = Path("public") / "results" / state
    out_dir.mkdir(parents=True, exist_ok=True)
    output_path = out_dir / f"{city}.geojson"
    
    # skip if output exists
    if output_path.exists():
        print(f"⏩ Skipping {city}: Output file already exists at {output_path}")
        return output_path

    print(f"\nProcessing city '{city}' in state '{state}'")
    print(" - police file:", police_path)
    print(" - census block groups:", census_bg_path)

    police_gdf = gpd.read_file(police_path).to_crs(epsg=4326)
    census_gdf = gpd.read_file(census_bg_path).to_crs(epsg=4326)

    # detect district field and normalize to 'DISTRICT'
    detected_field = detect_district_field(police_gdf)
    if detected_field != "DISTRICT":
        police_gdf = police_gdf.rename(columns={detected_field: "DISTRICT"})
    print(f" - Detected district field: '{detected_field}' -> using 'DISTRICT'")

    # Ensure census GEOID exists
    if "GEOID" not in census_gdf.columns:
        upp = {c.upper(): c for c in census_gdf.columns}
        required = {"STATEFP", "COUNTYFP", "TRACTCE", "BLKGRPCE"}
        if required.issubset(set(upp.keys())):
            census_gdf["GEOID"] = (
                census_gdf[upp["STATEFP"]].astype(str).str.zfill(2) +
                census_gdf[upp["COUNTYFP"]].astype(str).str.zfill(3) +
                census_gdf[upp["TRACTCE"]].astype(str).str.zfill(6) +
                census_gdf[upp["BLKGRPCE"]].astype(str).str.zfill(1)
            )
            print(" - Built GEOID from components")
        else:
            raise RuntimeError("census_block_groups.geojson missing GEOID and components")

    # Determine state FIPS
    upp = {c.upper(): c for c in census_gdf.columns}
    if "STATEFP" in upp:
        state_fips = str(census_gdf[upp["STATEFP"]].iloc[0]).zfill(2)
    else:
        state_fips = str(census_gdf["GEOID"].astype(str).iloc[0][:2]).zfill(2)
    print(" - State FIPS:", state_fips)

    # Clip census to police bounding box for speed, expand slightly if necessary
    police_bbox = box(*police_gdf.total_bounds)
    census_clip = census_gdf[census_gdf.intersects(police_bbox)]
    if census_clip.empty:
        # expand bbox slightly
        minx, miny, maxx, maxy = police_gdf.total_bounds
        expand = 0.05
        police_bbox = box(minx - expand, miny - expand, maxx + expand, maxy + expand)
        census_clip = census_gdf[census_gdf.intersects(police_bbox)]
        if census_clip.empty:
            raise RuntimeError("No census block groups found near police districts (after bbox expand)")

    # Extract counties present in clipped census
    county_col = None
    for c in census_gdf.columns:
        if c.upper() == "COUNTYFP":
            county_col = c
            break
    if county_col:
        unique_counties = sorted(census_clip[county_col].astype(str).unique())
    else:
        unique_counties = sorted(list({str(g)[2:5] for g in census_clip["GEOID"].astype(str)}))
    unique_counties = [pad_fips(c, 3) for c in unique_counties]
    print(f" - Intersecting counties (to query): {unique_counties}")

    # Fetch ACS B03002 for just those counties
    census_vars_df = fetch_census_for_counties(state_fips, unique_counties)
    # Build GEOID field and coerce numeric columns for mapping keys
    census_vars_df["GEOID"] = census_vars_df["GEOID"].astype(str)

    # Map the API codes into the friendly categories and coerce numeric
    for code, friendly in MAPPING.items():
        if code in census_vars_df.columns:
            census_vars_df[friendly] = pd.to_numeric(census_vars_df[code], errors="coerce").fillna(0.0).astype(float)
        else:
            census_vars_df[friendly] = 0.0

    # Merge the demographic vars onto the census_gdf
    census_gdf["GEOID"] = census_gdf["GEOID"].astype(str)
    merged_bg = census_gdf.merge(
        census_vars_df[["GEOID"] + list(MAPPING.values())],
        on="GEOID",
        how="left",
        validate="m:1"
    )

    # Fill missing demographics with zeros
    for v in MAPPING.values():
        if v in merged_bg.columns:
            merged_bg[v] = merged_bg[v].fillna(0.0)

    # Clip to bbox and intersect with police districts
    clipped_bg = gpd.clip(merged_bg, police_bbox)
    print(f" - Clipped block groups: {len(clipped_bg)} features")

    # Overlay (intersection)
    overlay = gpd.overlay(clipped_bg, police_gdf[["DISTRICT", "geometry"]], how="intersection")
    if overlay.empty:
        raise RuntimeError("Overlay resulted in no intersecting geometries")

    # Compute accurate areas in equal-area CRS for weighting (EPSG:5070)
    overlay_area = overlay.to_crs(epsg=5070)
    overlay_area["area_m2"] = overlay_area.geometry.area
    overlay["area_m2"] = overlay_area["area_m2"].values

    # Compute block-group original area (m^2)
    bg_area = clipped_bg.to_crs(epsg=5070)
    bg_area["bg_area_m2"] = bg_area.geometry.area
    bg_area_map = bg_area.set_index("GEOID")["bg_area_m2"].to_dict()
    overlay["bg_area_m2"] = overlay["GEOID"].map(bg_area_map).astype(float)
    overlay["bg_area_m2"].replace({0: 1e-9}, inplace=True)

    # compute weight and contributions
    overlay["weight"] = overlay["area_m2"] / overlay["bg_area_m2"]
    contrib_cols = []
    for v in MAPPING.values():
        col = f"{v}_contrib"
        overlay[col] = overlay[v].astype(float) * overlay["weight"]
        contrib_cols.append(col)

    # Aggregate per district
    agg = overlay.groupby("DISTRICT")[contrib_cols].sum().reset_index()
    rename_back = {f"{v}_contrib": v for v in MAPPING.values()}
    agg = agg.rename(columns=rename_back)

    # Merge aggregated values back into police_gdf
    final = police_gdf.merge(agg, on="DISTRICT", how="left")
    for v in MAPPING.values():
        if v in final.columns:
            final[v] = final[v].fillna(0.0).astype(int)
        else:
            final[v] = 0

    # Compute percentages relative to TOTAL
    if "TOTAL" in final.columns and final["TOTAL"].sum() > 0:
        for v in ["WHITE", "BLACK", "AMERICAN_INDIAN", "ASIAN", "PACIFIC_ISLANDER", "OTHER", "TWO_OR_MORE", "HISPANIC"]:
            pct_col = f"{v}_PCT"
            final[pct_col] = (final[v] / final["TOTAL"]).fillna(0.0).round(3)

    # Save output
    final = final.to_crs(epsg=4326)
    final.to_file(output_path, driver="GeoJSON")
    print("✅ Wrote final processed file to:", output_path)
    return output_path


# Process all helper:
def process_all():
    root = Path("data")
    if not root.exists():
        raise FileNotFoundError("data folder not found")
    for state_folder in sorted(root.iterdir()):
        if not state_folder.is_dir():
            continue
        census_file = state_folder / "census_block_groups.geojson"
        if not census_file.exists():
            print(f"Skipping {state_folder.name} (no census_block_groups.geojson)")
            continue
        for city_folder in sorted(state_folder.iterdir()):
            if not city_folder.is_dir():
                continue
            if (city_folder / "police_districts.geojson").exists():
                try:
                    process_city(state_folder.name, city_folder.name)
                except Exception as e:
                    print(f"Error processing {city_folder.name} in {state_folder.name}: {e}")


# CLI
def main():
    parser = argparse.ArgumentParser(description="Process police district data with ACS B03002 (2023)")
    parser.add_argument("--state", help="State folder name (e.g., NC)")
    parser.add_argument("--city", help="City folder name (e.g., charlotte)")
    parser.add_argument("--all", action="store_true", help="Process all states/cities under data/")
    args = parser.parse_args()

    if args.all:
        process_all()
        return
    if not args.state or not args.city:
        parser.print_help()
        sys.exit(1)
    process_city(args.state, args.city)


if __name__ == "__main__":
    main()