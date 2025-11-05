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
import TechnicianSubmitEVMForm from './TechnicianSubmitEVMForm/TechnicianSubmitEVMForm'; 
import EVMClaimApprovePage from './EVMClaimActionModal/EVMClaimApprovePage'; 
import EVMClaimRejectPage from './EVMClaimActionModal/EVMClaimRejectPage';
import ProblemReportPage from './ProblemReportPage/ProblemReportPage';
import ProblemResolutionPage from './ProblemResolutionPage/ProblemResolutionPage';
import ClaimCompletePage from './ClaimManagementForms/ClaimCompletePage';
import ClaimReopenPage from './ClaimManagementForms/ClaimReopenPage';
import WorkDonePage from './ClaimManagementForms/WorkDonePage'; 
import SCDashboardCards from './SCDashboardCards/SCDashboardCards';
import EVMDashboardCards from './EVMDashboardCards/EVMDashboardCards';
import VehicleModelManagementPage from './VehicleModelManagementPage/VehicleModelManagementPage';
import WarrantyConditionManagementPage from './WarrantyConditionManagementPage/WarrantyConditionManagementPage';
import ThirdPartyPartManagementPage from './ThirdPartyPartManagementPage/ThirdPartyPartManagementPage';
import ServiceCatalogManagementPage from './ServiceCatalogManagementPage/ServiceCatalogManagementPage';


const roleFunctions = {
  SC_STAFF: [
    { title: 'Yêu cầu Sửa chữa Mới', path: 'new-repair-claim' },
    { title: 'Quản lý Yêu cầu', path: 'claim-management' },
    { title: 'Khách hàng', path: 'customer' },
    { title: 'Quản lý Xe', path: 'vehicle-management' },
    { title: 'Kỹ thuật viên Trung tâm Dịch vụ', path: 'sc-technicians' },
    { title: 'Quản lý Thu hồi', path: 'recall-management' },
    { title: 'Quản lý Mẫu Xe', path: 'vehicle-model-management' },
    { title: 'Quản lý Điều kiện Bảo hành', path: 'warranty-condition-management' },
    { title: 'Quản lý Phụ tùng Bên thứ ba', path: 'third-party-part-management' },
    { title: 'Danh mục Dịch vụ', path: 'service-catalog-management' },
  ],
  SC_TECHNICIAN: [
    { title: 'Quản lý Yêu cầu Kỹ thuật viên', path: 'technician-claim-management' },
    { title: 'Khách hàng', path: 'customer' },
    { title: 'Quản lý Xe', path: 'vehicle-management' },
    { title: 'Quản lý Số Serial Phụ tùng', path: 'sc-part-management' },
    { title: 'Quản lý Mẫu Xe', path: 'vehicle-model-management' },
    { title: 'Quản lý Điều kiện Bảo hành', path: 'warranty-condition-management' },
    { title: 'Quản lý Phụ tùng Bên thứ ba', path: 'third-party-part-management' },
    { title: 'Danh mục Dịch vụ', path: 'service-catalog-management' },
  ],
  // ADDED ROLE
  EVM_STAFF: [
    { title: 'Quản lý Yêu cầu EVM', path: 'evm-claim-management' },
    { title: 'Quản lý Thu hồi', path: 'recall-management' }, 
    { title: 'Quản lý Xe', path: 'vehicle-management' },
    { title: 'Kho Phụ tùng EVM', path: 'evm-part-inventory' },
    { title: 'Quản lý Mẫu Xe', path: 'vehicle-model-management' },
    { title: 'Quản lý Điều kiện Bảo hành', path: 'warranty-condition-management' },
  ],
  ADMIN: [
    { title: 'Quản lý Người dùng', path: 'user-management' },
    { title: 'Danh mục Dịch vụ', path: 'service-catalog-management' },
  ],
};

const HomePageContent = ({ userRole }) => {
  // Show SC dashboard cards for SC_STAFF and SC_TECHNICIAN
  const shouldShowSCDashboard = (userRole === 'SC_STAFF' || userRole === 'SC_TECHNICIAN');
  // Show EVM dashboard cards for EVM_STAFF and ADMIN (ADMIN gets EVM dashboard as higher priority)
  const shouldShowEVMDashboard = (userRole === 'EVM_STAFF' || userRole === 'ADMIN');
  // Show welcome message for other roles
  const shouldShowWelcome = !shouldShowSCDashboard && !shouldShowEVMDashboard;
  
  return (
    <div className="dashboard-content-page">
      {shouldShowSCDashboard && <SCDashboardCards userRole={userRole} />}
      {shouldShowEVMDashboard && <EVMDashboardCards userRole={userRole} />}
      {shouldShowWelcome && (
        <div className="welcome-message">
          <h2>Chào mừng đến với Bảng điều khiển</h2>
          <p>Chọn một chức năng từ thanh bên để bắt đầu.</p>
        </div>
      )}
    </div>
  );
};

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
  // --- NEW STATE FOR EVM APPROVE/REJECT CONTEXT (Updated to use warrantyCost) ---
  const [evmActionContext, setEvmActionContext] = useState(null); // Stores claimId, claimNumber, vin, failure, warrantyCost
  // --- NEW STATE FOR PROBLEM REPORTING/RESOLUTION CONTEXT ---
  const [problemContext, setProblemContext] = useState(null); // Stores claimId, claimNumber, vin, failure, warrantyCost, problemType, problemDescription
  // --- NEW STATE FOR CLAIM COMPLETE/REOPEN CONTEXT ---
  const [claimActionContext, setClaimActionContext] = useState(null); // Stores claimId, claimNumber, vin, failure, warrantyCost
  // --- NEW STATE FOR WORK DONE CONTEXT (TECHNICIAN) ---
  const [workDoneContext, setWorkDoneContext] = useState(null); // Stores claimId, claimNumber, vin, failure, warrantyCost

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Debug: Monitor evmActionContext changes
  useEffect(() => {
    if (evmActionContext) {
      console.log('Dashboard - evmActionContext changed:', evmActionContext);
    }
  }, [evmActionContext]);

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
      setProblemContext(null);
      setActivePage('claim-details');
    };
    
    // Handler for successful EVM approval/rejection
    const handleEVMActionComplete = (updatedClaimData) => {
        // Clear action context and return to Claim Detail page
        setEvmActionContext(null);
        setSelectedClaimId(updatedClaimData.id);
        setActivePage('claim-details');
    };
    
    // --- NEW HANDLER: Navigate to Problem Report Page (Technician) ---
    const handleNavigateToReportProblem = (claimId, claimNumber, warrantyCost, vin, reportedFailure) => {
        setProblemContext({
            claimId,
            claimNumber,
            warrantyCost,
            vin,
            reportedFailure
        });
        setActivePage('problem-report');
    };
    
    // --- NEW HANDLER: Navigate to Problem Resolution Page (EVM) ---
    const handleNavigateToResolveProblem = (claimId, claimNumber, vin, reportedFailure, warrantyCost, problemType, problemDescription) => {
        setProblemContext({
            claimId,
            claimNumber,
            vin,
            reportedFailure,
            warrantyCost,
            problemType,
            problemDescription
        });
        setActivePage('problem-resolution');
    };
    
    // --- NEW HANDLER: Problem action complete ---
    const handleProblemActionComplete = (updatedClaimData) => {
        setProblemContext(null);
        setSelectedClaimId(updatedClaimData.id);
        setActivePage('claim-details');
    };
    
    // --- NEW HANDLER: Navigate to Complete Claim Form ---
    const handleNavigateToCompleteClaim = (claimId, claimNumber, warrantyCost, vin, reportedFailure) => {
        setClaimActionContext({ 
            claimId, 
            claimNumber, 
            warrantyCost, 
            vin, 
            reportedFailure 
        });
        setActivePage('claim-complete');
    };
    
    // --- NEW HANDLER: Navigate to Reopen Claim Form ---
    const handleNavigateToReopenClaim = (claimId, claimNumber, warrantyCost, vin, reportedFailure) => {
        setClaimActionContext({ 
            claimId, 
            claimNumber, 
            warrantyCost, 
            vin, 
            reportedFailure 
        });
        setActivePage('claim-reopen');
    };
    
    // --- NEW HANDLER: Claim action complete ---
    const handleClaimActionComplete = (updatedClaimData) => {
        setClaimActionContext(null);
        setSelectedClaimId(updatedClaimData.id);
        setActivePage('claim-details');
    };
    
    // --- NEW HANDLER: Navigate to Work Done Form (Technician) ---
    const handleNavigateToWorkDone = (claimId, claimNumber, warrantyCost, vin, reportedFailure) => {
        setWorkDoneContext({ 
            claimId, 
            claimNumber, 
            warrantyCost, 
            vin, 
            reportedFailure 
        });
        setActivePage('work-done');
    };
    
    // --- NEW HANDLER: Work done action complete ---
    const handleWorkDoneComplete = (updatedClaimData) => {
        setWorkDoneContext(null);
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
      setProblemContext(null); // Clear problem context
      setClaimActionContext(null); // Clear claim action context
      setWorkDoneContext(null); // Clear work done context
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
    
    // --- MODIFIED HANDLER: Navigate to EVM Approve Form (Now using warrantyCost) ---
    const handleNavigateToApprove = (claimId, claimNumber, warrantyCost, vin, reportedFailure) => {
        console.log('Dashboard - handleNavigateToApprove called with:', { claimId, claimNumber, warrantyCost, vin, reportedFailure });
        const contextToSet = { 
            claimId, 
            claimNumber, 
            warrantyCost, // PROP: warrantyCost
            vin, 
            reportedFailure 
        };
        console.log('Dashboard - Setting evmActionContext to:', contextToSet);
        setEvmActionContext(contextToSet);
        setActivePage('evm-claim-approve');
    };

    // --- MODIFIED/FIXED HANDLER: Navigate to EVM Reject Form (Now using warrantyCost) ---
    const handleNavigateToReject = (claimId, claimNumber, vin, reportedFailure, warrantyCost) => {
        console.log('Dashboard - handleNavigateToReject:', { claimId, claimNumber, warrantyCost, vin, reportedFailure });
        setEvmActionContext({ 
            claimId, 
            claimNumber, 
            vin, 
            reportedFailure,
            warrantyCost // FIX APPLIED HERE: Ensure warrantyCost is stored in state
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

    const handleBackToCustomer = () => {
      setCustomerVehiclesId(null);
      setActivePage('customer');
    };

    // Determine which 'Back' handler to use for ClaimDetailPage
    const claimDetailBackHandler =
      sourcePage === 'technician-claim-management'
        ? handleBackToTechnicianList
        : sourcePage === 'evm-claim-management' 
          ? handleBackToEVMList
          : handleBackToClaimList;

    // Determine the button label for ClaimDetailPage
    const backButtonLabel =
      sourcePage === 'technician-claim-management'
        ? 'Quay lại Danh sách Yêu cầu Kỹ thuật viên'
        : sourcePage === 'evm-claim-management' 
          ? 'Quay lại Danh sách Yêu cầu EVM'
          : 'Quay lại Danh sách Yêu cầu';


    switch (activePage) {
      case 'customer':
        return <CustomerPage handleBackClick={handleBackClick} onViewVehiclesClick={handleViewVehiclesClick} />;
      case 'sc-technicians':
        return <ServiceCenterTechniciansPage handleBackClick={handleBackClick} />;
      case 'user-management':
        return <UserManagementPage handleBackClick={handleBackClick} />;
      case 'vehicle-management':
        return <VehicleManagementPage handleBackClick={handleBackClick} customerId={customerVehiclesId} onBackToCustomer={customerVehiclesId ? handleBackToCustomer : null} />;

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
          onNavigateToApprove={handleNavigateToApprove} 
          onNavigateToReject={handleNavigateToReject}   
          onNavigateToTechSubmitEVM={handleNavigateToTechSubmitEVM}
          onNavigateToReportProblem={handleNavigateToReportProblem}
          onNavigateToResolveProblem={handleNavigateToResolveProblem}
          onNavigateToCompleteClaim={handleNavigateToCompleteClaim}
          onNavigateToReopenClaim={handleNavigateToReopenClaim}
          onNavigateToWorkDone={handleNavigateToWorkDone}
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
                  onNavigateToResolveProblem={handleNavigateToResolveProblem}
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

      case 'vehicle-model-management':
        return <VehicleModelManagementPage
                  handleBackClick={handleBackClick}
                />;

      case 'warranty-condition-management':
        return <WarrantyConditionManagementPage
                  handleBackClick={handleBackClick}
                />;

      case 'third-party-part-management':
        return <ThirdPartyPartManagementPage
                  handleBackClick={handleBackClick}
                />;

      case 'service-catalog-management':
        return <ServiceCatalogManagementPage
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
                  
      // --- NEW CASE: EVM CLAIM APPROVE PAGE (Uses warrantyCost) ---
      case 'evm-claim-approve':
        if (!evmActionContext) return <HomePageContent />;
        console.log('Dashboard - Rendering EVMClaimApprovePage with evmActionContext:', evmActionContext);
        console.log('Dashboard - warrantyCost being passed:', evmActionContext.warrantyCost, 'Type:', typeof evmActionContext.warrantyCost);
        return <EVMClaimApprovePage
                  claimId={evmActionContext.claimId}
                  claimNumber={evmActionContext.claimNumber}
                  warrantyCost={evmActionContext.warrantyCost} // PROP RENAMED
                  vin={evmActionContext.vin}
                  reportedFailure={evmActionContext.reportedFailure}
                  onActionComplete={handleEVMActionComplete}
                  handleBack={handleBackToClaimDetail}
                />;
                
      // --- NEW CASE: EVM CLAIM REJECT PAGE (Uses warrantyCost) ---
      case 'evm-claim-reject':
        if (!evmActionContext) return <HomePageContent />;
        return <EVMClaimRejectPage
                  claimId={evmActionContext.claimId}
                  claimNumber={evmActionContext.claimNumber}
                  vin={evmActionContext.vin}
                  reportedFailure={evmActionContext.reportedFailure}
                  warrantyCost={evmActionContext.warrantyCost} // PROP RENAMED
                  onActionComplete={handleEVMActionComplete}
                  handleBack={handleBackToClaimDetail}
                />;
                
      // --- NEW CASE: PROBLEM REPORT PAGE (Technician) ---
      case 'problem-report':
        if (!problemContext) return <HomePageContent />;
        return <ProblemReportPage
                  claimId={problemContext.claimId}
                  claimNumber={problemContext.claimNumber}
                  vin={problemContext.vin}
                  reportedFailure={problemContext.reportedFailure}
                  warrantyCost={problemContext.warrantyCost}
                  onActionComplete={handleProblemActionComplete}
                  handleBack={handleBackToClaimDetail}
                />;
                
      // --- NEW CASE: PROBLEM RESOLUTION PAGE (EVM) ---
      case 'problem-resolution':
        if (!problemContext) return <HomePageContent />;
        return <ProblemResolutionPage
                  claimId={problemContext.claimId}
                  claimNumber={problemContext.claimNumber}
                  vin={problemContext.vin}
                  reportedFailure={problemContext.reportedFailure}
                  warrantyCost={problemContext.warrantyCost}
                  problemType={problemContext.problemType}
                  problemDescription={problemContext.problemDescription}
                  onActionComplete={handleProblemActionComplete}
                  handleBack={handleBackToClaimDetail}
                />;
                
      // --- NEW CASE: CLAIM COMPLETE PAGE (SC Staff) ---
      case 'claim-complete':
        if (!claimActionContext) return <HomePageContent />;
        return <ClaimCompletePage
                  claimId={claimActionContext.claimId}
                  claimNumber={claimActionContext.claimNumber}
                  warrantyCost={claimActionContext.warrantyCost}
                  vin={claimActionContext.vin}
                  reportedFailure={claimActionContext.reportedFailure}
                  onActionComplete={handleClaimActionComplete}
                  handleBack={handleBackToClaimDetail}
                />;
                
      // --- NEW CASE: CLAIM REOPEN PAGE (SC Staff) ---
      case 'claim-reopen':
        if (!claimActionContext) return <HomePageContent />;
        return <ClaimReopenPage
                  claimId={claimActionContext.claimId}
                  claimNumber={claimActionContext.claimNumber}
                  warrantyCost={claimActionContext.warrantyCost}
                  vin={claimActionContext.vin}
                  reportedFailure={claimActionContext.reportedFailure}
                  onActionComplete={handleClaimActionComplete}
                  handleBack={handleBackToClaimDetail}
                />;
                
      // --- NEW CASE: WORK DONE PAGE (Technician) ---
      case 'work-done':
        if (!workDoneContext) return <HomePageContent />;
        return <WorkDonePage
                  claimId={workDoneContext.claimId}
                  claimNumber={workDoneContext.claimNumber}
                  warrantyCost={workDoneContext.warrantyCost}
                  vin={workDoneContext.vin}
                  reportedFailure={workDoneContext.reportedFailure}
                  onActionComplete={handleWorkDoneComplete}
                  handleBack={handleBackToClaimDetail}
                />;

      default:
        return <HomePageContent userRole={userRole} />;
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