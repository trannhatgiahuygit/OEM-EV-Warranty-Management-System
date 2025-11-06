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
  
  // For SC Staff, always use 'all' (no tabs needed)
  const [activeFunction] = useState('all');
  
  // --- NEW: State for sorting order. Default to 'newest' ---
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  
  // --- NEW: State for status filter ---
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' or specific status

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

        // For SC Staff, use /api/claims/all endpoint
        if (isSCStaff) {
          response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/claims/all`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
        } else {
          // For non-SC Staff, show empty
          setClaims([]);
          setIsLoading(false);
          return;
        }

        if (response.status === 200) {
          let fetchedClaims = response.data;
          
          // For SC Staff, filter to only show allowed statuses
          if (isSCStaff) {
            // Allowed statuses
            const allowedStatuses = [
              'PENDING_EVM_APPROVAL',
              'CUSTOMER_PAYMENT_PENDING',
              'EVM_APPROVED',
              'READY_FOR_REPAIR',
              'EVM_REJECTED',
              'PROBLEM_CONFLICT',
              'PROBLEM_SOLVED',
              'HANDOVER_PENDING',
              'READY_FOR_HANDOVER',
              'CLAIM_DONE',
              'CUSTOMER_PAID',
              'OPEN',
              'IN_PROGRESS',
              'DRAFT'
            ];
            fetchedClaims = fetchedClaims.filter(claim => 
              allowedStatuses.includes(claim.status)
            );
          }

          // Apply status filter if not 'all'
          if (statusFilter !== 'all') {
            fetchedClaims = fetchedClaims.filter(claim => claim.status === statusFilter);
          }

          setClaims(fetchedClaims);
          if (fetchedClaims.length > 0) {
            const statusText = getStatusName(statusFilter);
            toast.success(`Đã tải yêu cầu ${statusText} (${fetchedClaims.length} mục).`);
          } else if (fetchedClaims.length === 0) {
            // No toast for zero claims, to reduce spam
          }
        }
      } catch (err) {
        const statusText = getStatusName(statusFilter);
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

  }, [isSCStaff, statusFilter]); // Re-run effect when isSCStaff or statusFilter changes

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

  // Helper function to get Vietnamese name for status
  const getStatusName = (status) => {
    const statusMap = {
      'all': 'tất cả',
      'OPEN': 'Mở',
      'DRAFT': 'Nháp',
      'PENDING_EVM_APPROVAL': 'Chờ Phê duyệt EVM',
      'CUSTOMER_PAYMENT_PENDING': 'Chờ Thanh toán',
      'EVM_APPROVED': 'Đã Phê duyệt EVM',
      'READY_FOR_REPAIR': 'Sẵn sàng Sửa chữa',
      'EVM_REJECTED': 'Bị Từ chối EVM',
      'PROBLEM_CONFLICT': 'Vấn đề Xung đột',
      'PROBLEM_SOLVED': 'Vấn đề Đã Giải quyết',
      'HANDOVER_PENDING': 'Chờ Bàn giao',
      'CLAIM_DONE': 'Hoàn tất',
      'CUSTOMER_PAID': 'Khách đã Thanh toán',
      'READY_FOR_HANDOVER': 'Sẵn sàng Bàn giao'
    };
    return statusMap[status] || status;
  };

  const renderContent = () => {
    if (isLoading) {
      const statusName = statusFilter !== 'all' ? getStatusName(statusFilter) : 'tất cả';
      return <div className="cm-loading">Đang tải yêu cầu {statusName}...</div>;
    }

    if (error) {
      return <div className="cm-error">Lỗi: {error}</div>;
    }

    if (claimsToRender.length === 0) {
      return <div className="cm-no-claims">Không có yêu cầu nào.</div>;
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
                {claim.status}
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

  const pageTitle = 'Tất cả Yêu cầu';

  return (
    <div className="claim-management-page">
      <div className="claim-management-header">
        <button onClick={handleBackClick} className="cm-back-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h2 className="cm-page-title">{pageTitle}</h2>
        {/* REMOVED: <p className="cm-page-description">{pageDescription}</p> */}

        {/* Status Filter Buttons (for SC Staff) */}
        {isSCStaff && (
            <motion.div
              className="cm-status-filter-container"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Universal Statuses */}
              <div className="cm-status-filter-group">
                <span className="cm-filter-group-label">Trạng thái Chung:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'active' : ''}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStatusFilter('OPEN')}
                  className={statusFilter === 'OPEN' ? 'active' : ''}
                >
                  Yêu cầu Mở
                </button>
                <button
                  onClick={() => setStatusFilter('DRAFT')}
                  className={statusFilter === 'DRAFT' ? 'active' : ''}
                >
                  Yêu cầu Nháp
                </button>
                <button
                  onClick={() => setStatusFilter('CUSTOMER_ACTION_NEEDED')}
                  className={statusFilter === 'CUSTOMER_ACTION_NEEDED' ? 'active' : ''}
                >
                  Cần Hành động Khách hàng
                </button>
                <button
                  onClick={() => setStatusFilter('MOVE_ON_SC_REPAIR')}
                  className={statusFilter === 'MOVE_ON_SC_REPAIR' ? 'active' : ''}
                >
                  Chuyển sang SC Repair
                </button>
              </div>

              {/* EVM Repair Flow */}
              <div className="cm-status-filter-group">
                <span className="cm-filter-group-label">Luồng Sửa chữa EVM:</span>
                <button
                  onClick={() => setStatusFilter('PENDING_EVM_APPROVAL')}
                  className={statusFilter === 'PENDING_EVM_APPROVAL' ? 'active' : ''}
                >
                  Chờ Phê duyệt EVM
                </button>
                <button
                  onClick={() => setStatusFilter('EVM_APPROVED')}
                  className={statusFilter === 'EVM_APPROVED' ? 'active' : ''}
                >
                  Đã Phê duyệt EVM
                </button>
                <button
                  onClick={() => setStatusFilter('READY_FOR_REPAIR')}
                  className={statusFilter === 'READY_FOR_REPAIR' ? 'active' : ''}
                >
                  Sẵn sàng Sửa chữa
                </button>
                <button
                  onClick={() => setStatusFilter('EVM_REJECTED')}
                  className={statusFilter === 'EVM_REJECTED' ? 'active' : ''}
                >
                  Bị Từ chối EVM
                </button>
                <button
                  onClick={() => setStatusFilter('PROBLEM_CONFLICT')}
                  className={statusFilter === 'PROBLEM_CONFLICT' ? 'active' : ''}
                >
                  Vấn đề Xung đột
                </button>
                <button
                  onClick={() => setStatusFilter('PROBLEM_SOLVED')}
                  className={statusFilter === 'PROBLEM_SOLVED' ? 'active' : ''}
                >
                  Vấn đề Đã Giải quyết
                </button>
              </div>

              {/* SC Repair Flow */}
              <div className="cm-status-filter-group">
                <span className="cm-filter-group-label">Luồng Sửa chữa SC:</span>
                <button
                  onClick={() => setStatusFilter('CUSTOMER_PAYMENT_PENDING')}
                  className={statusFilter === 'CUSTOMER_PAYMENT_PENDING' ? 'active' : ''}
                >
                  Chờ Thanh toán
                </button>
                <button
                  onClick={() => setStatusFilter('CUSTOMER_PAID')}
                  className={statusFilter === 'CUSTOMER_PAID' ? 'active' : ''}
                >
                  Khách đã Thanh toán
                </button>
                <button
                  onClick={() => setStatusFilter('READY_FOR_HANDOVER')}
                  className={statusFilter === 'READY_FOR_HANDOVER' ? 'active' : ''}
                >
                  Sẵn sàng Bàn giao
                </button>
                <button
                  onClick={() => setStatusFilter('HANDOVER_PENDING')}
                  className={statusFilter === 'HANDOVER_PENDING' ? 'active' : ''}
                >
                  Chờ Bàn giao
                </button>
                <button
                  onClick={() => setStatusFilter('CLAIM_DONE')}
                  className={statusFilter === 'CLAIM_DONE' ? 'active' : ''}
                >
                  Hoàn tất
                </button>
              </div>
            </motion.div>
        )}
          
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
      <div className="cm-content-wrapper">
        {renderContent()}
      </div>
    </div>
  );
};

export default ClaimManagementPage;
