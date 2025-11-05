import React from 'react';
import { motion } from 'framer-motion';
import './VehicleManagementPage.css';

const PartsDetailPage = ({ vehicle, handleBackClick }) => {
  if (!vehicle || !vehicle.installedParts) {
    return (
      <div className="form-container">
        <h3>Chưa chọn xe nào.</h3>
        <button onClick={handleBackClick} className="back-to-list-button">
          ← Quay lại Trang Trước
        </button>
      </div>
    );
  }

  const { installedParts } = vehicle;

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="customer-page-header">
        <button onClick={handleBackClick} className="back-to-list-button">
          ← Quay lại Trang Trước
        </button>
        <h2 className="page-title">Chi tiết Phụ tùng</h2>
        <p className="page-description">
          Hiển thị phụ tùng đã đăng ký cho xe có số VIN: {vehicle.vin}
        </p>
      </div>

      {installedParts.length > 0 ? (
        <div className="parts-table-container">
          <div className="parts-table-wrapper">
            <table className="parts-table">
              <thead>
                <tr>
                  <th>Số Phụ tùng</th>
                  <th>Tên Phụ tùng</th>
                  <th>Danh mục</th>
                  <th>Số Serial</th>
                  <th>Đã Cài đặt Lúc</th>
                </tr>
              </thead>
              <tbody>
                {installedParts.map((part, index) => (
                  <tr key={index}>
                    <td>{part.partNumber}</td>
                    <td>{part.partName}</td>
                    <td>{part.category}</td>
                    <td>{part.serialNumber}</td>
                    <td>{new Date(part.installedAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="no-parts-message">
          Không tìm thấy phụ tùng đã đăng ký cho xe này.
        </div>
      )}
    </motion.div>
  );
};

export default PartsDetailPage;