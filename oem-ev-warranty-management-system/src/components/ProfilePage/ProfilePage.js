import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaUserTag, FaCalendarAlt, FaToggleOn, FaEdit, FaSave, FaTimes, FaLock, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import './ProfilePage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Helper function to format ROLE_NAME to Role Name
const formatRole = (role) => {
  if (!role) return 'N/A';
  return role.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
};

// Helper function to format ISO date string
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [editData, setEditData] = useState({ fullName: '', email: '', phone: '' });
    // NEW STATE: Password management
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    
    const [loading, setLoading] = useState(true);
    const [isEditingProfile, setIsEditingProfile] = useState(false); // Renamed state
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false }); // State for password visibility
    const navigate = useNavigate();

    const getToken = () => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        return storedUser ? storedUser.token : null;
    }

    const fetchProfile = async () => {
        const token = getToken();
        if (!token) {
            toast.error('Authentication required to view your profile.');
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 200) {
                const fetchedUser = response.data;
                setUser(fetchedUser);
                setEditData({
                    fullName: fetchedUser.fullName || '',
                    email: fetchedUser.email || '',
                    phone: fetchedUser.phone || '',
                });
            } else {
                toast.error('Failed to load profile data.');
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            const message = error.response?.data?.message || 'Session expired or network error. Please log in again.';
            toast.error(message);
            localStorage.removeItem('user');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [navigate]);

    // --- Profile Editing Handlers ---
    const handleEditToggle = () => {
        setIsEditingProfile(true);
    };

    const handleCancelEdit = () => {
        setIsEditingProfile(false);
        // Reset editData back to the original user state
        if (user) {
            setEditData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
            });
        }
    };

    const handleChangeProfile = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = getToken();

        if (!token) {
            toast.error('Not authorized.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            const response = await axios.put(`${API_URL}/api/users/profile`, editData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                toast.success('Profile updated successfully! 🎉');
                const updatedUser = response.data;
                setUser(updatedUser); // Update the displayed user state
                setIsEditingProfile(false); // Exit edit mode
            }
        } catch (error) {
            console.error('Profile update error:', error);
            const message = error.response?.data?.message || 'Failed to update profile. Please check your inputs.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    // --- Password Editing Handlers ---
    const handleChangePasswordInput = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleTogglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            toast.error('New password and confirmation do not match.');
            return;
        }

        setLoading(true);
        const token = getToken();

        if (!token) {
            toast.error('Not authorized.');
            setLoading(false);
            navigate('/login');
            return;
        }

        try {
            // Destructure only the fields required by the API
            const { currentPassword, newPassword } = passwordData;
            
            const response = await axios.put(`${API_URL}/api/users/profile`, {
                currentPassword,
                newPassword,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                toast.success('Password updated successfully! Logging out for security.');
                // Clear password fields and log out user for security
                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                localStorage.removeItem('user');
                navigate('/login');
            }
        } catch (error) {
            console.error('Password change error:', error);
            const message = error.response?.data?.message || 'Failed to change password. Check your current password.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <div className="profile-page-wrapper">
                <div className="hero-bg"><div className="animated-grid" /><div className="gradient-bg" /></div>
                <div className="profile-container" style={{ textAlign: 'center', marginTop: '150px', fontSize: '1.2rem' }}>
                    Loading Profile Data...
                </div>
            </div>
        );
    }

    if (!user) {
        return <div className="profile-container">Unable to display user data.</div>;
    }

    const { fullName, username, email, phone, role, active, createdAt } = user;

    const userDataFields = [
        { 
            icon: FaUser, 
            label: 'Full Name', 
            name: 'fullName', 
            value: isEditingProfile ? editData.fullName : fullName,
            type: 'text'
        },
        { 
            icon: FaEnvelope, 
            label: 'Email', 
            name: 'email', 
            value: isEditingProfile ? editData.email : email,
            type: 'email'
        },
        { 
            icon: FaPhone, 
            label: 'Phone', 
            name: 'phone', 
            value: isEditingProfile ? editData.phone : phone,
            type: 'text'
        },
    ];
    
    const systemInfoFields = [
        { icon: FaUserTag, label: 'Role', value: formatRole(role) },
        { icon: FaCalendarAlt, label: 'Member Since', value: formatDate(createdAt) },
        { 
            icon: FaToggleOn, 
            label: 'Account Status', 
            value: active ? 'Active' : 'Inactive',
            className: active ? 'status-active' : 'status-inactive'
        },
    ];

    return (
        <div className="profile-page-wrapper">
            <div className="hero-bg">
                <div className="animated-grid" />
                <div className="gradient-bg" />
            </div>
            
            <motion.div 
                className="profile-container section-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2>User Profile: {username}</h2>
                <p className="profile-subtitle">Your personal and system details within the OEM EV Warranty Management System.</p>

                <div className="profile-grid">
                    
                    {/* 1. Personal Information Card */}
                    <motion.div 
                        className="profile-card info-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h3>Personal Information</h3>
                        <form onSubmit={handleSaveProfile} className="sub-form">
                            <div className="details-list">
                                {/* Username (Read-only) */}
                                <div className="detail-item">
                                    <FaUser className="detail-icon" />
                                    <div className="detail-content">
                                        <div className="detail-label">Username (Read-only)</div>
                                        <div className="detail-value">{username}</div>
                                    </div>
                                </div>
                                
                                {/* Editable Fields */}
                                {userDataFields.map((field) => (
                                    <div key={field.name} className={`detail-item ${isEditingProfile ? 'editing' : ''}`}>
                                        <field.icon className="detail-icon" />
                                        <div className="detail-content">
                                            <div className="detail-label">{field.label}</div>
                                            {isEditingProfile ? (
                                                <div className="input-wrapper">
                                                    <input
                                                        type={field.type}
                                                        name={field.name}
                                                        value={field.value}
                                                        onChange={handleChangeProfile}
                                                        className="profile-input"
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="detail-value">{field.value || 'N/A'}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Action Buttons for Profile Edit */}
                            {isEditingProfile ? (
                                <div className="edit-actions">
                                    <button 
                                        type="submit" 
                                        className="btn-save" 
                                        disabled={loading}
                                    >
                                        <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-cancel" 
                                        onClick={handleCancelEdit}
                                        disabled={loading}
                                    >
                                        <FaTimes /> Cancel
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button"
                                    className="btn-edit" 
                                    onClick={handleEditToggle}
                                    disabled={loading}
                                >
                                    <FaEdit /> Edit Profile
                                </button>
                            )}
                        </form>
                    </motion.div>

                    {/* 2. System Details Card */}
                    <motion.div 
                        className="profile-card system-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <h3>System Details</h3>
                        <div className="details-list">
                            {systemInfoFields.map((field, index) => (
                                <div key={`system-${index}`} className="detail-item">
                                    <field.icon className="detail-icon" />
                                    <div className="detail-content">
                                        <div className="detail-label">{field.label}</div>
                                        <div className={`detail-value ${field.className || ''}`}>{field.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    
                    {/* 3. Change Password Card */}
                    <motion.div 
                        className="profile-card password-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <h3>Change Password</h3>
                        <form onSubmit={handleSavePassword} className="sub-form">
                            <div className="details-list">
                                {/* Current Password */}
                                <div className="detail-item">
                                    <FaLock className="detail-icon" />
                                    <div className="detail-content">
                                        <div className="detail-label">Current Password</div>
                                        <div className="input-wrapper password-input-wrapper">
                                            <input
                                                type={showPasswords.current ? 'text' : 'password'}
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handleChangePasswordInput}
                                                className="profile-input"
                                                required
                                                disabled={loading}
                                            />
                                            <span 
                                                className="password-toggle-icon"
                                                onClick={() => handleTogglePasswordVisibility('current')}
                                            >
                                                {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* New Password */}
                                <div className="detail-item">
                                    <FaKey className="detail-icon" />
                                    <div className="detail-content">
                                        <div className="detail-label">New Password</div>
                                        <div className="input-wrapper password-input-wrapper">
                                            <input
                                                type={showPasswords.new ? 'text' : 'password'}
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handleChangePasswordInput}
                                                className="profile-input"
                                                required
                                                disabled={loading}
                                            />
                                            <span 
                                                className="password-toggle-icon"
                                                onClick={() => handleTogglePasswordVisibility('new')}
                                            >
                                                {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Confirm New Password */}
                                <div className="detail-item">
                                    <FaKey className="detail-icon" />
                                    <div className="detail-content">
                                        <div className="detail-label">Confirm New Password</div>
                                        <div className="input-wrapper password-input-wrapper">
                                            <input
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                name="confirmNewPassword"
                                                value={passwordData.confirmNewPassword}
                                                onChange={handleChangePasswordInput}
                                                className="profile-input"
                                                required
                                                disabled={loading}
                                            />
                                            <span 
                                                className="password-toggle-icon"
                                                onClick={() => handleTogglePasswordVisibility('confirm')}
                                            >
                                                {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button for Password Change */}
                            <button 
                                type="submit" 
                                className="btn-password-save" 
                                disabled={loading || passwordData.newPassword !== passwordData.confirmNewPassword || !passwordData.currentPassword || !passwordData.newPassword}
                            >
                                <FaLock /> {loading ? 'Updating...' : 'Set New Password'}
                            </button>
                        </form>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;