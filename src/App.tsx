
import SmallNavbar from './Pages/SmallNavbar'
import { Routes, Route, Link } from 'react-router-dom';
import './App.css'
import Help from './Pages/Help';

function App() {

  return (
    <>
      <SmallNavbar />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<div className="text-white">Home Content</div>} />
          <Route path="/help" element={<Help />} />
       
        </Routes>
      </main>

    </>
  )
}

export default App
