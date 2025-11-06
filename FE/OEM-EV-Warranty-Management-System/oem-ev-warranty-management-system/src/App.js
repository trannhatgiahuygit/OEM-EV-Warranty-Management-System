import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage"; // nếu cậu có file HomePage.js
import Dashboard from "./pages/Dashboard";
import SCPartManagementPage from "./pages/technician/SCPartManagementPage";
import EVMPartInventoryPage from "./pages/evm/EVMPartInventoryPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/technician/part-management" element={<SCPartManagementPage />} />
        <Route path="/evm/part-inventory" element={<EVMPartInventoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
