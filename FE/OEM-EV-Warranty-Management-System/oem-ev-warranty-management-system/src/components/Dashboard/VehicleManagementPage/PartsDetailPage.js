import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { serialPartsService } from '../../../services/serialPartsService';
import { toast } from 'react-toastify';
import './VehicleManagementPage.css';
import './PartsDetailPage.css';

const PartsDetailPage = ({ vehicle, handleBackClick }) => {
  const [serialParts, setSerialParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (vehicle && vehicle.vin) {
      loadVehicleSerialParts();
    }
  }, [vehicle]);

  useEffect(() => {
    filterParts();
  }, [serialParts, statusFilter, searchTerm]);

  const loadVehicleSerialParts = async () => {
    try {
      setLoading(true);
      const parts = await serialPartsService.getVehicleSerialParts(vehicle.vin);
      setSerialParts(parts || []);
    } catch (error) {
      console.error('Failed to load vehicle serial parts:', error);
      toast.error('Không thể tải thông tin phụ tùng.', { position: 'top-right' });
      setSerialParts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = [...serialParts];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(part => {
        const partStatus = (part.status || '').toLowerCase();
        return partStatus === statusFilter.toLowerCase();
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(part =>
        (part.serialNumber || '').toLowerCase().includes(term) ||
        (part.partName || '').toLowerCase().includes(term) ||
        (part.partType || part.category || '').toLowerCase().includes(term) ||
        (part.partNumber || '').toLowerCase().includes(term)
      );
    }

    setFilteredParts(filtered);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusClass = (status) => {
    if (!status) return 'installed';
    return status.toLowerCase().replace(/ /g, '_');
  };

  const getStatusLabel = (status) => {
    if (!status) return 'N/A';
    const statusUpper = status.toUpperCase();
    const statusMap = {
      'IN_STOCK': 'Trong kho',
      'ALLOCATED': 'Đã phân công',
      'ASSIGNED': 'Đã phân công',
      'INSTALLED': 'Đã lắp đặt',
      'REPLACED': 'Đã thay thế',
      'DEFECTIVE': 'Lỗi',
      'RETURNED': 'Đã trả về',
      // Third party part statuses
      'AVAILABLE': 'Có sẵn',
      'RESERVED': 'Đã đặt trước',
      'USED': 'Đã dùng',
      'DEACTIVATED': 'Đã vô hiệu hóa'
    };
    return statusMap[statusUpper] || status || 'N/A';
  };

  const getLocationLabel = (location) => {
    if (!location) return 'N/A';
    const locationMap = {
      'EVM_WAREHOUSE': 'Kho EVM',
      'THIRD_PARTY_WAREHOUSE': 'Kho bên thứ 3',
      'CUSTOMER_VEHICLE': 'Xe khách hàng'
    };
    return locationMap[location] || location;
  };

  // Calculate summary statistics
  const summary = {
    total: serialParts.length,
    installed: serialParts.filter(p => {
      const status = (p.status || '').toUpperCase();
      return status === 'INSTALLED' || status === 'USED';
    }).length,
    replaced: serialParts.filter(p => {
      const status = (p.status || '').toUpperCase();
      return status === 'REPLACED';
    }).length,
    defective: serialParts.filter(p => {
      const status = (p.status || '').toUpperCase();
      return status === 'DEFECTIVE';
    }).length
  };

  if (!vehicle || !vehicle.vin) {
    return (
      <div className="form-container">
        <h3>Chưa chọn xe nào.</h3>
        <button onClick={handleBackClick} className="back-to-list-button">
          ← Quay lại Trang Trước
        </button>
      </div>
    );
  }

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

      {loading ? (
        <div className="loading-message">Đang tải thông tin phụ tùng...</div>
      ) : serialParts.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="parts-summary">
            <div className="summary-card primary">
              <div className="summary-card__label">Tổng số linh kiện</div>
              <div className="summary-card__value">{summary.total}</div>
            </div>
            <div className="summary-card success">
              <div className="summary-card__label">Đã lắp đặt</div>
              <div className="summary-card__value">{summary.installed}</div>
            </div>
            <div className="summary-card warning">
              <div className="summary-card__label">Đã thay thế</div>
              <div className="summary-card__value">{summary.replaced}</div>
            </div>
            <div className="summary-card danger">
              <div className="summary-card__label">Lỗi</div>
              <div className="summary-card__value">{summary.defective}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="parts-history-filters">
            <div className="filter-group">
              <label>Trạng thái:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="in_stock">Trong kho</option>
                <option value="assigned">Đã phân công</option>
                <option value="installed">Đã lắp đặt</option>
                <option value="replaced">Đã thay thế</option>
                <option value="defective">Lỗi</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Tìm kiếm:</label>
              <input
                type="text"
                placeholder="Serial, tên linh kiện..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Parts Table */}
          {filteredParts.length === 0 ? (
            <div className="no-parts-message">
              Không tìm thấy phụ tùng phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="parts-table-container">
              <div className="parts-table-wrapper">
                <table className="parts-table">
                  <thead>
                    <tr>
                      <th>Số Phụ tùng</th>
                      <th>Tên Phụ tùng</th>
                      <th>Danh mục</th>
                      <th>Số Serial</th>
                      <th>Ngày Gán</th>
                      <th>Trạng Thái</th>
                      <th>Vị Trí</th>
                      <th>Work Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParts.map((part, index) => (
                      <tr key={part.id || part.serialNumber || index}>
                        <td>{part.partNumber || 'N/A'}</td>
                        <td>{part.partName || 'N/A'}</td>
                        <td>{part.category || part.partType || 'N/A'}</td>
                        <td className="serial-number">{part.serialNumber || 'N/A'}</td>
                        <td>{formatDate(part.installedAt || part.assignedDate || part.createdAt)}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(part.status)}`}>
                            {getStatusLabel(part.status)}
                          </span>
                        </td>
                        <td>{getLocationLabel(part.location)}</td>
                        <td>{part.workOrderId || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="no-parts-message">
          <div className="no-data-icon">📦</div>
          <p>Chưa có linh kiện nào được gán cho xe này.</p>
        </div>
      )}
    </motion.div>
  );
};

export default PartsDetailPage;