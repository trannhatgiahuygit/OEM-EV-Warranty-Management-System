import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import RequiredIndicator from '../../common/RequiredIndicator';
import { formatPhoneInput, isValidPhoneNumber, PHONE_PATTERN, PHONE_LENGTH, PHONE_ERROR_MESSAGE } from '../../../utils/validation';
import './UserManagementPage.css';

const RegisterNewUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullname: '',
    phone: '',
    roleName: 'SC_STAFF', // Changed 'name' to 'roleName'
    serviceCenterId: ''
  });

  const [registeredUser, setRegisteredUser] = useState(null);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingServiceCenters, setLoadingServiceCenters] = useState(false);

  const roles = ['SC_STAFF', 'SC_TECHNICIAN', 'EVM_STAFF', 'ADMIN'];

  // Fetch service centers when component mounts
  useEffect(() => {
    const fetchServiceCenters = async () => {
      try {
        setLoadingServiceCenters(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/service-centers/active`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.status === 200) {
          setServiceCenters(response.data);
        }
      } catch (error) {
        console.error('Error fetching service centers:', error);
        toast.error('Không thể tải danh sách trung tâm dịch vụ', { position: 'top-right' });
      } finally {
        setLoadingServiceCenters(false);
      }
    };
    fetchServiceCenters();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? formatPhoneInput(value) : value;
    setFormData({ ...formData, [name]: nextValue });
    
    // Reset serviceCenterId when role changes to non-SC role
    if (name === 'roleName' && value !== 'SC_STAFF' && value !== 'SC_TECHNICIAN') {
      setFormData(prev => ({ ...prev, serviceCenterId: '' }));
    }
  };

  const handleCreateAnother = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullname: '',
      phone: '',
      roleName: 'SC_STAFF', // Changed 'name' to 'roleName'
      serviceCenterId: ''
    });
    setRegisteredUser(null);
  };

  // Check if serviceCenterId is required based on selected role
  const isServiceCenterRequired = formData.roleName === 'SC_STAFF' || formData.roleName === 'SC_TECHNICIAN';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate serviceCenterId for SC_STAFF and SC_TECHNICIAN
    if (isServiceCenterRequired && !formData.serviceCenterId) {
      toast.error('Vui lòng chọn Trung tâm Dịch vụ cho vai trò này', { position: 'top-right' });
      return;
    }

    if (!isValidPhoneNumber(formData.phone)) {
      toast.error(PHONE_ERROR_MESSAGE, { position: 'top-right' });
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // Prepare payload - only include serviceCenterId if it's provided
      const payload = {
        ...formData,
        serviceCenterId: formData.serviceCenterId ? parseInt(formData.serviceCenterId) : null
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/register`,
        payload,
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
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Lỗi khi đăng ký tài khoản mới.';
        toast.error(errorMessage, { position: 'top-right' });
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
            {registeredUser.serviceCenterId && (
              <p><strong>Trung tâm Dịch vụ ID:</strong> {registeredUser.serviceCenterId}</p>
            )}
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
        <div className="form-field">
          <label htmlFor="register-username" className="required-label">
            Tên đăng nhập
            <RequiredIndicator />
          </label>
          <input type="text" id="register-username" name="username" placeholder="Tên đăng nhập" value={formData.username} onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label htmlFor="register-email" className="required-label">
            Email
            <RequiredIndicator />
          </label>
          <input type="email" id="register-email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label htmlFor="register-password" className="required-label">
            Mật khẩu
            <RequiredIndicator />
          </label>
          <input type="password" id="register-password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label htmlFor="register-fullname" className="required-label">
            Họ và Tên
            <RequiredIndicator />
          </label>
          <input type="text" id="register-fullname" name="fullname" placeholder="Họ và Tên" value={formData.fullname} onChange={handleChange} required />
        </div>
        <div className="form-field">
          <label htmlFor="register-phone" className="required-label">
            Số điện thoại
            <RequiredIndicator />
          </label>
          <input
            type="tel"
            id="register-phone"
            name="phone"
            placeholder="Số điện thoại"
            value={formData.phone}
            onChange={handleChange}
            required
            inputMode="numeric"
            maxLength={PHONE_LENGTH}
            pattern={PHONE_PATTERN}
            title={PHONE_ERROR_MESSAGE}
          />
        </div>
        <div className="form-group">
          <label htmlFor="role-select">Chọn Vai trò:</label>
          <select id="role-select" name="roleName" value={formData.roleName} onChange={handleChange}>
            {roles.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        {isServiceCenterRequired && (
          <div className="form-group">
            <label htmlFor="service-center-select" className="required-label">
              Chọn Trung tâm Dịch vụ
              <RequiredIndicator />
            </label>
            {loadingServiceCenters ? (
              <div>Đang tải danh sách trung tâm dịch vụ...</div>
            ) : (
              <select 
                id="service-center-select" 
                name="serviceCenterId" 
                value={formData.serviceCenterId} 
                onChange={handleChange}
                required
              >
                <option value="">-- Chọn Trung tâm Dịch vụ --</option>
                {serviceCenters.map(sc => (
                  <option key={sc.id} value={sc.id}>
                    {sc.code} - {sc.name} {sc.isMainBranch ? '(Trung tâm chính)' : '(Chi nhánh)'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
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
  const [editingUserId, setEditingUserId] = useState(null);
  const [editData, setEditData] = useState({});
  const [serviceCenters, setServiceCenters] = useState([]);
  const [roles, setRoles] = useState([]);
  const [saving, setSaving] = useState(false);
  const isFirstRender = useRef(true);

  // Role name to ID mapping (based on data.sql)
  const roleNameToId = {
    'SC_STAFF': 1,
    'SC_TECHNICIAN': 2,
    'EVM_STAFF': 3,
    'ADMIN': 4
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const fetchData = async () => {
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const token = user.token;
          
          // Fetch users
          const usersResponse = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/users`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          // Fetch service centers
          const serviceCentersResponse = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/service-centers/active`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (usersResponse.status === 200) {
            let fetchedUsers = usersResponse.data;
            // Sort by date (newest first)
            fetchedUsers.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA; // Newest first (descending)
            });
            setUsers(fetchedUsers);
          }
          
          if (serviceCentersResponse.status === 200) {
            setServiceCenters(serviceCentersResponse.data);
          }
          
          // Set roles based on known role names
          setRoles(['SC_STAFF', 'SC_TECHNICIAN', 'EVM_STAFF', 'ADMIN']);
          
          toast.success('Đã tải danh sách người dùng thành công!', { position: 'top-right' });
        } catch (error) {
          if (error.response) {
            toast.error('Lỗi khi tải dữ liệu.', { position: 'top-right' });
          } else {
            toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
          }
        } finally {
          setLoading(false);
        }
      };
      fetchData();
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

  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setEditData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      serviceCenterId: user.serviceCenterId || '',
      active: user.active !== undefined ? user.active : true
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditData({});
  };

  const handleSaveEdit = async (userId) => {
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // Prepare update payload
      const updatePayload = {
        fullName: editData.fullName,
        email: editData.email,
        phone: editData.phone,
        roleId: roleNameToId[editData.role] || null,
        serviceCenterId: editData.serviceCenterId ? parseInt(editData.serviceCenterId) : null,
        active: editData.active
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/users/${userId}`,
        updatePayload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        // Update the user in the list
        setUsers(prevUsers =>
          prevUsers.map(u => u.id === userId ? response.data : u)
        );
        toast.success('Đã cập nhật thông tin người dùng thành công!', { position: 'top-right' });
        setEditingUserId(null);
        setEditData({});
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật người dùng.';
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setSaving(false);
    }
  };

  const handleEditFieldChange = (field, value) => {
    const nextValue = field === 'phone' ? formatPhoneInput(value) : value;
    setEditData(prev => ({
      ...prev,
      [field]: nextValue
    }));
    
    // Reset serviceCenterId if role changes to non-SC role
    if (field === 'role' && value !== 'SC_STAFF' && value !== 'SC_TECHNICIAN') {
      setEditData(prev => ({
        ...prev,
        serviceCenterId: ''
      }));
    }
  };

  const getServiceCenterName = (serviceCenterId) => {
    if (!serviceCenterId) return '-';
    const sc = serviceCenters.find(sc => sc.id === serviceCenterId);
    return sc ? `${sc.code} - ${sc.name}` : `ID: ${serviceCenterId}`;
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
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Trung tâm Dịch vụ</th>
              <th>Trạng thái</th>
              <th>Ngày Tạo</th>
              {!deactivateMode && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className={editingUserId === user.id ? 'editing-row' : ''}>
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
                <td>
                  {editingUserId === user.id ? (
                    <input
                      type="text"
                      value={editData.fullName}
                      onChange={(e) => handleEditFieldChange('fullName', e.target.value)}
                      className="inline-edit-input"
                    />
                  ) : (
                    user.fullName
                  )}
                </td>
                <td>
                  {editingUserId === user.id ? (
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleEditFieldChange('email', e.target.value)}
                      className="inline-edit-input"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td>
                  {editingUserId === user.id ? (
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => handleEditFieldChange('phone', e.target.value)}
                      className="inline-edit-input"
                      inputMode="numeric"
                      maxLength={PHONE_LENGTH}
                      pattern={PHONE_PATTERN}
                      title={PHONE_ERROR_MESSAGE}
                    />
                  ) : (
                    user.phone || '-'
                  )}
                </td>
                <td>
                  {editingUserId === user.id ? (
                    <select
                      value={editData.role}
                      onChange={(e) => handleEditFieldChange('role', e.target.value)}
                      className="inline-edit-select"
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td>
                  {editingUserId === user.id ? (
                    (editData.role === 'SC_STAFF' || editData.role === 'SC_TECHNICIAN') ? (
                      <select
                        value={editData.serviceCenterId || ''}
                        onChange={(e) => handleEditFieldChange('serviceCenterId', e.target.value)}
                        className="inline-edit-select"
                      >
                        <option value="">-- Chọn Trung tâm --</option>
                        {serviceCenters.map(sc => (
                          <option key={sc.id} value={sc.id}>
                            {sc.code} - {sc.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      '-'
                    )
                  ) : (
                    getServiceCenterName(user.serviceCenterId)
                  )}
                </td>
                <td>
                  {editingUserId === user.id ? (
                    <select
                      value={editData.active ? 'true' : 'false'}
                      onChange={(e) => handleEditFieldChange('active', e.target.value === 'true')}
                      className="inline-edit-select"
                    >
                      <option value="true">Hoạt động</option>
                      <option value="false">Không hoạt động</option>
                    </select>
                  ) : (
                    user.active ? 'Hoạt động' : 'Không hoạt động'
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                {!deactivateMode && (
                  <td>
                    {editingUserId === user.id ? (
                      <div className="inline-edit-actions">
                        <button
                          onClick={() => handleSaveEdit(user.id)}
                          disabled={saving}
                          className="save-btn"
                          title="Lưu"
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saving}
                          className="cancel-btn"
                          title="Hủy"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(user)}
                        className="edit-btn"
                        title="Chỉnh sửa"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </td>
                )}
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