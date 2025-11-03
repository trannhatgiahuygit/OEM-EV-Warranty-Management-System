import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa'; 
// --- New CSS Import ---
import './EVMClaimManagementPage.css'; 

// --- NECESSARY IMPORTS FOR THE VIEWS (Based on your file structure) ---
import ClaimDetailPage from '../ClaimDetailPage/ClaimDetailPage'; 
import EVMClaimApprovePage from '../EVMClaimActionModal/EVMClaimApprovePage'; 
import EVMClaimRejectPage from '../EVMClaimActionModal/EVMClaimRejectPage';   


// --- Status Badge Component (Reusable within this file) ---
const StatusBadge = ({ status, statusLabel }) => {
    const badgeClass = `cd-status-badge ${status.toLowerCase()}`;
    return <span className={badgeClass}>{statusLabel}</span>;
};

// --- Helper for Client-Side Sorting ---
const sortByStatus = (a, b) => {
    const statusA = a.status.toUpperCase();
    const statusB = b.status.toUpperCase();
    if (statusA < statusB) {
        return -1;
    }
    if (statusA > statusB) {
        return 1;
    }
    return 0;
};


// --- Component to display ALL claims for EVM staff, sorted by status ---
const AllEVMClaimsView = ({ onViewClaimDetails, onClaimsUpdated }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      // API Endpoint for All Claims
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/evm/claims`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        let fetchedClaims = response.data.content || []; 
        // SORTING: Apply client-side sorting by status
        fetchedClaims.sort(sortByStatus); 
        setClaims(fetchedClaims); 
        toast.success('All claims fetched successfully!', { position: 'top-right' });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
         setClaims([]);
         toast.info('No claims found in the system.', { position: 'top-right' });
      } else if (error.response) {
        toast.error(`Error fetching all claims: ${error.response.data?.message || error.response.statusText}`, { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [onClaimsUpdated]);

  if (loading) {
    return <div className="evmcmp-message-card">Loading all claims...</div>;
  }
  
  if (claims.length === 0) {
    return <div className="evmcmp-message-card">There are currently no claims managed by EVM.</div>;
  }

  return (
    <motion.div
      className="evmcmp-claim-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="evmcmp-claim-table-wrapper">
        <table className="evmcmp-claim-table">
          <thead>
            <tr>
              <th>Claim Number</th>
              <th>Status</th>
              <th>Vehicle VIN</th>
              <th>Service Center</th>
              <th>Warranty Cost</th>
              <th>Date Filed</th> 
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr 
                key={claim.id} 
              >
                <td>{claim.claimNumber}</td>
                <td>
                  <StatusBadge status={claim.status} statusLabel={claim.statusLabel} />
                </td>
                <td>{claim.vehicle?.vin || 'N/A'}</td>
                <td>{claim.serviceCenter?.region || 'N/A'}</td> 
                <td>${(claim.warrantyCost !== undefined && claim.warrantyCost !== null) ? claim.warrantyCost.toFixed(2) : 'N/A'}</td>
                <td>{new Date(claim.dateFiled).toLocaleDateString() || 'N/A'}</td> 
                <td>
                  <button 
                    onClick={() => onViewClaimDetails(claim.id)} 
                    className="evmcmp-view-details-btn"
                    title="View Claim Details"
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};


// --- Component to display pending claims for EVM staff ---
const PendingClaimsView = ({ onViewClaimDetails, onClaimsUpdated }) => { 
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/evm/claims/pending`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        setClaims(response.data.content || []); 
        toast.success('Pending claims fetched successfully!', { position: 'top-right' });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
         setClaims([]);
         toast.info('No claims currently pending EVM approval.', { position: 'top-right' });
      } else if (error.response) {
        toast.error(`Error fetching pending claims: ${error.response.data?.message || error.response.statusText}`, { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [onClaimsUpdated]);

  if (loading) {
    return <div className="evmcmp-message-card">Loading pending claims...</div>;
  }
  
  if (claims.length === 0) {
    return <div className="evmcmp-message-card">There are currently no claims pending EVM approval.</div>;
  }

  return (
    <motion.div
      className="evmcmp-claim-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="evmcmp-claim-table-wrapper">
        <table className="evmcmp-claim-table">
          <thead>
            <tr>
              <th>Claim Number</th>
              <th>Status</th>
              <th>Vehicle VIN</th>
              <th>Service Center</th>
              <th>Warranty Cost</th>
              <th>Days to Approval</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr 
                key={claim.id} 
              >
                <td>{claim.claimNumber}</td>
                <td>
                  <StatusBadge status={claim.status} statusLabel={claim.statusLabel} />
                </td>
                <td>{claim.vehicle?.vin || 'N/A'}</td>
                <td>{claim.serviceCenter?.region || 'N/A'}</td> 
                <td>${(claim.warrantyCost !== undefined && claim.warrantyCost !== null) ? claim.warrantyCost.toFixed(2) : 'N/A'}</td>
                <td>{claim.daysToApproval || 'N/A'} days</td>
                <td>
                  <button 
                    onClick={() => onViewClaimDetails(claim.id)} 
                    className="evmcmp-view-details-btn"
                    title="View Claim Details"
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};


// --- MODIFIED: Component to display claims ready for repair (uses all claims and client-side filtering) ---
const ReadyForRepairClaimsView = ({ onViewClaimDetails, onClaimsUpdated }) => { 
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      // MODIFIED: Use the general /api/evm/claims endpoint
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/evm/claims`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200) {
        let fetchedClaims = response.data.content || [];
        
        // NEW FILTERING LOGIC: Filter for claims that are APPROVED or explicitly READY_FOR_REPAIR.
        const filteredClaims = fetchedClaims.filter(
            claim => claim.status === 'APPROVED' || claim.status === 'READY_FOR_REPAIR'
        );
        
        // Optional: Sort filtered claims by claim number
        filteredClaims.sort((a, b) => a.claimNumber.localeCompare(b.claimNumber));

        setClaims(filteredClaims); 
        toast.success(`Ready for Repair claims fetched (${filteredClaims.length} items)!`, { position: 'top-right' });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
         setClaims([]);
         toast.info('No claims found in the system to filter.', { position: 'top-right' });
      } else if (error.response) {
        toast.error(`Error fetching claims: ${error.response.data?.message || error.response.statusText}`, { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [onClaimsUpdated]);

  if (loading) {
    return <div className="evmcmp-message-card">Loading Ready for Repair claims...</div>;
  }
  
  if (claims.length === 0) {
    return <div className="evmcmp-message-card">There are currently no claims with the status Ready for Repair (Approved).</div>;
  }

  return (
    <motion.div
      className="evmcmp-claim-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="evmcmp-claim-table-wrapper">
        <table className="evmcmp-claim-table">
          <thead>
            <tr>
              <th>Claim Number</th>
              <th>Status</th>
              <th>Vehicle VIN</th>
              <th>Service Center</th>
              <th>Warranty Cost</th>
              <th>Days since Approval</th> 
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr 
                key={claim.id} 
              >
                <td>{claim.claimNumber}</td>
                <td>
                  <StatusBadge status={claim.status} statusLabel={claim.statusLabel} />
                </td>
                <td>{claim.vehicle?.vin || 'N/A'}</td>
                <td>{claim.serviceCenter?.region || 'N/A'}</td> 
                <td>${(claim.warrantyCost !== undefined && claim.warrantyCost !== null) ? claim.warrantyCost.toFixed(2) : 'N/A'}</td>
                <td>{claim.daysSinceApproval || 'N/A'} days</td> 
                <td>
                  <button 
                    onClick={() => onViewClaimDetails(claim.id)} 
                    className="evmcmp-view-details-btn"
                    title="View Claim Details"
                  >
                    <FaEye /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};


// --- Main Page Component (EVMClaimManagementPage) ---
const EVMClaimManagementPage = ({ handleBackClick }) => {
  // MODIFIED: 'allClaims' is now the default active function
  const [activeFunction, setActiveFunction] = useState('allClaims'); 
  
  const [currentView, setCurrentView] = useState('list');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [actionData, setActionData] = useState(null); 
  const [claimsUpdateKey, setClaimsUpdateKey] = useState(0); 

  const handleViewClaimDetails = (claimId) => {
    setSelectedClaimId(claimId);
    setCurrentView('details');
  };

  const handleBackToClaimsList = () => {
    setSelectedClaimId(null);
    setActionData(null);
    setCurrentView('list');
  };

  // Handler for navigation to Approve Page (passes context data)
  const handleNavigateToApprove = (claimId, claimNumber, estimatedCost, vin, reportedFailure) => {
    setSelectedClaimId(claimId);
    setActionData({ type: 'approve', claimNumber, estimatedCost, vin, reportedFailure });
    setCurrentView('action');
  };

  // Handler for navigation to Reject Page (passes context data)
  const handleNavigateToReject = (claimId, claimNumber, vin, reportedFailure) => {
    setSelectedClaimId(claimId);
    setActionData({ type: 'reject', claimNumber, vin, reportedFailure });
    setCurrentView('action');
  };

  const handleActionComplete = (updatedClaim) => {
    toast.info(`Status updated to ${updatedClaim.statusLabel}. Returning to list.`);
    setClaimsUpdateKey(prev => prev + 1);
    handleBackToClaimsList();
  };

  const getPageTitle = () => {
    if (currentView === 'action' && actionData) {
        return actionData.type === 'approve' ? 'Approve Claim' : 'Reject Claim';
    }
    return 'EVM Claim Management';
  };


  const renderHeader = () => {
      // The header is only necessary for the LIST view.
      if (currentView !== 'list') {
          return null;
      }
      
      return (
        <div className="evmcmp-page-header">
            <button onClick={handleBackClick} className="evmcmp-back-button">
              ← Back to Dashboard
            </button>
            <h2 className="evmcmp-page-title">{getPageTitle()}</h2>
            
            <motion.div
              className="evmcmp-function-nav-bar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* NEW BUTTON: All Claims (set as default) */}
              <button
                onClick={() => setActiveFunction('allClaims')}
                className={activeFunction === 'allClaims' ? 'active' : ''}
              >
                All Claims
              </button>
              <button
                onClick={() => setActiveFunction('pendingClaims')}
                className={activeFunction === 'pendingClaims' ? 'active' : ''}
              >
                Pending Claims
              </button>
              <button
                onClick={() => setActiveFunction('readyForRepair')}
                className={activeFunction === 'readyForRepair' ? 'active' : ''}
              >
                Ready for Repair
              </button>
            </motion.div>
        </div>
      );
  };


  const renderActiveFunction = () => {
    if (currentView === 'details') {
      // The ClaimDetailPage contains its own header (title, back button, action buttons)
      return (
        <ClaimDetailPage 
          claimId={selectedClaimId} 
          onBackClick={handleBackToClaimsList}
          backButtonLabel="Back to Claims List"
          
          // FIX: Pass the handlers directly. They now accept the necessary arguments from ClaimDetailPage.
          onNavigateToApprove={handleNavigateToApprove}
          onNavigateToReject={handleNavigateToReject}
          
          onProcessToIntake={() => {}}
          onEditDraftClaim={() => {}}
          onUpdateDiagnostic={() => {}}
          onSubmitToEVM={() => {}}
        />
      );
    }
    
    if (currentView === 'action' && actionData) {
      const { type, claimNumber, estimatedCost, vin, reportedFailure } = actionData;
      const commonProps = {
        claimId: selectedClaimId,
        claimNumber: claimNumber,
        handleBack: () => setCurrentView('details'),
        onActionComplete: handleActionComplete,
        // Pass context data to the form pages
        vin: vin,
        reportedFailure: reportedFailure,
      };

      if (type === 'approve') {
        return <EVMClaimApprovePage 
                 {...commonProps} 
                 estimatedCost={estimatedCost} 
               />;
      }
      
      if (type === 'reject') {
        return <EVMClaimRejectPage 
                 {...commonProps} 
               />;
      }
      
      return <div className="evmcmp-message-card">Error: Action component not found or type is invalid.</div>
    }

    // MODIFIED: Render the appropriate view based on activeFunction
    if (activeFunction === 'allClaims') {
        return (
            <AllEVMClaimsView
                onViewClaimDetails={handleViewClaimDetails}
                onClaimsUpdated={claimsUpdateKey}
            />
        );
    }
    
    if (activeFunction === 'readyForRepair') {
        return (
            <ReadyForRepairClaimsView
                onViewClaimDetails={handleViewClaimDetails}
                onClaimsUpdated={claimsUpdateKey}
            />
        );
    }

    // Default: Pending Claims View
    return (
      <PendingClaimsView 
        onViewClaimDetails={handleViewClaimDetails} 
        onClaimsUpdated={claimsUpdateKey}
      />
    );
  };


  return (
    <div className="evmcmp-page-wrapper">
      {/* RENDER HEADER ONLY FOR LIST VIEW */}
      {renderHeader()}
      
      {/* Content area now contains EITHER the list view, the details page, or the action page */}
      <div className="evmcmp-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default EVMClaimManagementPage;