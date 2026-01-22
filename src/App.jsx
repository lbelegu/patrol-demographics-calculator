import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './Home.jsx';
import Methodology from './Methodology.jsx';
import About from './About.jsx';

function Navbar() {
  const location = useLocation();
  const isTransparent = location.pathname === '/' || location.pathname === '/methodology' || location.pathname === '/about';

  // Base classes + conditional classes
  const navClass = isTransparent
    ? "absolute top-0 left-0 w-full z-10 bg-transparent text-white px-6 py-4 flex justify-between items-center"
    : "bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md";

  return (
    <nav className={navClass}>
      <h1 className="text-xl font-bold tracking-wide">
        <Link to="/" className="hover:text-gray-400 transition-colors">Patrol Demographics Calculator</Link>
      </h1>
      <div className="space-x-6 text-sm font-medium">
        <Link to="/about" className="hover:text-gray-400 transition-colors">About</Link>
        <Link to="/methodology" className="hover:text-gray-400 transition-colors">Methodology</Link>
        <a href="https://github.com/lbelegu/police-district-demographics" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Github</a>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-accent text-white py-6 text-center text-sm mt-auto">
      <p>&copy; {new Date().getFullYear()} Police District Demographics. Open Source Project.</p>
    </footer>
  );
}

function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <MainLayout />
    </Router>
  );
}