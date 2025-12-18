# Police District Demographics

[![Deploy Vite App to GitHub Pages](https://github.com/lbelegu/police-district-demographics/actions/workflows/deploy.yml/badge.svg)](https://github.com/lbelegu/police-district-demographics/actions/workflows/deploy.yml)

An open-source web app that visualizes demographic data across police districts in U.S. cities.

Built using **React**, **TailwindCSS**, and **Leaflet**, this project allows users to:
- View existing city data on a map.
- Explore demographic breakdowns (race/ethnicity) by police district.
- Compare districts visually and interactively.
- Download structured demographic data (CSV) for further analysis.


## 🚀 Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Map Visualization:** Leaflet + React-Leaflet
- **Data Processing:** Python (Pandas, GeoPandas)
- **Deployment:** GitHub Pages

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone git@github.com:lbelegu/police-district-demographics.git

cd police-district-demographics
```

### 2. Install Dependencies
You need both the frontend dependencies (Node.js) and backend processing tools (Python).
#### Frontend:
```bash
npm install
```
#### Data Processing (Python):
It is recommended to use a virtual environment.
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run the App Locally
```bash
npm run dev
```
Then open the URL shown in your terminal (usually ```http://localhost:5173```).

## 🗺️ How to add a New City
Follow these steps to process demographic data for a new city.

### Step 1: Add Raw Data

1. **Find the Data:** Download the "Police Districts" or "Patrol Areas" Shapefile/GeoJSON from the city's open data portal.

2. **Create Folders:**
- Navigate to the ```data/``` directory.
- Find or create the State folder (e.g., ```data/IL```).
- Create a City folder inside it (e.g., ```data/IL/charlotte```).

3. **Save File:** Place your police district file in that city folder and rename it to ```police_districts.geojson```.

### Step 2: Download Census Blocks
This script automatically detects which states you have folders for in ```data/``` and downloads the necessary Census Block Group shapes from the US Census Bureau.
```bash
python scripts/dwnld_census_block_groups.py
```
*Note: This script skips states that have already been downloaded.*

### Step 3: Process the Demographics
This script intersects the police districts with the census blocks to calculate demographic estimates.

#### Run for a specific city:
```bash
python scripts/process_city.py --state IL --city chicago
```
#### Arguments:

- ```--state```: The 2-letter state code (folder name).

- ```--city```: The city name (folder name).

- ```--col``` (Optional): Manually specify the column name for the district ID if auto-detection fails (e.g., ```--col dist_label```).

Output: A processed GeoJSON file will be generated in ```public/results/{STATE}/{city}.geojson```.

### Step 4: Update the Frontend

1. Open ```src/cities.js```.

2. Add a new entry to the ```CITIES``` array following this format:
    ```bash
    { 
    id: 'charlotte-nc', 
    name: "Charlotte, NC", 
    file: "NC/charlotte.geojson", // Matches the path in public/results
    lat: 35.2271, 
    lng: -80.8431 
    },
    ```

### Step 5: Verify
Run ```npm run dev``` and select your new city from the dropdown menu to verify the map loads and data populates correctly.

## 📄 License
Distributed under the MIT License. See ```LICENSE``` for more information.