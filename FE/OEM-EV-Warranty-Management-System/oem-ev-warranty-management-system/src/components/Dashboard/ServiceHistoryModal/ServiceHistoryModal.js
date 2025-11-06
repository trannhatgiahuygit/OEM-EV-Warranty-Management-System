import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import './ServiceHistoryModal.css';

const ServiceHistoryModal = ({ isOpen, onClose, type, id, title }) => {
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchServiceHistory = async () => {
      if (!isOpen || !id) {
        setServiceHistory([]);
        return;
      }

      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        
        let endpoint = '';
        if (type === 'customer') {
          endpoint = `${process.env.REACT_APP_API_URL}/api/service-history/customer/${id}`;
        } else if (type === 'vehicle') {
          endpoint = `${process.env.REACT_APP_API_URL}/api/service-history/vehicle/${id}`;
        }

        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 200) {
          setServiceHistory(response.data);
          if (response.data.length === 0) {
            toast.info('Không có lịch sử dịch vụ nào.', { position: 'top-right' });
          }
        }
      } catch (error) {
        if (error.response) {
          toast.error('Lỗi khi tải lịch sử dịch vụ.', { position: 'top-right' });
        } else {
          toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
        }
        setServiceHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceHistory();
  }, [isOpen, id, type]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="service-history-modal-overlay" onClick={onClose}>
      <motion.div
        className="service-history-modal-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="service-history-modal-header">
          <h3>{title || 'Lịch sử Dịch vụ'}</h3>
          <button onClick={onClose} className="service-history-modal-close">
            ×
          </button>
        </div>

        <div className="service-history-modal-body">
          {loading ? (
            <div className="service-history-loading">Đang tải lịch sử dịch vụ...</div>
          ) : serviceHistory.length === 0 ? (
            <div className="service-history-empty">Không có lịch sử dịch vụ nào.</div>
          ) : (
            <div className="service-history-table-container">
              <table className="service-history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {type === 'customer' && <th>VIN Xe</th>}
                    {type === 'vehicle' && <th>Tên Khách hàng</th>}
                    <th>Loại Dịch vụ</th>
                    <th>Mô tả</th>
                    <th>Số Km</th>
                    <th>Thực hiện bởi</th>
                    <th>Ngày thực hiện</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceHistory.map((history) => (
                    <tr key={history.id}>
                      <td>{history.id}</td>
                      {type === 'customer' && (
                        <td>{history.vehicleVin || 'N/A'}</td>
                      )}
                      {type === 'vehicle' && (
                        <td>{history.customerName || 'N/A'}</td>
                      )}
                      <td>{history.serviceType || 'N/A'}</td>
                      <td>{history.description || 'N/A'}</td>
                      <td>{history.mileageKm ? `${history.mileageKm.toLocaleString('vi-VN')} km` : 'N/A'}</td>
                      <td>{history.performedByName || 'N/A'}</td>
                      <td>{formatDate(history.performedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ServiceHistoryModal;

