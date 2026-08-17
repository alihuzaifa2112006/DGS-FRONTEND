import SmallNavbar from './Pages/SmallNavbar';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Help from './Pages/Help';
import { RadialBackground } from "@/components/ui/light-theme-tailwind-css-background-snippet";
import Navbar from './Pages/Navbar';

function App() {
  return (
    <div className="relative min-h-screen text-slate-900">
      {/* Off-white / Dull-white subtle radial dot pattern */}
      <RadialBackground />

      {/* Main Foreground Content */}
      <div className="relative z-10">
        <SmallNavbar />
        <Navbar />
        <main className="p-4">
          <Routes>
            <Route path="/" element={<div className="text-slate-900 font-semibold">Home Content</div>} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;