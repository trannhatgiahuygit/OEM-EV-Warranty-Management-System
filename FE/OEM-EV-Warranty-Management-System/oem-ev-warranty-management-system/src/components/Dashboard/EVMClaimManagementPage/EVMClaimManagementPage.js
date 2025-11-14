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
import { EVMClaimTable } from '../EVMClaimTable';


// --- Status Badge Component (Reusable within this file) ---
const StatusBadge = ({ status }) => {
  const badgeClass = `cd-status-badge ${status.toLowerCase()}`;
  return <span className={badgeClass}>{status}</span>;
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

// Helper function to safely format date
const formatDate = (dateValue, fallbackDate = null) => {
  if (!dateValue && !fallbackDate) {
    return 'N/A';
  }
  
  const dateToFormat = dateValue || fallbackDate;
  
  if (!dateToFormat) {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateToFormat);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('vi-VN');
  } catch (error) {
    console.error('Error formatting date:', error, 'Value:', dateToFormat);
    return 'N/A';
  }
};

// --- Component to display ALL claims for EVM staff, sorted by status ---
const AllEVMClaimsView = ({ onViewClaimDetails, onClaimsUpdated, statusFilter = 'all' }) => {
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

        // FILTER: Only show EVM Repair flow statuses
        const allowedStatuses = [
          'PENDING_EVM_APPROVAL',
          'EVM_APPROVED',
          'READY_FOR_REPAIR',
          'EVM_REJECTED',
          'PROBLEM_CONFLICT',
          'PROBLEM_SOLVED'
        ];
        fetchedClaims = fetchedClaims.filter(claim =>
          allowedStatuses.includes(claim.status)
        );

        // Apply status filter if not 'all'
        if (statusFilter !== 'all') {
          fetchedClaims = fetchedClaims.filter(claim => claim.status === statusFilter);
        }

        // SORTING: Sort by date (newest first), then by status
        fetchedClaims.sort((a, b) => {
          // First sort by date (newest first)
          const dateA = new Date(a.dateFiled || a.createdAt || 0);
          const dateB = new Date(b.dateFiled || b.createdAt || 0);
          const dateDiff = dateB - dateA; // Newest first (descending)
          if (dateDiff !== 0) return dateDiff;
          // If dates are equal, sort by status
          return sortByStatus(a, b);
        });
        setClaims(fetchedClaims);
        toast.success('Đã tải tất cả yêu cầu thành công!', { position: 'top-right' });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setClaims([]);
        toast.info('Không tìm thấy yêu cầu nào trong hệ thống.', { position: 'top-right' });
      } else if (error.response) {
        toast.error(`Lỗi khi tải tất cả yêu cầu: ${error.response.data?.message || error.response.statusText}`, { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [onClaimsUpdated, statusFilter]);

  if (loading) {
    const statusName = statusFilter !== 'all' ? getStatusName(statusFilter) : 'tất cả';
    return <div className="evmcmp-message-card">Đang tải yêu cầu {statusName}...</div>;
  }

  if (claims.length === 0) {
    return <div className="evmcmp-message-card">Hiện tại không có yêu cầu nào được quản lý bởi EVM.</div>;
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
              <th>Số Yêu cầu</th>
              <th>Trạng thái</th>
              <th>Số VIN Xe</th>
              <th>Trung tâm Dịch vụ</th>
              <th>Chi phí Bảo hành</th>
              <th>Ngày Nộp</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr
                key={claim.id}
              >
                <td>{claim.claimNumber}</td>
                <td>
                  <StatusBadge status={claim.status} />
                </td>
                <td>{claim.vehicle?.vin || 'N/A'}</td>
                <td>{claim.serviceCenter?.region || 'N/A'}</td>
                <td>₫{(claim.warrantyCost !== undefined && claim.warrantyCost !== null) ? claim.warrantyCost.toFixed(2) : 'N/A'}</td>
<<<<<<< HEAD
                <td>{formatDate(claim.dateFiled, claim.createdAt)}</td> 
=======
                <td>{new Date(claim.dateFiled).toLocaleDateString('vi-VN') || 'N/A'}</td>
>>>>>>> 28a0e039bee845053fc5467b98a973856d1eb3ce
                <td>
                  <button
                    onClick={() => onViewClaimDetails(claim.id)}
                    className="evmcmp-view-details-btn"
                    title="Xem Chi tiết Yêu cầu"
                  >
                    <FaEye /> Xem
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
        let fetchedClaims = response.data.content || [];
        // Sort by date (newest first)
        fetchedClaims.sort((a, b) => {
          const dateA = new Date(a.dateFiled || a.createdAt || 0);
          const dateB = new Date(b.dateFiled || b.createdAt || 0);
          return dateB - dateA; // Newest first (descending)
        });
        setClaims(fetchedClaims);
        toast.success('Đã tải yêu cầu đang chờ thành công!', { position: 'top-right' });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setClaims([]);
        toast.info('Hiện tại không có yêu cầu nào đang chờ phê duyệt EVM.', { position: 'top-right' });
      } else if (error.response) {
        toast.error(`Lỗi khi tải yêu cầu đang chờ: ${error.response.data?.message || error.response.statusText}`, { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [onClaimsUpdated]);

  if (loading) {
    return <div className="evmcmp-message-card">Đang tải yêu cầu đang chờ...</div>;
  }

  if (claims.length === 0) {
    return <div className="evmcmp-message-card">Hiện tại không có yêu cầu nào đang chờ phê duyệt EVM.</div>;
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
              <th>Số Yêu cầu</th>
              <th>Trạng thái</th>
              <th>Số VIN Xe</th>
              <th>Trung tâm Dịch vụ</th>
              <th>Chi phí Bảo hành</th>
              <th>Số Ngày đến Phê duyệt</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr
                key={claim.id}
              >
                <td>{claim.claimNumber}</td>
                <td>
                  <StatusBadge status={claim.status} />
                </td>
                <td>{claim.vehicle?.vin || 'N/A'}</td>
                <td>{claim.serviceCenter?.region || 'N/A'}</td>
                <td>₫{(claim.warrantyCost !== undefined && claim.warrantyCost !== null) ? claim.warrantyCost.toFixed(2) : 'N/A'}</td>
                <td>{claim.daysToApproval || 'N/A'} ngày</td>
                <td>
                  <button
                    onClick={() => onViewClaimDetails(claim.id)}
                    className="evmcmp-view-details-btn"
                    title="Xem Chi tiết Yêu cầu"
                  >
                    <FaEye /> Xem
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


// --- NEW: Component to display EVM Repair flow claims ---
const EVMRepairFlowClaimsView = ({ onViewClaimDetails, onClaimsUpdated }) => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      // Use the general /api/evm/claims endpoint
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

        // Filter for EVM Repair flow statuses
        const evmRepairFlowStatuses = [
          'PENDING_EVM_APPROVAL',
          'EVM_APPROVED',
          'READY_FOR_REPAIR',
          'EVM_REJECTED',
          'PROBLEM_CONFLICT',
          'PROBLEM_SOLVED'
        ];
        const filteredClaims = fetchedClaims.filter(
          claim => evmRepairFlowStatuses.includes(claim.status)
        );

        // Sort by date (newest first)
        filteredClaims.sort((a, b) => {
          const dateA = new Date(a.dateFiled || a.createdAt || 0);
          const dateB = new Date(b.dateFiled || b.createdAt || 0);
          return dateB - dateA; // Newest first (descending)
        });

        setClaims(filteredClaims);
        toast.success(`Đã tải yêu cầu Luồng Sửa chữa EVM (${filteredClaims.length} mục)!`, { position: 'top-right' });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setClaims([]);
        toast.info('Không tìm thấy yêu cầu nào trong hệ thống để lọc.', { position: 'top-right' });
      } else if (error.response) {
        toast.error(`Lỗi khi tải yêu cầu: ${error.response.data?.message || error.response.statusText}`, { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [onClaimsUpdated]);

  if (loading) {
    return <div className="evmcmp-message-card">Đang tải yêu cầu Luồng Sửa chữa EVM...</div>;
  }

  if (claims.length === 0) {
    return <div className="evmcmp-message-card">Hiện tại không có yêu cầu nào trong Luồng Sửa chữa EVM.</div>;
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
              <th>Số Yêu cầu</th>
              <th>Trạng thái</th>
              <th>Số VIN Xe</th>
              <th>Trung tâm Dịch vụ</th>
              <th>Chi phí Bảo hành</th>
              <th>Ngày Nộp</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr
                key={claim.id}
              >
                <td>{claim.claimNumber}</td>
                <td>
                  <StatusBadge status={claim.status} />
                </td>
                <td>{claim.vehicle?.vin || 'N/A'}</td>
                <td>{claim.serviceCenter?.region || 'N/A'}</td>
                <td>₫{(claim.warrantyCost !== undefined && claim.warrantyCost !== null) ? claim.warrantyCost.toFixed(2) : 'N/A'}</td>
<<<<<<< HEAD
                <td>{formatDate(claim.dateFiled, claim.createdAt)}</td> 
=======
                <td>{new Date(claim.dateFiled || claim.createdAt).toLocaleDateString('vi-VN') || 'N/A'}</td>
>>>>>>> 28a0e039bee845053fc5467b98a973856d1eb3ce
                <td>
                  <button
                    onClick={() => onViewClaimDetails(claim.id)}
                    className="evmcmp-view-details-btn"
                    title="Xem Chi tiết Yêu cầu"
                  >
                    <FaEye /> Xem
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

        // Sort by date (newest first)
        filteredClaims.sort((a, b) => {
          const dateA = new Date(a.dateFiled || a.createdAt || 0);
          const dateB = new Date(b.dateFiled || b.createdAt || 0);
          return dateB - dateA; // Newest first (descending)
        });

        setClaims(filteredClaims);
        toast.success(`Đã tải yêu cầu sẵn sàng sửa chữa (${filteredClaims.length} mục)!`, { position: 'top-right' });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setClaims([]);
        toast.info('Không tìm thấy yêu cầu nào trong hệ thống để lọc.', { position: 'top-right' });
      } else if (error.response) {
        toast.error(`Lỗi khi tải yêu cầu: ${error.response.data?.message || error.response.statusText}`, { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [onClaimsUpdated]);

  if (loading) {
    return <div className="evmcmp-message-card">Đang tải yêu cầu sẵn sàng sửa chữa...</div>;
  }

  if (claims.length === 0) {
    return <div className="evmcmp-message-card">Hiện tại không có yêu cầu nào với trạng thái Sẵn sàng Sửa chữa (Đã phê duyệt).</div>;
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
              <th>Số Yêu cầu</th>
              <th>Trạng thái</th>
              <th>Số VIN Xe</th>
              <th>Trung tâm Dịch vụ</th>
              <th>Chi phí Bảo hành</th>
              <th>Số Ngày kể từ Phê duyệt</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {claims.map(claim => (
              <tr
                key={claim.id}
              >
                <td>{claim.claimNumber}</td>
                <td>
                  <StatusBadge status={claim.status} />
                </td>
                <td>{claim.vehicle?.vin || 'N/A'}</td>
                <td>{claim.serviceCenter?.region || 'N/A'}</td>
                <td>₫{(claim.warrantyCost !== undefined && claim.warrantyCost !== null) ? claim.warrantyCost.toFixed(2) : 'N/A'}</td>
                <td>{claim.daysSinceApproval || 'N/A'} ngày</td>
                <td>
                  <button
                    onClick={() => onViewClaimDetails(claim.id)}
                    className="evmcmp-view-details-btn"
                    title="Xem Chi tiết Yêu cầu"
                  >
                    <FaEye /> Xem
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
const EVMClaimManagementPage = ({ handleBackClick, onViewClaimDetails, onNavigateToResolveProblem }) => {
  // MODIFIED: 'allClaims' is now the default active function
  const [activeFunction, setActiveFunction] = useState('allClaims');

  // NEW: State for status filter
  const [statusFilter, setStatusFilter] = useState('all');

  const [currentView, setCurrentView] = useState('list');
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [actionData, setActionData] = useState(null);
  const [claimsUpdateKey, setClaimsUpdateKey] = useState(0);

  const handleViewClaimDetailsInternal = (claimId) => {
    setSelectedClaimId(claimId);
    setCurrentView('details');
  };

  // Use external handler if provided, otherwise use internal
  const handleViewClaimDetailsFinal = onViewClaimDetails || handleViewClaimDetailsInternal;

  const handleBackToClaimsList = () => {
    setSelectedClaimId(null);
    setActionData(null);
    setCurrentView('list');
  };

  // Handler for navigation to Approve Page (passes context data)
  const handleNavigateToApprove = (claimId, claimNumber, warrantyCost, vin, reportedFailure) => {
    setSelectedClaimId(claimId);
    setActionData({ type: 'approve', claimNumber, warrantyCost, vin, reportedFailure });
    setCurrentView('action');
  };

  // Handler for navigation to Reject Page (passes context data)
  const handleNavigateToReject = (claimId, claimNumber, vin, reportedFailure, warrantyCost) => {
    setSelectedClaimId(claimId);
    setActionData({ type: 'reject', claimNumber, vin, reportedFailure, warrantyCost });
    setCurrentView('action');
  };

  const handleActionComplete = (updatedClaim) => {
    toast.info(`Trạng thái đã được cập nhật thành ${updatedClaim.status}. Quay lại danh sách.`);
    setClaimsUpdateKey(prev => prev + 1);
    handleBackToClaimsList();
  };

  const getPageTitle = () => {
    if (currentView === 'action' && actionData) {
      return actionData.type === 'approve' ? 'Phê duyệt Yêu cầu' : 'Từ chối Yêu cầu';
    }
    return 'Quản lý Yêu cầu EVM';
  };


  const renderHeader = () => {
    // The header is only necessary for the LIST view.
    if (currentView !== 'list') {
      return null;
    }

    return (
      <div className="evmcmp-page-header">
        <button onClick={handleBackClick} className="evmcmp-back-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h2 className="evmcmp-page-title">{getPageTitle()}</h2>

        {/* Status Filter Buttons - EVM Repair Flow */}
        <motion.div
          className="evmcmp-status-filter-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* EVM Repair Flow */}
          <div className="evmcmp-status-filter-group">
            <span className="evmcmp-filter-group-label">Luồng Sửa chữa EVM:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'active' : ''}
            >
              Tất cả
            </button>
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
          backButtonLabel="Quay lại Danh sách Yêu cầu"

          // FIX: Pass the handlers directly. They now accept the necessary arguments from ClaimDetailPage.
          onNavigateToApprove={handleNavigateToApprove}
          onNavigateToReject={handleNavigateToReject}
          onNavigateToResolveProblem={onNavigateToResolveProblem}

          onProcessToIntake={() => { }}
          onEditDraftClaim={() => { }}
          onUpdateDiagnostic={() => { }}
          onSubmitToEVM={() => { }}
        />
      );
    }

    if (currentView === 'action' && actionData) {
      const { type, claimNumber, warrantyCost, vin, reportedFailure } = actionData;
      const commonProps = {
        claimId: selectedClaimId,
        claimNumber: claimNumber,
        handleBack: () => setCurrentView('details'),
        onActionComplete: handleActionComplete,
        // Pass context data to the form pages
        vin: vin,
        reportedFailure: reportedFailure,
        warrantyCost: warrantyCost,
      };

      if (type === 'approve') {
        return <EVMClaimApprovePage
          {...commonProps}
        />;
      }

      if (type === 'reject') {
        return <EVMClaimRejectPage
          {...commonProps}
        />;
      }

      return <div className="evmcmp-message-card">Lỗi: Không tìm thấy component Hành động hoặc loại không hợp lệ.</div>
    }

    // MODIFIED: Render the appropriate view based on activeFunction
    // Only "allClaims" view is available now
    return (
      <AllEVMClaimsView
        onViewClaimDetails={handleViewClaimDetailsFinal}
        onClaimsUpdated={claimsUpdateKey}
        statusFilter={statusFilter}
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