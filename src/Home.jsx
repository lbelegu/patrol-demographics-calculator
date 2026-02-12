import { useState, useEffect } from 'react';
import MapView from './MapView.jsx';
import DataTable from './DataTable.jsx';
import { CITIES, STATE_NAMES } from './cities';


// --- Main App Logic ---

// Map dropdown labels to the correct GeoJSON property keys
const MAP_FILTERS = [
    { label: 'Total Population', value: 'TOTAL' },
    { label: 'White', value: 'WHITE_PCT' },
    { label: 'Black', value: 'BLACK_PCT' },
    { label: 'Hispanic', value: 'HISPANIC_PCT' },
    { label: 'Asian', value: 'ASIAN_PCT' },
    { label: 'American Indian', value: 'AMERICAN_INDIAN_PCT' },
    { label: 'Pacific Islander', value: 'PACIFIC_ISLANDER_PCT' },
    { label: 'Two or More', value: 'TWO_OR_MORE_PCT' },
    { label: 'Other', value: 'OTHER_PCT' },
];

export default function Home() {
    const [selectedState, setSelectedState] = useState("");
    const [currentCity, setCurrentCity] = useState(null);
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [activeDemographic, setActiveDemographic] = useState('TOTAL');     // default TOTAL so the map has a state on load
    const availableStates = [...new Set(CITIES.map(c => c.file.split('/')[0]))].sort();

    const handleStateChange = (e) => {
        setSelectedState(e.target.value);
        setCurrentCity(null); // reset city when state changes
    };

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        const city = CITIES.find((c) => c.id === cityId);
        setCurrentCity(city);
    };

    // filter cities based on selected state
    const filteredCities = CITIES.filter(c => c.file.startsWith(selectedState + '/'))
        .sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        if (!currentCity) {
            setGeoJsonData(null);
            return;
        }
        setGeoJsonData(null);

        const baseUrl = import.meta.env.BASE_URL;
        const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const url = `${cleanBase}results/${currentCity.file}`;

        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then((data) => setGeoJsonData(data))
            .catch((err) => console.error(err));

    }, [currentCity]);

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <main className="flex-grow flex flex-col items-center w-full">

                {/* Hero Section */}
                <div
                    className="w-full relative pt-32 pb-16 px-4 text-center bg-cover bg-center"
                    style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero.jpg)` }}
                >
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/60"></div>

                    {/* Content */}
                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-bold mb-16 text-white drop-shadow-md">
                            Patrol Demographics Calculator
                        </h1>
                        {/* <h2 className="text-3xl font-semibold text-white mb-4 mx-auto max-w-2xl">Mission Statement</h2> */}
                        <p className="text-white leading-relaxed text-lg mx-auto max-w-2xl">
                            Understanding the demographics of patrol districts is crucial for transparency,
                            equitable policing, and community trust. This tool aggregates open data to visualize
                            who lives in each patrol area, helping researchers, journalists, and citizens
                            identify potential disparities and advocate for fair representation.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center w-full px-4 my-12">

                    {/* Control Bar */}
                    <div className="w-full max-w-4xl mb-6 flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200 gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 ">Map Filters</h2>
                            <p className="text-sm text-gray-500">Select city and demographic to visualize</p>

                        </div>

                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                            {/* State Select */}
                            <select
                                value={selectedState}
                                onChange={handleStateChange}
                                className="block w-full md:w-40 px-3 py-2 text-sm border-gray-300 rounded-md border bg-gray-50 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                            >
                                <option value="" disabled>Select State</option>
                                {availableStates.map((state) => (
                                    <option key={state} value={state}>{STATE_NAMES[state] || state}</option>
                                ))}
                            </select>

                            {/* City Select */}
                            <select
                                value={currentCity ? currentCity.id : ""}
                                onChange={handleCityChange}
                                disabled={!selectedState}
                                className={`block w-full md:w-48 px-3 py-2 text-sm border-gray-300 rounded-md border bg-gray-50 focus:ring-blue-500 focus:outline-none focus:border-blue-500 ${!selectedState ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="" disabled>{selectedState ? "Select a City" : "Select State First"}</option>
                                {filteredCities.map((city) => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>

                            {/* Demographic Select */}
                            <select
                                value={activeDemographic}
                                onChange={(e) => setActiveDemographic(e.target.value)}
                                className="block w-full md:w-48 px-3 py-2 text-sm border-gray-300 rounded-md border bg-gray-50 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                            >
                                {MAP_FILTERS.map((filter) => (
                                    <option key={filter.value} value={filter.value}>{filter.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Map Container */}
                    <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <MapView
                            city={currentCity}
                            data={geoJsonData}
                            activeDemographic={activeDemographic}
                        />
                    </div>

                    {currentCity && (
                        <div className="w-full max-w-5xl mt-4 text-xs text-gray-500 flex flex-col sm:flex-row sm:gap-6">
                            <span><span className="font-semibold">Added:</span> {currentCity.added_date}</span>
                            <span><span className="font-semibold">Source:</span> {currentCity.source_date}</span>
                        </div>
                    )}

                    {currentCity && geoJsonData && (
                        <DataTable data={geoJsonData} city={currentCity} />
                    )}

                </div>

            </main>
        </div>
    );
}