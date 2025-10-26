import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa'; 
// --- New CSS Import ---
import './EVMClaimManagementPage.css'; 

// --- Status Badge Component (Reusable within this file) ---
const StatusBadge = ({ status, statusLabel }) => {
    // Uses the same naming convention as ClaimDetailPage CSS: lowercase status
    const badgeClass = `cd-status-badge ${status.toLowerCase()}`;
    return <span className={badgeClass}>{statusLabel}</span>;
};

// --- Component to display pending claims for EVM staff ---
const PendingClaimsView = ({ onViewClaimDetails }) => { 
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
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
            // The API returns a paged object, we need the 'content' array
            setClaims(response.data.content || []); 
            toast.success('Pending claims fetched successfully!', { position: 'top-right' });
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
             setClaims([]);
             toast.info('No claims currently pending EVM approval.', { position: 'top-right' });
          } else if (error.response) {
            toast.error(`Error fetching pending claims: ${error.response.statusText}`, { position: 'top-right' });
          } else {
            toast.error('Network error. Please try again later.', { position: 'top-right' });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchClaims();
    }
  }, []);

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
                  {/* MODIFIED: Use StatusBadge component */}
                  <td>
                    <StatusBadge status={claim.status} statusLabel={claim.statusLabel} />
                  </td>
                  <td>{claim.vehicle.vin}</td>
                  <td>{claim.serviceCenter.region}</td>
                  <td>${claim.warrantyCost.toFixed(2)}</td>
                  <td>{claim.daysToApproval} days</td>
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
const EVMClaimManagementPage = ({ handleBackClick, onViewClaimDetails }) => {
  const [activeFunction, setActiveFunction] = useState('pendingClaims'); 

  const renderActiveFunction = () => {
    switch (activeFunction) {
      case 'pendingClaims':
        return <PendingClaimsView onViewClaimDetails={onViewClaimDetails} />; 
      default:
        return null;
    }
  };

  return (
    <div className="evmcmp-page-wrapper">
      <div className="evmcmp-page-header">
        <button onClick={handleBackClick} className="evmcmp-back-button">
          ← Back to Dashboard
        </button>
        <h2 className="evmcmp-page-title">EVM Claim Management</h2>
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
      <div className="evmcmp-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default EVMClaimManagementPage;