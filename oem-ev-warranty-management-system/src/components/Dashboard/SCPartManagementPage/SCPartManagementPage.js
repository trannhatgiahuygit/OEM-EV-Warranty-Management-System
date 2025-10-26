import React, { useState } from 'react';
import './SCPartManagementPage.css'; // File CSS chúng ta vừa tạo
import { FaArrowLeft } from 'react-icons/fa'; // Icon nút Back
import { motion } from 'framer-motion';
import axios from 'axios'; // Import axios để gọi API
import { toast } from 'react-toastify'; // Import toast để thông báo

// Component khung
const SCPartManagementPage = ({ handleBackClick }) => {
  const [vin, setVin] = useState(''); // Để lưu trữ VIN người dùng nhập
  const [installedParts, setInstalledParts] = useState([]); // Lưu danh sách phụ tùng
  const [isLoading, setIsLoading] = useState(false); // Trạng thái loading
  const [installFormData, setInstallFormData] = useState({
    serialNumber: '',
    workOrderId: '',
    notes: ''
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [partToUninstall, setPartToUninstall] = useState(null);

  // === 1. HÀM TRA CỨU PHỤ TÙNG THEO VIN ===
  // (Chúng ta sẽ code hàm này ở bước tiếp theo)
  // === 1. HÀM TRA CỨU PHỤ TÙNG THEO VIN (ĐÃ SỬA LỖI LOGIC) ===
  const handleFetchPartsByVin = async () => {
    if (!vin || vin.length !== 17) {
      toast.error('Please enter a valid 17-character VIN to search.');
      return;
    }
    
    console.log(`Fetching parts for VIN: ${vin}`);
    setIsLoading(true);
    setInstalledParts([]); 

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        toast.error('You are not logged in. Please log in again.');
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
        
        // Gán mảng 'installedParts' (bên trong response.data) vào state
        setInstalledParts(response.data.installedParts); 
        
        // Hiển thị số lượng phụ tùng tìm thấy
        toast.success(`Found ${response.data.installedParts.length} installed part(s) for VIN: ${vin}`);
      
      } else {
        // API thành công nhưng không tìm thấy phụ tùng nào
        setInstalledParts([]);
        toast.info(`No installed parts found for VIN: ${vin}`);
      }
      // === KẾT THÚC SỬA LỖI ===
    } catch (error) {
      console.error('Failed to fetch parts:', error);
      
      // === SỬA LỖI 403 ===
      // Nếu là lỗi 403, báo cho người dùng biết là do phân quyền
      if (error.response && error.response.status === 403) {
         toast.error('You do not have permission to view parts for this vehicle.');
      } else {
         const errorMessage = error.response?.data?.message || 'Failed to load parts. Check connection or token.';
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
      toast.success(`Part ${serialNumber} uninstalled successfully!`);

      // Tự động tải lại danh sách phụ tùng của xe
      handleFetchPartsByVin();

    } catch (error) {
      // Xử lý khi có lỗi
      console.error('Failed to uninstall part:', error);
      const errorMessage = error.response?.data?.message || 'Failed to uninstall part.';
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
      toast.error('Please enter the New Part Serial Number.');
      return;
    }
    if (!workOrderId) {
      toast.error('Please enter the Work Order ID.');
      return;
    }
    if (!vin) {
      // Trường hợp này hiếm khi xảy ra vì form chỉ hiển thị khi có VIN
      toast.error('Cannot install part: VIN is missing. Please search for the VIN again.');
      return;
    }

    console.log('Attempting to install part:', installFormData, 'onto VIN:', vin);
    setIsLoading(true);

    try {
      // Lấy token và kiểm tra
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        toast.error('You are not logged in. Please log in again.');
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
      toast.success(`Part ${response.data.serialNumber} installed on ${vin} successfully!`);

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
        toast.error('Access Denied: You do not have permission to install parts. Please check your user role.');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to install part.';
        toast.error(errorMessage);
      }
      setIsLoading(false); // Chỉ tắt loading nếu có lỗi
    }
    // setIsLoading(false) sẽ được gọi trong handleFetchPartsByVin() nếu thành công
  };


  // --- PHẦN GIAO DIỆN (JSX) ---
  return (
    <motion.div 
      className="sc-part-management-page" // Đảm bảo bạn có CSS cho class này
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      {/* Nút Back và Tiêu đề */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={handleBackClick} className="back-button" style={{ marginRight: '20px' }}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 style={{ margin: 0 }}>Part Serial Management (Technician)</h1>
      </div>

      {/* Vùng 1: Tra cứu theo VIN */}
      <div className="card part-lookup-card" style={{ marginBottom: '20px', padding: '20px' }}>
        <h2>Manage Vehicle Parts</h2>
        <p>Enter a Vehicle Identification Number (VIN) to find installed parts.</p>
        <div className="vin-search-bar" style={{ display: 'flex' }}>
          <input 
            type="text"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase().trim())}
            placeholder="Enter VIN (17 characters)"
            maxLength={17}
            style={{ flexGrow: 1, marginRight: '10px' }}
          />
          <button onClick={handleFetchPartsByVin} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      {installedParts.length > 0 && (
        <motion.div
          className="card installed-parts-list"
          style={{ padding: '20px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3>Installed Parts on VIN: {vin}</h3>
          <table className="parts-table">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Part Name</th>
                <th>Installed At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {installedParts.map((part) => (
                <tr key={part.serialNumber}>
                  <td>{part.serialNumber}</td>
                  <td>{part.partName || part.part?.partName || 'N/A'}</td>
                  <td>{new Date(part.installedAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <span className={`status-badge status-${part.status?.toLowerCase()}`}>
                      {part.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="button-danger"
                      onClick={() => handleUninstallClick(part.serialNumber, part.partName || part.part?.partName || 'N/A')}
                      disabled={isLoading}
                    >
                      Uninstall
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Vùng 2: Form Gắn Phụ Tùng */}
      <motion.div
        className="card install-part-form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3>Install New Part on VIN: {vin}</h3>
        <p>Enter the Serial Number of the new part and the associated Work Order ID.</p>
        
        <div className="install-form-layout">
          {/* Trường nhập Serial Number */}
          <div className="form-group">
            <label>New Part Serial Number</label>
            <input 
              type="text"
              placeholder="Enter part serial number"
              value={installFormData.serialNumber}
              onChange={(e) => setInstallFormData({ ...installFormData, serialNumber: e.target.value.toUpperCase() })}
            />
          </div>

          {/* Trường nhập Work Order ID */}
          <div className="form-group">
            <label>Work Order ID</label>
            <input 
              type="number"
              placeholder="Enter Work Order ID"
              value={installFormData.workOrderId}
              onChange={(e) => setInstallFormData({ ...installFormData, workOrderId: e.target.value })}
            />
          </div>
        </div>
        
        {/* Trường nhập Notes (full width) */}
        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea 
            placeholder="Enter installation notes..."
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
          {isLoading ? 'Installing...' : 'Install Part'}
        </button>
      </motion.div>

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
            <h3>Confirm Uninstall</h3>
            <p>Are you sure you want to uninstall this part?</p>
            {partToUninstall && (
              <div className="modal-part-info">
                <p><strong>Serial Number:</strong> {partToUninstall.serialNumber}</p>
                <p><strong>Part Name:</strong> {partToUninstall.partName}</p>
              </div>
            )}
            <div className="modal-actions">
              <button className="button-cancel" onClick={cancelUninstall}>
                No, Cancel
              </button>
              <button className="button-confirm" onClick={confirmUninstall}>
                Yes, Uninstall
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default SCPartManagementPage;


