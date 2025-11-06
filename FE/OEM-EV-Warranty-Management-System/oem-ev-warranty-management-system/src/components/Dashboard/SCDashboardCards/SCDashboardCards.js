import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import './SCDashboardCards.css';
import { 
  FaClipboardList, 
  FaClock, 
  FaCalendarDay, 
  FaTools,
  FaExclamationTriangle
} from 'react-icons/fa';

const SCDashboardCards = ({ userRole }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            className="dashboard-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="dashboard-card-content">
              <div className="dashboard-card-header">
                <span className="dashboard-card-title">{card.title}</span>
                <span className="dashboard-card-icon">{card.icon}</span>
              </div>
              <div className="dashboard-card-value">{card.value}</div>
              <p className="dashboard-card-description">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SCDashboardCards;

