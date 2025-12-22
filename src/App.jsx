import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Home.jsx';
import Methodology from './Methodology.jsx';

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold tracking-wide">
        <Link to="/">Police District Demographics</Link>
      </h1>
      <div className="space-x-6 text-sm font-medium">
        <Link to="/" className="hover:text-blue-400 transition-colors">Home</Link>
        <Link to="/methodology" className="hover:text-blue-400 transition-colors">Methodology</Link>
        <a href="https://github.com/lbelegu/police-district-demographics" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Github</a>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm mt-auto">
      <p>&copy; {new Date().getFullYear()} Police District Demographics. Open Source Project.</p>
    </footer>
  );
}

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/methodology" element={<Methodology />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}