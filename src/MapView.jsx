import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// Continuous Color Scale Logic
const getContinuousColor = (d) => {
    if (d === undefined || d === null) return '#ccc';
    const value = Math.max(0, Math.min(1, d));
    const colors = [
        [239, 243, 255], // 0.0
        [189, 215, 231], // 0.2
        [107, 174, 214], // 0.4
        [49, 130, 189],  // 0.6
        [8, 81, 156],   // 0.8
        [8, 48, 107]    // 1.0
    ];
    const scaledIdx = value * (colors.length - 1);
    const idx = Math.floor(scaledIdx);
    const fraction = scaledIdx - idx;
    if (idx >= colors.length - 1) return `rgb(${colors[colors.length - 1].join(',')})`;
    const r = Math.round(colors[idx][0] + (colors[idx + 1][0] - colors[idx][0]) * fraction);
    const g = Math.round(colors[idx][1] + (colors[idx + 1][1] - colors[idx][1]) * fraction);
    const b = Math.round(colors[idx][2] + (colors[idx + 1][2] - colors[idx][2]) * fraction);
    return `rgb(${r},${g},${b})`;
};

// Legend Component
function Legend({ activeDemographic }) {
    if (!activeDemographic || !activeDemographic.includes('_PCT')) return null;

    // Clean up label (e.g., "WHITE_PCT" -> "White")
    const label = activeDemographic.replace('_PCT', '').toLowerCase();
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

    return (
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 min-w-[200px]">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                % {capitalizedLabel} Population
            </div>
            {/* Gradient Bar */}
            <div 
                className="h-3 w-full rounded-sm mb-1" 
                style={{
                    background: 'linear-gradient(to right, #eff3ff, #9ecae1, #4292c6, #084594, #08306b)'
                }}
            ></div>
            <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
            </div>
        </div>
    );
}

function RecenterMap({ lat, lng, zoom }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], zoom);
    }, [lat, lng, zoom, map]);
    return null;
}

export default function MapView({ city, data, activeDemographic }) {
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    const defaultCenter = { lat: 39.8283, lng: -98.5795, zoom: 4 };
    const centerLat = city ? city.lat : defaultCenter.lat;
    const centerLng = city ? city.lng : defaultCenter.lng;
    const zoomLevel = city ? 11 : defaultCenter.zoom;

    useEffect(() => {
        setSelectedDistrict(null);
    }, [city]);

    const getStyle = (feature) => {
        const isSelected = selectedDistrict && feature.properties.DISTRICT === selectedDistrict.DISTRICT;
        const val = feature.properties[activeDemographic];

        return {
            fillColor: activeDemographic.includes('_PCT') 
                ? getContinuousColor(val) 
                : "#2b547e", 
            weight: isSelected ? 3 : 1,
            opacity: 1,
            color: isSelected ? "#000000" : "black",
            fillOpacity: isSelected ? 0.9 : 0.7,
        };
    };

    const onEachFeature = (feature, layer) => {
        layer.on({
            click: (e) => {
                e.originalEvent.stopPropagation();
                setSelectedDistrict(feature.properties);
            }
        });
    };

    return (
        <div className="relative h-[600px] w-full">
            <MapContainer
                center={[centerLat, centerLng]}
                zoom={zoomLevel}
                style={{ height: "100%", width: "100%" }}
                minZoom={4}
            >
                <RecenterMap lat={centerLat} lng={centerLng} zoom={zoomLevel} />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; OpenStreetMap'
                />

                {data && city && (
                    <GeoJSON
                        key={`${city.id}-${activeDemographic}`}
                        data={data}
                        onEachFeature={onEachFeature}
                        style={getStyle}
                    />
                )}
            </MapContainer>

            {/* Continuous Legend Overlay */}
            <Legend activeDemographic={activeDemographic} />

            {/* Selection UI Panel */}
            {selectedDistrict && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-300 shadow-lg p-4 z-[1000]">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="border-b sm:border-b-0 sm:border-r border-gray-300 pb-2 sm:pb-0 sm:pr-6">
                            <h3 className="text-gray-500 text-xs uppercase font-bold tracking-wider">Selected District</h3>
                            <div className="text-2xl font-bold text-gray-900">{selectedDistrict.DISTRICT}</div>
                            <div className="text-sm text-gray-600 mt-1">
                                Total Pop: <span className="font-semibold text-gray-900">{selectedDistrict.TOTAL?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto">
                            <StatBox label="White" value={selectedDistrict.WHITE} pct={selectedDistrict.WHITE_PCT} color="bg-pink-100 text-pink-800" />
                            <StatBox label="Black" value={selectedDistrict.BLACK} pct={selectedDistrict.BLACK_PCT} color="bg-purple-100 text-purple-800" />
                            <StatBox label="Hispanic" value={selectedDistrict.HISPANIC} pct={selectedDistrict.HISPANIC_PCT} color="bg-orange-100 text-orange-800" />
                            <StatBox label="Asian" value={selectedDistrict.ASIAN} pct={selectedDistrict.ASIAN_PCT} color="bg-green-100 text-green-800" />
                        </div>
                    </div>
                    <button onClick={() => setSelectedDistrict(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            )}
        </div>
    );
}

function StatBox({ label, value, pct, color }) {
    return (
        <div className={`rounded-lg p-2 ${color} flex flex-col items-center justify-center`}>
            <span className="text-xs font-semibold opacity-75 uppercase">{label}</span>
            <span className="text-lg font-bold">
                {pct ? (pct * 100).toFixed(1) + '%' : value?.toLocaleString()}
            </span>
        </div>
    );
}