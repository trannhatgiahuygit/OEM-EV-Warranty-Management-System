import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaEye } from 'react-icons/fa'; // Import an icon for the button
// --- UPDATED IMPORT ---
import './TechnicianClaimManagementPage.css';

// --- Status Badge Component (Matching other pages) ---
const StatusBadge = ({ status }) => {
    const badgeClass = `cd-status-badge ${status.toLowerCase()}`;
    return <span className={badgeClass}>{status}</span>;
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
    'READY_FOR_HANDOVER': 'Sẵn sàng Bàn giao',
    'CUSTOMER_ACTION_NEEDED': 'Cần Hành động Khách hàng',
    'MOVE_ON_SC_REPAIR': 'Chuyển sang SC Repair',
    'CANCEL_REQUESTED': 'Chờ Xử lý Hủy',
    'CANCEL_PENDING': 'Chờ Xử lý Hủy',
    'CANCELED_PENDING': 'Đã Chấp nhận Hủy',
    'CANCELED_READY_TO_HANDOVER': 'Sẵn sàng Trả xe (Đã Hủy)',
    'CANCELED_DONE': 'Đã Hoàn tất Hủy'
  };
  return statusMap[status] || status;
}; 

// --- Component to display claims assigned to the technician ---
// MODIFIED: Accepts onViewClaimDetails prop and statusFilter for filtering
const AssignedClaimsView = ({ onViewClaimDetails, statusFilter }) => { 
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          // Only show toast on initial load or when filter changes
          const statusName = getStatusName(statusFilter);
          if (fetchedClaims.length > 0) {
            toast.success(`Đã tải yêu cầu ${statusName} (${fetchedClaims.length} mục).`, { position: 'top-right' });
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
           setClaims([]);
           const statusName = getStatusName(statusFilter);
           toast.info(`Không tìm thấy yêu cầu nào với trạng thái "${statusName}".`, { position: 'top-right' });
        } else if (error.response) {
          toast.error(`Lỗi khi tải yêu cầu: ${error.response.statusText}`, { position: 'top-right' });
        } else {
          toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();
  }, [statusFilter]);

  // Filter claims based on statusFilter
  // Always exclude WAITING_FOR_PARTS status as it doesn't belong to any flow
  const filteredClaims = claims.filter(claim => {
    // Always exclude WAITING_FOR_PARTS status
    if (claim.status === 'WAITING_FOR_PARTS') {
      return false;
    }
    if (statusFilter === 'all') {
      return true;
    }
    return claim.status === statusFilter;
  });

  if (loading) {
    const statusName = getStatusName(statusFilter);
    return <div className="tcmp-loading-message">Đang tải yêu cầu {statusName}...</div>;
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
              ? `Không tìm thấy yêu cầu nào với trạng thái "${getStatusName(statusFilter)}".`
              : 'Bạn hiện tại không có yêu cầu nào được phân công.'
          }
        </div>
      ) : (
        <div className="tcmp-claim-table-wrapper">
          <table className="tcmp-claim-table">
            <thead><tr><th>Số Yêu cầu</th><th>Trạng thái</th><th>Tên Khách hàng</th><th>Số VIN Xe</th><th>Lỗi Đã Báo cáo</th><th>Ngày Tạo</th><th>Hành động</th></tr></thead>
            <tbody>
              {filteredClaims.map(claim => (
                <tr key={claim.id}>
                  <td>{claim.claimNumber}</td>
                  <td><StatusBadge status={claim.status} /></td>
                  <td>{claim.customer.name}</td>
                  <td>{claim.vehicle.vin}</td>
                  <td>{claim.reportedFailure}</td>
                  <td>{new Date(claim.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td><button onClick={() => onViewClaimDetails(claim.id)} className="tcmp-view-details-btn" title="Xem Chi tiết Yêu cầu"><FaEye /> Xem</button></td>
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
  const [statusFilter, setStatusFilter] = useState('all'); // Status filter state

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
        
        {/* Status Filter Buttons - Same structure as SC Staff page */}
        <motion.div
          className="tcmp-status-filter-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Universal Statuses */}
          <div className="tcmp-status-filter-group">
            <span className="tcmp-filter-group-label">Trạng thái Chung:</span>
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
          <div className="tcmp-status-filter-group">
            <span className="tcmp-filter-group-label">Luồng Sửa chữa EVM:</span>
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
          <div className="tcmp-status-filter-group">
            <span className="tcmp-filter-group-label">Luồng Sửa chữa SC:</span>
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
      </div>
      
      <div className="tcmp-page-content-area">
        <AssignedClaimsView onViewClaimDetails={onViewClaimDetails} statusFilter={statusFilter} />
      </div>
    </div>
  );
};

export default TechnicianClaimManagementPage;