import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaSearch, FaFileContract, FaHashtag, FaCalendarAlt, FaRoad, FaAlignLeft, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaCar } from 'react-icons/fa';
import './WarrantyConditionManagementPage.css';

// Component to display the list of warranty conditions
const WarrantyConditionsTable = ({ conditions, loading, onEdit, onDelete, canEdit }) => {
    if (loading) {
        return <div className="warranty-condition-message">Đang tải điều kiện bảo hành...</div>;
    }

    if (conditions.length === 0) {
        return <div className="warranty-condition-message">Không tìm thấy điều kiện bảo hành nào.</div>;
    }

    return (
        <motion.div
            className="warranty-condition-table-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="warranty-condition-table-wrapper">
                <table className="warranty-condition-list-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Thời hạn (năm)</th>
                            <th>Quãng đường (km)</th>
                            <th>Hiệu lực từ</th>
                            <th>Hiệu lực đến</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conditions.map((condition) => (
                            <tr key={condition.id}>
                                <td>{condition.id}</td>
                                <td>{condition.coverageYears || 'N/A'}</td>
                                <td>{condition.coverageKm ? `${condition.coverageKm.toLocaleString('vi-VN')} km` : 'N/A'}</td>
                                <td>{condition.effectiveFrom ? new Date(condition.effectiveFrom).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                <td>{condition.effectiveTo ? new Date(condition.effectiveTo).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                <td>
                                    <span className={`warranty-condition-status ${condition.active ? 'active' : 'inactive'}`}>
                                        {condition.active ? 'Hoạt động' : 'Không hoạt động'}
                                    </span>
                                </td>
                                <td>
                                    {canEdit ? (
                                        <div className="warranty-condition-action-buttons">
                                            <button
                                                onClick={() => onEdit(condition)}
                                                className="warranty-condition-edit-button"
                                            >
                                                Sửa
                                            </button>
                                            <button
                                                onClick={() => onDelete(condition.id)}
                                                className="warranty-condition-delete-button"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="warranty-condition-view-only">Chỉ xem</span>
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

// Component for creating/editing a warranty condition
const WarrantyConditionForm = ({ condition, vehicleModelId, onSave, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        vehicleModelId: vehicleModelId || '',
        coverageYears: '',
        coverageKm: '',
        conditionsText: '',
        effectiveFrom: '',
        effectiveTo: '',
        active: true
    });

    useEffect(() => {
        if (condition) {
            setFormData({
                vehicleModelId: condition.vehicleModelId || vehicleModelId || '',
                coverageYears: condition.coverageYears || '',
                coverageKm: condition.coverageKm || '',
                conditionsText: condition.conditionsText || '',
                effectiveFrom: condition.effectiveFrom ? condition.effectiveFrom.split('T')[0] : '',
                effectiveTo: condition.effectiveTo ? condition.effectiveTo.split('T')[0] : '',
                active: condition.active !== undefined ? condition.active : true
            });
        } else {
            setFormData({
                vehicleModelId: vehicleModelId || '',
                coverageYears: '',
                coverageKm: '',
                conditionsText: '',
                effectiveFrom: '',
                effectiveTo: '',
                active: true
            });
        }
    }, [condition, vehicleModelId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <motion.div
            className="warranty-condition-content-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3>{condition ? 'Chỉnh sửa Điều kiện Bảo hành' : 'Tạo Điều kiện Bảo hành Mới'}</h3>
            <form onSubmit={handleSubmit} className="warranty-condition-form-grid">
                <div>
                    <label>Mã Mẫu Xe *</label>
                    <input
                        type="number"
                        value={formData.vehicleModelId}
                        onChange={(e) => setFormData({ ...formData, vehicleModelId: e.target.value })}
                        required
                        disabled={!!condition || !!vehicleModelId}
                        className="warranty-condition-form-input"
                        placeholder="ID của mẫu xe"
                    />
                </div>
                <div>
                    <label>Thời hạn Bảo hành (năm)</label>
                    <input
                        type="number"
                        value={formData.coverageYears}
                        onChange={(e) => setFormData({ ...formData, coverageYears: e.target.value })}
                        className="warranty-condition-form-input"
                        placeholder="Ví dụ: 3 hoặc 5"
                        min="0"
                    />
                </div>
                <div>
                    <label>Quãng đường Bảo hành (km)</label>
                    <input
                        type="number"
                        value={formData.coverageKm}
                        onChange={(e) => setFormData({ ...formData, coverageKm: e.target.value })}
                        className="warranty-condition-form-input"
                        placeholder="Ví dụ: 100000"
                        min="0"
                    />
                </div>
                <div>
                    <label>Hiệu lực từ</label>
                    <input
                        type="date"
                        value={formData.effectiveFrom}
                        onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                        className="warranty-condition-form-input"
                    />
                </div>
                <div>
                    <label>Hiệu lực đến</label>
                    <input
                        type="date"
                        value={formData.effectiveTo}
                        onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                        className="warranty-condition-form-input"
                    />
                </div>
                <div className="warranty-condition-form-full-width">
                    <label>Mô tả Điều kiện</label>
                    <textarea
                        value={formData.conditionsText}
                        onChange={(e) => setFormData({ ...formData, conditionsText: e.target.value })}
                        className="warranty-condition-form-textarea"
                        placeholder="Mô tả chi tiết điều kiện/ngoại lệ bảo hành"
                        rows="4"
                    />
                </div>
                <div>
                    <label>Trạng thái</label>
                    <select
                        value={formData.active ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                        className="warranty-condition-form-input warranty-condition-form-select"
                    >
                        <option value="true">Hoạt động</option>
                        <option value="false">Không hoạt động</option>
                    </select>
                </div>
                <div className="warranty-condition-form-actions">
                    <button type="submit" className="warranty-condition-submit-button" disabled={loading}>
                        {loading ? 'Đang lưu...' : (condition ? 'Cập nhật' : 'Tạo')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="warranty-condition-cancel-button"
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
const DetailLookup = ({ searchValue, setSearchValue, searchConditionDetail, conditionDetail, loading }) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading && searchValue.trim()) {
            searchConditionDetail();
        }
    };

    return (
        <motion.div
            className="warranty-condition-content-box warranty-condition-lookup-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="warranty-condition-lookup-header">
                <h3>Tra cứu Chi tiết Điều kiện Bảo hành</h3>
                <p className="warranty-condition-lookup-subtitle">Tìm kiếm thông tin chi tiết về điều kiện bảo hành bằng ID</p>
            </div>

            <div className="warranty-condition-search-section">
                <div className="warranty-condition-search-group-enhanced">
                    <div className="warranty-condition-search-input-wrapper">
                        <FaHashtag className="warranty-condition-search-icon" />
                        <input
                            type="text"
                            placeholder="Nhập ID Điều kiện Bảo hành"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="warranty-condition-search-input"
                        />
                    </div>
                    <button 
                        onClick={searchConditionDetail} 
                        className="warranty-condition-search-button" 
                        disabled={loading || !searchValue.trim()}
                    >
                        <FaSearch />
                        {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                    </button>
                </div>
            </div>

            {conditionDetail && (
                <motion.div
                    className="warranty-condition-detail-card-enhanced"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="warranty-condition-detail-card-header">
                        <div className="warranty-condition-detail-icon-wrapper">
                            <FaFileContract className="warranty-condition-detail-icon" />
                        </div>
                        <div>
                            <h4>Chi tiết Điều kiện Bảo hành</h4>
                            <p className="warranty-condition-detail-subtitle">Thông tin đầy đủ về điều kiện bảo hành</p>
                        </div>
                    </div>

                    <div className="warranty-condition-detail-content">
                        <div className="warranty-condition-detail-item">
                            <div className="warranty-condition-detail-item-header">
                                <FaHashtag className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">ID</span>
                            </div>
                            <div className="warranty-condition-detail-item-value">{conditionDetail.id}</div>
                        </div>

                        <div className="warranty-condition-detail-item">
                            <div className="warranty-condition-detail-item-header">
                                <FaCar className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">Mã Mẫu Xe</span>
                            </div>
                            <div className="warranty-condition-detail-item-value">{conditionDetail.vehicleModelId}</div>
                        </div>

                        {conditionDetail.coverageYears && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaCalendarAlt className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Thời hạn (năm)</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">{conditionDetail.coverageYears} năm</div>
                            </div>
                        )}

                        {conditionDetail.coverageKm && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaRoad className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Quãng đường (km)</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">{conditionDetail.coverageKm.toLocaleString('vi-VN')} km</div>
                            </div>
                        )}

                        {conditionDetail.effectiveFrom && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaCalendarAlt className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Hiệu lực từ</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">
                                    {new Date(conditionDetail.effectiveFrom).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        )}

                        {conditionDetail.effectiveTo && (
                            <div className="warranty-condition-detail-item">
                                <div className="warranty-condition-detail-item-header">
                                    <FaCalendarAlt className="warranty-condition-detail-item-icon" />
                                    <span className="warranty-condition-detail-item-label">Hiệu lực đến</span>
                                </div>
                                <div className="warranty-condition-detail-item-value">
                                    {new Date(conditionDetail.effectiveTo).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                        )}

                        <div className="warranty-condition-detail-item warranty-condition-detail-item-full">
                            <div className="warranty-condition-detail-item-header">
                                <FaAlignLeft className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">Mô tả Điều kiện</span>
                            </div>
                            <div className="warranty-condition-detail-item-value warranty-condition-description-value">
                                {conditionDetail.conditionsText || <span className="warranty-condition-detail-empty">Không có mô tả</span>}
                            </div>
                        </div>

                        <div className="warranty-condition-detail-item">
                            <div className="warranty-condition-detail-item-header">
                                <FaInfoCircle className="warranty-condition-detail-item-icon" />
                                <span className="warranty-condition-detail-item-label">Trạng thái</span>
                            </div>
                            <div className="warranty-condition-detail-item-value">
                                <span className={`warranty-condition-status-enhanced ${conditionDetail.active ? 'active' : 'inactive'}`}>
                                    {conditionDetail.active ? (
                                        <>
                                            <FaCheckCircle className="warranty-condition-status-icon" />
                                            Hoạt động
                                        </>
                                    ) : (
                                        <>
                                            <FaTimesCircle className="warranty-condition-status-icon" />
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

// Component for selecting vehicle model with search functionality
const VehicleModelSelector = ({ selectedModelId, onModelChange, vehicleModels, loading, modelSearchQuery, setModelSearchQuery, modelSearchResults, setModelSearchResults, showModelResults, setShowModelResults }) => {
    // Perform search function
    const performModelSearch = (query) => {
        const queryLower = query.toLowerCase();
        if (queryLower.length < 1) return vehicleModels;

        return vehicleModels.filter(model => 
            model.name.toLowerCase().includes(queryLower) ||
            (model.brand && model.brand.toLowerCase().includes(queryLower)) ||
            (model.code && model.code.toLowerCase().includes(queryLower)) ||
            String(model.id).includes(queryLower)
        );
    };

    // Handle search query change
    const handleModelQueryChange = (e) => {
        const value = e.target.value;
        setModelSearchQuery(value);
        
        // Update search results
        const results = performModelSearch(value);
        setModelSearchResults(results);
        setShowModelResults(true);

        // Clear selection if user is typing something different
        if (value !== getSelectedModelDisplay()) {
            onModelChange(null);
        }
    };

    // Handle model selection
    const handleModelSelect = (model) => {
        onModelChange(model.id);
        setModelSearchQuery(model.name);
        setShowModelResults(false);
    };

    // Get display text for selected model
    const getSelectedModelDisplay = () => {
        if (!selectedModelId) return '';
        const selectedModel = vehicleModels.find(m => m.id === selectedModelId);
        return selectedModel ? selectedModel.name : '';
    };

    return (
        <div className="warranty-condition-model-selector">
            <label>Chọn Mẫu Xe *</label>
            <div className="vm-customer-search-container">
                <input
                    type="text"
                    placeholder={loading ? "Đang tải danh sách mẫu xe..." : "Tìm kiếm mẫu xe theo tên, thương hiệu, mã hoặc ID..."}
                    value={modelSearchQuery}
                    onChange={handleModelQueryChange}
                    onFocus={() => {
                        if (vehicleModels.length > 0) {
                            setModelSearchResults(performModelSearch(modelSearchQuery));
                            setShowModelResults(true);
                        }
                    }}
                    onBlur={() => setTimeout(() => setShowModelResults(false), 200)}
                    required
                    disabled={loading}
                    autoComplete="off"
                />
                {showModelResults && !loading && (
                    <div className="vm-search-results">
                        {modelSearchResults.length > 0 ? (
                            modelSearchResults.map((model) => (
                                <div
                                    key={model.id}
                                    className="vm-search-result-item"
                                    onMouseDown={(e) => { e.preventDefault(); handleModelSelect(model); }}
                                >
                                    <p><strong>{model.name}</strong> {model.brand ? `(${model.brand})` : ''}</p>
                                    {model.code && <p>Mã: {model.code}</p>}
                                </div>
                            ))
                        ) : (
                            <div className="vm-search-result-item vm-no-results">
                                <p>Không tìm thấy mẫu xe phù hợp.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Main Component
const WarrantyConditionManagementPage = ({ handleBackClick }) => {
    const [activeTab, setActiveTab] = useState('all-conditions');
    const [warrantyConditions, setWarrantyConditions] = useState([]);
    const [effectiveConditions, setEffectiveConditions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [conditionDetail, setConditionDetail] = useState(null);
    const [editingCondition, setEditingCondition] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedModelId, setSelectedModelId] = useState(null);
    const [vehicleModels, setVehicleModels] = useState([]);
    const [userRole, setUserRole] = useState(null);
    
    // State for Vehicle Model Search
    const [modelSearchQuery, setModelSearchQuery] = useState('');
    const [modelSearchResults, setModelSearchResults] = useState([]);
    const [showModelResults, setShowModelResults] = useState(false);
    
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

    // Fetch vehicle models
    useEffect(() => {
        const fetchVehicleModels = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/vehicle-models`, {
                    headers: getAuthHeaders()
                });
                setVehicleModels(res.data);
                setModelSearchResults(res.data);
            } catch (err) {
                console.error('Error fetching vehicle models:', err);
            }
        };
        fetchVehicleModels();
    }, []);

    // Initialize search query when model is selected
    useEffect(() => {
        if (selectedModelId && vehicleModels.length > 0) {
            const selectedModel = vehicleModels.find(m => m.id === selectedModelId);
            if (selectedModel) {
                setModelSearchQuery(selectedModel.name);
            }
        } else if (!selectedModelId) {
            setModelSearchQuery('');
        }
    }, [selectedModelId, vehicleModels]);

    const fetchWarrantyConditions = async (modelId, showToast = true) => {
        if (!modelId) {
            setWarrantyConditions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/warranty-conditions?modelId=${modelId}`, {
                headers: getAuthHeaders()
            });
            let fetchedConditions = res.data;
            fetchedConditions.sort((a, b) => (b.id || 0) - (a.id || 0));
            setWarrantyConditions(fetchedConditions);
            if (showToast) {
                toast.success('Đã tải điều kiện bảo hành thành công!');
            }
        } catch (err) {
            console.error(err);
            if (showToast) {
                toast.error('Lỗi khi tải điều kiện bảo hành');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchEffectiveConditions = async (modelId, showToast = true) => {
        if (!modelId) {
            setEffectiveConditions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/effective?modelId=${modelId}`, {
                headers: getAuthHeaders()
            });
            let fetchedConditions = res.data;
            fetchedConditions.sort((a, b) => (b.id || 0) - (a.id || 0));
            setEffectiveConditions(fetchedConditions);
            if (showToast) {
                toast.success('Đã tải điều kiện hiệu lực thành công!');
            }
        } catch (err) {
            console.error(err);
            if (showToast) {
                toast.error('Lỗi khi tải điều kiện hiệu lực');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCondition = async (formData) => {
        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/warranty-conditions`, formData, {
                headers: getAuthHeaders()
            });
            toast.success('Đã tạo điều kiện bảo hành thành công!');
            setShowForm(false);
            setEditingCondition(null);
            if (selectedModelId) {
                if (activeTab === 'all-conditions') {
                    fetchWarrantyConditions(selectedModelId, false);
                } else if (activeTab === 'effective-conditions') {
                    fetchEffectiveConditions(selectedModelId, false);
                }
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi tạo điều kiện bảo hành';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCondition = async (formData) => {
        if (!editingCondition || !editingCondition.id) {
            toast.error('Chưa chọn điều kiện để chỉnh sửa');
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/${editingCondition.id}`, formData, {
                headers: getAuthHeaders()
            });
            toast.success('Đã cập nhật điều kiện bảo hành thành công!');
            setShowForm(false);
            setEditingCondition(null);
            if (selectedModelId) {
                if (activeTab === 'all-conditions') {
                    fetchWarrantyConditions(selectedModelId, false);
                } else if (activeTab === 'effective-conditions') {
                    fetchEffectiveConditions(selectedModelId, false);
                }
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật điều kiện bảo hành';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCondition = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa điều kiện bảo hành này?')) {
            return;
        }

        setLoading(true);
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/${id}`, {
                headers: getAuthHeaders()
            });
            toast.success('Đã xóa điều kiện bảo hành thành công!');
            if (selectedModelId) {
                if (activeTab === 'all-conditions') {
                    fetchWarrantyConditions(selectedModelId, false);
                } else if (activeTab === 'effective-conditions') {
                    fetchEffectiveConditions(selectedModelId, false);
                }
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.message || 'Lỗi khi xóa điều kiện bảo hành';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleEditCondition = (condition) => {
        setEditingCondition(condition);
        setShowForm(true);
        setActiveTab('create-edit');
    };

    const handleSaveCondition = (formData) => {
        if (editingCondition) {
            handleUpdateCondition(formData);
        } else {
            handleCreateCondition(formData);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingCondition(null);
        setActiveTab('all-conditions');
    };

    const handleModelChange = (modelId) => {
        setSelectedModelId(modelId);
        if (modelId) {
            // Update search query to show selected model name
            const selectedModel = vehicleModels.find(m => m.id === modelId);
            if (selectedModel) {
                setModelSearchQuery(selectedModel.name);
            }
            if (activeTab === 'all-conditions') {
                fetchWarrantyConditions(modelId);
            } else if (activeTab === 'effective-conditions') {
                fetchEffectiveConditions(modelId);
            }
        } else {
            setModelSearchQuery('');
            setWarrantyConditions([]);
            setEffectiveConditions([]);
        }
    };

    const searchConditionDetail = async () => {
        if (!searchValue.trim()) {
            toast.warning('Vui lòng nhập ID điều kiện bảo hành');
            return;
        }

        setLoading(true);
        setConditionDetail(null);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/warranty-conditions/${searchValue}`, {
                headers: getAuthHeaders()
            });
            toast.success('Đã lấy chi tiết điều kiện bảo hành thành công!');
            setConditionDetail(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Không tìm thấy điều kiện bảo hành hoặc lỗi khi lấy chi tiết');
            setConditionDetail(null);
        } finally {
            setLoading(false);
        }
    };

    // Function to render the active tab content
    const renderActiveTabContent = () => {
        if (showForm) {
            return (
                <WarrantyConditionForm
                    condition={editingCondition}
                    vehicleModelId={selectedModelId}
                    onSave={handleSaveCondition}
                    onCancel={handleCancelForm}
                    loading={loading}
                />
            );
        }

        switch (activeTab) {
            case 'all-conditions':
                if (!selectedModelId) {
                    return (
                        <div className="warranty-condition-message">
                            <p>Vui lòng chọn mẫu xe để xem điều kiện bảo hành.</p>
                        </div>
                    );
                }
                return (
                    <WarrantyConditionsTable
                        conditions={warrantyConditions}
                        loading={loading}
                        onEdit={handleEditCondition}
                        onDelete={handleDeleteCondition}
                        canEdit={canEdit}
                    />
                );
            case 'effective-conditions':
                if (!selectedModelId) {
                    return (
                        <div className="warranty-condition-message">
                            <p>Vui lòng chọn mẫu xe để xem điều kiện hiệu lực.</p>
                        </div>
                    );
                }
                return (
                    <WarrantyConditionsTable
                        conditions={effectiveConditions}
                        loading={loading}
                        onEdit={handleEditCondition}
                        onDelete={handleDeleteCondition}
                        canEdit={canEdit}
                    />
                );
            case 'create-edit':
                return (
                    <WarrantyConditionForm
                        condition={editingCondition}
                        vehicleModelId={selectedModelId}
                        onSave={handleSaveCondition}
                        onCancel={handleCancelForm}
                        loading={loading}
                    />
                );
            case 'detail-lookup':
                return (
                    <DetailLookup
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        searchConditionDetail={searchConditionDetail}
                        conditionDetail={conditionDetail}
                        loading={loading}
                    />
                );
            default:
                return (
                    <div className="warranty-condition-message">
                        <h3>Chào mừng đến với Quản lý Điều kiện Bảo hành</h3>
                        <p>Chọn một chức năng ở trên để quản lý điều kiện bảo hành.</p>
                    </div>
                );
        }
    };

    useEffect(() => {
        if (activeTab === 'all-conditions' && selectedModelId && !showForm) {
            fetchWarrantyConditions(selectedModelId);
        } else if (activeTab === 'effective-conditions' && selectedModelId && !showForm) {
            fetchEffectiveConditions(selectedModelId);
        } else if (activeTab === 'detail-lookup') {
            setConditionDetail(null);
            setSearchValue('');
        }
    }, [activeTab, selectedModelId, showForm]);

    return (
        <div className="warranty-condition-page-wrapper">
            {/* Header Card */}
            <div className="warranty-condition-page-header">
                <button onClick={handleBackClick} className="warranty-condition-back-to-dashboard-button">
                    ← Quay lại Bảng điều khiển
                </button>
                <h2 className="warranty-condition-page-title">Quản lý Điều kiện Bảo hành</h2>

                {/* Vehicle Model Selector */}
                <div className="warranty-condition-model-selector-wrapper">
                    <VehicleModelSelector
                        selectedModelId={selectedModelId}
                        onModelChange={handleModelChange}
                        vehicleModels={vehicleModels}
                        loading={loading}
                        modelSearchQuery={modelSearchQuery}
                        setModelSearchQuery={setModelSearchQuery}
                        modelSearchResults={modelSearchResults}
                        setModelSearchResults={setModelSearchResults}
                        showModelResults={showModelResults}
                        setShowModelResults={setShowModelResults}
                    />
                </div>

                {/* Navigation Group */}
                <div className="warranty-condition-nav-bar-group">
                    <motion.div
                        className="warranty-condition-tab-nav-bar"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button
                            onClick={() => {
                                setActiveTab('all-conditions');
                                setShowForm(false);
                                setEditingCondition(null);
                            }}
                            className={`warranty-condition-tab-button ${activeTab === 'all-conditions' && !showForm ? 'active' : ''}`}
                        >
                            Tất cả Điều kiện
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('effective-conditions');
                                setShowForm(false);
                                setEditingCondition(null);
                            }}
                            className={`warranty-condition-tab-button ${activeTab === 'effective-conditions' && !showForm ? 'active' : ''}`}
                        >
                            Điều kiện Hiệu lực
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => {
                                    setActiveTab('create-edit');
                                    setShowForm(true);
                                    setEditingCondition(null);
                                }}
                                className={`warranty-condition-tab-button ${activeTab === 'create-edit' || showForm ? 'active' : ''}`}
                            >
                                Tạo Điều kiện Mới
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setActiveTab('detail-lookup');
                                setShowForm(false);
                                setEditingCondition(null);
                            }}
                            className={`warranty-condition-tab-button ${activeTab === 'detail-lookup' && !showForm ? 'active' : ''}`}
                        >
                            Tra cứu Chi tiết
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="warranty-condition-page-content-area">
                {renderActiveTabContent()}
            </div>
        </div>
    );
};

export default WarrantyConditionManagementPage;

