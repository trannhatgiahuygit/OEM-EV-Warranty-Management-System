// VehicleManagementPage.js

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AllVehiclesList from './AllVehiclesList';
import PartsDetailPage from './PartsDetailPage';
import SearchVehicleByVin from './SearchVehicleByVin';
import SearchVehicleByCustomerId from './SearchVehicleByCustomerId';
import AddNewVehicle from './AddNewVehicle'; // NEW: Import the new component
import './VehicleManagementPage.css';

const VehicleManagementPage = ({ handleBackClick, customerId: initialCustomerId }) => { // Accept initialCustomerId
  const [activeFunction, setActiveFunction] = useState('all-vehicles');
  const [activeView, setActiveView] = useState('main'); 
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentCustomerId, setCurrentCustomerId] = useState(initialCustomerId); // State for customerId

  // Effect to handle initialCustomerId coming from CustomerPage
  useEffect(() => {
    if (initialCustomerId) {
      setActiveFunction('search-customer-id');
      setActiveView('main');
      setCurrentCustomerId(initialCustomerId);
    } else {
      setActiveFunction('all-vehicles');
      setActiveView('main');
      setCurrentCustomerId(null);
    }
  }, [initialCustomerId]); // Rerun if initialCustomerId changes

  const handlePartsDetailClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveView('parts-detail');
  };

  const handleBackToMain = (newFunction = 'all-vehicles') => {
    setSelectedVehicle(null);
    setActiveView('main');
    setActiveFunction(newFunction);
    // When navigating back, if we came from a customer-specific view, clear the customerId
    if (initialCustomerId) {
      setCurrentCustomerId(null); // This will cause a re-render and revert to 'all-vehicles'
    }
  };
  
  const handleFunctionChange = (func) => {
    setActiveFunction(func);
    setActiveView('main');
    setSelectedVehicle(null);
    setCurrentCustomerId(null); // Clear customer ID when switching functions manually
  };
  
  // Handler for successful vehicle registration to switch to the all-vehicles list
  const handleNewVehicleAdded = () => {
    setActiveFunction('all-vehicles');
    setActiveView('main');
    setSelectedVehicle(null);
    setCurrentCustomerId(null);
  }

  const renderActiveFunction = () => {
    if (activeView === 'parts-detail') {
      return <PartsDetailPage vehicle={selectedVehicle} handleBackClick={() => handleBackToMain(activeFunction)} />;
    }

    switch (activeFunction) {
      case 'all-vehicles':
        return <AllVehiclesList onPartsDetailClick={handlePartsDetailClick} />;
      case 'search-vin':
        return <SearchVehicleByVin onPartsDetailClick={handlePartsDetailClick} />;
      case 'search-customer-id':
        // Pass currentCustomerId to SearchVehicleByCustomerId
        return <SearchVehicleByCustomerId 
                 onPartsDetailClick={handlePartsDetailClick} 
                 initialCustomerId={currentCustomerId} // Pass the ID here
               />;
      case 'add-vehicle': // NEW: Render AddNewVehicle component
          return <AddNewVehicle 
                    handleBackClick={() => handleBackToMain()} 
                    onVehicleAdded={handleNewVehicleAdded}
                 />;
      default:
        return (
          <motion.div
            className="welcome-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3>Welcome to Vehicle Management</h3>
            <p>Select a function above to get started.</p>
          </motion.div>
        );
    }
  };

  return (
    <div className="vehicle-page-wrapper"> {/* Changed from customer-page-wrapper to vehicle-page-wrapper */}
      <div className="vehicle-page-header"> {/* Changed from customer-page-header to vehicle-page-header */}
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Back to Dashboard
        </button>
        <h2 className="page-title">Vehicle Management</h2>
        {/* REMOVED: <p className="page-description">Manage all vehicle-related functions here.</p> */}
        <motion.div
          className="function-nav-bar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Only show "All Vehicles", "Add New Vehicle", and "Search by VIN" if not coming from a customer-specific view */}
          {!currentCustomerId && (
            <>
              {/* 1. All Vehicles */}
              <button
                onClick={() => handleFunctionChange('all-vehicles')}
                className={activeFunction === 'all-vehicles' && activeView === 'main' ? 'active' : ''}
                disabled={activeView === 'parts-detail'}
              >
                All Vehicles
              </button>

              {/* 2. Add New Vehicle (MOVED HERE) */}
              <button
                onClick={() => handleFunctionChange('add-vehicle')}
                className={activeFunction === 'add-vehicle' && activeView === 'main' ? 'active' : ''}
                disabled={activeView === 'parts-detail'}
              >
                Add New Vehicle
              </button>

              {/* 3. Search by VIN */}
              <button
                onClick={() => handleFunctionChange('search-vin')}
                className={activeFunction === 'search-vin' && activeView === 'main' ? 'active' : ''}
                disabled={activeView === 'parts-detail'}
              >
                Search by VIN
              </button>
            </>
          )}
          
          {/* Always show "Search by Customer ID" but it will be active if currentCustomerId is set */}
          <button
            onClick={() => handleFunctionChange('search-customer-id')}
            className={activeFunction === 'search-customer-id' && activeView === 'main' ? 'active' : ''}
            disabled={activeView === 'parts-detail'}
          >
            Search by Customer ID
          </button>
        </motion.div>
      </div>

      <div className="vehicle-page-content-area"> {/* Changed from customer-page-content-area to vehicle-page-content-area */}
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default VehicleManagementPage;