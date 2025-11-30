import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCar, FaUser, FaPhone, FaEnvelope, FaIdCard } from 'react-icons/fa';
import './RecallCampaignDetailPage.css';

const RecallCampaignDetailPage = ({ campaignId, onBackClick }) => {
  const [campaign, setCampaign] = useState(null);
  const [affectedVehicles, setAffectedVehicles] = useState([]);
  const [allAffectedVehicles, setAllAffectedVehicles] = useState([]); // For models tab
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState('info');
  const pageSize = 10;

  useEffect(() => {
    if (campaignId) {
      loadCampaignDetails();
      loadAffectedVehicles(0);
      loadAllAffectedVehicles();
    }
  }, [campaignId]);

  // Load all affected vehicles for models display (no pagination)
  const loadAllAffectedVehicles = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      // Load with large size to get all vehicles for models tab
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/recall-campaigns/${campaignId}/affected-vehicles?page=0&size=1000`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setAllAffectedVehicles(response.data.content || []);
      }
    } catch (error) {
      console.error('Failed to load all affected vehicles:', error);
    }
  };

  const loadCampaignDetails = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/recall-campaigns/${campaignId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setCampaign(response.data);
      }
    } catch (error) {
      console.error('Failed to load campaign details:', error);
      toast.error('Không thể tải thông tin chiến dịch.', { position: 'top-right' });
    }
  };

  const loadAffectedVehicles = async (page) => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/recall-campaigns/${campaignId}/affected-vehicles?page=${page}&size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setAffectedVehicles(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalElements(response.data.totalElements || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load affected vehicles:', error);
      toast.error('Không thể tải danh sách xe bị ảnh hưởng.', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (e) {
      return 'N/A';
    }
  };

  if (loading && !campaign) {
    return (
      <div className="recall-detail-page-wrapper">
        <div className="loading-message">Đang tải thông tin chiến dịch...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="recall-detail-page-wrapper">
        <div className="loading-message">Không tìm thấy thông tin chiến dịch.</div>
      </div>
    );
  }

  // Get unique customers from all affected vehicles
  const uniqueCustomers = allAffectedVehicles.reduce((acc, vehicle) => {
    if (vehicle.customerId && !acc.find(c => c.customerId === vehicle.customerId)) {
      acc.push({
        customerId: vehicle.customerId,
        customerName: vehicle.customerName,
        customerPhone: vehicle.customerPhone,
        customerEmail: vehicle.customerEmail,
        vehicleCount: allAffectedVehicles.filter(v => v.customerId === vehicle.customerId).length
      });
    }
    return acc;
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className="recall-detail-section">
            <div className="recall-detail-grid">
              <div className="detail-item">
                <span className="detail-label">Mã:</span>
                <span className="detail-value">{campaign.code}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tiêu đề:</span>
                <span className="detail-value">{campaign.title}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Trạng thái:</span>
                <span className={`status-badge status-${campaign.status?.toLowerCase()}`}>
                  {campaign.status?.toUpperCase()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Mức độ ưu tiên:</span>
                <span className="detail-value">{campaign.priority || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Giờ Sửa chữa Ước tính:</span>
                <span className="detail-value">
                  {campaign.estimatedRepairHours != null 
                    ? `${campaign.estimatedRepairHours} giờ` 
                    : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ngày tạo:</span>
                <span className="detail-value">{formatDate(campaign.createdAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ngày phát hành:</span>
                <span className="detail-value">{formatDate(campaign.releasedAt)}</span>
              </div>
            </div>
            {campaign.description && (
              <div className="detail-item-full">
                <span className="detail-label">Mô tả:</span>
                <p className="detail-value">{campaign.description}</p>
              </div>
            )}
            {campaign.actionRequired && (
              <div className="detail-item-full">
                <span className="detail-label">Hành động yêu cầu:</span>
                <p className="detail-value">{campaign.actionRequired}</p>
              </div>
            )}
          </div>
        );
      case 'models':
        return (
          <div className="recall-detail-section">
            {campaign.affectedModels && campaign.affectedModels.length > 0 ? (
              <div className="affected-models-grid">
                {campaign.affectedModels.map((model, index) => {
                  // Find vehicles for this model to get year info
                  const modelVehicles = allAffectedVehicles.filter(v => v.model === model);
                  const uniqueYears = [...new Set(modelVehicles.map(v => v.year).filter(Boolean))];
                  const vehicleCount = modelVehicles.length;
                  
                  return (
                    <div key={index} className="affected-model-card">
                      <div className="model-card-header">
                        <div className="model-card-icon">
                          <FaCar />
                        </div>
                        <div className="model-card-info">
                          <h3 className="model-card-name">{model}</h3>
                          <div className="model-card-meta">
                            <span className="model-vehicle-count">{vehicleCount} xe</span>
                            {uniqueYears.length > 0 && (
                              <span className="model-years">• {uniqueYears.sort((a, b) => b - a).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {campaign.affectedYears && campaign.affectedYears.length > 0 && (
                        <div className="model-card-years">
                          <span className="model-years-label">Năm sản xuất:</span>
                          <div className="model-years-badges">
                            {campaign.affectedYears
                              .filter(year => uniqueYears.includes(year))
                              .sort((a, b) => b - a)
                              .map((year, idx) => (
                                <span key={idx} className="year-badge">{year}</span>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-data">Không có mẫu xe nào được chỉ định</p>
            )}
          </div>
        );
      case 'customers':
        return (
          <div className="recall-detail-section">
            {loading ? (
              <div className="loading-message">Đang tải danh sách khách hàng...</div>
            ) : uniqueCustomers.length > 0 ? (
              <>
                <div className="customers-table-container">
                  <table className="customers-table">
                    <thead>
                      <tr>
                        <th>Tên Khách hàng</th>
                        <th>Số điện thoại</th>
                        <th>Email</th>
                        <th>Số lượng Xe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uniqueCustomers.map((customer) => (
                        <tr key={customer.customerId}>
                          <td>
                            <div className="customer-name-cell">
                              <FaUser className="customer-icon" />
                              {customer.customerName || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div className="customer-phone-cell">
                              <FaPhone className="customer-icon" />
                              {customer.customerPhone || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <div className="customer-email-cell">
                              <FaEnvelope className="customer-icon" />
                              {customer.customerEmail || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <span className="vehicle-count-badge">{customer.vehicleCount}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => loadAffectedVehicles(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="pagination-button"
                    >
                      Trước
                    </button>
                    <span className="pagination-info">
                      Trang {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => loadAffectedVehicles(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="pagination-button"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="no-data">Chưa có khách hàng nào bị ảnh hưởng</p>
            )}
          </div>
        );
      case 'vehicles':
        return (
          <div className="recall-detail-section">
            {loading ? (
              <div className="loading-message">Đang tải danh sách xe...</div>
            ) : affectedVehicles.length > 0 ? (
              <>
                <div className="vehicles-card-grid">
                  {affectedVehicles.map((vehicle) => (
                    <motion.div
                      key={vehicle.id}
                      className="vehicle-detail-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="vehicle-card-header">
                        <div className="vehicle-card-icon">
                          <FaCar />
                        </div>
                        <div className="vehicle-card-title">
                          <h4>{vehicle.model || 'N/A'}</h4>
                          <span className="vehicle-card-year">{vehicle.year || 'N/A'}</span>
                        </div>
                        <span className={`vehicle-status-badge ${vehicle.processed ? 'processed' : 'pending'}`}>
                          {vehicle.processed ? 'Đã xử lý' : 'Bị ảnh hưởng'}
                        </span>
                      </div>
                      <div className="vehicle-card-body">
                        <div className="vehicle-info-row">
                          <FaIdCard className="vehicle-info-icon" />
                          <div className="vehicle-info-content">
                            <span className="vehicle-info-label">VIN</span>
                            <span className="vehicle-info-value">{vehicle.vin || 'N/A'}</span>
                          </div>
                        </div>
                        {vehicle.customerName && (
                          <div className="vehicle-info-row">
                            <FaUser className="vehicle-info-icon" />
                            <div className="vehicle-info-content">
                              <span className="vehicle-info-label">Khách hàng</span>
                              <span className="vehicle-info-value">{vehicle.customerName}</span>
                            </div>
                          </div>
                        )}
                        {vehicle.customerPhone && (
                          <div className="vehicle-info-row">
                            <FaPhone className="vehicle-info-icon" />
                            <div className="vehicle-info-content">
                              <span className="vehicle-info-label">Điện thoại</span>
                              <span className="vehicle-info-value">{vehicle.customerPhone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => loadAffectedVehicles(currentPage - 1)}
                      disabled={currentPage === 0}
                      className="pagination-button"
                    >
                      Trước
                    </button>
                    <span className="pagination-info">
                      Trang {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => loadAffectedVehicles(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="pagination-button"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="no-data">Chưa có xe nào bị ảnh hưởng</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="recall-detail-page-wrapper">
      <div className="recall-detail-page-header">
        <button onClick={onBackClick} className="recall-detail-back-button">
          ← Quay lại Quản lý Thu hồi
        </button>
        <div className="recall-detail-header-content">
          <div className="recall-detail-header-left">
            <h2>Chi tiết Chiến dịch Thu hồi</h2>
            <span className="recall-detail-campaign-code">{campaign.code}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="recall-detail-tabs">
          <button
            className={`recall-detail-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Thông tin Chiến dịch
          </button>
          <button
            className={`recall-detail-tab ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => setActiveTab('models')}
          >
            Mẫu Xe Bị Ảnh Hưởng
          </button>
          <button
            className={`recall-detail-tab ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            Khách hàng ({totalElements})
          </button>
          <button
            className={`recall-detail-tab ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            Danh sách Xe
          </button>
        </div>
      </div>

      <div className="recall-detail-page-body">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default RecallCampaignDetailPage;