# Police District Demographics

[![Deploy Vite App to GitHub Pages](https://github.com/lbelegu/police-district-demographics/actions/workflows/deploy.yml/badge.svg)](https://github.com/lbelegu/police-district-demographics/actions/workflows/deploy.yml)

An open-source web app that visualizes demographic data across police districts in U.S. cities.

Built using **React**, **TailwindCSS**, and **Leaflet**, this project allows users to:
- View existing city data on a map.
- Explore demographic breakdowns (race/ethnicity) by police district.
- Compare districts visually and interactively.
- Download structured demographic data (CSV) for further analysis.


## Tech Stack
- **Frontend:** React + Vite + TailwindCSS
- **Map Visualization:** Leaflet + React-Leaflet
- **Data Processing:** Python (Pandas, GeoPandas)
- **Deployment:** GitHub Pages

## How to Add a New City 

We have automated the process of adding new cities using GitHub Actions!

### 🤖 Automated Method (Recommended)
This method runs entirely in the cloud — no coding required.

1. **Go to the "Actions" Tab**: Click on the [Actions](https://github.com/lbelegu/police-district-demographics/actions) tab in this repository.
2. **Select "Add New City"**: In the left sidebar, click on the **Add New City** workflow.
3. **Click "Run workflow"**: A dropdown menu will appear.
4. **Enter City Details**:
    *   **City Name**: e.g., `Detroit`
    *   **State Code**: e.g., `MI`
    *   **Data URL**: The direct link to the GeoJSON file (e.g., from ArcGIS Hub, right-click "GeoJSON" -> "Copy Link Address").
    *   **District Field**: The property in the GeoJSON that identifies the specific police district (e.g., `precinct`, `district`, `name`).
    *   **Source Info**: A link to the "About" page for the dataset (for credit).
5. **Run**: Click the green button.
6. **Merge the PR**: Once the job finishes (~2 minutes), a new Pull Request will be created automatically. Review and merge it!

---

### 🛠️ Manual Method (Local Development)
If you prefer to run the scripts locally on your machine, follow these steps.


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
python scripts/process_city.py --state IL --city chicago --field dist_num
```
#### Arguments:

- ```--state```: The 2-letter state code (folder name).

- ```--city```: The city name (folder name).

- ```--field```: Variable of patrol area. To identify this, find the variable by which patrol districts seem to be visualized in your source material.

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
    lng: -80.8431,
    src: "https://data.charlottenc.gov/datasets/charlotte::cmpd-police-divisions-1/about", // source link of geojson 
    date: "2026-01-03" // date of download, yyyy-mm-dd format
    },
    ```
 - Latitude and longitude coordinates can be found by searching for your city with https://www.batchgeo.com/map/cities-latitude-longitude.

### Step 5: Verify
Run ```npm run dev``` and select your new city from the dropdown menu to verify the map loads and data populates correctly.

## Locally Running the Calculator

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

### 3. Run App 
```bash
npm run dev
```
Then open the URL shown in your terminal (usually ```http://localhost:5173```).

## License
Distributed under the MIT License. See ```LICENSE``` for more information.
