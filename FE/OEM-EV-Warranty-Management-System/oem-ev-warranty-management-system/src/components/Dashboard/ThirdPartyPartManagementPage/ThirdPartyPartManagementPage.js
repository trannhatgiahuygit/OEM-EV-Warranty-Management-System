import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaPlus, FaKey, FaEdit, FaBan, FaCheck, FaTimes, FaUndo } from 'react-icons/fa';
import RequiredIndicator from '../../common/RequiredIndicator';
import './ThirdPartyPartManagementPage.css';

// Component to display the list of third-party parts - Memoized to prevent unnecessary rerenders
const ThirdPartyPartsTable = React.memo(({ parts, loading, onEdit, onDelete, onDeactivate, onManageSerials, canEdit, canManageSerials }) => {
    if (loading) {
        return <div className="third-party-part-message">Đang tải danh sách phụ tùng...</div>;
    }

    if (parts.length === 0) {
        return <div className="third-party-part-message">Không tìm thấy phụ tùng nào.</div>;
    }

    return (
        <motion.div
            className="third-party-part-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="third-party-part-table-wrapper">
                <table className="third-party-part-list-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Mã Phụ tùng</th>
                            <th>Tên</th>
                            <th>Danh mục</th>
                            <th>Nhà cung cấp</th>
                            <th>Số lượng</th>
                            <th>Giá đơn vị</th>
                            <th>Giá theo vùng</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parts.map((part) => {
                            // Determine which regional price to show based on user role
                            let displayPrice = null;
                            let priceLabel = '';
                            if (part.northPrice || part.southPrice || part.centralPrice) {
                                if (part.northPrice) {
                                    displayPrice = part.northPrice;
                                    priceLabel = 'Bắc';
                                } else if (part.southPrice) {
                                    displayPrice = part.southPrice;
                                    priceLabel = 'Nam';
                                } else if (part.centralPrice) {
                                    displayPrice = part.centralPrice;
                                    priceLabel = 'Trung';
                                }
                            } else {
                                displayPrice = part.unitCost;
                            }
                            
                            return (
                                <tr key={part.id}>
                                    <td>{part.id}</td>
                                    <td>{part.partNumber || 'N/A'}</td>
                                    <td>{part.name || 'N/A'}</td>
                                    <td>{part.category || 'N/A'}</td>
                                    <td>{part.supplier || 'N/A'}</td>
                                    <td>{part.quantity !== undefined ? part.quantity : 'N/A'}</td>
                                    <td>{part.unitCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(part.unitCost) : 'N/A'}</td>
                                    <td>
                                        {displayPrice ? (
                                            <span>
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(displayPrice)}
                                                {priceLabel && <span className="price-region-label"> ({priceLabel})</span>}
                                            </span>
                                        ) : 'N/A'}
                                    </td>
                                    <td>
                                        <span className={`third-party-part-status ${part.active ? 'active' : 'inactive'}`}>
                                            {part.active ? 'Hoạt động' : 'Không hoạt động'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="third-party-part-action-buttons">
                                            {canManageSerials && (
                                                <button
                                                    onClick={() => onManageSerials(part)}
                                                    className="third-party-part-serial-button"
                                                    title="Quản lý Serial"
                                                >
                                                    <FaKey />
                                                </button>
                                            )}
                                            {canEdit && (
                                                <>
                                                    <button
                                                        onClick={() => onEdit(part)}
                                                        className="third-party-part-edit-button"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    {part.active && (
                                                        <button
                                                            onClick={() => onDeactivate && onDeactivate(part.id)}
                                                            className="third-party-part-deactivate-button"
                                                            title="Vô hiệu hóa"
                                                        >
                                                            <FaBan />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {!canManageSerials && !canEdit && (
                                                <span className="third-party-part-view-only">Chỉ xem</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
});

// Component for creating/editing a third-party part
const ThirdPartyPartForm = ({ part, serviceCenterId, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        partNumber: '',
        name: '',
        category: '',
        description: '',
        supplier: '',
        unitCost: '',
        quantity: 0,
        northPrice: '',
        southPrice: '',
        centralPrice: '',
        serviceCenterId: serviceCenterId || '',
        active: true
    });

    useEffect(() => {
        if (part) {
            setFormData({
                partNumber: part.partNumber || '',
                name: part.name || '',
                category: part.category || '',
                description: part.description || '',
                supplier: part.supplier || '',
                unitCost: part.unitCost || '',
                quantity: part.quantity !== undefined ? part.quantity : 0,
                northPrice: part.northPrice || '',
                southPrice: part.southPrice || '',
                centralPrice: part.centralPrice || '',
                serviceCenterId: part.serviceCenterId || serviceCenterId || '',
                active: part.active !== undefined ? part.active : true
            });
        } else {
            setFormData({
                partNumber: '',
                name: '',
                category: '',
                description: '',
                supplier: '',
                unitCost: '',
                quantity: 0,
                northPrice: '',
                southPrice: '',
                centralPrice: '',
                serviceCenterId: serviceCenterId || '',
                active: true
            });
        }
    }, [part, serviceCenterId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...formData,
            unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
            quantity: formData.quantity ? parseInt(formData.quantity) : 0,
            northPrice: formData.northPrice ? parseFloat(formData.northPrice) : null,
            southPrice: formData.southPrice ? parseFloat(formData.southPrice) : null,
            centralPrice: formData.centralPrice ? parseFloat(formData.centralPrice) : null,
            serviceCenterId: parseInt(formData.serviceCenterId)
        };
        onSave(submitData);
    };

    return (
        <motion.div
            className="third-party-part-form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <form onSubmit={handleSubmit} className="third-party-part-form">
                <h3>{part ? 'Chỉnh sửa Phụ tùng Bên thứ ba' : 'Tạo Phụ tùng Bên thứ ba Mới'}</h3>
                
                <div className="third-party-part-form-group">
                    <label className="required-label">
                        Mã Phụ tùng
                        <RequiredIndicator />
                    </label>
                    <input
                        type="text"
                        name="partNumber"
                        value={formData.partNumber}
                        onChange={handleChange}
                        required
                        disabled={!!part}
                        className="third-party-part-form-input"
                        placeholder="Nhập mã phụ tùng"
                    />
                </div>

                <div className="third-party-part-form-group">
                    <label className="required-label">
                        Tên Phụ tùng
                        <RequiredIndicator />
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="third-party-part-form-input"
                        placeholder="Nhập tên phụ tùng"
                    />
                </div>

                <div className="third-party-part-form-row">
                    <div className="third-party-part-form-group">
                        <label>
                            Danh mục
                        </label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="third-party-part-form-input"
                            placeholder="Nhập danh mục"
                        />
                    </div>

                    <div className="third-party-part-form-group">
                        <label>
                            Nhà cung cấp
                        </label>
                        <input
                            type="text"
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            className="third-party-part-form-input"
                            placeholder="Nhập tên nhà cung cấp"
                        />
                    </div>
                </div>

                <div className="third-party-part-form-group">
                    <label>
                        Mô tả
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="third-party-part-form-textarea"
                        placeholder="Nhập mô tả phụ tùng"
                        rows="3"
                    />
                </div>

                <div className="third-party-part-form-row">
                    <div className="third-party-part-form-group">
                        <label>
                            Giá đơn vị (VND) - Giá cơ sở
                        </label>
                        <input
                            type="number"
                            name="unitCost"
                            value={formData.unitCost}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            className="third-party-part-form-input"
                            placeholder="Nhập giá đơn vị"
                        />
                        <small>Giá này sẽ được dùng nếu không nhập giá theo vùng</small>
                    </div>

                    <div className="third-party-part-form-group">
                        <label className="required-label">
                            Số lượng
                            <RequiredIndicator />
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="0"
                            step="1"
                            inputMode="numeric"
                            required
                            className="third-party-part-form-input"
                            placeholder="Nhập số lượng"
                        />
                    </div>
                </div>

                <div className="third-party-part-form-group">
                    <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                        Giá theo vùng (VND) - Tùy chọn
                    </label>
                    <div className="third-party-part-form-row">
                        <div className="third-party-part-form-group">
                            <label>
                                Giá Miền Bắc
                            </label>
                            <input
                                type="number"
                                name="northPrice"
                                value={formData.northPrice}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="third-party-part-form-input"
                                placeholder="Giá cho miền Bắc"
                            />
                        </div>
                        <div className="third-party-part-form-group">
                            <label>
                                Giá Miền Nam
                            </label>
                            <input
                                type="number"
                                name="southPrice"
                                value={formData.southPrice}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="third-party-part-form-input"
                                placeholder="Giá cho miền Nam"
                            />
                        </div>
                        <div className="third-party-part-form-group">
                            <label>
                                Giá Miền Trung
                            </label>
                            <input
                                type="number"
                                name="centralPrice"
                                value={formData.centralPrice}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="third-party-part-form-input"
                                placeholder="Giá cho miền Trung"
                            />
                        </div>
                    </div>
                    <small>Nếu không nhập, hệ thống sẽ dùng giá đơn vị cho tất cả các vùng</small>
                </div>

                <div className="third-party-part-form-group">
                    <label className="required-label">
                        ID Trung tâm Dịch vụ
                        <RequiredIndicator />
                    </label>
                    <input
                        type="number"
                        name="serviceCenterId"
                        value={formData.serviceCenterId}
                        onChange={handleChange}
                        required
                        min="1"
                        step="1"
                        inputMode="numeric"
                        className="third-party-part-form-input"
                        placeholder="Nhập ID trung tâm dịch vụ"
                    />
                </div>

                <div className="third-party-part-form-group">
                    <label className="third-party-part-checkbox-label">
                        <input
                            type="checkbox"
                            name="active"
                            checked={formData.active}
                            onChange={handleChange}
                            className="third-party-part-checkbox"
                        />
                        <span>Hoạt động</span>
                    </label>
                </div>

                <div className="third-party-part-form-actions">
                    <button type="submit" className="third-party-part-submit-button" disabled={loading}>
                        {loading ? 'Đang lưu...' : (part ? 'Cập nhật' : 'Tạo mới')}
                    </button>
                    <button type="button" onClick={onCancel} className="third-party-part-cancel-button">
                        Hủy
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// Component for managing serials
const SerialManagementModal = ({ part, onClose, onAddSerial, onUpdateSerial, onDeactivateSerial, onActivateSerial, onRefresh, getAuthHeaders }) => {
    const [serialNumber, setSerialNumber] = useState('');
    const [allSerials, setAllSerials] = useState([]);
    const [loadingSerials, setLoadingSerials] = useState(false);
    const [editingSerialId, setEditingSerialId] = useState(null);
    const [editingSerialNumber, setEditingSerialNumber] = useState('');

    // Fetch all serials when modal opens
    useEffect(() => {
        fetchAllSerials();
    }, [part]);

    const fetchAllSerials = async () => {
        if (!part || !part.id) return;
        setLoadingSerials(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/third-party-parts/${part.id}/serials`, {
                headers: getAuthHeaders()
            });
            setAllSerials(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách serial');
        } finally {
            setLoadingSerials(false);
        }
    };

    const handleAddSerial = async () => {
        if (!serialNumber.trim()) {
            toast.warning('Vui lòng nhập số serial');
            return;
        }
        try {
            await onAddSerial(part.id, serialNumber.trim());
            setSerialNumber('');
            await fetchAllSerials();
            if (onRefresh) onRefresh();
        } catch (err) {
            // Error handling is done in parent
        }
    };

    const handleStartEdit = (serial) => {
        setEditingSerialId(serial.id);
        setEditingSerialNumber(serial.serialNumber);
    };

    const handleCancelEdit = () => {
        setEditingSerialId(null);
        setEditingSerialNumber('');
    };

    const handleSaveEdit = async (serialId) => {
        if (!editingSerialNumber.trim()) {
            toast.warning('Vui lòng nhập số serial');
            return;
        }
        try {
            await onUpdateSerial(serialId, editingSerialNumber.trim());
            setEditingSerialId(null);
            setEditingSerialNumber('');
            await fetchAllSerials();
            if (onRefresh) onRefresh();
        } catch (err) {
            // Error handling is done in parent
        }
    };

    const handleDeactivate = async (serialId) => {
        if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa serial này?')) {
            return;
        }
        try {
            await onDeactivateSerial(serialId);
            await fetchAllSerials();
            if (onRefresh) onRefresh();
        } catch (err) {
            // Error handling is done in parent
        }
    };

    const handleActivate = async (serialId) => {
        if (!window.confirm('Bạn có chắc chắn muốn kích hoạt serial này?')) {
            return;
        }
        try {
            await onActivateSerial(serialId);
            await fetchAllSerials();
            if (onRefresh) onRefresh();
        } catch (err) {
            // Error handling is done in parent
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'AVAILABLE':
                return 'Có sẵn';
            case 'RESERVED':
                return 'Đã đặt trước';
            case 'DEACTIVATED':
                return 'Đã vô hiệu hóa';
            case 'USED':
                return 'Đã dùng';
            default:
                return status;
        }
    };

    const availableCount = allSerials.filter(s => s.status === 'AVAILABLE').length;
    const deactivatedCount = allSerials.filter(s => s.status === 'DEACTIVATED').length;
    const usedCount = allSerials.filter(s => s.status === 'USED').length;

    return (
        <div className="third-party-part-modal-overlay" onClick={onClose}>
            <motion.div
                className="third-party-part-modal-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="third-party-part-modal-header">
                    <h3>Quản lý Serial - {part.name}</h3>
                    <button onClick={onClose} className="third-party-part-modal-close">×</button>
                </div>

                <div className="third-party-part-modal-body">
                    <div className="third-party-part-serial-add-section">
                        <h4>Thêm Serial Mới</h4>
                        <div className="third-party-part-serial-input-group">
                            <input
                                type="text"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                placeholder="Nhập số serial"
                                className="third-party-part-serial-input"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSerial()}
                            />
                            <button
                                onClick={handleAddSerial}
                                className="third-party-part-serial-add-button"
                                disabled={loadingSerials}
                            >
                                <FaPlus /> Thêm
                            </button>
                        </div>
                    </div>

                    <div className="third-party-part-serial-stats">
                        <span>Tổng: {allSerials.length}</span>
                        <span className="status-available">Có sẵn: {availableCount}</span>
                        <span className="status-deactivated">Vô hiệu hóa: {deactivatedCount}</span>
                        <span className="status-used">Đã dùng: {usedCount}</span>
                    </div>

                    <div className="third-party-part-serial-list-section">
                        <h4>Danh sách Serial ({allSerials.length})</h4>
                        {loadingSerials ? (
                            <div className="third-party-part-message">Đang tải...</div>
                        ) : allSerials.length === 0 ? (
                            <div className="third-party-part-message">Không có serial nào.</div>
                        ) : (
                            <div className="third-party-part-serial-list">
                                {allSerials.map((serial) => (
                                    <div key={serial.id} className="third-party-part-serial-item">
                                        {editingSerialId === serial.id ? (
                                            <div className="third-party-part-serial-edit-mode">
                                                <input
                                                    type="text"
                                                    value={editingSerialNumber}
                                                    onChange={(e) => setEditingSerialNumber(e.target.value)}
                                                    className="third-party-part-serial-edit-input"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') handleSaveEdit(serial.id);
                                                        if (e.key === 'Escape') handleCancelEdit();
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleSaveEdit(serial.id)}
                                                    className="third-party-part-serial-action-btn save-btn"
                                                    title="Lưu"
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="third-party-part-serial-action-btn cancel-btn"
                                                    title="Hủy"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="third-party-part-serial-info">
                                                    <span className="third-party-part-serial-number">{serial.serialNumber}</span>
                                                    <span className={`third-party-part-serial-status ${serial.status?.toLowerCase()}`}>
                                                        {getStatusLabel(serial.status)}
                                                    </span>
                                                </div>
                                                <div className="third-party-part-serial-actions">
                                                    {serial.status !== 'USED' && (
                                                        <button
                                                            onClick={() => handleStartEdit(serial)}
                                                            className="third-party-part-serial-action-btn edit-btn"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                    )}
                                                    {serial.status === 'AVAILABLE' && (
                                                        <button
                                                            onClick={() => handleDeactivate(serial.id)}
                                                            className="third-party-part-serial-action-btn deactivate-btn"
                                                            title="Vô hiệu hóa"
                                                        >
                                                            <FaBan />
                                                        </button>
                                                    )}
                                                    {serial.status === 'DEACTIVATED' && (
                                                        <button
                                                            onClick={() => handleActivate(serial.id)}
                                                            className="third-party-part-serial-action-btn activate-btn"
                                                            title="Kích hoạt"
                                                        >
                                                            <FaUndo />
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const ThirdPartyPartManagementPage = ({ handleBackClick }) => {
    const [parts, setParts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [serviceCenterId, setServiceCenterId] = useState('');
    const [editingPart, setEditingPart] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedPartForSerials, setSelectedPartForSerials] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userServiceCenterId, setUserServiceCenterId] = useState(null);
    
    // State for Service Center Search
    const [serviceCenters, setServiceCenters] = useState([]);
    const [scSearchQuery, setScSearchQuery] = useState('');
    const [scSearchResults, setScSearchResults] = useState([]);
    const [showScResults, setShowScResults] = useState(false);
    
    // Get user role and service center ID on mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            if (user.role) {
                setUserRole(user.role);
            }
            if (user.serviceCenterId) {
                setUserServiceCenterId(user.serviceCenterId);
            }
        }
    }, []);

    // Check if user can edit - ONLY ADMIN can create/edit/deactivate
    const canEdit = () => {
        return userRole === 'ADMIN';
    };

    // Check if user can manage serials - All roles (SC_STAFF, SC_TECHNICIAN, ADMIN) can manage serials
    const canManageSerials = () => {
        if (userRole === 'ADMIN') {
            return true;
        }
        if (userRole === 'SC_STAFF' || userRole === 'SC_TECHNICIAN') {
            return userServiceCenterId && serviceCenterId && 
                   String(userServiceCenterId) === String(serviceCenterId);
        }
        return false;
    };

    // Helper to get auth headers
    const getAuthHeaders = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } : {};
    };

    // Fetch service centers for search
    useEffect(() => {
        const fetchServiceCenters = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/service-centers`, {
                    headers: getAuthHeaders()
                });
                const centers = Array.isArray(res.data) ? res.data : (res.data.content || []);
                setServiceCenters(centers);
                setScSearchResults(centers);
            } catch (err) {
                console.error('Error fetching service centers:', err);
            }
        };
        fetchServiceCenters();
    }, []);

    // Perform service center search
    const performSCSearch = (query) => {
        const queryLower = query.toLowerCase();
        if (queryLower.length < 1) return serviceCenters;

        return serviceCenters.filter(center => 
            center.name?.toLowerCase().includes(queryLower) ||
            String(center.id).includes(queryLower) ||
            center.code?.toLowerCase().includes(queryLower) ||
            center.location?.toLowerCase().includes(queryLower)
        );
    };

    // Handle service center search query change
    const handleSCQueryChange = (e) => {
        const value = e.target.value;
        setScSearchQuery(value);
        
        // Update search results
        const results = performSCSearch(value);
        setScSearchResults(results);
        setShowScResults(true);

        // Clear selection if user is typing something different
        if (value !== getSelectedSCDisplay()) {
            setServiceCenterId('');
            setParts([]);
        }
    };

    // Handle service center selection
    const handleSCSelect = (center) => {
        setServiceCenterId(String(center.id));
        setScSearchQuery(center.name);
        setShowScResults(false);
        fetchParts(center.id);
    };

    // Get display text for selected service center
    const getSelectedSCDisplay = () => {
        if (!serviceCenterId) return '';
        const selectedCenter = serviceCenters.find(c => String(c.id) === serviceCenterId);
        return selectedCenter ? selectedCenter.name : '';
    };

    // Initialize search query when service center is selected
    useEffect(() => {
        if (serviceCenterId && serviceCenters.length > 0) {
            const selectedCenter = serviceCenters.find(c => String(c.id) === serviceCenterId);
            if (selectedCenter && scSearchQuery !== selectedCenter.name) {
                setScSearchQuery(selectedCenter.name);
            }
        } else if (!serviceCenterId) {
            setScSearchQuery('');
        }
    }, [serviceCenterId, serviceCenters]);

    // Fetch parts by service center
    const fetchParts = async (scId, showToast = true) => {
        if (!scId) {
            setParts([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/third-party-parts/service-center/${scId}`, {
                headers: getAuthHeaders()
            });
            let fetchedParts = res.data;
            fetchedParts.sort((a, b) => (b.id || 0) - (a.id || 0));
            setParts(fetchedParts);
            if (showToast) {
                toast.success('Đã tải danh sách phụ tùng thành công!');
            }
        } catch (err) {
            console.error(err);
            if (showToast) {
                toast.error('Lỗi khi tải danh sách phụ tùng');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle service center ID change (kept for backward compatibility, but not used directly)
    // Now using handleSCSelect instead

    // Handle create part
    const handleCreatePart = async (formData) => {
        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/third-party-parts`, formData, {
                headers: getAuthHeaders()
            });
            toast.success('Đã tạo phụ tùng thành công!');
            setShowForm(false);
            setEditingPart(null);
            if (serviceCenterId) {
                fetchParts(serviceCenterId, false);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi tạo phụ tùng';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle update part
    const handleUpdatePart = async (formData) => {
        if (!editingPart || !editingPart.id) {
            toast.error('Chưa chọn phụ tùng để chỉnh sửa');
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/third-party-parts/${editingPart.id}`, formData, {
                headers: getAuthHeaders()
            });
            toast.success('Đã cập nhật phụ tùng thành công!');
            setShowForm(false);
            setEditingPart(null);
            if (serviceCenterId) {
                fetchParts(serviceCenterId, false);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật phụ tùng';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle delete part
    const handleDeletePart = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa phụ tùng này?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/third-party-parts/${id}`, {
                headers: getAuthHeaders()
            });
            toast.success('Đã xóa phụ tùng thành công!');
            if (serviceCenterId) {
                fetchParts(serviceCenterId, false);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi xóa phụ tùng';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle deactivate part
    const handleDeactivatePart = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa phụ tùng này?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/third-party-parts/${id}/deactivate`, {}, {
                headers: getAuthHeaders()
            });
            toast.success('Đã vô hiệu hóa phụ tùng thành công!');
            if (serviceCenterId) {
                fetchParts(serviceCenterId, false);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi vô hiệu hóa phụ tùng';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle edit part
    const handleEditPart = (part) => {
        setEditingPart(part);
        setShowForm(true);
    };

    // Handle manage serials
    const handleManageSerials = (part) => {
        setSelectedPartForSerials(part);
    };

    // Handle add serial
    const handleAddSerial = async (partId, serialNumber) => {
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/third-party-parts/${partId}/serials?serialNumber=${encodeURIComponent(serialNumber)}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );
            toast.success('Đã thêm serial thành công!');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi thêm serial';
            toast.error(errorMessage);
            throw err; // Re-throw to let modal handle it
        }
    };

    // Handle update serial
    const handleUpdateSerial = async (serialId, newSerialNumber) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/third-party-parts/serials/${serialId}?serialNumber=${encodeURIComponent(newSerialNumber)}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );
            toast.success('Đã cập nhật serial thành công!');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật serial';
            toast.error(errorMessage);
            throw err; // Re-throw to let modal handle it
        }
    };

    // Handle deactivate serial
    const handleDeactivateSerial = async (serialId) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/third-party-parts/serials/${serialId}/deactivate`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );
            toast.success('Đã vô hiệu hóa serial thành công!');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi vô hiệu hóa serial';
            toast.error(errorMessage);
            throw err; // Re-throw to let modal handle it
        }
    };

    // Handle activate serial
    const handleActivateSerial = async (serialId) => {
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/third-party-parts/serials/${serialId}/activate`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );
            toast.success('Đã kích hoạt serial thành công!');
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi kích hoạt serial';
            toast.error(errorMessage);
            throw err; // Re-throw to let modal handle it
        }
    };

    // Refresh table data
    const refreshTableData = () => {
        if (serviceCenterId) {
            fetchParts(serviceCenterId, false);
        }
    };

    // Handle close serial modal
    const handleCloseSerialModal = () => {
        setSelectedPartForSerials(null);
    };

    return (
        <div className="third-party-part-page-wrapper">
            {/* Header Card */}
            <div className="third-party-part-page-header">
                <button onClick={handleBackClick} className="third-party-part-back-to-dashboard-button">
                    ← Quay lại Bảng điều khiển
                </button>
                <h2 className="third-party-part-page-title">Quản lý Phụ tùng Bên thứ ba</h2>

                {/* Service Center Selector with Search */}
                <div className="third-party-part-service-center-selector">
                    <label className="required-label">
                        ID Trung tâm Dịch vụ
                        <RequiredIndicator />
                    </label>
                    <div className="vm-customer-search-container">
                        <input
                            type="text"
                            placeholder="Tìm kiếm trung tâm dịch vụ theo ID, tên, mã hoặc địa điểm..."
                            value={scSearchQuery}
                            onChange={handleSCQueryChange}
                            onFocus={() => {
                                if (serviceCenters.length > 0) {
                                    setScSearchResults(performSCSearch(scSearchQuery));
                                    setShowScResults(true);
                                }
                            }}
                            onBlur={() => setTimeout(() => setShowScResults(false), 200)}
                            required
                            autoComplete="off"
                            className="third-party-part-service-center-input"
                        />
                        {showScResults && (
                            <div className="vm-search-results">
                                {scSearchResults.length > 0 ? (
                                    scSearchResults.map((center) => (
                                        <div
                                            key={center.id}
                                            className="vm-search-result-item"
                                            onMouseDown={(e) => { e.preventDefault(); handleSCSelect(center); }}
                                        >
                                            <p><strong>{center.name}</strong> (ID: {center.id})</p>
                                            {center.code && <p>Mã: {center.code}</p>}
                                            {center.location && <p>Địa điểm: {center.location}</p>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="vm-search-result-item vm-no-results">
                                        <p>Không tìm thấy trung tâm dịch vụ phù hợp.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="third-party-part-page-content-area">
                <div className="third-party-part-content-box">
                    {showForm ? (
                        <ThirdPartyPartForm
                            part={editingPart}
                            serviceCenterId={serviceCenterId}
                            onSave={editingPart ? handleUpdatePart : handleCreatePart}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingPart(null);
                            }}
                            loading={loading}
                        />
                    ) : (
                        <>
                            {canEdit() && (
                                <div className="third-party-part-action-bar">
                                    <button
                                        onClick={() => {
                                            setEditingPart(null);
                                            setShowForm(true);
                                        }}
                                        className="third-party-part-create-button"
                                        disabled={!serviceCenterId}
                                    >
                                        <FaPlus /> Tạo Phụ tùng Mới
                                    </button>
                                </div>
                            )}
                            {!canEdit() && userRole !== 'ADMIN' && (
                                <div className="third-party-part-view-only-notice">
                                    <p>Chỉ quản trị viên (Admin) mới có thể thêm, chỉnh sửa và vô hiệu hóa phụ tùng bên thứ ba. Bạn chỉ có thể xem thông tin và quản lý serial.</p>
                                </div>
                            )}

                            {serviceCenterId ? (
                                <ThirdPartyPartsTable
                                    parts={parts}
                                    loading={loading}
                                    onEdit={handleEditPart}
                                    onDelete={handleDeletePart}
                                    onDeactivate={handleDeactivatePart}
                                    onManageSerials={handleManageSerials}
                                    canEdit={canEdit()}
                                    canManageSerials={canManageSerials()}
                                />
                            ) : (
                                <div className="third-party-part-message">
                                    <p>Vui lòng nhập ID trung tâm dịch vụ để xem danh sách phụ tùng.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedPartForSerials && (
                <SerialManagementModal
                    part={selectedPartForSerials}
                    onClose={handleCloseSerialModal}
                    onAddSerial={handleAddSerial}
                    onUpdateSerial={handleUpdateSerial}
                    onDeactivateSerial={handleDeactivateSerial}
                    onActivateSerial={handleActivateSerial}
                    onRefresh={refreshTableData}
                    getAuthHeaders={getAuthHeaders}
                />
            )}
        </div>
    );
};

export default ThirdPartyPartManagementPage;

