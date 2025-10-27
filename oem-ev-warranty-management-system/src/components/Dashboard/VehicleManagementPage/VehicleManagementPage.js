// VehicleManagementPage.js

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AllVehiclesList from './AllVehiclesList';
import PartsDetailPage from './PartsDetailPage';
import SearchVehicleByVin from './SearchVehicleByVin';
import SearchVehicleByCustomerId from './SearchVehicleByCustomerId';
import AddNewVehicle from './AddNewVehicle';
import './VehicleManagementPage.css';

const VehicleManagementPage = ({ handleBackClick, customerId: initialCustomerId }) => {
  const [activeFunction, setActiveFunction] = useState('all-vehicles');
  const [activeView, setActiveView] = useState('main'); 
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentCustomerId, setCurrentCustomerId] = useState(initialCustomerId);
  const [userRole, setUserRole] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for latest (default), 'asc' for oldest

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => (prevOrder === 'desc' ? 'asc' : 'desc'));
  };
  
  // ... (Other useEffect and handlers remain the same) ...
  
  // ADDED: Effect to get user role from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    }
  }, []);

  // Effect to handle initialCustomerId coming from CustomerPage
  useEffect(() => {
    if (initialCustomerId) {
      setActiveFunction('search-customer-id');
      setActiveView('main');
      setCurrentCustomerId(initialCustomerId);
      setSortOrder('desc'); 
    } else {
      setActiveFunction('all-vehicles');
      setActiveView('main');
      setCurrentCustomerId(null);
      setSortOrder('desc'); 
    }
  }, [initialCustomerId]);

  const handlePartsDetailClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setActiveView('parts-detail');
  };

  const handleBackToMain = (newFunction = 'all-vehicles') => {
    setSelectedVehicle(null);
    setActiveView('main');
    setActiveFunction(newFunction);
    setSortOrder('desc'); 
    if (initialCustomerId) {
      setCurrentCustomerId(null);
    }
  };
  
  const handleFunctionChange = (func) => {
    setActiveFunction(func);
    setActiveView('main');
    setSelectedVehicle(null);
    setCurrentCustomerId(null);
    setSortOrder('desc'); 
  };
  
  const handleNewVehicleAdded = () => {
    setActiveFunction('all-vehicles');
    setActiveView('main');
    setSelectedVehicle(null);
    setCurrentCustomerId(null);
    setSortOrder('desc'); 
  }

  const renderActiveFunction = () => {
    if (activeView === 'parts-detail') {
      return <PartsDetailPage vehicle={selectedVehicle} handleBackClick={() => handleBackToMain(activeFunction)} />;
    }

    switch (activeFunction) {
      case 'all-vehicles':
        return <AllVehiclesList 
                 onPartsDetailClick={handlePartsDetailClick} 
                 sortOrder={sortOrder}
                 toggleSortOrder={toggleSortOrder}
               />;
      case 'search-vin':
        return <SearchVehicleByVin onPartsDetailClick={handlePartsDetailClick} />;
      case 'search-customer-id':
        return <SearchVehicleByCustomerId 
                 onPartsDetailClick={handlePartsDetailClick} 
                 initialCustomerId={currentCustomerId}
               />;
      case 'add-vehicle':
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
    <div className="vehicle-page-wrapper">
      <div className="vehicle-page-header">
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Back to Dashboard
        </button>
        <h2 className="page-title">Vehicle Management</h2>
        
        {/* NEW WRAPPER: Use a similar pattern as ClaimManagementPage to stack nav bars */}
        <div className="vehicle-header-nav-group"> 
            
            {/* Function Nav Bar (Main Tabs) */}
            <motion.div
              className="function-nav-bar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Only show these buttons if not coming from a customer-specific view */}
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

                  {/* 2. Add New Vehicle (CONDITIONAL RENDER BASED ON ROLE) */}
                  {(userRole === 'SC_STAFF' || userRole === 'EVM_STAFF') && (
                    <button
                      onClick={() => handleFunctionChange('add-vehicle')}
                      className={activeFunction === 'add-vehicle' && activeView === 'main' ? 'active' : ''}
                      disabled={activeView === 'parts-detail'}
                    >
                      Add New Vehicle
                    </button>
                  )}

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
              
              {/* Always show "Search by Customer ID" */}
              <button
                onClick={() => handleFunctionChange('search-customer-id')}
                className={activeFunction === 'search-customer-id' && activeView === 'main' ? 'active' : ''}
                disabled={activeView === 'parts-detail'}
              >
                Search by Customer ID
              </button>
            </motion.div>
            
            {/* NEW: Sorting Buttons (separated into a new line/container) */}
            {activeFunction === 'all-vehicles' && activeView === 'main' && (
              <motion.div
                className="vehicle-sort-button-group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span>Sort by Creation Date:</span> 
                <button
                  onClick={() => setSortOrder('desc')} // 'desc' is latest first
                  className={sortOrder === 'desc' ? 'active' : ''}
                >
                  Latest First
                </button>
                <button
                  onClick={() => setSortOrder('asc')} // 'asc' is oldest first
                  className={sortOrder === 'asc' ? 'active' : ''}
                >
                  Oldest First
                </button>
              </motion.div>
            )}
        </div>
      </div>

      <div className="vehicle-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default VehicleManagementPage;