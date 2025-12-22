import { useState, useEffect } from 'react';
import MapView from './MapView.jsx';
import DataTable from './DataTable.jsx';
import { CITIES } from './cities';

export default function Home() {
    const [currentCity, setCurrentCity] = useState(null);
    const [geoJsonData, setGeoJsonData] = useState(null);

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        const city = CITIES.find((c) => c.id === cityId);
        setCurrentCity(city);
    };

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
        <div className="flex flex-col items-center py-8 px-4">
            {/* Selection */}
            <div className="w-full max-w-4xl mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Select a City</h2>
                    <p className="text-sm text-gray-500">View demographic breakdowns by police district</p>
                </div>

                <select
                    value={currentCity ? currentCity.id : ""}
                    onChange={handleCityChange}
                    className="block w-64 px-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-gray-50"
                >
                    <option value="" disabled>Select a City</option>
                    {CITIES.map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                </select>
            </div>

            {/* Map */}
            <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <MapView city={currentCity} data={geoJsonData} />
            </div>

            {/* Table */}
            {currentCity && geoJsonData && (
                <DataTable data={geoJsonData} city={currentCity} />
            )}
        </div>
    );
}