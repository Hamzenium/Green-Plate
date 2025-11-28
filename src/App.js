import React from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Dashboard from './pages/Dashboard';
import './App.css';
import {
	BrowserRouter as Router,
	Routes,
	Route
} from "react-router-dom";

function App() {
	return (
		<Router>
			<Navbar />
			<Routes>
				<Route path='/' element={<LandingPage />} />
				<Route path='/dashboard' element={<Dashboard />} />
			</Routes>
		</Router>
	);
}

export default App;
