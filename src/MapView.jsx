// import statements
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// MapView component
export default function MapView() {
    // state to hold GeoJSON data
    const [data, setData] = useState(null);

    // fetch GeoJSON data on component mount
    useEffect(() => {
        fetch("/police-district-demographics/results/NC/raleigh.geojson")
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`GeoJSON fetch failed: ${response.statusText}`);
                }
                return response.json();
            })
            .then((json) => setData(json))
            .catch((err) => console.error("Error loading GeoJSON:", err));
    }, []);

    // function to handle each feature
    const onEachFeature = (feature, layer) => {
        const { DISTRICT, Total, W_nH, B_nH, Hispan } = feature.properties;
        layer.bindPopup(`
      <strong>District:</strong> ${DISTRICT}<br/>
      <strong>Total Population:</strong> ${Total}<br/>
      <strong>White:</strong> ${W_nH}<br/>
      <strong>Black:</strong> ${B_nH}<br/>
      <strong>Hispanic:</strong> ${Hispan}
    `);
    };

    return (
        // map container setup
        <MapContainer
            center={[35.7796, -78.6382]} // Raleigh, NC coordinates
            zoom={11}
            style={{ height: "80vh", width: "100%" }}
            maxBounds={[[5.499550, -200.276413], [83.162102, -52.233040]]}
            maxBoundsViscosity={1.0}
            maxZoom={16}
            minZoom={4}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            {data && (
                <GeoJSON
                    data={data}
                    onEachFeature={onEachFeature}
                    style={() => ({
                        color: "#2563eb",
                        weight: 1,
                        fillColor: "#3b82f6",
                        fillOpacity: 0.4,
                    })}
                />
            )}
        </MapContainer>
    );
}
