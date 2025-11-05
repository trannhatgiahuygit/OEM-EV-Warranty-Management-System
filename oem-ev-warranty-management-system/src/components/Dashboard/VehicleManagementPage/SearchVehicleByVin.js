import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import ServiceHistoryModal from '../ServiceHistoryModal/ServiceHistoryModal';
import './VehicleManagementPage.css';

// --- Vehicle Status Badge Component ---
const VehicleStatusBadge = ({ status }) => {
    // Normalize status to lowercase and handle spaces/underscores
    const normalizedStatus = status ? status.toLowerCase().replace(/\s+/g, '_') : '';
    const badgeClass = `vehicle-status-badge ${normalizedStatus}`;
    return <span className={badgeClass}>{status}</span>;
};

const SearchVehicleByVin = ({ onPartsDetailClick }) => {
  const [vin, setVin] = useState('');
  const [vehicle, setVehicle] = useState(null);
  const [showServiceHistory, setShowServiceHistory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVehicle(null); // Clear previous results
    
    // Simple validation for VIN format (e.g., must be 17 characters)
    if (!vin || vin.length !== 17) {
        toast.error('Vui lòng nhập Số VIN hợp lệ gồm 17 ký tự.', { position: 'top-right' });
        return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/vehicles/vin/${vin}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Response code 200: Vehicle found
      if (response.status === 200) {
        toast.success('Đã tải thông tin xe thành công!', { position: 'top-right' });
        setVehicle(response.data);
      }
    } catch (error) {
        if (error.response) {
            // Response code 404: Vehicle not found
            if (error.response.status === 404) {
                toast.warn('Không tìm thấy xe theo Số VIN.', { position: 'top-right' });
            } else {
                // Other HTTP errors
                toast.error('Tìm kiếm Xe theo Số VIN thất bại.', { position: 'top-right' });
            }
        } else {
            // Network or other generic error
            toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
        }
        setVehicle(null);
    }
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Tìm kiếm Xe theo Số VIN</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="vin"
          placeholder="Nhập Số VIN 17 ký tự"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          maxLength="17"
          required
        />
        <button type="submit">Tìm kiếm Xe</button>
      </form>

      {vehicle && (
        <motion.div
          className="vehicle-data"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h4>Chi tiết Xe:</h4>
          <p><strong>Mẫu xe:</strong> {vehicle.model}</p>
          <p><strong>Số VIN:</strong> {vehicle.vin}</p>
          <p><strong>Năm:</strong> {vehicle.year}</p>
          <p><strong>Khách hàng:</strong> {vehicle.customer?.name || 'N/A'}</p>
          <p><strong>Trạng thái Bảo hành:</strong> <VehicleStatusBadge status={vehicle.warrantyStatus} /></p>
          <p><strong>Số km (Km):</strong> {vehicle.mileageKm}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
             <button
                onClick={() => onPartsDetailClick(vehicle)}
                className="parts-detail-button"
             >
                Chi tiết Phụ tùng
             </button>
             <button
                onClick={() => setShowServiceHistory(true)}
                className="view-service-history-button"
             >
                Lịch sử Dịch vụ
             </button>
          </div>
        </motion.div>
      )}
      {showServiceHistory && vehicle && (
        <ServiceHistoryModal
          isOpen={showServiceHistory}
          onClose={() => setShowServiceHistory(false)}
          type="vehicle"
          id={vehicle.id}
          title={`Lịch sử Dịch vụ - VIN: ${vehicle.vin}`}
        />
      )}
    </motion.div>
  );
};

export default SearchVehicleByVin;