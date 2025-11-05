import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import './UserManagementPage.css';

const RegisterNewUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullname: '',
    phone: '',
    roleName: 'SC_STAFF' // Changed 'name' to 'roleName'
  });

  const [registeredUser, setRegisteredUser] = useState(null);

  const roles = ['SC_STAFF', 'SC_TECHNICIAN', 'EVM_STAFF', 'ADMIN'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateAnother = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullname: '',
      phone: '',
      roleName: 'SC_STAFF' // Changed 'name' to 'roleName'
    });
    setRegisteredUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        formData, // This object now contains 'roleName'
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 201) {
        toast.success('Đã đăng ký người dùng thành công!', { position: 'top-right' });
        setRegisteredUser(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Lỗi khi đăng ký tài khoản mới.', { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
    }
  };

  if (registeredUser) {
    return (
      <motion.div
        className="form-container confirmation-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="confirmation-content">
          <FaCheckCircle className="success-icon" />
          <h3 className="success-message">Đã Đăng ký Người dùng Thành công!</h3>
          <div className="user-data">
            <h4>Chi tiết Người dùng:</h4>
            <p><strong>Tên đăng nhập:</strong> {registeredUser.username}</p>
            <p><strong>Họ và Tên:</strong> {registeredUser.fullname}</p>
            <p><strong>Vai trò:</strong> {registeredUser.role}</p>
            <p><strong>Email:</strong> {registeredUser.email}</p>
          </div>
          <button onClick={handleCreateAnother} className="create-another-button">
            Đăng ký Người dùng Khác
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Đăng ký Người dùng Mới</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Tên đăng nhập" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Mật khẩu" onChange={handleChange} required />
        <input type="text" name="fullname" placeholder="Họ và Tên" onChange={handleChange} required />
        <input type="text" name="phone" placeholder="Số điện thoại" onChange={handleChange} required />
        <div className="form-group">
          <label htmlFor="role-select">Chọn Vai trò:</label>
          <select id="role-select" name="roleName" value={formData.roleName} onChange={handleChange}> {/* Changed 'name' to 'roleName' */}
            {roles.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <button type="submit">Đăng ký Người dùng</button>
      </form>
    </motion.div>
  );
};

const ViewAllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deactivateMode, setDeactivateMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const fetchUsers = async () => {
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const token = user.token;
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/users`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (response.status === 200) {
            let fetchedUsers = response.data;
            // Sort by date (newest first)
            fetchedUsers.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA; // Newest first (descending)
            });
            setUsers(fetchedUsers);
            toast.success('Đã tải danh sách người dùng thành công!', { position: 'top-right' });
          }
        } catch (error) {
          if (error.response) {
            toast.error('Lỗi khi tải danh sách người dùng.', { position: 'top-right' });
          } else {
            toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, []);

  const handleDeactivateClick = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      for (const userId of selectedUsers) {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/users/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }
      toast.success('Đã vô hiệu hóa tài khoản thành công!', { position: 'top-right' });
      setUsers(prevUsers =>
        prevUsers.map(user =>
          selectedUsers.includes(user.id) ? { ...user, active: false } : user
        )
      );

      setDeactivateMode(false);
      setSelectedUsers([]);
    } catch (error) {
      if (error.response) {
        toast.error('Lỗi khi vô hiệu hóa tài khoản.', { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
    }
  };

  const handleCheckboxChange = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return <div className="loading-message">Đang tải danh sách người dùng...</div>;
  }

  return (
    <motion.div
      className="user-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="user-table-header">
        <h3>Tất cả Người dùng</h3>
        <div className="table-actions">
          {deactivateMode ? (
            <>
              <button className="confirm-btn" onClick={handleDeactivateClick}>Xác nhận Vô hiệu hóa</button>
              <button className="cancel-btn" onClick={() => setDeactivateMode(false)}>Hủy</button>
            </>
          ) : (
            <button className="deactivate-btn" onClick={() => setDeactivateMode(true)}>Vô hiệu hóa Người dùng</button>
          )}
        </div>
      </div>
      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              {deactivateMode && <th></th>}
              <th>ID</th>
              <th>Tên đăng nhập</th>
              <th>Họ và Tên</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày Tạo</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                {deactivateMode && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleCheckboxChange(user.id)}
                    />
                  </td>
                )}
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.fullName}</td>
                <td>{user.role}</td>
                <td>{user.active ? 'Hoạt động' : 'Không hoạt động'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

const UserManagementPage = ({ handleBackClick }) => {
  const [activeFunction, setActiveFunction] = useState('viewAll');

  const renderActiveFunction = () => {
    switch (activeFunction) {
      case 'register':
        return <RegisterNewUser />;
      case 'viewAll':
        return <ViewAllUsers />;
      default:
        return null;
    }
  };

  return (
    <div className="user-management-page-wrapper">
      <div className="user-management-page-header">
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h2 className="page-title">Quản lý Người dùng</h2>
        <motion.div
          className="function-nav-bar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => setActiveFunction('viewAll')}
            className={activeFunction === 'viewAll' ? 'active' : ''}
          >
            Tất cả Người dùng
          </button>
          <button
            onClick={() => setActiveFunction('register')}
            className={activeFunction === 'register' ? 'active' : ''}
          >
            Đăng ký Người dùng Mới
          </button>
        </motion.div>
      </div>
      <div className="user-management-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default UserManagementPage;