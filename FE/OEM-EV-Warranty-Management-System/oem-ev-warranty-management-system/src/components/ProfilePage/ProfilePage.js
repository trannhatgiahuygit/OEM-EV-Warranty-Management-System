import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaUserTag, FaCalendarAlt, FaToggleOn, FaEdit, FaSave, FaTimes, FaLock, FaKey, FaEye, FaEyeSlash, FaBuilding } from 'react-icons/fa';
import RequiredIndicator from '../common/RequiredIndicator';
import { formatPhoneInput, isValidPhoneNumber, PHONE_PATTERN, PHONE_LENGTH, PHONE_ERROR_MESSAGE } from '../../utils/validation';
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
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' });
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
    const [serviceCenter, setServiceCenter] = useState(null); // Service center information
    const navigate = useNavigate();

    const getToken = () => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        return storedUser ? storedUser.token : null;
    }

    const fetchProfile = async () => {
        const token = getToken();
        if (!token) {
            toast.error('Yêu cầu xác thực để xem hồ sơ của bạn.');
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
                    phone: formatPhoneInput(fetchedUser.phone || ''),
                });
                
                // Fetch service center information if serviceCenterId exists
                if (fetchedUser.serviceCenterId) {
                    fetchServiceCenter(fetchedUser.serviceCenterId);
                }
            } else {
                toast.error('Không thể tải dữ liệu hồ sơ.');
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            const message = error.response?.data?.message || 'Phiên đăng nhập đã hết hạn hoặc lỗi mạng. Vui lòng đăng nhập lại.';
            toast.error(message);
            localStorage.removeItem('user');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchServiceCenter = async (serviceCenterId) => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await axios.get(`${API_URL}/api/service-centers/${serviceCenterId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.status === 200) {
                setServiceCenter(response.data);
            }
        } catch (error) {
            console.error('Error fetching service center:', error);
            // Don't show error toast as this is optional information
        }
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                phone: formatPhoneInput(user.phone || ''),
            });
        }
    };

    const handleChangeProfile = (e) => {
        const { name, value } = e.target;
        const nextValue = name === 'phone' ? formatPhoneInput(value) : value;
        setEditData(prev => ({ ...prev, [name]: nextValue }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = getToken();

        if (!token) {
            toast.error('Không được phép.');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (editData.phone && !isValidPhoneNumber(editData.phone)) {
            toast.error(PHONE_ERROR_MESSAGE);
            setLoading(false);
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
                toast.success('Hồ sơ đã được cập nhật thành công! 🎉');
                const updatedUser = response.data;
                setUser(updatedUser); // Update the displayed user state
                setIsEditingProfile(false); // Exit edit mode
            }
        } catch (error) {
            console.error('Profile update error:', error);
            const message = error.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng kiểm tra thông tin đầu vào.';
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
            toast.error('Mật khẩu mới và xác nhận không khớp.');
            return;
        }

        setLoading(true);
        const token = getToken();

        if (!token) {
            toast.error('Không được phép.');
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
                toast.success('Mật khẩu đã được cập nhật thành công! Đang đăng xuất để bảo mật.');
                // Clear password fields and log out user for security
                setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                localStorage.removeItem('user');
                navigate('/login');
            }
        } catch (error) {
            console.error('Password change error:', error);
            const message = error.response?.data?.message || 'Không thể thay đổi mật khẩu. Kiểm tra mật khẩu hiện tại của bạn.';
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
                    Đang tải Dữ liệu Hồ sơ...
                </div>
            </div>
        );
    }

    if (!user) {
        return <div className="profile-container">Không thể hiển thị dữ liệu người dùng.</div>;
    }

    const { fullName, username, email, phone, role, active, createdAt, serviceCenterId } = user;

    const userDataFields = [
        { 
            icon: FaUser, 
            label: 'Họ và Tên', 
            name: 'fullName', 
            value: isEditingProfile ? editData.fullName : fullName,
            type: 'text',
            required: true
        },
        { 
            icon: FaEnvelope, 
            label: 'Email', 
            name: 'email', 
            value: isEditingProfile ? editData.email : email,
            type: 'email',
            required: true
        },
        { 
            icon: FaPhone, 
            label: 'Số điện thoại', 
            name: 'phone', 
            value: isEditingProfile ? editData.phone : phone,
            type: 'tel',
            required: true,
            inputProps: {
                inputMode: 'numeric',
                maxLength: PHONE_LENGTH,
                pattern: PHONE_PATTERN,
                title: PHONE_ERROR_MESSAGE
            }
        },
    ];
    
    // Build system info fields - conditionally include service center
    const systemInfoFields = [
        { icon: FaUserTag, label: 'Vai trò', value: formatRole(role) },
        { icon: FaCalendarAlt, label: 'Thành viên từ', value: formatDate(createdAt) },
        { 
            icon: FaToggleOn, 
            label: 'Trạng thái Tài khoản', 
            value: active ? 'Hoạt động' : 'Không hoạt động',
            className: active ? 'status-active' : 'status-inactive'
        },
    ];

    // Add service center information if available
    if (serviceCenterId) {
        const serviceCenterValue = serviceCenter 
            ? `${serviceCenter.code} - ${serviceCenter.name}${serviceCenter.isMainBranch ? ' (Trung tâm chính)' : ' (Chi nhánh)'}`
            : `ID: ${serviceCenterId}`;
        
        systemInfoFields.push({
            icon: FaBuilding,
            label: 'Trung tâm Dịch vụ',
            value: serviceCenterValue
        });
    }

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
                <h2>Hồ sơ Người dùng: {username}</h2>
                <p className="profile-subtitle">Thông tin cá nhân và hệ thống của bạn trong Hệ thống Quản lý Bảo hành Xe Điện OEM.</p>

                <div className="profile-grid">
                    
                    {/* 1. Personal Information Card */}
                    <motion.div 
                        className="profile-card info-card"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h3>Thông tin Cá nhân</h3>
                        <form onSubmit={handleSaveProfile} className="sub-form">
                            <div className="details-list">
                                {/* Username (Read-only) */}
                                <div className="detail-item">
                                    <FaUser className="detail-icon" />
                                    <div className="detail-content">
                                        <div className="detail-label">Tên đăng nhập (Chỉ đọc)</div>
                                        <div className="detail-value">{username}</div>
                                    </div>
                                </div>
                                
                                {/* Editable Fields */}
                                {userDataFields.map((field) => (
                                    <div key={field.name} className={`detail-item ${isEditingProfile ? 'editing' : ''}`}>
                                        <field.icon className="detail-icon" />
                                        <div className="detail-content">
                                        <div className="detail-label">
                                            {field.label}
                                            {field.required && <RequiredIndicator />}
                                        </div>
                                            {isEditingProfile ? (
                                                <div className="input-wrapper">
                                                    <input
                                                        type={field.type}
                                                        name={field.name}
                                                        value={field.value}
                                                        onChange={handleChangeProfile}
                                                        className="profile-input"
                                                    required={field.required}
                                                        disabled={loading}
                                                    {...(field.inputProps || {})}
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
                                        <FaSave /> {loading ? 'Đang lưu...' : 'Lưu Thay đổi'}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-cancel" 
                                        onClick={handleCancelEdit}
                                        disabled={loading}
                                    >
                                        <FaTimes /> Hủy
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button"
                                    className="btn-edit" 
                                    onClick={handleEditToggle}
                                    disabled={loading}
                                >
                                    <FaEdit /> Chỉnh sửa Hồ sơ
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
                        <h3>Chi tiết Hệ thống</h3>
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
                        <h3>Thay đổi Mật khẩu</h3>
                        <form onSubmit={handleSavePassword} className="sub-form">
                            <div className="details-list">
                                {/* Current Password */}
                                <div className="detail-item">
                                    <FaLock className="detail-icon" />
                                    <div className="detail-content">
                                        <div className="detail-label">Mật khẩu Hiện tại</div>
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
                                        <div className="detail-label">Mật khẩu Mới</div>
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
                                        <div className="detail-label">Xác nhận Mật khẩu Mới</div>
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
                                <FaLock /> {loading ? 'Đang cập nhật...' : 'Đặt Mật khẩu Mới'}
                            </button>
                        </form>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;