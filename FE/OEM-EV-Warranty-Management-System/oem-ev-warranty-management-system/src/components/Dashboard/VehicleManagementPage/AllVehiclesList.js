// AllVehiclesList.js

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import ServiceHistoryModal from '../ServiceHistoryModal/ServiceHistoryModal';
import VehicleDetailWithSerial from './VehicleDetailWithSerial';
import { classifyVehicle, getAllVehicleTypes } from '../../../utils/vehicleClassification';

const VEHICLE_TYPE_OPTIONS = [
  {
    id: 'all',
    name: 'Tất cả loại xe',
    icon: '🌀'
  },
  ...getAllVehicleTypes()
];

// --- Vehicle Status Badge Component ---
const VehicleStatusBadge = ({ status }) => {
  // Normalize status to lowercase and handle spaces/underscores
  const normalizedStatus = status ? status.toLowerCase().replace(/\s+/g, '_') : '';
  const badgeClass = `vehicle-status-badge ${normalizedStatus}`;
  return <span className={badgeClass}>{status}</span>;
};

// MODIFIED: Accept sortOrder and toggleSortOrder as props
const AllVehiclesList = ({ onPartsDetailClick, sortOrder, toggleSortOrder }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceHistory, setShowServiceHistory] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [selectedVehicleVin, setSelectedVehicleVin] = useState(null);
  const [showSerialHistory, setShowSerialHistory] = useState(false);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
  // REMOVED: const [sortOrder, setSortOrder] = useState('desc'); 
  // REMOVED: Sort state is now in VehicleManagementPage.js

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/vehicles`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.status === 200 && isMounted) {
          toast.success('Đã tải danh sách xe thành công!', { position: 'top-right' });
          setVehicles(response.data);
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Lỗi khi tải danh sách tất cả xe.', { position: 'top-right' });
          } else {
            toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized function to sort vehicles
  const filteredVehicles = useMemo(() => {
    const sorted = [...vehicles].sort((a, b) => {
      if (a.id < b.id) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (a.id > b.id) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    if (vehicleTypeFilter === 'all') {
      return sorted;
    }

    return sorted.filter((vehicle) => classifyVehicle(vehicle).id === vehicleTypeFilter);
  }, [vehicles, sortOrder, vehicleTypeFilter]);

  // REMOVED: Handler to toggle sorting - now in parent

  if (loading) {
    return <div className="loading-message">Đang tải danh sách xe...</div>;
  }

  if (vehicles.length === 0) {
    return <div className="loading-message">Không tìm thấy xe nào.</div>;
  }

  if (filteredVehicles.length === 0) {
    return (
      <div className="loading-message">
        Không có xe nào khớp với bộ lọc &ldquo;{VEHICLE_TYPE_OPTIONS.find(option => option.id === vehicleTypeFilter)?.name || 'Đã chọn'}&rdquo;.
      </div>
    );
  }

  return (
    <motion.div
      className="vehicle-list-content-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="vehicle-table-container">
        <div className="vehicle-table-controls">
          <div className="vehicle-type-filter">
            <label htmlFor="vehicleTypeFilter">Lọc theo loại xe</label>
            <select
              id="vehicleTypeFilter"
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
            >
              {VEHICLE_TYPE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.icon ? `${option.icon} ${option.name}` : option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="vehicle-table-wrapper">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>Số VIN</th>
                <th>Mẫu xe</th>
                <th>Loại xe</th>
                <th>Năm</th>
                <th>Khách hàng</th>
                <th>Trạng thái Bảo hành</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {/* MODIFIED: Use filteredVehicles for rendering */}
              {filteredVehicles.map((vehicle) => {
                const vehicleType = classifyVehicle(vehicle);
                return (
                  <tr key={vehicle.id}>
                    <td>{vehicle.vin}</td>
                    <td>{vehicle.model}</td>
                    <td>
                      <span className="vehicle-type-badge" style={{ backgroundColor: vehicleType.color }}>
                        {vehicleType.icon} {vehicleType.name}
                      </span>
                    </td>
                    <td>{vehicle.year}</td>
                    <td>{vehicle.customer?.name || 'N/A'}</td>
                    <td>
                      <VehicleStatusBadge status={vehicle.warrantyStatus} />
                    </td>
                    <td>
                      <div className="vehicle-action-buttons">
                        <button
                          onClick={() => onPartsDetailClick(vehicle)}
                          className="avl-parts-detail-btn"
                        >
                          Chi tiết Phụ tùng
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVehicleId(vehicle.id);
                            setSelectedVehicleVin(vehicle.vin);
                            setShowServiceHistory(true);
                          }}
                          className="view-service-history-button"
                        >
                          Lịch sử Dịch vụ
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVehicleId(vehicle.id);
                            setSelectedVehicleVin(vehicle.vin);
                            setShowSerialHistory(true);
                          }}
                          className="view-serial-history-button"
                        >
                          Lịch sử Serial
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {showServiceHistory && selectedVehicleId && (
        <ServiceHistoryModal
          isOpen={showServiceHistory}
          onClose={() => {
            setShowServiceHistory(false);
            setSelectedVehicleId(null);
            setSelectedVehicleVin(null);
          }}
          type="vehicle"
          id={selectedVehicleId}
          title={`Lịch sử Dịch vụ - VIN: ${selectedVehicleVin}`}
        />
      )}

      {showSerialHistory && selectedVehicleId && (
        <VehicleDetailWithSerial
          vehicleId={selectedVehicleId}
          onClose={() => {
            setShowSerialHistory(false);
            setSelectedVehicleId(null);
            setSelectedVehicleVin(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default AllVehiclesList;