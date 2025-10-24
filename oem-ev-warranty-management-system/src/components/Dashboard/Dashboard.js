// Dashboard.js

import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CustomerPage from './CustomerPage/CustomerPage';
import ServiceCenterTechniciansPage from './ServiceCenterTechniciansPage/ServiceCenterTechniciansPage';
import UserManagementPage from './UserManagementPage/UserManagementPage';
import VehicleManagementPage from './VehicleManagementPage/VehicleManagementPage';
import NewRepairClaimPage from './NewRepairClaimPage/NewRepairClaimPage';
import ClaimManagementPage from './ClaimManagementPage/ClaimManagementPage';
import ClaimDetailPage from './ClaimDetailPage/ClaimDetailPage'; // Import the new component

const roleFunctions = {
  SC_STAFF: [
    { title: 'Customer', path: 'customer' },
    { title: 'Vehicle Management', path: 'vehicle-management' },
    { title: 'New Repair Claim', path: 'new-repair-claim' },
    { title: 'Claim Management', path: 'claim-management' },
    { title: 'Service Center Technicians', path: 'sc-technicians' },
  ],
  SC_TECHNICIAN: [
    { title: 'Customer', path: 'customer' },
    { title: 'Vehicle Management', path: 'vehicle-management' },
  ],
  ADMIN: [
    { title: 'User Management', path: 'user-management' },
  ],
};

const HomePageContent = () => (
  <div className="dashboard-content-page">
    <h2>Welcome to Your Dashboard</h2>
    <p>Select a function from the sidebar to get started.</p>
  </div>
);

const Dashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const [activePage, setActivePage] = useState(null);
  const [customerVehiclesId, setCustomerVehiclesId] = useState(null);
  const [selectedClaimId, setSelectedClaimId] = useState(null); // State for the selected claim
  const [draftToProcess, setDraftToProcess] = useState(null); // State for draft data for intake/edit
  
  // State to remember the active claim tab
  const [activeClaimTab, setActiveClaimTab] = useState('open'); // Default to 'open'
  
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const getSidebarLinks = () => {
    return roleFunctions[userRole] || [];
  };

  const renderContent = () => {
    // Main back button handler
    const handleBackClick = () => {
      // If we're coming back from a claim form (new, intake, or edit), check if we should go to claim list or dashboard
      if (activePage === 'new-repair-claim') {
        if (selectedClaimId) {
            // If selectedClaimId exists, we were editing a draft, so go back to details
            setActivePage('claim-details');
            setDraftToProcess(null); // Clear draft data but keep selectedClaimId
            return;
        }
      }
      
      // Default behavior: back to home/dashboard and clear all states
      setActivePage(null);
      setCustomerVehiclesId(null);
      setSelectedClaimId(null); 
      setDraftToProcess(null); 
      setActiveClaimTab('open'); 
    };

    // Handler to go from claim list to claim detail
    const handleViewClaimDetails = (claimId, sourceTab) => {
      setSelectedClaimId(claimId);
      setActiveClaimTab(sourceTab || 'open'); 
      setActivePage('claim-details');
    };

    // Handler to go from claim detail back to claim list
    const handleBackToClaimList = () => {
      setSelectedClaimId(null);
      setDraftToProcess(null);
      setActivePage('claim-management');
    };

    // --- Handler to process a draft claim (Intake flow) ---
    const handleProcessToIntake = (claimData) => {
      setDraftToProcess({ ...claimData, flowType: 'intake' }); // Add flow type for clarity
      setSelectedClaimId(claimData.id); // Keep the ID for returning to details later
      setActivePage('new-repair-claim');
    };
    
    // --- NEW: Handler to edit a draft claim (Edit Draft flow) ---
    const handleEditDraftClaim = (claimData) => {
      setDraftToProcess({ ...claimData, flowType: 'edit' }); // Set flow type to distinguish from intake
      setSelectedClaimId(claimData.id); // Keep the ID for returning to details later
      setActivePage('new-repair-claim');
    };

    const handleViewVehiclesClick = (customerId) => {
      setCustomerVehiclesId(customerId);
      setActivePage('vehicle-management');
    };

    switch (activePage) {
      case 'customer':
        return <CustomerPage handleBackClick={handleBackClick} onViewVehiclesClick={handleViewVehiclesClick} />;
      case 'sc-technicians':
        return <ServiceCenterTechniciansPage handleBackClick={handleBackClick} />;
      case 'user-management':
        return <UserManagementPage handleBackClick={handleBackClick} />;
      case 'vehicle-management':
        return <VehicleManagementPage handleBackClick={handleBackClick} customerId={customerVehiclesId} />;
      
      case 'new-repair-claim':
        // Pass draft data to the form
        return <NewRepairClaimPage handleBackClick={handleBackClick} draftClaimData={draftToProcess} />;
      
      case 'claim-management':
        // Pass the new handler and the initial tab state
        return <ClaimManagementPage 
                  handleBackClick={handleBackClick} 
                  onViewClaimDetails={handleViewClaimDetails}
                  initialTab={activeClaimTab} 
                />;
      
      case 'claim-details':
        // --- MODIFIED: Pass the new handler `onEditDraftClaim` to the detail page ---
        return <ClaimDetailPage
          claimId={selectedClaimId}
          onBackClick={handleBackToClaimList}
          onProcessToIntake={handleProcessToIntake}
          onEditDraftClaim={handleEditDraftClaim} // <<-- NEW PROP HERE
        />;
      default:
        return <HomePageContent />;
    }
  };

  return (
    <>
      <div className="hero-bg">
        <div className="animated-grid" />
        <div className="gradient-bg" />
      </div>
      <div className="dashboard-page">
        <div className="dashboard-container">
          <motion.div
            className="dashboard-sidebar"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {getSidebarLinks().map((link, index) => (
              <motion.button
                key={index}
                className="sidebar-button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => {
                  setActivePage(link.path);
                  setCustomerVehiclesId(null);
                  setSelectedClaimId(null); // Clear claim ID when changing main pages
                  setDraftToProcess(null); 
                  setActiveClaimTab('open'); 
                }}
              >
                {link.title}
              </motion.button>
            ))}
          </motion.div>
          <div className="dashboard-content">{renderContent()}</div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;