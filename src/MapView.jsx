import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// Continuous Color Scale Logic
const getContinuousColor = (d) => {
    if (d === undefined || d === null) return '#ccc';
    const value = Math.max(0, Math.min(1, d));
    const colors = [
        [239, 243, 255], [189, 215, 231], [107, 174, 214],
        [49, 130, 189], [8, 81, 156], [8, 48, 107]
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

function Legend({ activeDemographic, isDistrictSelected }) {
    if (!activeDemographic || !activeDemographic.includes('_PCT')) return null;
    const visibilityClass = isDistrictSelected ? 'hidden sm:block' : 'block';
    const label = activeDemographic.replace('_PCT', '').toLowerCase().replace(/_/g, ' ');
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

    return (
        <div className={`absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200 min-w-[200px] ${visibilityClass}`}>
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                % {capitalizedLabel} Pop
            </div>
            <div className="h-3 w-full rounded-sm mb-1" style={{ background: 'linear-gradient(to right, #eff3ff, #9ecae1, #4292c6, #084594, #08306b)' }}></div>
            <div className="flex justify-between text-[10px] font-bold text-gray-600">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
        </div>
    );
}

function RecenterMap({ lat, lng, zoom }) {
    const map = useMap();
    useEffect(() => { map.setView([lat, lng], zoom); }, [lat, lng, zoom, map]);
    return null;
}

export default function MapView({ city, data, activeDemographic }) {
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    const defaultCenter = { lat: 39.8283, lng: -98.5795, zoom: 4 };
    const centerLat = city ? city.lat : defaultCenter.lat;
    const centerLng = city ? city.lng : defaultCenter.lng;
    const zoomLevel = city ? 11 : defaultCenter.zoom;

    useEffect(() => { setSelectedDistrict(null); }, [city]);

    const getStyle = (feature) => {
        const isSelected = selectedDistrict && feature.properties.DISTRICT === selectedDistrict.DISTRICT;
        const val = feature.properties[activeDemographic];
        return {
            fillColor: activeDemographic.includes('_PCT') ? getContinuousColor(val) : "#2b547e",
            weight: isSelected ? 3 : 1,
            opacity: 1,
            color: isSelected ? "#000000" : "black",
            fillOpacity: isSelected ? 0.9 : 0.7,
        };
    };

    const onEachFeature = (feature, layer) => {
        layer.on({ click: (e) => { e.originalEvent.stopPropagation(); setSelectedDistrict(feature.properties); } });
    };

    return (
        <div className="relative h-[600px] w-full">
            <MapContainer center={[centerLat, centerLng]} zoom={zoomLevel} style={{ height: "100%", width: "100%" }} minZoom={4}>
                <RecenterMap lat={centerLat} lng={centerLng} zoom={zoomLevel} />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
                {data && city && <GeoJSON key={`${city.id}-${activeDemographic}`} data={data} onEachFeature={onEachFeature} style={getStyle} />}
            </MapContainer>

            <Legend activeDemographic={activeDemographic} isDistrictSelected={!!selectedDistrict} />

            {selectedDistrict && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[1001] transition-transform duration-300">
                    <button onClick={() => setSelectedDistrict(null)} className="absolute -top-3 right-3 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>

                    <div className="max-w-5xl mx-auto p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-shrink-0 sm:border-r sm:border-gray-300 sm:pr-6">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected District</h3>
                                <div className="flex flex-row sm:flex-col justify-between items-baseline sm:items-start mt-0.5">
                                    <span className="text-lg sm:text-2xl font-bold text-gray-900 leading-none">{selectedDistrict.DISTRICT}</span>
                                    <span className="text-xs sm:text-sm text-gray-600 sm:mt-1">Pop: <span className="font-semibold text-gray-900">{selectedDistrict.TOTAL?.toLocaleString()}</span></span>
                                </div>
                            </div>

                            <div className="flex-grow">
                                <div className="flex sm:grid sm:grid-cols-4 gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                                    <StatBox label="White" value={selectedDistrict.WHITE} pct={selectedDistrict.WHITE_PCT} color="bg-pink-50 text-pink-800 border-pink-100" />
                                    <StatBox label="Black" value={selectedDistrict.BLACK} pct={selectedDistrict.BLACK_PCT} color="bg-purple-50 text-purple-800 border-purple-100" />
                                    <StatBox label="Hispanic" value={selectedDistrict.HISPANIC} pct={selectedDistrict.HISPANIC_PCT} color="bg-orange-50 text-orange-800 border-orange-100" />
                                    <StatBox label="Asian" value={selectedDistrict.ASIAN} pct={selectedDistrict.ASIAN_PCT} color="bg-green-50 text-green-800 border-green-100" />
                                    <StatBox label="Am. Indian" value={selectedDistrict.AMERICAN_INDIAN} pct={selectedDistrict.AMERICAN_INDIAN_PCT} color="bg-red-50 text-red-800 border-red-100" />
                                    <StatBox label="Pac. Islander" value={selectedDistrict.PACIFIC_ISLANDER} pct={selectedDistrict.PACIFIC_ISLANDER_PCT} color="bg-cyan-50 text-cyan-800 border-cyan-100" />
                                    <StatBox label="Two+" value={selectedDistrict.TWO_OR_MORE} pct={selectedDistrict.TWO_OR_MORE_PCT} color="bg-teal-50 text-teal-800 border-teal-100" />
                                    <StatBox label="Other" value={selectedDistrict.OTHER} pct={selectedDistrict.OTHER_PCT} color="bg-gray-50 text-gray-800 border-gray-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatBox({ label, value, pct, color }) {
    return (
        <div className={`flex-shrink-0 min-w-[85px] sm:min-w-0 flex-1 rounded-lg p-2 border ${color} flex flex-col items-center justify-center`}>
            <span className="text-[10px] sm:text-xs font-bold opacity-70 uppercase tracking-wide truncate w-full text-center">{label}</span>
            <span className="text-sm sm:text-lg font-bold mt-0.5">
                {pct ? (pct * 100).toFixed(1) + '%' : value?.toLocaleString()}
            </span>
        </div>
    );
}