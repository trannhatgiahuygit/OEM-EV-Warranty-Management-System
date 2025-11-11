import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import './SCDashboardCards.css';
import { 
  FaClipboardList, 
  FaClock, 
  FaCalendarDay, 
  FaTools,
  FaExclamationTriangle,
  FaUserCheck,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch
} from 'react-icons/fa';

const SCDashboardCards = ({ userRole }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicianStatus, setTechnicianStatus] = useState({
    available: 0,
    total: 0,
    loading: true,
    error: null
  });
  const [technicians, setTechnicians] = useState([]);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'busy'

  useEffect(() => {
    // Fetch for SC_STAFF, ADMIN, and SC_TECHNICIAN (will handle 403 gracefully for SC_TECHNICIAN)
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
          setError('Không tìm thấy token xác thực.');
          setLoading(false);
          return;
        }

        const token = user.token;
        
        // Fetch dashboard summary
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/sc/dashboard/summary`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status === 200) {
          setDashboardData(response.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (err.response?.status === 403) {
          if (userRole === 'SC_TECHNICIAN') {
            setError('Kỹ thuật viên không có quyền truy cập dữ liệu dashboard của trung tâm dịch vụ.');
          } else {
            setError('Bạn không có quyền truy cập dữ liệu dashboard.');
          }
        } else if (err.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userRole]);

  // Fetch technician status for SC_STAFF
  useEffect(() => {
    if (userRole !== 'SC_STAFF') return;

    const fetchTechnicianStatus = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) return;

        const token = user.token;

        // Fetch available technicians
        const availableResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/technicians/available`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        // Fetch all technicians for total count
        const allResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/technicians`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const availableTechs = availableResponse.data || [];
        const allTechs = allResponse.data || [];

        // Get busy technicians (those not in available list)
        const availableIds = new Set(availableTechs.map(t => t.userId));
        const busyTechs = allTechs.filter(t => !availableIds.has(t.userId));

        // Combine and sort: available first, then busy
        const sortedTechs = [
          ...availableTechs.map(t => ({ ...t, isAvailable: true })),
          ...busyTechs.map(t => ({ ...t, isAvailable: false }))
        ];

        setTechnicians(sortedTechs);
        setTechnicianStatus({
          available: availableTechs.length,
          total: allTechs.length,
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Error fetching technician status:', err);
        setTechnicianStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Không thể tải trạng thái kỹ thuật viên'
        }));
      }
    };

    fetchTechnicianStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTechnicianStatus, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  if (loading) {
    return (
      <div className="sc-dashboard-cards-container">
        <div className="dashboard-cards-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sc-dashboard-cards-container">
        <div className="dashboard-cards-error">
          <FaExclamationTriangle className="error-icon" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const cards = [
    {
      id: 'active-claims',
      title: 'Yêu cầu Đang Hoạt động',
      value: dashboardData.totalActiveClaims || 0,
      icon: <FaClipboardList />,
      color: 'var(--glow1)',
      description: 'Tổng số yêu cầu đang mở hoặc đang xử lý'
    },
    {
      id: 'pending-claims',
      title: 'Yêu cầu Chờ Duyệt',
      value: dashboardData.pendingClaims || 0,
      icon: <FaClock />,
      color: 'var(--glow2)',
      description: 'Yêu cầu đang chờ phê duyệt từ EVM'
    },
    {
      id: 'today-appointments',
      title: 'Lịch Hẹn Hôm Nay',
      value: dashboardData.todayAppointments || 0,
      icon: <FaCalendarDay />,
      color: 'var(--glow3)',
      description: 'Số lượng cuộc hẹn được lên lịch cho hôm nay'
    },
    {
      id: 'active-workorders',
      title: 'Đơn Hàng Đang Xử Lý',
      value: dashboardData.activeWorkOrders || 0,
      icon: <FaTools />,
      color: 'var(--glow4)',
      description: 'Số lượng đơn hàng công việc đang được thực hiện'
    }
  ];

  // Add technician status card for SC_STAFF
  if (userRole === 'SC_STAFF') {
    const busyCount = technicianStatus.total - technicianStatus.available;
    cards.push({
      id: 'technician-status',
      title: 'Trạng thái Kỹ thuật viên',
      value: technicianStatus.loading 
        ? '...' 
        : technicianStatus.error 
        ? 'Lỗi' 
        : `${technicianStatus.available} sẵn sàng / ${busyCount} bận`,
      icon: <FaUserCheck />,
      color: technicianStatus.available > 0 ? '#4caf50' : '#f44336',
      description: technicianStatus.loading 
        ? 'Đang tải...' 
        : technicianStatus.error 
        ? technicianStatus.error 
        : technicianStatus.total > 0 
        ? `Tổng: ${technicianStatus.total} kỹ thuật viên`
        : 'Không có kỹ thuật viên nào',
      clickable: true
    });
  }

  const getWorkloadInfo = (tech) => {
    const workload = tech.currentWorkload || 0;
    const maxWorkload = tech.maxWorkload || 5;
    const percentage = maxWorkload > 0 ? Math.round((workload / maxWorkload) * 100) : 0;
    return { workload, maxWorkload, percentage };
  };

  const handleTechnicianCardClick = () => {
    if (userRole === 'SC_STAFF' && !technicianStatus.loading && !technicianStatus.error) {
      setShowTechnicianModal(true);
      // Reset filters when opening modal
      setSearchQuery('');
      setStatusFilter('all');
    }
  };

  // Filter and search technicians
  const getFilteredTechnicians = () => {
    let filtered = technicians;

    // Apply status filter
    if (statusFilter === 'available') {
      filtered = filtered.filter(t => t.isAvailable);
    } else if (statusFilter === 'busy') {
      filtered = filtered.filter(t => !t.isAvailable);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(tech => {
        const name = (tech.fullName || tech.username || `Technician #${tech.userId}`).toLowerCase();
        const specialization = (tech.specialization || '').toLowerCase();
        return name.includes(query) || specialization.includes(query);
      });
    }

    return filtered;
  };

  const filteredTechnicians = getFilteredTechnicians();
  const availableCount = filteredTechnicians.filter(t => t.isAvailable).length;
  const busyCount = filteredTechnicians.filter(t => !t.isAvailable).length;

  return (
    <div className="sc-dashboard-cards-container">
      <div className="dashboard-cards-header">
        <h2>Bảng Điều Khiển Trung Tâm Dịch Vụ</h2>
        <p>Tổng quan nhanh về hoạt động của trung tâm</p>
      </div>
      
      <div className="dashboard-cards-grid">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`dashboard-card ${card.id === 'technician-status' ? 'technician-status-card' : ''} ${card.clickable ? 'clickable-card' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={card.id === 'technician-status' && card.color ? {
              borderColor: technicianStatus.available > 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'
            } : {}}
            onClick={card.id === 'technician-status' ? handleTechnicianCardClick : undefined}
          >
            <div className="dashboard-card-content">
              <div className="dashboard-card-header">
                <span className="dashboard-card-title">{card.title}</span>
                <span 
                  className="dashboard-card-icon"
                  style={card.id === 'technician-status' && card.color ? { color: card.color } : {}}
                >
                  {card.icon}
                </span>
              </div>
              {card.id === 'technician-status' ? (
                <div className="technician-status-value-container">
                  {technicianStatus.loading ? (
                    <div className="dashboard-card-value">...</div>
                  ) : technicianStatus.error ? (
                    <div className="dashboard-card-value" style={{ color: '#f44336' }}>Lỗi</div>
                  ) : (
                    <>
                      <div className="technician-status-row">
                        <span className="technician-status-label">Sẵn sàng:</span>
                        <span className="technician-status-number available">{technicianStatus.available}</span>
                      </div>
                      <div className="technician-status-row">
                        <span className="technician-status-label">Bận:</span>
                        <span className="technician-status-number busy">{technicianStatus.total - technicianStatus.available}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div 
                  className="dashboard-card-value"
                  style={card.id === 'technician-status' && card.color ? { color: card.color } : {}}
                >
                  {card.value}
                </div>
              )}
              <p className="dashboard-card-description">{card.description}</p>
              {card.id === 'technician-status' && card.clickable && !technicianStatus.loading && !technicianStatus.error && (
                <p className="dashboard-card-hint" style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Nhấp để xem chi tiết
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Technician Details Modal */}
      <AnimatePresence>
        {showTechnicianModal && (
          <motion.div
            className="technician-modal-overlay"
            onClick={() => setShowTechnicianModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="technician-modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="technician-modal-header">
                <h2>Chi tiết Trạng thái Kỹ thuật viên</h2>
                <button 
                  className="technician-modal-close"
                  onClick={() => setShowTechnicianModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="technician-modal-body">
                {/* Summary Stats - Compact */}
                <div className="technician-summary-stats">
                  <div className="technician-stat-item">
                    <span className="technician-stat-label">Tổng số</span>
                    <span className="technician-stat-value">{filteredTechnicians.length}</span>
                  </div>
                  <div className="technician-stat-item available">
                    <span className="technician-stat-label">Sẵn sàng</span>
                    <span className="technician-stat-value">{availableCount}</span>
                  </div>
                  <div className="technician-stat-item busy">
                    <span className="technician-stat-label">Bận</span>
                    <span className="technician-stat-value">{busyCount}</span>
                  </div>
                </div>

                {/* Search and Filter Controls */}
                <div className="technician-controls">
                  <div className="technician-search-container">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      className="technician-search-input"
                      placeholder="Tìm kiếm theo tên hoặc chuyên môn..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="search-clear-btn"
                        onClick={() => setSearchQuery('')}
                        title="Xóa tìm kiếm"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  <div className="technician-filter-buttons">
                    <button
                      className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      Tất cả
                    </button>
                    <button
                      className={`filter-btn ${statusFilter === 'available' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('available')}
                    >
                      <FaCheckCircle style={{ marginRight: '0.25rem' }} />
                      Sẵn sàng
                    </button>
                    <button
                      className={`filter-btn ${statusFilter === 'busy' ? 'active' : ''}`}
                      onClick={() => setStatusFilter('busy')}
                    >
                      <FaTimesCircle style={{ marginRight: '0.25rem' }} />
                      Bận
                    </button>
                  </div>
                </div>

                {/* Technicians List - Unified */}
                {filteredTechnicians.length > 0 ? (
                  <div className="technician-list-container">
                    {filteredTechnicians.map((tech) => {
                      const workload = getWorkloadInfo(tech);
                      return (
                        <div key={tech.userId || tech.id} className={`technician-item ${tech.isAvailable ? 'available' : 'busy'}`}>
                          <div className="technician-item-main">
                            <div className="technician-name-row">
                              <span className="technician-status-indicator">
                                {tech.isAvailable ? <FaCheckCircle /> : <FaTimesCircle />}
                              </span>
                              <div className="technician-name">{tech.fullName || tech.username || `Technician #${tech.userId}`}</div>
                            </div>
                            {tech.specialization && (
                              <div className="technician-specialization">{tech.specialization}</div>
                            )}
                          </div>
                          <div className="technician-workload">
                            <div className="workload-bar-container">
                              <div className="workload-bar-bg">
                                <div 
                                  className={`workload-bar-fill ${workload.percentage >= 100 ? 'full' : workload.percentage >= 80 ? 'high' : ''}`}
                                  style={{ width: `${Math.min(workload.percentage, 100)}%` }}
                                />
                              </div>
                              <span className="workload-value">{workload.workload}/{workload.maxWorkload}</span>
                            </div>
                            <span className="workload-percentage">{workload.percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="technician-empty">
                    <p>
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Không tìm thấy kỹ thuật viên nào phù hợp' 
                        : 'Không có kỹ thuật viên nào'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SCDashboardCards;

