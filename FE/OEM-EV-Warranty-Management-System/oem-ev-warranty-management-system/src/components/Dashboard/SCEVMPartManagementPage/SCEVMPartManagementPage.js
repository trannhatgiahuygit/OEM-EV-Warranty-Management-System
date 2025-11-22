import React, { useState, useEffect } from 'react';
import './SCEVMPartManagementPage.css';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

// Component khung
const SCEVMPartManagementPage = ({ handleBackClick }) => {
  const [activeFunction, setActiveFunction] = useState('all-parts');
  const [vin, setVin] = useState('');
  const [installedParts, setInstalledParts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [installFormData, setInstallFormData] = useState({
    serialNumber: '',
    workOrderId: '',
    notes: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [partToUninstall, setPartToUninstall] = useState(null);
  const [allParts, setAllParts] = useState([]);

  // === 1. HÀM TRA CỨU PHỤ TÙNG THEO VIN (ĐÃ SỬA LỖI LOGIC) ===
  const handleFetchPartsByVin = async () => {
    if (!vin || vin.length !== 17) {
      toast.error('Vui lòng nhập VIN hợp lệ gồm 17 ký tự để tìm kiếm.');
      return;
    }
    
    console.log(`Fetching parts for VIN: ${vin}`);
    setIsLoading(true);
    setInstalledParts([]); 

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        toast.error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
        setIsLoading(false);
        return;
      }
      
      const token = user.token;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/part-serials/vehicle/${vin}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // === SỬA LỖI Ở ĐÂY ===
      // Kiểm tra xem 'response.data.installedParts' có tồn tại và có phải là mảng có dữ liệu không
      if (response.data && response.data.installedParts && response.data.installedParts.length > 0) {
        
        // Sort by date (newest first) - use installedAt if available
        let fetchedParts = response.data.installedParts;
        fetchedParts.sort((a, b) => {
          if (a.installedAt && b.installedAt) {
            const dateA = new Date(a.installedAt);
            const dateB = new Date(b.installedAt);
            return dateB - dateA; // Newest first (descending)
          }
          return 0;
        });
        
        // Gán mảng 'installedParts' (bên trong response.data) vào state
        setInstalledParts(fetchedParts); 
        
        // Hiển thị số lượng phụ tùng tìm thấy
        toast.success(`Đã tìm thấy ${response.data.installedParts.length} phụ tùng đã cài đặt cho VIN: ${vin}`);
      
      } else {
        // API thành công nhưng không tìm thấy phụ tùng nào
        setInstalledParts([]);
        toast.info(`Không tìm thấy phụ tùng đã cài đặt cho VIN: ${vin}`);
      }
      // === KẾT THÚC SỬA LỖI ===
    } catch (error) {
      console.error('Failed to fetch parts:', error);
      
      // === SỬA LỖI 403 ===
      // Nếu là lỗi 403, báo cho người dùng biết là do phân quyền
      if (error.response && error.response.status === 403) {
         toast.error('Bạn không có quyền xem phụ tùng cho xe này.');
      } else {
         const errorMessage = error.response?.data?.message || 'Không thể tải phụ tùng. Vui lòng kiểm tra kết nối hoặc token.';
         toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // === 2. HÀM THÁO PHỤ TÙNG (UNINSTALL) ===
  // Show confirmation modal
  const handleUninstallClick = (serialNumber, partName) => {
    setPartToUninstall({ serialNumber, partName });
    setShowConfirmModal(true);
  };

  // Confirm uninstall
  const confirmUninstall = async () => {
    if (!partToUninstall) return;

    const { serialNumber } = partToUninstall;
    setShowConfirmModal(false);
    
    console.log(`Uninstalling part: ${serialNumber}`);
    setIsLoading(true);

    try {
      // Lấy token
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      // Chuẩn bị dữ liệu body cho API (chỉ cần serialNumber)
      const requestBody = {
        serialNumber: serialNumber
      };

      // Gọi API POST /api/part-serials/uninstall
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/part-serials/uninstall`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Xử lý khi thành công
      toast.success(`Phụ tùng ${serialNumber} đã được tháo gỡ thành công!`);

      // Tự động tải lại danh sách phụ tùng của xe
      handleFetchPartsByVin();

    } catch (error) {
      // Xử lý khi có lỗi
      console.error('Failed to uninstall part:', error);
      const errorMessage = error.response?.data?.message || 'Không thể tháo gỡ phụ tùng.';
      toast.error(errorMessage);
      setIsLoading(false);
    }
    setPartToUninstall(null);
  };

  // Cancel uninstall
  const cancelUninstall = () => {
    setShowConfirmModal(false);
    setPartToUninstall(null);
  };

  // === 3. HÀM GẮN PHỤ TÙNG (INSTALL) ===
  const handleInstallPart = async () => {
    // Lấy dữ liệu từ form state
    const { serialNumber, workOrderId, notes } = installFormData;

    // --- Kiểm tra dữ liệu đầu vào ---
    if (!serialNumber) {
      toast.error('Vui lòng nhập Số Serial Phụ tùng Mới.');
      return;
    }
    if (!workOrderId) {
      toast.error('Vui lòng nhập ID Work Order.');
      return;
    }
    if (!vin) {
      // Trường hợp này hiếm khi xảy ra vì form chỉ hiển thị khi có VIN
      toast.error('Không thể cài đặt phụ tùng: VIN bị thiếu. Vui lòng tìm kiếm VIN lại.');
      return;
    }

    console.log('Attempting to install part:', installFormData, 'onto VIN:', vin);
    setIsLoading(true);

    try {
      // Lấy token và kiểm tra
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        toast.error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
        setIsLoading(false);
        return;
      }
      
      const token = user.token;
      
      // Log user info for debugging
      console.log('User role:', user.role);
      console.log('Token exists:', !!token);

      // Chuẩn bị dữ liệu body cho API - đúng với cấu trúc backend yêu cầu
      const requestBody = {
        serialNumber: serialNumber,
        vehicleVin: vin, // Backend expects "vehicleVin" not "vin"
        workOrderId: parseInt(workOrderId), // Convert to number
        notes: notes || '' // Include notes field (optional)
      };

      console.log('Request URL:', `${process.env.REACT_APP_API_URL}/api/part-serials/install`);
      console.log('Request Body:', requestBody);
      console.log('Authorization Header:', `Bearer ${token.substring(0, 20)}...`);

      // Gọi API POST /api/part-serials/install
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/part-serials/install`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Xử lý khi thành công
      toast.success(`Phụ tùng ${response.data.serialNumber} đã được cài đặt trên ${vin} thành công!`);

      // Xóa sạch form
      setInstallFormData({
        serialNumber: '',
        workOrderId: '',
        notes: ''
      });

      // Tự động tải lại danh sách phụ tùng của xe
      // để hiển thị phụ tùng vừa được gắn
      handleFetchPartsByVin();

    } catch (error) {
      // Xử lý khi có lỗi
      console.error('Failed to install part:', error);
      console.error('Error response:', error.response);
      
      if (error.response && error.response.status === 403) {
        toast.error('Truy cập bị từ chối: Bạn không có quyền cài đặt phụ tùng. Vui lòng kiểm tra vai trò người dùng của bạn.');
      } else {
        const errorMessage = error.response?.data?.message || 'Không thể cài đặt phụ tùng.';
        toast.error(errorMessage);
      }
      setIsLoading(false); // Chỉ tắt loading nếu có lỗi
    }
    // setIsLoading(false) sẽ được gọi trong handleFetchPartsByVin() nếu thành công
  };

  // === 4. HÀM LẤY TẤT CẢ PHỤ TÙNG ===
  const handleFetchAllParts = async () => {
    console.log('Fetching all part serials...');
    setIsLoading(true);
    setAllParts([]);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        toast.error('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
        setIsLoading(false);
        return;
      }

      const token = user.token;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/part-serials`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data && response.data.length > 0) {
        let fetchedParts = response.data;
        // Sort by date (newest first) - use createdDate if available, otherwise use id as fallback
        fetchedParts.sort((a, b) => {
          if (a.createdDate && b.createdDate) {
            const dateA = new Date(a.createdDate);
            const dateB = new Date(b.createdDate);
            return dateB - dateA; // Newest first (descending)
          }
          // Fallback to id if no createdDate field
          return (b.id || 0) - (a.id || 0); // Higher id = newer (assuming auto-increment)
        });
        setAllParts(fetchedParts);
        toast.success(`Đã tìm thấy ${fetchedParts.length} phụ tùng`);
      } else {
        setAllParts([]);
        toast.info('Không tìm thấy phụ tùng nào');
      }
    } catch (error) {
      console.error('Failed to fetch all parts:', error);
      if (error.response && error.response.status === 403) {
        toast.error('Bạn không có quyền xem phụ tùng.');
      } else {
        const errorMessage = error.response?.data?.message || 'Không thể tải phụ tùng.';
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial mount
  useEffect(() => {
    handleFetchAllParts();
  }, []);

  // Handle tab change
  const handleFunctionChange = (func) => {
    setActiveFunction(func);
    // Load data when switching to All Parts tab
    if (func === 'all-parts') {
      handleFetchAllParts();
    }
  };

  // --- RENDER FUNCTIONS FOR EACH TAB ---
  const renderSearchByVin = () => (
    <>
      {/* VIN Search Card */}
      <div className="scpm-card part-lookup-card">
        <h2>Tìm kiếm Phụ tùng theo VIN</h2>
        <p>Nhập số nhận dạng xe (VIN) để tìm phụ tùng đã cài đặt.</p>
        <div className="vin-search-bar">
          <input 
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase().trim())}
            placeholder="Nhập VIN (17 ký tự)"
            maxLength={17}
          />
          <button onClick={handleFetchPartsByVin} disabled={isLoading}>
            {isLoading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
          </button>
        </div>
      </div>

      {/* Installed Parts List */}
      {installedParts.length > 0 && (
        <motion.div
          className="scpm-table-container" // Use new container class
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="scpm-table-wrapper"> {/* Use new wrapper class */}
            <table className="scpm-table"> {/* Use new table class */}
              <thead>
                <tr>
                  <th>Số Serial</th>
                  <th>Tên Phụ tùng</th>
                  <th>Ngày Cài đặt</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {installedParts.map((part) => (
                  <tr key={part.serialNumber}>
                    <td>{part.serialNumber}</td>
                    <td>{part.partName || part.part?.partName || 'Không có'}</td>
                    <td>{new Date(part.installedAt).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className={`status-badge status-${part.status?.toLowerCase()}`}>
                        {part.status === 'installed' || part.status === 'INSTALLED' ? 'Đã dùng' : 
                         part.status === 'in_stock' || part.status === 'IN_STOCK' ? 'Trong kho' :
                         part.status === 'allocated' || part.status === 'ALLOCATED' ? 'Đã phân công' :
                         part.status === 'returned' || part.status === 'RETURNED' ? 'Đã trả về' :
                         part.status || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="button-danger"
                        onClick={() => handleUninstallClick(part.serialNumber, part.partName || part.part?.partName || 'N/A')}
                        disabled={isLoading}
                      >
                        Tháo gỡ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </>
  );

  const renderAllParts = () => (
    <>
      {isLoading ? (
        <div className="scpm-card">
          <p style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</p>
        </div>
      ) : allParts.length > 0 ? (
        <motion.div
          className="scpm-table-container" // Use new container class
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="scpm-table-wrapper"> {/* Use new wrapper class */}
            <table className="scpm-table"> {/* Use new table class */}
              <thead>
                <tr>
                  <th>Số Serial</th>
                  <th>Tên Phụ tùng</th>
                  <th>VIN</th>
                  <th>Ngày Cài đặt</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {allParts.map((part) => (
                  <tr key={part.serialNumber}>
                    <td>{part.serialNumber}</td>
                    <td>{part.partName || part.part?.partName || 'Không có'}</td>
                    <td>{part.installedOnVehicleVin || 'Không có'}</td>
                    <td>{part.installedAt ? new Date(part.installedAt).toLocaleDateString('vi-VN') : 'Không có'}</td>
                    <td>
                      <span className={`status-badge status-${part.status?.toLowerCase()}`}>
                        {part.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <div className="scpm-card">
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Không tìm thấy phụ tùng nào. Nhấp vào nút phía trên để làm mới.
          </p>
        </div>
      )}
    </>
  );

  const renderInstallPart = () => (
    <>
      {/* VIN Input for Install */}
      <div className="scpm-card">
        <h2>Cài đặt Phụ tùng trên Xe</h2>
        <p>Đầu tiên, nhập VIN của xe bạn muốn cài đặt phụ tùng.</p>
        <div className="vin-search-bar">
          <input 
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase().trim())}
            placeholder="Nhập VIN (17 ký tự)"
            maxLength={17}
          />
        </div>
      </div>

      {/* Install Form */}
      {vin && (
        <motion.div
          className="scpm-card install-part-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Cài đặt Phụ tùng Mới trên VIN: {vin}</h3>
          <p>Nhập Số Serial của phụ tùng mới và ID Work Order liên quan.</p>
          
          <div className="install-form-layout">
            {/* Trường nhập Serial Number */}
            <div className="form-group">
              <label>Số Serial Phụ tùng Mới</label>
              <input 
                type="text"
                placeholder="Nhập số serial phụ tùng"
                value={installFormData.serialNumber}
                onChange={(e) => setInstallFormData({ ...installFormData, serialNumber: e.target.value.toUpperCase() })}
              />
            </div>

            {/* Trường nhập Work Order ID */}
            <div className="form-group">
              <label>ID Work Order</label>
              <input 
                type="number"
                placeholder="Nhập ID Work Order"
                value={installFormData.workOrderId}
                onChange={(e) => setInstallFormData({ ...installFormData, workOrderId: e.target.value })}
              />
            </div>
          </div>
          
          {/* Trường nhập Notes (full width) */}
          <div className="form-group">
            <label>Ghi chú (Tùy chọn)</label>
            <textarea 
              placeholder="Nhập ghi chú cài đặt..."
              value={installFormData.notes}
              onChange={(e) => setInstallFormData({ ...installFormData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Nút Submit */}
          <button 
            onClick={handleInstallPart}
            disabled={isLoading || !vin}
            className="button-primary"
          >
            {isLoading ? 'Đang cài đặt...' : 'Cài đặt Phụ tùng'}
          </button>
        </motion.div>
      )}
    </>
  );

  // Render active function
  const renderActiveFunction = () => {
    switch (activeFunction) {
      case 'all-parts':
        return renderAllParts();
      case 'search-vin':
        return renderSearchByVin();
      case 'install-part':
        return renderInstallPart();
      default:
        return renderAllParts();
    }
  };

  // --- MAIN RETURN JSX ---
  return (
    <motion.div 
      className="sc-evm-part-management-page"
      initial={{ opacity: 0 }} // MODIFIED: Changed from { opacity: 0, x: 100 }
      animate={{ opacity: 1 }} // MODIFIED: Changed from { opacity: 1, x: 0 }
      exit={{ opacity: 0 }} // MODIFIED: Changed from { opacity: 0, x: -100 }
    >
      {/* Header with Navigation */}
      <div className="page-header">
        <button onClick={handleBackClick} className="back-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h2 className="page-title">Quản lý Số Serial Phụ tùng EVM</h2>
        
        <motion.div
          className="function-nav-bar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => handleFunctionChange('all-parts')}
            className={activeFunction === 'all-parts' ? 'active' : ''}
          >
            Tất cả Phụ tùng Serial
          </button>
          <button
            onClick={() => handleFunctionChange('search-vin')}
            className={activeFunction === 'search-vin' ? 'active' : ''}
          >
            Tìm kiếm theo VIN
          </button>
          <button
            onClick={() => handleFunctionChange('install-part')}
            className={activeFunction === 'install-part' ? 'active' : ''}
          >
            Cài đặt Phụ tùng
          </button>
        </motion.div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {renderActiveFunction()}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={cancelUninstall}>
          <motion.div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h3>Xác nhận Tháo gỡ</h3>
            <p>Bạn có chắc chắn muốn tháo gỡ phụ tùng này không?</p>
            {partToUninstall && (
              <div className="modal-part-info">
                <p><strong>Số Serial:</strong> {partToUninstall.serialNumber}</p>
                <p><strong>Tên Phụ tùng:</strong> {partToUninstall.partName}</p>
              </div>
            )}
            <div className="modal-actions">
              <button className="button-cancel" onClick={cancelUninstall}>
                Không, Hủy
              </button>
              <button className="button-confirm" onClick={confirmUninstall}>
                Có, Tháo gỡ
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default SCEVMPartManagementPage;

