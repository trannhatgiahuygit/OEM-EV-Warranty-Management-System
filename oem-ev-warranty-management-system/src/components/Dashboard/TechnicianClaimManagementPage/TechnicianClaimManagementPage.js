import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa'; // Import an icon for the button
// --- UPDATED IMPORT ---
import './TechnicianClaimManagementPage.css';

// --- Status Badge Component (Matching other pages) ---
const StatusBadge = ({ status, statusLabel }) => {
    const badgeClass = `cd-status-badge ${status.toLowerCase()}`;
    return <span className={badgeClass}>{statusLabel}</span>;
}; 

// --- Component to display claims assigned to the technician ---
// MODIFIED: Accepts onViewClaimDetails prop and statusFilter for filtering
const AssignedClaimsView = ({ onViewClaimDetails, statusFilter }) => { 
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
            toast.error('Không tìm thấy ID Kỹ thuật viên trong dữ liệu người dùng.', { position: 'top-right' });
            setLoading(false);
            return;
          }

          // Fetching claims assigned to this technician.
          // ASSUMPTION: This endpoint returns all claims assigned to the technician, regardless of status.
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/claims/technician/${technicianId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );

          if (response.status === 200) {
            let fetchedClaims = response.data;
            // Sort by date (newest first)
            fetchedClaims.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA; // Newest first (descending)
            });
            setClaims(fetchedClaims);
            // MODIFIED: Clearer toast message
            toast.success('Đã tải tất cả yêu cầu đã phân công thành công!', { position: 'top-right' });
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
             setClaims([]);
             toast.info('Hiện tại không có yêu cầu nào được phân công cho bạn.', { position: 'top-right' });
          } else if (error.response) {
            toast.error(`Lỗi khi tải yêu cầu đã phân công: ${error.response.statusText}`, { position: 'top-right' });
          } else {
            toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchClaims();
    }
  }, []);

  // Filter claims based on statusFilter
  const filteredClaims = claims.filter(claim => {
    if (statusFilter === 'all') {
      return true;
    }
    // Map filter values to actual status codes
    switch (statusFilter) {
      case 'open':
        return claim.status === 'OPEN';
      case 'pending_approval':
        return claim.status === 'PENDING_APPROVAL';
      case 'pending_evm_approval':
        return claim.status === 'PENDING_EVM_APPROVAL';
      default:
        return true;
    }
  });

  if (loading) {
    return <div className="tcmp-loading-message">Đang tải yêu cầu đã phân công...</div>;
  }
  
  return (
    <motion.div
      className="tcmp-claim-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {filteredClaims.length === 0 ? (
        <div className="tcmp-loading-message">
          {claims.length === 0 
            ? 'Bạn hiện tại không có yêu cầu nào được phân công.'
            : statusFilter !== 'all' 
              ? `Không tìm thấy yêu cầu nào với trạng thái "${statusFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}".`
              : 'Bạn hiện tại không có yêu cầu nào được phân công.'
          }
        </div>
      ) : (
        <div className="tcmp-claim-table-wrapper">
          <table className="tcmp-claim-table">
            <thead>
              <tr>
                <th>Số Yêu cầu</th>
                <th>Trạng thái</th>
                <th>Tên Khách hàng</th>
                <th>Số VIN Xe</th>
                <th>Lỗi Đã Báo cáo</th>
                <th>Ngày Tạo</th>
                <th>Hành động</th> {/* ADDED: Action column */}
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map(claim => (
                <tr 
                  key={claim.id} 
                >
                  <td>{claim.claimNumber}</td>
                  <td>
                    <StatusBadge status={claim.status} statusLabel={claim.statusLabel} />
                  </td>
                  <td>{claim.customer.name}</td>
                  <td>{claim.vehicle.vin}</td>
                  <td>{claim.reportedFailure}</td>
                  <td>{new Date(claim.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    {/* MODIFIED: Button text changed to "View" */}
                    <button 
                      onClick={() => onViewClaimDetails(claim.id)} 
                      className="tcmp-view-details-btn"
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
      )}
    </motion.div>
  );
};


// --- Main Page Component ---
// MODIFIED: Accepts onViewClaimDetails prop
const TechnicianClaimManagementPage = ({ handleBackClick, onViewClaimDetails }) => {
  const [activeFunction, setActiveFunction] = useState('assignedClaims');
  const [statusFilter, setStatusFilter] = useState('all'); // NEW: Status filter state

  const renderActiveFunction = () => {
    switch (activeFunction) {
      case 'assignedClaims':
        // MODIFIED: Pass the handler and statusFilter down
        return <AssignedClaimsView onViewClaimDetails={onViewClaimDetails} statusFilter={statusFilter} />; 
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
          ← Quay lại Bảng điều khiển
        </button>
        <h2 
          className="tcmp-page-title"
        >
          Quản lý Yêu cầu Kỹ thuật viên
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
              Yêu cầu Đã Phân công
            </button>
        </motion.div>
        
        {/* NEW: Status Filter Buttons */}
        {activeFunction === 'assignedClaims' && (
          <motion.div
            className="tcmp-status-filter-group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span>Lọc theo Trạng thái:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'active' : ''}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={statusFilter === 'open' ? 'active' : ''}
            >
              Mở
            </button>
            <button
              onClick={() => setStatusFilter('pending_approval')}
              className={statusFilter === 'pending_approval' ? 'active' : ''}
            >
              Đang chờ Phê duyệt
            </button>
            <button
              onClick={() => setStatusFilter('pending_evm_approval')}
              className={statusFilter === 'pending_evm_approval' ? 'active' : ''}
            >
              Đang chờ Phê duyệt EVM
            </button>
          </motion.div>
        )}
      </div>
      
      <div className="tcmp-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default TechnicianClaimManagementPage;