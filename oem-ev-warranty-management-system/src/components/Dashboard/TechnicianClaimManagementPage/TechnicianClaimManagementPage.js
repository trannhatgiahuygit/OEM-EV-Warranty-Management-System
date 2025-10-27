import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa'; // Import an icon for the button
// --- UPDATED IMPORT ---
import './TechnicianClaimManagementPage.css'; 

// --- Component to display claims assigned to the technician ---
// MODIFIED: Accepts onViewClaimDetails prop for navigation
const AssignedClaimsView = ({ onViewClaimDetails }) => { 
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
          const technicianId = user.userId; // Get the userId (which is the technicianId)

          if (!technicianId) {
            toast.error('Technician ID not found in user data.', { position: 'top-right' });
            setLoading(false);
            return;
          }

          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/claims/technician/${technicianId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (response.status === 200) {
            setClaims(response.data);
            toast.success('Assigned claims fetched successfully!', { position: 'top-right' });
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
             setClaims([]);
             toast.info('No claims currently assigned to you.', { position: 'top-right' });
          } else if (error.response) {
            toast.error(`Error fetching assigned claims: ${error.response.statusText}`, { position: 'top-right' });
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
    return <div className="tcmp-loading-message">Loading assigned claims...</div>;
  }
  
  return (
    <motion.div
      className="tcmp-claim-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {claims.length === 0 ? (
        <div className="tcmp-loading-message">You currently have no claims assigned.</div>
      ) : (
        <div className="tcmp-claim-table-wrapper">
          <table className="tcmp-claim-table">
            <thead>
              <tr>
                <th>Claim Number</th>
                <th>Status</th>
                <th>Customer Name</th>
                <th>Vehicle VIN</th>
                <th>Reported Failure</th>
                <th>Created At</th>
                <th>Action</th> {/* ADDED: Action column */}
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr 
                  key={claim.id} 
                >
                  <td>{claim.claimNumber}</td>
                  <td>{claim.statusLabel}</td>
                  <td>{claim.customer.name}</td>
                  <td>{claim.vehicle.vin}</td>
                  <td>{claim.reportedFailure}</td>
                  <td>{new Date(claim.createdAt).toLocaleDateString()}</td>
                  <td>
                    {/* MODIFIED: Button text changed to "View" */}
                    <button 
                      onClick={() => onViewClaimDetails(claim.id)} 
                      className="tcmp-view-details-btn"
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
// MODIFIED: Accepts onViewClaimDetails prop
const TechnicianClaimManagementPage = ({ handleBackClick, onViewClaimDetails }) => {
  const [activeFunction, setActiveFunction] = useState('assignedClaims'); 

  const renderActiveFunction = () => {
    switch (activeFunction) {
      case 'assignedClaims':
        // MODIFIED: Pass the handler down
        return <AssignedClaimsView onViewClaimDetails={onViewClaimDetails} />; 
      default:
        return null;
    }
  };

  return (
    <div className="tcmp-page-wrapper">
      <div 
        className="tcmp-page-header"
      >
        <button 
          onClick={handleBackClick} 
          className="tcmp-back-button"
        >
          ← Back to Dashboard
        </button>
        <h2 
          className="tcmp-page-title"
        >
          Technician Claim Management
        </h2>
        
        {/* Function navigation bar is MOVED BACK INSIDE the tcmp-page-header */}
        <motion.div
            className="tcmp-function-nav-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => setActiveFunction('assignedClaims')}
              className={activeFunction === 'assignedClaims' ? 'active' : ''}
            >
              Assigned Claims
            </button>
        </motion.div>
      </div>
      
      <div className="tcmp-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default TechnicianClaimManagementPage;