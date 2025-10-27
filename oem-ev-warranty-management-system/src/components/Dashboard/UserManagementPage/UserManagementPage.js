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
        toast.success('User registered successfully!', { position: 'top-right' });
        setRegisteredUser(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Error registering new account.', { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
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
          <h3 className="success-message">User Registered Successfully!</h3>
          <div className="user-data">
            <h4>User Details:</h4>
            <p><strong>Username:</strong> {registeredUser.username}</p>
            <p><strong>Full Name:</strong> {registeredUser.fullname}</p>
            <p><strong>Role:</strong> {registeredUser.role}</p>
            <p><strong>Email:</strong> {registeredUser.email}</p>
          </div>
          <button onClick={handleCreateAnother} className="create-another-button">
            Register Another User
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
      <h3>Register New User</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input type="text" name="fullname" placeholder="Full Name" onChange={handleChange} required />
        <input type="text" name="phone" placeholder="Phone" onChange={handleChange} required />
        <div className="form-group">
          <label htmlFor="role-select">Select Role:</label>
          <select id="role-select" name="roleName" value={formData.roleName} onChange={handleChange}> {/* Changed 'name' to 'roleName' */}
            {roles.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <button type="submit">Register User</button>
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
            setUsers(response.data);
            toast.success('User list fetched successfully!', { position: 'top-right' });
          }
        } catch (error) {
          if (error.response) {
            toast.error('Error fetching list of user.', { position: 'top-right' });
          } else {
            toast.error('Network error. Please try again later.', { position: 'top-right' });
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
      toast.success('Accounts deactivated successfully!', { position: 'top-right' });
      setUsers(prevUsers =>
        prevUsers.map(user =>
          selectedUsers.includes(user.id) ? { ...user, active: false } : user
        )
      );

      setDeactivateMode(false);
      setSelectedUsers([]);
    } catch (error) {
      if (error.response) {
        toast.error('Error deactivating account.', { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
      }
    }
  };

  const handleCheckboxChange = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (loading) {
    return <div className="loading-message">Loading user list...</div>;
  }

  return (
    <motion.div
      className="user-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="user-table-header">
        <h3>All Users</h3>
        <div className="table-actions">
          {deactivateMode ? (
            <>
              <button className="confirm-btn" onClick={handleDeactivateClick}>Confirm Deactivate</button>
              <button className="cancel-btn" onClick={() => setDeactivateMode(false)}>Cancel</button>
            </>
          ) : (
            <button className="deactivate-btn" onClick={() => setDeactivateMode(true)}>Deactivate User</button>
          )}
        </div>
      </div>
      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              {deactivateMode && <th></th>}
              <th>ID</th>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created At</th>
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
                <td>{user.active ? 'Active' : 'Inactive'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
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
          ← Back to Dashboard
        </button>
        <h2 className="page-title">User Management</h2>
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
            All Users
          </button>
          <button
            onClick={() => setActiveFunction('register')}
            className={activeFunction === 'register' ? 'active' : ''}
          >
            Register New User
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