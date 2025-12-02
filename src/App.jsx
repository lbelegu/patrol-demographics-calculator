import { useState } from 'react';
import MapView from './MapView.jsx';
import { CITIES } from './cities.js';

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-semibold tracking-wide">Police District Demographics</h1>
      <div className="space-x-6 text-sm font-medium">
        <a href="#" className="hover:text-blue-400">Home</a>
        <a href="#" className="hover:text-blue-400">About</a>
        <a href="#" className="hover:text-blue-400">Github</a>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Police District Demographics. Open Source Project.
      </p>
    </footer>
  );
}

export default function App() {
  // state for the currently selected city
  const [currentCity, setCurrentCity] = useState(null);

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    const city = CITIES.find((c) => c.id === cityId);
    setCurrentCity(city);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />

      <main className="flex-grow flex flex-col items-center py-8 px-4">
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
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <MapView city={currentCity} />
        </div>
      </main>
      <Footer />
    </div>
  );
}