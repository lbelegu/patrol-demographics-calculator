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
      <div className="space-x-6 text-sm font-medium flex items-center">
        <Link to="/about" className="hover:text-gray-400 transition-colors">About</Link>
        <Link to="/methodology" className="hover:text-gray-400 transition-colors">Methodology</Link>
        <a href="https://github.com/lbelegu/police-district-demographics" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors" aria-label="GitHub">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>
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