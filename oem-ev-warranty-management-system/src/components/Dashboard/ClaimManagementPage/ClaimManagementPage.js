import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import './ClaimManagementPage.css';

// Helper to format date
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (error) {
    return 'Ngày không hợp lệ';
  }
};

// --- MODIFIED: Accept 'initialTab' prop ---
const ClaimManagementPage = ({ handleBackClick, onViewClaimDetails, initialTab = 'open' }) => {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // --- MODIFIED: Initialize state using the prop ---
  const [activeFunction, setActiveFunction] = useState(initialTab);
  
  // --- NEW: State for sorting order. Default to 'newest' ---
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  // Get user role
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        setUserRole(user.role || null);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const isSCStaff = userRole === 'SC_STAFF';

  useEffect(() => {
    const fetchClaims = async () => {
      setIsLoading(true);
      setError(null);
      let loggedInUser;

      try {
        const userString = localStorage.getItem('user');
        if (!userString) {
          throw new Error('Người dùng chưa được xác thực.');
        }
        loggedInUser = JSON.parse(userString);

        if (!loggedInUser || !loggedInUser.token || !loggedInUser.username) {
          throw new Error('Dữ liệu người dùng không hợp lệ. Vui lòng đăng nhập lại.');
        }

        const token = loggedInUser.token;
        let response;

        // If "all" is selected and user is SC Staff, use /api/claims/all endpoint
        if (activeFunction === 'all' && isSCStaff) {
          response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/claims/all`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
        } else {
          // --- MODIFIED: Map activeFunction to the correct API status code ---
          let statusToFetch;
          switch (activeFunction) {
            case 'open':
              statusToFetch = 'OPEN';
              break;
            case 'in_progress':
              statusToFetch = 'IN_PROGRESS'; // NEW Status
              break;
            case 'draft':
              statusToFetch = 'DRAFT';
              break;
            default:
              statusToFetch = 'OPEN'; // Default fallback
          }

          response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/claims/status/${statusToFetch}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
        }

        if (response.status === 200) {
          let fetchedClaims = response.data;
          
          // For "all" view (SC Staff only), show all claims. Otherwise filter by creator
          if (activeFunction !== 'all') {
            fetchedClaims = fetchedClaims.filter(
              (claim) => claim.createdBy.username === loggedInUser.username
            );
          }

          setClaims(fetchedClaims);
          if (fetchedClaims.length > 0) {
            const statusText = activeFunction === 'all' ? 'tất cả' 
              : activeFunction === 'open' ? 'mở' 
              : activeFunction === 'in_progress' ? 'đang xử lý' 
              : 'nháp';
            toast.success(`Đã tải ${fetchedClaims.length} yêu cầu ${statusText}.`);
          } else if (fetchedClaims.length === 0) {
            // No toast for zero claims, to reduce spam
          }
        }
      } catch (err) {
        const statusText = activeFunction === 'all' ? 'tất cả' 
          : activeFunction === 'open' ? 'mở' 
          : activeFunction === 'in_progress' ? 'đang xử lý' 
          : 'nháp';
        let errorMessage = `Không thể tải yêu cầu ${statusText}.`;
        if (err.message === 'Người dùng chưa được xác thực.' || err.message.includes('Dữ liệu người dùng không hợp lệ')) {
          errorMessage = 'Người dùng chưa được xác thực. Vui lòng đăng nhập lại.';
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

  }, [activeFunction, isSCStaff]); // Re-run effect when activeFunction or isSCStaff changes

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
      const statusText = activeFunction === 'open' ? 'mở' : activeFunction === 'in_progress' ? 'đang xử lý' : 'nháp';
      return <div className="cm-loading">Đang tải yêu cầu {statusText}...</div>;
    }

    if (error) {
      return <div className="cm-error">Lỗi: {error}</div>;
    }

    if (claimsToRender.length === 0) {
      const statusText = activeFunction === 'open' ? 'mở' : activeFunction === 'in_progress' ? 'đang xử lý' : 'nháp';
      return <div className="cm-no-claims">Bạn không có yêu cầu {statusText} nào.</div>;
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
                <p><strong>Khách hàng:</strong> {claim.customer.name}</p>
                <p><strong>Xe:</strong> {claim.vehicle.model} ({claim.vehicle.vin})</p>
              </div>
            </div>
            <div className="cm-card-footer">
              <p><strong>Đã tạo:</strong> {formatDateTime(claim.createdAt)}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const pageTitle = activeFunction === 'all'
    ? 'Tất cả Yêu cầu'
    : activeFunction === 'open' 
    ? 'Yêu cầu Mở của Tôi' 
    : activeFunction === 'in_progress' 
    ? 'Yêu cầu Đang xử lý của Tôi' 
    : 'Yêu cầu Nháp của Tôi';

  return (
    <div className="claim-management-page">
      <div className="claim-management-header">
        <button onClick={handleBackClick} className="cm-back-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h2 className="cm-page-title">{pageTitle}</h2>
        {/* REMOVED: <p className="cm-page-description">{pageDescription}</p> */}

        {/* --- NEW: Wrapper for both navigation bars to manage vertical space --- */}
        <div className="cm-header-nav-group"> 
            
          {/* --- Function Nav Bar (for status tabs) --- */}
          <motion.div
            className="function-nav-bar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Filter buttons in order: All (SC Staff only), Open, In Progress, Draft */}
            {isSCStaff && (
              <button
                onClick={() => setActiveFunction('all')}
                className={activeFunction === 'all' ? 'active' : ''}
              >
                Tất cả Yêu cầu
              </button>
            )}
            <button
              onClick={() => setActiveFunction('open')}
              className={activeFunction === 'open' ? 'active' : ''}
            >
              Yêu cầu Mở
            </button>
            <button
              onClick={() => setActiveFunction('in_progress')}
              className={activeFunction === 'in_progress' ? 'active' : ''}
            >
              Yêu cầu Đang xử lý
            </button>
            <button
              onClick={() => setActiveFunction('draft')}
              className={activeFunction === 'draft' ? 'active' : ''}
            >
              Yêu cầu Nháp
            </button>
          </motion.div>
          
          {/* --- NEW: Sorting Buttons (using new class) --- */}
          <motion.div
            className="cm-sort-button-group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span>Sắp xếp theo:</span> 
            <button
              onClick={() => setSortOrder('newest')}
              className={sortOrder === 'newest' ? 'active' : ''}
            >
              Mới nhất Trước
            </button>
            <button
              onClick={() => setSortOrder('oldest')}
              className={sortOrder === 'oldest' ? 'active' : ''}
            >
              Cũ nhất Trước
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
