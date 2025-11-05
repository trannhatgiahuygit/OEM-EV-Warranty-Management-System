import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaPlus, FaKey } from 'react-icons/fa';
import './ThirdPartyPartManagementPage.css';

// Component to display the list of third-party parts - Memoized to prevent unnecessary rerenders
const ThirdPartyPartsTable = React.memo(({ parts, loading, onEdit, onDelete, onManageSerials, canEdit, canManageSerials }) => {
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
                            <th>Giá đơn vị</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parts.map((part) => (
                            <tr key={part.id}>
                                <td>{part.id}</td>
                                <td>{part.partNumber || 'N/A'}</td>
                                <td>{part.name || 'N/A'}</td>
                                <td>{part.category || 'N/A'}</td>
                                <td>{part.supplier || 'N/A'}</td>
                                <td>{part.unitCost ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(part.unitCost) : 'N/A'}</td>
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
                                                <FaKey /> Serial
                                            </button>
                                        )}
                                        {canEdit && (
                                            <>
                                                <button
                                                    onClick={() => onEdit(part)}
                                                    className="third-party-part-edit-button"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => onDelete(part.id)}
                                                    className="third-party-part-delete-button"
                                                >
                                                    Xóa
                                                </button>
                                            </>
                                        )}
                                        {!canManageSerials && !canEdit && (
                                            <span className="third-party-part-view-only">Chỉ xem</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
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
                    <label>
                        Mã Phụ tùng <span className="required">*</span>
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
                    <label>
                        Tên Phụ tùng <span className="required">*</span>
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
                            Giá đơn vị (VND)
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
                    </div>

                    <div className="third-party-part-form-group">
                        <label>
                            ID Trung tâm Dịch vụ <span className="required">*</span>
                        </label>
                        <input
                            type="number"
                            name="serviceCenterId"
                            value={formData.serviceCenterId}
                            onChange={handleChange}
                            required
                            className="third-party-part-form-input"
                            placeholder="Nhập ID trung tâm dịch vụ"
                        />
                    </div>
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
const SerialManagementModal = ({ part, onClose, onAddSerial, availableSerials, loading }) => {
    const [serialNumber, setSerialNumber] = useState('');
    const [loadingSerials, setLoadingSerials] = useState(false);

    const handleAddSerial = async () => {
        if (!serialNumber.trim()) {
            toast.warning('Vui lòng nhập số serial');
            return;
        }
        await onAddSerial(part.id, serialNumber.trim());
        setSerialNumber('');
    };

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
                                disabled={loading}
                            >
                                <FaPlus /> Thêm
                            </button>
                        </div>
                    </div>

                    <div className="third-party-part-serial-list-section">
                        <h4>Serial Có sẵn ({availableSerials.length})</h4>
                        {loadingSerials ? (
                            <div className="third-party-part-message">Đang tải...</div>
                        ) : availableSerials.length === 0 ? (
                            <div className="third-party-part-message">Không có serial nào có sẵn.</div>
                        ) : (
                            <div className="third-party-part-serial-list">
                                {availableSerials.map((serial) => (
                                    <div key={serial.id} className="third-party-part-serial-item">
                                        <span className="third-party-part-serial-number">{serial.serialNumber}</span>
                                        <span className={`third-party-part-serial-status ${serial.status?.toLowerCase()}`}>
                                            {serial.status === 'AVAILABLE' ? 'Có sẵn' : serial.status}
                                        </span>
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
    const [availableSerials, setAvailableSerials] = useState([]);
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

    // Check if user can edit
    // - ADMIN can edit any service center
    // - SC_STAFF can only edit their own service center
    // - SC_TECHNICIAN can only view and manage serials (no create/edit/delete)
    const canEdit = () => {
        if (userRole === 'ADMIN') {
            return true; // Admin can edit any service center
        }
        if (userRole === 'SC_STAFF') {
            // SC_STAFF can only edit if the selected service center matches their own
            return userServiceCenterId && serviceCenterId && 
                   String(userServiceCenterId) === String(serviceCenterId);
        }
        // SC_TECHNICIAN and others can only view
        return false;
    };

    // Check if user can manage serials (SC_TECHNICIAN can manage serials at their own service center)
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

    // Handle edit part
    const handleEditPart = (part) => {
        setEditingPart(part);
        setShowForm(true);
    };

    // Handle manage serials - use separate loading state to prevent table rerendering
    const handleManageSerials = async (part) => {
        setSelectedPartForSerials(part);
        // Use a separate loading state for serials to prevent table rerendering
        const serialLoading = true;
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/third-party-parts/${part.id}/serials/available`, {
                headers: getAuthHeaders()
            });
            setAvailableSerials(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách serial');
        }
        // Don't set main loading state - this prevents table rerendering
    };

    // Handle add serial
    const handleAddSerial = async (partId, serialNumber) => {
        setLoading(true);
        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/third-party-parts/${partId}/serials?serialNumber=${encodeURIComponent(serialNumber)}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );
            toast.success('Đã thêm serial thành công!');
            // Refresh available serials
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/third-party-parts/${partId}/serials/available`, {
                headers: getAuthHeaders()
            });
            setAvailableSerials(res.data);
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi thêm serial';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Handle close serial modal
    const handleCloseSerialModal = () => {
        setSelectedPartForSerials(null);
        setAvailableSerials([]);
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
                    <label>
                        ID Trung tâm Dịch vụ <span className="required">*</span>
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
                            {!canEdit() && serviceCenterId && userRole === 'SC_STAFF' && userServiceCenterId && 
                             String(userServiceCenterId) !== String(serviceCenterId) && (
                                <div className="third-party-part-view-only-notice">
                                    <p>Bạn chỉ có thể xem thông tin phụ tùng của trung tâm dịch vụ khác. Chỉ có thể chỉnh sửa phụ tùng tại trung tâm dịch vụ của bạn.</p>
                                </div>
                            )}

                            {serviceCenterId ? (
                                <ThirdPartyPartsTable
                                    parts={parts}
                                    loading={loading}
                                    onEdit={handleEditPart}
                                    onDelete={handleDeletePart}
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
                    availableSerials={availableSerials}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default ThirdPartyPartManagementPage;

