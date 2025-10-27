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
    return <div className="evmcmp-loading-message">Loading pending claims...</div>;
  }
  
  return (
    <motion.div
      className="evmcmp-claim-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="evmcmp-claim-table-header">
        <h3>Pending Claims ({claims.length})</h3>
      </div>
      
      {claims.length === 0 ? (
        <div className="evmcmp-loading-message">There are currently no claims pending EVM approval.</div>
      ) : (
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
      )}
    </motion.div>
  );
};


// --- Main Page Component ---
const EVMClaimManagementPage = ({ handleBackClick }) => {
  const [activeFunction, setActiveFunction] = useState('pendingClaims'); 
  
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
              <button
                onClick={() => setActiveFunction('pendingClaims')}
                className={activeFunction === 'pendingClaims' ? 'active' : ''}
              >
                Pending Claims
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
          backButtonLabel="Back to Pending Claims"
          
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
      
      return <div className="evmcmp-loading-message">Error: Action component not found or type is invalid.</div>
    }

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