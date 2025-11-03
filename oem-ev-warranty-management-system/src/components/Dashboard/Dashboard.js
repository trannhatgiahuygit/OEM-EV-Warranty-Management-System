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
import ClaimDetailPage from './ClaimDetailPage/ClaimDetailPage';
import TechnicianClaimManagementPage from './TechnicianClaimManagementPage/TechnicianClaimManagementPage';
import EVMPartInventoryPage from './EVMPartInventoryPage/EVMPartInventoryPage';
import EVMClaimManagementPage from './EVMClaimManagementPage/EVMClaimManagementPage';
import SCPartManagementPage from './SCPartManagementPage/SCPartManagementPage';
import UpdateDiagnosticPage from './UpdateDiagnosticPage/UpdateDiagnosticPage'; 
import EVMRecallManagementPage from './EVMRecallManagementPage/EVMRecallManagementPage'; 
// --- ADDED NEW IMPORT ---
import TechnicianSubmitEVMForm from './TechnicianSubmitEVMForm/TechnicianSubmitEVMForm'; 
// --- ADDED EVM Action Imports ---
import EVMClaimApprovePage from './EVMClaimActionModal/EVMClaimApprovePage'; // Assuming this component exists
import EVMClaimRejectPage from './EVMClaimActionModal/EVMClaimRejectPage'; // Assuming this component exists


const roleFunctions = {
  SC_STAFF: [
    { title: 'New Repair Claim', path: 'new-repair-claim' },
    { title: 'Claim Management', path: 'claim-management' },
    { title: 'Customer', path: 'customer' },
    { title: 'Vehicle Management', path: 'vehicle-management' },
    { title: 'Service Center Technicians', path: 'sc-technicians' },
    { title: 'Recall Management', path: 'recall-management' }, 
  ],
  SC_TECHNICIAN: [
    { title: 'Technician Claim Management', path: 'technician-claim-management' },
    { title: 'Customer', path: 'customer' },
    { title: 'Vehicle Management', path: 'vehicle-management' },
    { title: 'Part Serial Management', path: 'sc-part-management' },
  ],
  // ADDED ROLE
  EVM_STAFF: [
    { title: 'EVM Claim Management', path: 'evm-claim-management' },
    { title: 'Recall Management', path: 'recall-management' }, 
    { title: 'Vehicle Management', path: 'vehicle-management' },
    { title: 'EVM Part Inventory', path: 'evm-part-inventory' },
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
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [draftToProcess, setDraftToProcess] = useState(null);
  const [activeClaimTab, setActiveClaimTab] = useState('open');
  // ADDED: State to track the source page for claim details
  const [sourcePage, setSourcePage] = useState(null);
  // --- NEW STATE FOR TECHNICIAN SUBMISSION ---
  const [techSubmitEVMData, setTechSubmitEVMData] = useState(null);
  // --- NEW STATE FOR EVM APPROVE/REJECT CONTEXT ---
  const [evmActionContext, setEvmActionContext] = useState(null); // Stores claimId, claimNumber, vin, failure, estimatedCost

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
    // Handler to go back to the Technician Claim Management list
    const handleBackToTechnicianList = () => {
      setSelectedClaimId(null);
      setDraftToProcess(null);
      setSourcePage(null); // Clear the source flag
      setActivePage('technician-claim-management');
    };

    // Handler to go back to the SC Staff Claim Management list
    const handleBackToClaimList = () => {
      setSelectedClaimId(null);
      setDraftToProcess(null);
      setSourcePage(null); // Clear the source flag
      setActivePage('claim-management');
    };

    // ADDED: Handler to go back to the EVM Claim Management list
    const handleBackToEVMList = () => {
      setSelectedClaimId(null);
      setDraftToProcess(null);
      setSourcePage(null); // Clear the source flag
      setActivePage('evm-claim-management');
    };
    
    // ADDED: Handler to go back from action page to ClaimDetailPage
    const handleBackToClaimDetail = () => {
      // Clear all action/submission data and go back to claim detail
      setTechSubmitEVMData(null); 
      setEvmActionContext(null); 
      setActivePage('claim-details');
    };
    
    // Handler for successful EVM approval/rejection
    const handleEVMActionComplete = (updatedClaimData) => {
        // Clear action context and return to Claim Detail page
        setEvmActionContext(null);
        setSelectedClaimId(updatedClaimData.id);
        setActivePage('claim-details');
    };


    // Main back button handler (for sidebar clicks)
    const handleBackClick = () => {
      if (activePage === 'new-repair-claim') {
        if (selectedClaimId) {
          setActivePage('claim-details');
          setDraftToProcess(null);
          return;
        }
      }

      // Default behavior: back to home/dashboard and clear all states
      setActivePage(null);
      setCustomerVehiclesId(null);
      setSelectedClaimId(null);
      setDraftToProcess(null);
      setActiveClaimTab('open');
      setSourcePage(null); // Ensure source is cleared
      setTechSubmitEVMData(null); // Clear submission data
      setEvmActionContext(null); // Clear EVM action context
    };

    // Handler to navigate to claim detail (used by both SC Staff, Technicians, and EVM Staff)
    const handleViewClaimDetails = (claimId, sourceTab, sourcePath = 'claim-management') => {
      setSelectedClaimId(claimId);
      setActiveClaimTab(sourceTab || 'open');
      setSourcePage(sourcePath); // Set the source path
      setActivePage('claim-details');
    };
    
    // ADDED: Handler to navigate to the Update Diagnostic page (Technician flow)
    const handleUpdateDiagnostic = (claimId) => {
        setSelectedClaimId(claimId);
        // sourcePage should already be set to 'technician-claim-management'
        setActivePage('update-diagnostic');
    }
    
    // --- MODIFIED HANDLER: Navigate to EVM Approve Form ---
    const handleNavigateToApprove = (claimId, claimNumber, estimatedCost, vin, reportedFailure) => {
        setEvmActionContext({ 
            claimId, 
            claimNumber, 
            estimatedCost, 
            vin, 
            reportedFailure 
        });
        setActivePage('evm-claim-approve');
    };

    // --- MODIFIED HANDLER: Navigate to EVM Reject Form ---
    const handleNavigateToReject = (claimId, claimNumber, vin, reportedFailure) => {
        setEvmActionContext({ 
            claimId, 
            claimNumber, 
            vin, 
            reportedFailure 
        });
        setActivePage('evm-claim-reject');
    };
    
    // --- NEW HANDLER: Navigate to Technician EVM Submission Form ---
    const handleNavigateToTechSubmitEVM = (claimId, claimNumber) => {
        setSelectedClaimId(claimId);
        setTechSubmitEVMData({ claimId, claimNumber });
        setSourcePage('technician-claim-management'); // Ensure source context is maintained
        setActivePage('technician-submit-evm');
    }
    
    // --- NEW HANDLER: After successful submission from the Technician Form ---
    const handleTechSubmissionSuccess = (updatedClaimData) => {
        // Clear temp state and navigate back to detail page, which will re-fetch details
        setTechSubmitEVMData(null);
        setSelectedClaimId(updatedClaimData.id);
        setActivePage('claim-details'); 
    }

    // --- Handler to process a draft claim (Intake flow) ---
    const handleProcessToIntake = (claimData) => {
      setDraftToProcess({ ...claimData, flowType: 'intake' });
      setSelectedClaimId(claimData.id);
      setActivePage('new-repair-claim');
    };

    // --- Handler to edit a draft claim (Edit Draft flow) ---
    const handleEditDraftClaim = (claimData) => {
      setDraftToProcess({ ...claimData, flowType: 'edit' });
      setSelectedClaimId(claimData.id);
      setActivePage('new-repair-claim');
    };

    const handleViewVehiclesClick = (customerId) => {
      setCustomerVehiclesId(customerId);
      setActivePage('vehicle-management');
    };

    // Determine which 'Back' handler to use for ClaimDetailPage
    const claimDetailBackHandler =
      sourcePage === 'technician-claim-management'
        ? handleBackToTechnicianList
        : sourcePage === 'evm-claim-management' // ADDED EVM check
          ? handleBackToEVMList
          : handleBackToClaimList;

    // Determine the button label for ClaimDetailPage
    const backButtonLabel =
      sourcePage === 'technician-claim-management'
        ? 'Back to Technician Claim List'
        : sourcePage === 'evm-claim-management' // ADDED EVM check
          ? 'Back to EVM Claim List'
          : 'Back to Claim List';


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
        return <NewRepairClaimPage handleBackClick={handleBackClick} draftClaimData={draftToProcess} />;

      case 'claim-management':
        return <ClaimManagementPage
          handleBackClick={handleBackClick}
          onViewClaimDetails={handleViewClaimDetails}
          initialTab={activeClaimTab}
        />;

      case 'claim-details':
        // MODIFIED: Pass the new onNavigateToApprove/Reject handlers
        return <ClaimDetailPage
          claimId={selectedClaimId}
          onBackClick={claimDetailBackHandler}
          onProcessToIntake={handleProcessToIntake}
          onEditDraftClaim={handleEditDraftClaim}
          onUpdateDiagnostic={handleUpdateDiagnostic} 
          onNavigateToApprove={handleNavigateToApprove} // ADDED
          onNavigateToReject={handleNavigateToReject}   // ADDED
          onNavigateToTechSubmitEVM={handleNavigateToTechSubmitEVM} 
          backButtonLabel={backButtonLabel} 
        />;

      case 'technician-claim-management':
        return <TechnicianClaimManagementPage
          handleBackClick={handleBackClick}
          onViewClaimDetails={(claimId) => handleViewClaimDetails(claimId, null, 'technician-claim-management')}
        />;

      case 'evm-claim-management': 
        return <EVMClaimManagementPage 
                  handleBackClick={handleBackClick}
                  onViewClaimDetails={(claimId) => handleViewClaimDetails(claimId, 'pending', 'evm-claim-management')}
                />;
      
      case 'recall-management': 
        return <EVMRecallManagementPage 
                  handleBackClick={handleBackClick} 
                  userRole={userRole} 
                />;
      
      case 'sc-part-management': 
        return <SCPartManagementPage 
                  handleBackClick={handleBackClick}
                />;

      case 'evm-part-inventory': 
        return <EVMPartInventoryPage 
                  handleBackClick={handleBackClick}
                />;
                
      case 'update-diagnostic': 
        return <UpdateDiagnosticPage
                  claimId={selectedClaimId}
                  handleBackClick={handleBackToClaimDetail} 
                />
                
      case 'technician-submit-evm': 
          if (!techSubmitEVMData) {
              return <HomePageContent />; 
          }
          return <TechnicianSubmitEVMForm
                    claimId={techSubmitEVMData.claimId}
                    claimNumber={techSubmitEVMData.claimNumber}
                    onSubmissionSuccess={handleTechSubmissionSuccess}
                    handleBackClick={handleBackToClaimDetail} 
                  />
                  
      // --- NEW CASE: EVM CLAIM APPROVE PAGE ---
      case 'evm-claim-approve':
        if (!evmActionContext) return <HomePageContent />;
        return <EVMClaimApprovePage
                  claimId={evmActionContext.claimId}
                  claimNumber={evmActionContext.claimNumber}
                  estimatedCost={evmActionContext.estimatedCost}
                  vin={evmActionContext.vin}
                  reportedFailure={evmActionContext.reportedFailure}
                  onActionComplete={handleEVMActionComplete}
                  handleBack={handleBackToClaimDetail}
                />;
                
      // --- NEW CASE: EVM CLAIM REJECT PAGE ---
      case 'evm-claim-reject':
        if (!evmActionContext) return <HomePageContent />;
        return <EVMClaimRejectPage
                  claimId={evmActionContext.claimId}
                  claimNumber={evmActionContext.claimNumber}
                  vin={evmActionContext.vin}
                  reportedFailure={evmActionContext.reportedFailure}
                  onActionComplete={handleEVMActionComplete}
                  handleBack={handleBackToClaimDetail}
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
                  setSelectedClaimId(null);
                  setDraftToProcess(null);
                  setActiveClaimTab('open');
                  setSourcePage(null); // Clear source page on main navigation
                  setTechSubmitEVMData(null); // Clear submission data on main navigation
                  setEvmActionContext(null); // Clear EVM action context
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