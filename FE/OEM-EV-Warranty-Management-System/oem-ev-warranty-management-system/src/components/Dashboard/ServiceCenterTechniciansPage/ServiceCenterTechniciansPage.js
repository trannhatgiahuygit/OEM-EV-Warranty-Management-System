import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import './ServiceCenterTechniciansPage.css';

const ServiceCenterTechniciansPage = ({ handleBackClick }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const fetchTechnicians = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        
        // 🚨 API ENDPOINT CHANGE: Updated from /api/users to /api/users/technical
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users/technical`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.status === 200 && isMounted) {
          // 🧹 LOGIC REMOVAL: No longer need to filter by role, as the new API
          // only returns SC_TECHNICIANs.
          let fetchedTechnicians = response.data;
          // Sort by date (newest first) - use createdAt if available, otherwise use id as fallback
          fetchedTechnicians.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              const dateA = new Date(a.createdAt);
              const dateB = new Date(b.createdAt);
              return dateB - dateA; // Newest first (descending)
            }
            // Fallback to id if no createdAt field
            return b.id - a.id; // Higher id = newer (assuming auto-increment)
          });
          setTechnicians(fetchedTechnicians);
          toast.success('Đã tải danh sách kỹ thuật viên thành công!', { position: 'top-right' });
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Lỗi khi tải danh sách kỹ thuật viên.', { position: 'top-right' });
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
    fetchTechnicians();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="loading-message">Đang tải danh sách kỹ thuật viên...</div>;
  }

  if (technicians.length === 0) {
    return (
      <motion.div
        className="technician-page-wrapper"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="technician-page-header">
          <button onClick={handleBackClick} className="back-to-dashboard-button">
            ← Quay lại Bảng điều khiển
          </button>
          <h2 className="technician-page-title">Kỹ thuật viên Trung tâm Dịch vụ</h2>
        </div>
        <div className="loading-message">Không tìm thấy kỹ thuật viên nào.</div>
      </motion.div>
    );
  }

  const filteredTechnicians = filter === 'active'
    ? technicians.filter(tech => tech.active)
    : technicians;

  return (
    <motion.div
      className="technician-page-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="technician-page-header">
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h2 className="technician-page-title">Kỹ thuật viên Trung tâm Dịch vụ</h2>
        
        {/* NEW/MODIFIED: Moved filter buttons into a dedicated navigation bar */}
        <motion.div
          className="technician-function-nav" // NEW CSS CLASS
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            // Removed filter-buttons class, now using technician-function-nav button style
            className={filter === 'all' ? 'nav-active' : ''} // NEW CSS CLASS
            onClick={() => setFilter('all')}
          >
            Tất cả Kỹ thuật viên
          </button>
          <button
            className={filter === 'active' ? 'nav-active' : ''} // NEW CSS CLASS
            onClick={() => setFilter('active')}
          >
            Kỹ thuật viên Hoạt động
          </button>
        </motion.div>
      </div>
      
      {/* MODIFIED: Table container uses new class names */}
      <div className="technician-list-container">
        <div className="technician-table-wrapper">
          <table className="technician-list-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ và Tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredTechnicians.map(tech => (
                <tr key={tech.id}>
                  <td>{tech.id}</td>
                  <td>{tech.fullName}</td>
                  <td>{tech.email}</td>
                  <td>{tech.phone}</td>
                  <td>{tech.role}</td>
                  <td>
                    <span className={`status-badge ${tech.active ? 'status-active' : 'status-inactive'}`}>
                      {tech.active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCenterTechniciansPage;