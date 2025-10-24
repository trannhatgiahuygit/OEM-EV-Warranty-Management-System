import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import './ClaimManagementPage.css';

// Helper to format date
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// --- MODIFIED: Accept 'initialTab' prop ---
const ClaimManagementPage = ({ handleBackClick, onViewClaimDetails, initialTab = 'open' }) => {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- MODIFIED: Initialize state using the prop ---
  const [activeFunction, setActiveFunction] = useState(initialTab);
  
  // --- NEW: State for sorting order. Default to 'newest' ---
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  // --- NEW: Add useEffect to sync state if prop changes ---
  useEffect(() => {
    setActiveFunction(initialTab);
    // Reset sort order when the tab changes for a fresh view
    setSortOrder('newest'); 
  }, [initialTab]);

  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true);
      setError(null);
      let loggedInUser;

      const statusToFetch = activeFunction === 'open' ? 'OPEN' : 'DRAFT';

      try {
        const userString = localStorage.getItem('user');
        if (!userString) {
          throw new Error('User not authenticated.');
        }
        loggedInUser = JSON.parse(userString);

        if (!loggedInUser || !loggedInUser.token || !loggedInUser.username) {
          throw new Error('Invalid user data. Please log in again.');
        }

        const token = loggedInUser.token;

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/claims/status/${statusToFetch}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          const userClaims = response.data.filter(
            (claim) => claim.createdBy.username === loggedInUser.username
          );

          setClaims(userClaims);
          if (userClaims.length > 0) {
            toast.success(`Fetched ${userClaims.length} ${activeFunction} claim(s).`);
          }
        }
      } catch (err) {
        let errorMessage = `Failed to fetch ${activeFunction} claims.`;
        if (err.message === 'User not authenticated.' || err.message.includes('Invalid user data')) {
          errorMessage = err.message;
        } else if (err.response) {
          errorMessage = err.response.data?.message || errorMessage;
        }
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();

  }, [activeFunction]); // Re-run effect when activeFunction changes

  // --- NEW: Function to sort claims ---
  const getSortedClaims = () => {
    if (!claims || claims.length === 0) return [];

    const sorted = [...claims].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      if (sortOrder === 'newest') {
        // Newest first (descending)
        return dateB - dateA; 
      } else {
        // Oldest first (ascending)
        return dateA - dateB; 
      }
    });

    return sorted;
  };
  
  // --- NEW: Get the claims to render ---
  const claimsToRender = getSortedClaims();

  const renderContent = () => {
    if (isLoading) {
      return <div className="cm-loading">Loading {activeFunction} claims...</div>;
    }

    if (error) {
      return <div className="cm-error">Error: {error}</div>;
    }

    if (claimsToRender.length === 0) {
      return <div className="cm-no-claims">You have no {activeFunction} claims.</div>;
    }

    return (
      <motion.div
        className="cm-claim-list"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } }
        }}
        initial="hidden"
        animate="visible"
      >
        {claimsToRender.map((claim) => ( // Use claimsToRender
          <motion.div
            key={claim.id}
            className="cm-claim-card"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            // --- MODIFIED: Pass both claim.id and activeFunction ---
            onClick={() => onViewClaimDetails(claim.id, activeFunction)}
            style={{ cursor: 'pointer' }} // Add cursor pointer to indicate it's clickable
          >
            <div className="cm-card-header">
              <span className="cm-claim-number">{claim.claimNumber}</span>
              <span className={`cm-status-badge ${claim.status.toLowerCase()}`}>
                {claim.statusLabel}
              </span>
            </div>
            <div className="cm-card-body">
              <p className="cm-claim-title">{claim.initialDiagnosis}</p>
              <p className="cm-claim-reported">{claim.reportedFailure}</p>
              <div className="cm-card-details">
                <p><strong>Customer:</strong> {claim.customer.name}</p>
                <p><strong>Vehicle:</strong> {claim.vehicle.model} ({claim.vehicle.vin})</p>
              </div>
            </div>
            <div className="cm-card-footer">
              <p><strong>Created:</strong> {formatDateTime(claim.createdAt)}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const pageTitle = activeFunction === 'open' ? 'My Open Claims' : 'My Draft Claims';
  const pageDescription = `Showing all repair claims with '${activeFunction === 'open' ? 'Open' : 'Draft'}' status that were created by you.`;

  return (
    <div className="claim-management-page">
      <div className="claim-management-header">
        <button onClick={handleBackClick} className="cm-back-button">
          ← Back to Dashboard
        </button>
        <h2 className="cm-page-title">{pageTitle}</h2>
        <p className="cm-page-description">{pageDescription}</p>

        {/* --- NEW: Wrapper for both navigation bars to manage vertical space --- */}
        <div className="cm-header-nav-group"> 
            
          {/* --- Function Nav Bar (for status tabs) --- */}
          <motion.div
            className="function-nav-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => setActiveFunction('open')}
              className={activeFunction === 'open' ? 'active' : ''}
            >
              Open Claims
            </button>
            <button
              onClick={() => setActiveFunction('draft')}
              className={activeFunction === 'draft' ? 'active' : ''}
            >
              Draft Claims
            </button>
          </motion.div>
          
          {/* --- NEW: Sorting Buttons (using new class) --- */}
          <motion.div
            className="cm-sort-button-group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span>Sort by:</span> 
            <button
              onClick={() => setSortOrder('newest')}
              className={sortOrder === 'newest' ? 'active' : ''}
            >
              Newest First
            </button>
            <button
              onClick={() => setSortOrder('oldest')}
              className={sortOrder === 'oldest' ? 'active' : ''}
            >
              Oldest First
            </button>
          </motion.div>
        </div>
      </div>
      <div className="cm-content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
};

export default ClaimManagementPage;