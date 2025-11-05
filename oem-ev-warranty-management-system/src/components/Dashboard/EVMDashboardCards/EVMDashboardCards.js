import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import './EVMDashboardCards.css';
import { 
  FaClock, 
  FaFolderOpen, 
  FaCog, 
  FaExclamationTriangle,
  FaBoxOpen
} from 'react-icons/fa';

const EVMDashboardCards = ({ userRole }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch for EVM_STAFF and ADMIN roles
    if (userRole !== 'EVM_STAFF' && userRole !== 'ADMIN') {
      setLoading(false);
      return;
    }

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
        
        // Fetch EVM dashboard summary
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/evm/dashboard/summary`,
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
        console.error('Error fetching EVM dashboard data:', err);
        if (err.response?.status === 403) {
          setError('Bạn không có quyền truy cập dữ liệu dashboard.');
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

  // Don't render for roles that don't have access
  if (userRole !== 'EVM_STAFF' && userRole !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="evm-dashboard-cards-container">
        <div className="evm-dashboard-cards-loading">
          <div className="evm-loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="evm-dashboard-cards-container">
        <div className="evm-dashboard-cards-error">
          <FaExclamationTriangle className="evm-error-icon" />
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
      id: 'pending-approvals',
      title: 'Yêu cầu Chờ Duyệt',
      value: dashboardData.pendingApprovals || 0,
      icon: <FaClock />,
      description: 'Số lượng yêu cầu đang chờ phê duyệt từ EVM'
    },
    {
      id: 'open-claims',
      title: 'Yêu cầu Đang Mở',
      value: dashboardData.openClaims || 0,
      icon: <FaFolderOpen />,
      description: 'Tổng số yêu cầu đang ở trạng thái mở'
    },
    {
      id: 'in-progress-claims',
      title: 'Yêu cầu Đang Xử Lý',
      value: dashboardData.inProgressClaims || 0,
      icon: <FaCog />,
      description: 'Số lượng yêu cầu đang được xử lý'
    },
    {
      id: 'low-stock-items',
      title: 'Mặt Hàng Tồn Kho Thấp',
      value: dashboardData.lowStockItems || 0,
      icon: <FaBoxOpen />,
      description: 'Số lượng mặt hàng có tồn kho thấp cần bổ sung'
    }
  ];

  return (
    <div className="evm-dashboard-cards-container">
      <div className="evm-dashboard-cards-header">
        <h2>Bảng Điều Khiển EVM</h2>
        <p>Tổng quan nhanh về hoạt động quản lý bảo hành</p>
      </div>
      
      <div className="evm-dashboard-cards-grid">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="evm-dashboard-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="evm-dashboard-card-content">
              <div className="evm-dashboard-card-header">
                <span className="evm-dashboard-card-title">{card.title}</span>
                <span className="evm-dashboard-card-icon">{card.icon}</span>
              </div>
              <div className="evm-dashboard-card-value">{card.value}</div>
              <p className="evm-dashboard-card-description">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EVMDashboardCards;

