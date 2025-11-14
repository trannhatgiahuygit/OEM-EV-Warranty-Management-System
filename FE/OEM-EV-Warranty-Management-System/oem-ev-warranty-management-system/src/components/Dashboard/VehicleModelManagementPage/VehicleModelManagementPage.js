import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaSearch, FaCar, FaHashtag, FaTag, FaBuilding, FaAlignLeft, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaFileContract, FaCalendarAlt, FaRoad } from 'react-icons/fa';
import './VehicleModelManagementPage.css';

// Component to display the list of vehicle models
const VehicleModelsTable = ({ models, loading, onEdit, onDelete, canEdit }) => {
    if (loading) {
        return <div className="vehicle-model-message">Đang tải danh sách mẫu xe...</div>;
    }

    if (models.length === 0) {
        return <div className="vehicle-model-message">Không tìm thấy mẫu xe nào.</div>;
    }

    return (
        <motion.div
            className="vehicle-model-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="vehicle-model-table-wrapper">
                <table className="vehicle-model-list-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Mã</th>
                            <th>Tên</th>
                            <th>Thương hiệu</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.map((model) => (
                            <tr key={model.id}>
                                <td>{model.id}</td>
                                <td>{model.code || 'N/A'}</td>
                                <td>{model.name || 'N/A'}</td>
                                <td>{model.brand || 'N/A'}</td>
                                <td className="description-cell">{model.description || 'N/A'}</td>
                                <td>
                                    <span className={`vehicle-model-status ${model.active ? 'active' : 'inactive'}`}>
                                        {model.active ? 'Hoạt động' : 'Không hoạt động'}
                                    </span>
                                </td>
                                <td>
                                    {canEdit ? (
                                        <div className="vehicle-model-action-buttons">
                                            <button
                                                onClick={() => onEdit(model)}
                                                className="vehicle-model-edit-button"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => onDelete(model.id)}
                                                className="vehicle-model-delete-button"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="vehicle-model-view-only">Chỉ xem</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

// Component for creating/editing a vehicle model
const VehicleModelForm = ({ model, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        brand: '',
        description: '',
        active: true,
        // Warranty information fields
        coverageYears: '',
        coverageKm: '',
        effectiveFrom: '',
        effectiveTo: '',
        conditionsText: '',
        warrantyActive: true
    });
    useEffect(() => {
        if (model) {
            setFormData({
                code: model.code || '',
                name: model.name || '',
                brand: model.brand || '',
                description: model.description || '',
                active: model.active !== undefined ? model.active : true,
                // Warranty information - not loaded from model, only for new models
                coverageYears: '',
                coverageKm: '',
                effectiveFrom: '',
                effectiveTo: '',
                conditionsText: '',
                warrantyActive: true
            });
        } else {
            setFormData({
                code: '',
                name: '',
                brand: '',
                description: '',
                active: true,
                coverageYears: '',
                coverageKm: '',
                effectiveFrom: '',
                effectiveTo: '',
                conditionsText: '',
                warrantyActive: true
            });
        }
    }, [model]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <motion.div
            className="vehicle-model-content-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3>{model ? 'Chỉnh sửa Mẫu Xe' : 'Tạo Mẫu Xe Mới'}</h3>
            <form onSubmit={handleSubmit} className="vehicle-model-form-grid">
                <div>
                    <label>Mã *</label>
                    <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                        disabled={!!model} // Disable code editing for existing models
                        className="vehicle-model-form-input"
                        placeholder="vd: EV-X-PRO-2024"
                    />
                </div>
                <div>
                    <label>Tên *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="vehicle-model-form-input"
                        placeholder="Tên thương mại"
                    />
                </div>
                <div>
                    <label>Thương hiệu</label>
                    <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="vehicle-model-form-input"
                        placeholder="Thương hiệu OEM"
                    />
                </div>
                <div className="vehicle-model-form-full-width">
                    <label>Mô tả</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="vehicle-model-form-textarea"
                        placeholder="Mô tả mẫu xe"
                        rows="4"
                    />
                </div>
                <div>
                    <label>Trạng thái</label>
                    <select
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                        className="vehicle-model-form-input vehicle-model-form-select"
                    >
                        <option value="true">Hoạt động</option>
                        <option value="false">Không hoạt động</option>
                    </select>
                </div>

                {/* Warranty Information Section - Always show for new models */}
                {!model && (
                    <>
                        <div className="vehicle-model-form-full-width" style={{ 
                            marginTop: '2rem', 
                            marginBottom: '1rem',
                            paddingTop: '1.5rem',
                            borderTop: '2px solid var(--border)'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.75rem',
                                marginBottom: '1.5rem'
                            }}>
                                <FaFileContract style={{ 
                                    color: 'var(--glow1)', 
                                    fontSize: '1.25rem' 
                                }} />
                                <h4 style={{ 
                                    margin: 0, 
                                    fontWeight: 600, 
                                    color: 'var(--text-primary)',
                                    fontSize: '1.1rem'
                                }}>
                                    Thiết lập Thông tin Bảo hành
                                </h4>
                                <span style={{ 
                                    marginLeft: 'auto', 
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    fontStyle: 'italic'
                                }}>
                                    (Tùy chọn)
                                </span>
                            </div>
                        </div>

                        <div className="vehicle-model-warranty-section">
                            <div>
                                <label>
                                    <FaCalendarAlt />
                                    Thời hạn Bảo hành (năm)
                                </label>
                                <input
                                    type="number"
                                    value={formData.coverageYears}
                                    onChange={(e) => setFormData({ ...formData, coverageYears: e.target.value })}
                                    className="vehicle-model-form-input"
                                    placeholder="Ví dụ: 3 hoặc 5"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label>
                                    <FaRoad />
                                    Quãng đường Bảo hành (km)
                                </label>
                                <input
                                    type="number"
                                    value={formData.coverageKm}
                                    onChange={(e) => setFormData({ ...formData, coverageKm: e.target.value })}
                                    className="vehicle-model-form-input"
                                    placeholder="Ví dụ: 100000"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label>
                                    <FaCalendarAlt />
                                    Hiệu lực từ
                                </label>
                                <input
                                    type="date"
                                    value={formData.effectiveFrom}
                                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                                    className="vehicle-model-form-input"
                                />
                            </div>
                            <div>
                                <label>
                                    <FaCalendarAlt />
                                    Hiệu lực đến
                                </label>
                                <input
                                    type="date"
                                    value={formData.effectiveTo}
                                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                                    className="vehicle-model-form-input"
                                />
                            </div>
                            <div className="vehicle-model-form-full-width">
                                <label>
                                    <FaAlignLeft />
                                    Mô tả Điều kiện Bảo hành
                                </label>
                                <textarea
                                    value={formData.conditionsText}
                                    onChange={(e) => setFormData({ ...formData, conditionsText: e.target.value })}
                                    className="vehicle-model-form-textarea"
                                    placeholder="Mô tả chi tiết điều kiện/ngoại lệ bảo hành"
                                    rows="4"
                                />
                            </div>
                            <div>
                                <label>
                                    <FaInfoCircle />
                                    Trạng thái Bảo hành
                                </label>
                                <select
                                    value={formData.warrantyActive ? 'true' : 'false'}
                                    onChange={(e) => setFormData({ ...formData, warrantyActive: e.target.value === 'true' })}
                                    className="vehicle-model-form-input vehicle-model-form-select"
                                >
                                    <option value="true">Hoạt động</option>
                                    <option value="false">Không hoạt động</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}

                <div className="vehicle-model-form-actions">
                    <button type="submit" className="vehicle-model-submit-button" disabled={loading}>
                        {loading ? 'Đang lưu...' : (model ? 'Cập nhật' : 'Tạo')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="vehicle-model-cancel-button"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// Component for detail lookup
const DetailLookup = ({ searchValue, setSearchValue, searchType, setSearchType, searchModelDetail, modelDetail, loading }) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading && searchValue.trim()) {
            searchModelDetail();
        }
    };

    return (
        <motion.div
            className="vehicle-model-content-box vehicle-model-lookup-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="vehicle-model-lookup-header">
                <h3>Tra cứu Chi tiết Mẫu Xe</h3>
                <p className="vehicle-model-lookup-subtitle">Tìm kiếm thông tin chi tiết về mẫu xe bằng ID hoặc Mã</p>
            </div>

            <div className="vehicle-model-search-section">
                <div className="vehicle-model-search-group-enhanced">
                    <div className="vehicle-model-search-type-wrapper">
                        <FaHashtag className="vehicle-model-search-icon" />
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="vehicle-model-search-type-select"
                        >
                            <option value="id">Tìm theo ID</option>
                            <option value="code">Tìm theo Mã</option>
                        </select>
                    </div>
                    <div className="vehicle-model-search-input-wrapper">
                        <FaCar className="vehicle-model-search-icon" />
                        <input
                            type="text"
                            placeholder={searchType === 'id' ? 'Nhập ID Mẫu Xe' : 'Nhập Mã Mẫu Xe'}
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="vehicle-model-search-input"
                        />
                    </div>
                    <button 
                        onClick={searchModelDetail} 
                        className="vehicle-model-search-button" 
                        disabled={loading || !searchValue.trim()}
                    >
                        <FaSearch />
                        {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                    </button>
                </div>
            </div>

            {modelDetail && (
                <motion.div
                    className="vehicle-model-detail-card-enhanced"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="vehicle-model-detail-card-header">
                        <div className="vehicle-model-detail-icon-wrapper">
                            <FaCar className="vehicle-model-detail-icon" />
                        </div>
                        <div>
                            <h4>Chi tiết Mẫu Xe</h4>
                            <p className="vehicle-model-detail-subtitle">Thông tin đầy đủ về mẫu xe</p>
                        </div>
                    </div>

                    <div className="vehicle-model-detail-content">
                        <div className="vehicle-model-detail-item">
                            <div className="vehicle-model-detail-item-header">
                                <FaHashtag className="vehicle-model-detail-item-icon" />
                                <span className="vehicle-model-detail-item-label">ID</span>
                            </div>
                            <div className="vehicle-model-detail-item-value">{modelDetail.id}</div>
                        </div>

                        <div className="vehicle-model-detail-item">
                            <div className="vehicle-model-detail-item-header">
                                <FaTag className="vehicle-model-detail-item-icon" />
                                <span className="vehicle-model-detail-item-label">Mã</span>
                            </div>
                            <div className="vehicle-model-detail-item-value vehicle-model-code-value">{modelDetail.code}</div>
                        </div>

                        <div className="vehicle-model-detail-item">
                            <div className="vehicle-model-detail-item-header">
                                <FaCar className="vehicle-model-detail-item-icon" />
                                <span className="vehicle-model-detail-item-label">Tên</span>
                            </div>
                            <div className="vehicle-model-detail-item-value vehicle-model-name-value">{modelDetail.name}</div>
                        </div>

                        {modelDetail.brand && (
                            <div className="vehicle-model-detail-item">
                                <div className="vehicle-model-detail-item-header">
                                    <FaBuilding className="vehicle-model-detail-item-icon" />
                                    <span className="vehicle-model-detail-item-label">Thương hiệu</span>
                                </div>
                                <div className="vehicle-model-detail-item-value">{modelDetail.brand}</div>
                            </div>
                        )}

                        <div className="vehicle-model-detail-item vehicle-model-detail-item-full">
                            <div className="vehicle-model-detail-item-header">
                                <FaAlignLeft className="vehicle-model-detail-item-icon" />
                                <span className="vehicle-model-detail-item-label">Mô tả</span>
                            </div>
                            <div className="vehicle-model-detail-item-value vehicle-model-description-value">
                                {modelDetail.description || <span className="vehicle-model-detail-empty">Không có mô tả</span>}
                            </div>
                        </div>

                        <div className="vehicle-model-detail-item">
                            <div className="vehicle-model-detail-item-header">
                                <FaInfoCircle className="vehicle-model-detail-item-icon" />
                                <span className="vehicle-model-detail-item-label">Trạng thái</span>
                            </div>
                            <div className="vehicle-model-detail-item-value">
                                <span className={`vehicle-model-status-enhanced ${modelDetail.active ? 'active' : 'inactive'}`}>
                                    {modelDetail.active ? (
                                        <>
                                            <FaCheckCircle className="vehicle-model-status-icon" />
                                            Hoạt động
                                        </>
                                    ) : (
                                        <>
                                            <FaTimesCircle className="vehicle-model-status-icon" />
                                            Không hoạt động
                                        </>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

// Main Component
const VehicleModelManagementPage = ({ handleBackClick }) => {
    const [activeTab, setActiveTab] = useState('all-models');
    const [vehicleModels, setVehicleModels] = useState([]);
    const [activeModels, setActiveModels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchType, setSearchType] = useState('id');
    const [modelDetail, setModelDetail] = useState(null);
    const [editingModel, setEditingModel] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [userRole, setUserRole] = useState(null);
    
    // Check if user can edit (only EVM_STAFF and ADMIN)
    const canEdit = userRole === 'EVM_STAFF' || userRole === 'ADMIN';

    // Get user role on mount
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role) {
            setUserRole(user.role);
        }
    }, []);

    // Helper to get auth headers
    const getAuthHeaders = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' } : {};
    };

    const fetchAllVehicleModels = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/vehicle-models`, {
                headers: getAuthHeaders()
            });
            let fetchedModels = res.data;
            // Sort by id (newest first)
            fetchedModels.sort((a, b) => (b.id || 0) - (a.id || 0));
            setVehicleModels(fetchedModels);
            toast.success('Đã tải danh sách mẫu xe thành công!');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách mẫu xe');
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveVehicleModels = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/vehicle-models/active`, {
                headers: getAuthHeaders()
            });
            let fetchedModels = res.data;
            // Sort by id (newest first)
            fetchedModels.sort((a, b) => (b.id || 0) - (a.id || 0));
            setActiveModels(fetchedModels);
            toast.success('Đã tải danh sách mẫu xe hoạt động thành công!');
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách mẫu xe hoạt động');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateModel = async (formData) => {
        setLoading(true);
        try {
            // Extract warranty information
            const { coverageYears, coverageKm, effectiveFrom, effectiveTo, conditionsText, warrantyActive, ...modelData } = formData;
            
            // Create vehicle model first
            const modelResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/vehicle-models`, modelData, {
                headers: getAuthHeaders()
            });
            
            // Extract model ID from response (handle different response structures)
            const createdModelId = modelResponse.data?.id || 
                                   modelResponse.data?.vehicleModel?.id || 
                                   modelResponse.data?.data?.id ||
                                   (typeof modelResponse.data === 'object' && modelResponse.data !== null ? modelResponse.data.id : null);
            
            // If warranty information is provided, create warranty condition
            if (createdModelId && (coverageYears || coverageKm || effectiveFrom || effectiveTo || conditionsText)) {
                const warrantyData = {
                    vehicleModelId: createdModelId,
                    coverageYears: coverageYears ? Number(coverageYears) : null,
                    coverageKm: coverageKm ? Number(coverageKm) : null,
                    effectiveFrom: effectiveFrom || null,
                    effectiveTo: effectiveTo || null,
                    conditionsText: conditionsText || null,
                    active: warrantyActive !== undefined ? warrantyActive : true
                };
                
                try {
                    await axios.post(`${process.env.REACT_APP_API_URL}/api/warranty-conditions`, warrantyData, {
                        headers: getAuthHeaders()
                    });
                    toast.success('Đã tạo mẫu xe và thông tin bảo hành thành công!');
                } catch (warrantyErr) {
                    console.error('Error creating warranty condition:', warrantyErr);
                    toast.warning('Đã tạo mẫu xe thành công nhưng có lỗi khi tạo thông tin bảo hành. Bạn có thể tạo sau trong Quản lý Điều kiện Bảo hành.');
                }
            } else {
                toast.success('Đã tạo mẫu xe thành công!');
            }
            
            setShowForm(false);
            setEditingModel(null);
            // Refresh the appropriate list
            if (activeTab === 'all-models') {
                fetchAllVehicleModels();
            } else if (activeTab === 'active-models') {
                fetchActiveVehicleModels();
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi tạo mẫu xe';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateModel = async (formData) => {
        if (!editingModel || !editingModel.id) {
            toast.error('Chưa chọn mẫu xe để chỉnh sửa');
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/vehicle-models/${editingModel.id}`, formData, {
                headers: getAuthHeaders()
            });
            toast.success('Đã cập nhật mẫu xe thành công!');
            setShowForm(false);
            setEditingModel(null);
            // Refresh the appropriate list
            if (activeTab === 'all-models') {
                fetchAllVehicleModels();
            } else if (activeTab === 'active-models') {
                fetchActiveVehicleModels();
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật mẫu xe';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteModel = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mẫu xe này?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/vehicle-models/${id}`, {
                headers: getAuthHeaders()
            });
            toast.success('Đã xóa mẫu xe thành công!');
            // Refresh the appropriate list
            if (activeTab === 'all-models') {
                fetchAllVehicleModels();
            } else if (activeTab === 'active-models') {
                fetchActiveVehicleModels();
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi xóa mẫu xe';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEditModel = (model) => {
        setEditingModel(model);
        setShowForm(true);
        setActiveTab('create-edit');
    };

    const handleSaveModel = (formData) => {
        if (editingModel) {
            handleUpdateModel(formData);
        } else {
            handleCreateModel(formData);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingModel(null);
        setActiveTab('all-models');
    };

    const searchModelDetail = async () => {
        if (!searchValue.trim()) {
            toast.warning('Vui lòng nhập giá trị tìm kiếm');
            return;
        }

        setLoading(true);
        setModelDetail(null);
        try {
            let url;
            if (searchType === 'id') {
                url = `${process.env.REACT_APP_API_URL}/api/vehicle-models/${searchValue}`;
            } else {
                url = `${process.env.REACT_APP_API_URL}/api/vehicle-models/code/${searchValue}`;
            }
            const res = await axios.get(url, { headers: getAuthHeaders() });
            toast.success('Đã lấy chi tiết mẫu xe thành công!');
            setModelDetail(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Không tìm thấy mẫu xe hoặc lỗi khi lấy chi tiết');
            setModelDetail(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to render the active tab content
    const renderActiveTabContent = () => {
        if (showForm) {
            return (
                <VehicleModelForm
                    model={editingModel}
                    onSave={handleSaveModel}
                    onCancel={handleCancelForm}
                    loading={loading}
                />
            );
        }

        switch (activeTab) {
            case 'all-models':
                return (
                    <VehicleModelsTable
                        models={vehicleModels}
                        loading={loading}
                        onEdit={handleEditModel}
                        onDelete={handleDeleteModel}
                        canEdit={canEdit}
                    />
                );
            case 'active-models':
                return (
                    <VehicleModelsTable
                        models={activeModels}
                        loading={loading}
                        onEdit={handleEditModel}
                        onDelete={handleDeleteModel}
                        canEdit={canEdit}
                    />
                );
            case 'create-edit':
                return (
                    <VehicleModelForm
                        model={editingModel}
                        onSave={handleSaveModel}
                        onCancel={handleCancelForm}
                        loading={loading}
                    />
                );
            case 'detail-lookup':
                return (
                    <DetailLookup
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        searchType={searchType}
                        setSearchType={setSearchType}
                        searchModelDetail={searchModelDetail}
                        modelDetail={modelDetail}
                        loading={loading}
                    />
                );
            default:
                return (
                    <div className="vehicle-model-message">
                        <h3>Chào mừng đến với Quản lý Mẫu Xe</h3>
                        <p>Chọn một chức năng ở trên để quản lý mẫu xe.</p>
                    </div>
                );
        }
    };

    useEffect(() => {
        if (activeTab === 'all-models' && !showForm) {
            fetchAllVehicleModels();
        } else if (activeTab === 'active-models' && !showForm) {
            fetchActiveVehicleModels();
        } else if (activeTab === 'detail-lookup') {
            // Reset detail lookup when switching to this tab
            setModelDetail(null);
            setSearchValue('');
        }
    }, [activeTab, showForm]);

    return (
        <div className="vehicle-model-page-wrapper">
            {/* Header Card */}
            <div className="vehicle-model-page-header">
                <button onClick={handleBackClick} className="vehicle-model-back-to-dashboard-button">
                    ← Quay lại Bảng điều khiển
                </button>
                <h2 className="vehicle-model-page-title">Quản lý Mẫu Xe</h2>

                {/* Navigation Group */}
                <div className="vehicle-model-nav-bar-group">
                    <motion.div
                        className="vehicle-model-tab-nav-bar"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button
                            onClick={() => {
                                setActiveTab('all-models');
                                setShowForm(false);
                                setEditingModel(null);
                            }}
                            className={`vehicle-model-tab-button ${activeTab === 'all-models' && !showForm ? 'active' : ''}`}
                        >
                            Tất cả Mẫu Xe
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('active-models');
                                setShowForm(false);
                                setEditingModel(null);
                            }}
                            className={`vehicle-model-tab-button ${activeTab === 'active-models' && !showForm ? 'active' : ''}`}
                        >
                            Mẫu Xe Hoạt động
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => {
                                    setActiveTab('create-edit');
                                    setShowForm(true);
                                    setEditingModel(null);
                                }}
                                className={`vehicle-model-tab-button ${activeTab === 'create-edit' || showForm ? 'active' : ''}`}
                            >
                                Tạo Mẫu Xe Mới
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setActiveTab('detail-lookup');
                                setShowForm(false);
                                setEditingModel(null);
                            }}
                            className={`vehicle-model-tab-button ${activeTab === 'detail-lookup' && !showForm ? 'active' : ''}`}
                        >
                            Tra cứu Chi tiết
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="vehicle-model-page-content-area">
                {renderActiveTabContent()}
            </div>
        </div>
    );
};

export default VehicleModelManagementPage;

