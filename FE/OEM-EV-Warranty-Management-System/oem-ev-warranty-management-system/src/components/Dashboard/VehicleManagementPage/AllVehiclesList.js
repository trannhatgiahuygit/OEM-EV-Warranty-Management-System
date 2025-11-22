// AllVehiclesList.js

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import ServiceHistoryModal from '../ServiceHistoryModal/ServiceHistoryModal';
import VehicleDetailWithSerial from './VehicleDetailWithSerial';
import { classifyVehicle, getAllVehicleTypes, VEHICLE_TYPE_METADATA, normalizeVehicleTypeForAPI, getCategoryFromBackendApiType } from '../../../utils/vehicleClassification';
import { getCategoryByType } from '../../../constants/vehicleCategories';

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

  // Helper to normalize vehicleType for backend API
  // Uses centralized utility function from vehicleClassification
  const normalizeVehicleTypeFilter = (filterId) => {
    if (filterId === 'all') return null;
    return normalizeVehicleTypeForAPI(filterId);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        
        // When filter is 'all', fetch all vehicles including unclassified ones
        if (vehicleTypeFilter === 'all') {
          // Fetch all vehicles - try to get both classified and unclassified
          const baseUrl = `${process.env.REACT_APP_API_URL}/api/vehicles`;
          
          console.log('Fetching all vehicles (including unclassified):', { url: baseUrl });
          
          try {
            // First, fetch all vehicles (without filter)
            const allResponse = await axios.get(baseUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json; charset=utf-8'
              },
              responseType: 'json',
              responseEncoding: 'utf8'
            });
            
            // Log response for debugging encoding issues
            if (process.env.NODE_ENV === 'development') {
              console.log('Vehicles response:', {
                headers: allResponse.headers,
                contentType: allResponse.headers['content-type'],
                sampleData: allResponse.data?.[0]
              });
            }
            
            let allVehicles = allResponse.data || [];
            
            // Try to fetch unclassified vehicles separately if backend supports it
            // Some backends might need explicit request for null/UNKNOWN vehicleType
            try {
              const unclassifiedResponse = await axios.get(`${baseUrl}?vehicleType=UNKNOWN`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (unclassifiedResponse.status === 200 && unclassifiedResponse.data) {
                // Merge unclassified vehicles, avoiding duplicates
                const unclassifiedVehicles = unclassifiedResponse.data || [];
                const existingVins = new Set(allVehicles.map(v => v.vin));
                const newUnclassified = unclassifiedVehicles.filter(v => !existingVins.has(v.vin));
                allVehicles = [...allVehicles, ...newUnclassified];
              }
            } catch (unclassifiedError) {
              // If backend doesn't support UNKNOWN filter, that's okay
              // Backend should return all vehicles including unclassified when no filter is applied
              console.log('Backend may not support UNKNOWN filter, using all vehicles from main request');
            }
            
            if (isMounted) {
              setVehicles(allVehicles);
              toast.success('Đã tải danh sách xe thành công!', { position: 'top-right' });
            }
          } catch (error) {
            throw error; // Re-throw to be caught by outer catch
          }
        } else {
          // Build URL with vehicleType filter if selected
          let url = `${process.env.REACT_APP_API_URL}/api/vehicles`;
          const vehicleTypeParam = normalizeVehicleTypeFilter(vehicleTypeFilter);
          if (vehicleTypeParam) {
            url += `?vehicleType=${vehicleTypeParam}`;
          }
          
          console.log('Fetching vehicles with filter:', {
            filterId: vehicleTypeFilter,
            vehicleTypeParam: vehicleTypeParam,
            url: url
          });
          
          const response = await axios.get(url, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json; charset=utf-8'
            },
            responseType: 'json',
            responseEncoding: 'utf8'
          });
          
          // Log response for debugging encoding issues
          if (process.env.NODE_ENV === 'development') {
            console.log('Vehicles response (filtered):', {
              headers: response.headers,
              contentType: response.headers['content-type'],
              sampleData: response.data?.[0]
            });
          }
          if (response.status === 200 && isMounted) {
            toast.success('Đã tải danh sách xe thành công!', { position: 'top-right' });
            setVehicles(response.data);
          }
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
  }, [vehicleTypeFilter]); // Add vehicleTypeFilter as dependency

  // Memoized function to sort vehicles (no need to filter here since backend does it)
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

    // Backend already filters by vehicleType, so just return sorted list
    return sorted;
  }, [vehicles, sortOrder]);

  // REMOVED: Handler to toggle sorting - now in parent

  if (loading) {
    return <div className="loading-message">Đang tải danh sách xe...</div>;
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
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {vehicles.length === 0 ? (
          <div className="loading-message">Không tìm thấy xe nào.</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="loading-message">
            Không có xe nào khớp với bộ lọc &ldquo;{VEHICLE_TYPE_OPTIONS.find(option => option.id === vehicleTypeFilter)?.name || 'Đã chọn'}&rdquo;.
          </div>
        ) : (
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
                // Use vehicle.vehicleType from backend if available, otherwise use classifyVehicle
                let vehicleType;
                if (vehicle.vehicleType) {
                  // Backend returns API format (CAR, EBIKE, SCOOTER, MOTORBIKE, TRUCK)
                  // Map from backend API value to frontend category metadata
                  vehicleType = getCategoryFromBackendApiType(vehicle.vehicleType);
                  
                  // If mapping failed, try getCategoryByType as fallback (for other formats)
                  if (!vehicleType) {
                    const category = getCategoryByType(vehicle.vehicleType);
                    if (category) {
                      vehicleType = VEHICLE_TYPE_METADATA.byId[category.id];
                    }
                  }
                  
                  // Final fallback to classifyVehicle if still no match
                  if (!vehicleType) {
                    vehicleType = classifyVehicle(vehicle);
                  }
                } else {
                  // No vehicleType from backend, use classifyVehicle
                  vehicleType = classifyVehicle(vehicle);
                }
                
                return (
                  <tr key={vehicle.id}>
                    <td>{vehicle.vin}</td>
                    <td>{vehicle.model}</td>
                    <td>
                      <span className="vehicle-type-badge" style={{ backgroundColor: vehicleType.color }}>
                        {vehicleType.name}
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
        )}
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