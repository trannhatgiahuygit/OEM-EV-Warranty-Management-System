import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Toast.css'; // Import the new custom toast styles
import HomePage from './components/HomePage/HomePage';
import Header from './components/Header/Header';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ProfilePage from './components/ProfilePage/ProfilePage'; // NEW: Import the ProfilePage component

const App = () => (
  <Router>
    <Header />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<ProfilePage />} /> {/* NEW: Add the Profile route */}
    </Routes>
    <ToastContainer />
  </Router>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);