import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaPlusCircle, FaEye, FaTrash, FaPlus, FaPowerOff, FaEdit } from 'react-icons/fa';
import RequiredIndicator from '../../common/RequiredIndicator';
import { sanitizeYearListInput, parseYearList, isYearWithinRange, getMaxAllowedYear, MIN_YEAR } from '../../../utils/validation';
import './EVMRecallManagementPage.css';

// --- Field Constants ---
const PRIORITY_OPTIONS = ['An toàn Quan trọng', 'Cao', 'Trung bình', 'Thấp'];
const INITIAL_FORM_DATA = {
    title: '',
    description: '',
    status: 'draft', // Always send as draft initially
    affectedModels: [], // String input, comma-separated initially
    affectedYears: [], // String input, comma-separated initially
    actionRequired: '',
    priority: PRIORITY_OPTIONS[0],
    estimatedRepairHours: '',
    code: '', // RESTORED: Code field for optional input
    // REMOVED: releasedAt from initial data
};

// --- Confirmation/Success Screen Component ---
// (This component remains largely the same as before)
const RecallConfirmation = ({ recallData, onCreateNew, onActivate }) => {
    const [isActivating, setIsActivating] = useState(false);
    // Use optional chaining to safely access status
    const [campaignStatus, setCampaignStatus] = useState(recallData?.status || 'draft');

    const handleActivate = async () => {
        setIsActivating(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const updatedBy = user.username || 'unknown_staff';
            const token = user.token;
            const campaignId = recallData.id;
            
            // API PUT Call to activate the campaign
            // Backend expects status as a query parameter, not in request body
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/recall-campaigns/${campaignId}/status?status=active`,
                null, // No request body needed
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200 || response.status === 201) {
                toast.success('Chiến dịch thu hồi đã được kích hoạt thành công!', { position: 'top-right' });
                setCampaignStatus('active'); // Update local status
                // Call the onActivate prop to notify the parent component
                if(onActivate) {
                    onActivate();
                }
            } else {
                toast.error('Không thể kích hoạt chiến dịch thu hồi.', { position: 'top-right' });
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(`Kích hoạt thất bại: ${errorMessage}`, { position: 'top-right' });
        } finally {
            setIsActivating(false);
        }
    };
    
    // Helper function to format array fields safely. Returns 'N/A' if null/empty.
    const formatArray = (arr) => (Array.isArray(arr) && arr.length > 0) ? arr.join(', ') : 'N/A';

    // Renders a detail row using the new CSS classes
    const renderDetailRow = (label, value) => {
        // Handle 0 or null/undefined/empty string by showing 'N/A'
        let displayValue = value === null || value === undefined || value === '' ? 'N/A' : value;

        // Special handling for numbers that might be 0 but should be displayed
        if (typeof value === 'number' && value === 0) {
            displayValue = 0;
        }
        
        // Final check to handle array conversion before rendering
        if (Array.isArray(value)) {
            displayValue = formatArray(value);
        } else if (label === 'Repair Hours' && value && value !== 'N/A') {
             displayValue = `${value} giờ`;
        } else if (label === 'Creation Date' && value && value !== 'N/A') {
            try {
                // Ensure we use the value for date parsing
                displayValue = new Date(value).toLocaleDateString('vi-VN');
            } catch (e) {
                displayValue = 'Ngày không hợp lệ';
            }
        }

        return (
            <div className="detail-row">
                <strong>{label}</strong> 
                <span className="detail-value">{displayValue}</span>
            </div>
        );
    };

    // Use "active" for consistency with the API call
    const statusColor = campaignStatus === 'active' ? '#34c759' : '#ff9500'; // Green for Active, Orange for Draft
    const statusText = campaignStatus.toUpperCase();

    return (
        <motion.div
            className="recall-confirmation-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="recall-confirmation-content">
                <FaCheckCircle className="recall-confirmation-icon" />
                <h3 className="recall-confirmation-title">
                    {campaignStatus === 'active' ? 'Chiến dịch đã được Kích hoạt!' : 'Chiến dịch Thu hồi đã được Tạo dưới dạng Nháp!'}
                </h3>
                
                <div className="recall-campaign-details">
                    
                    {/* --- 1. KEY IDENTIFICATION & STATUS --- */}
                    <h4>Nhận dạng & Trạng thái Chính:</h4>
                    <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                        {renderDetailRow('ID', recallData.id)}
                        {renderDetailRow('Mã', recallData.code)}
                        <div className="detail-row">
                            <strong>TRẠNG THÁI</strong>
                            <span className="detail-value" style={{ color: statusColor, fontWeight: 700 }}>{statusText}</span>
                        </div>
                    </div>

                    {/* --- 2. SCOPE AND LOGISTICS --- */}
                    <h4 style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>Phạm vi & Hậu cần:</h4>
                    <div className="detail-grid">
                        {renderDetailRow('Tiêu đề', recallData.title)}
                        {renderDetailRow('Mức độ Ưu tiên', recallData.priority)}
                        {renderDetailRow('Mẫu Bị ảnh hưởng', recallData.affectedModels)}
                        {renderDetailRow('Năm Bị ảnh hưởng', recallData.affectedYears)}
                        {renderDetailRow('Giờ Sửa chữa Ước tính', 
                            recallData.estimatedRepairHours != null 
                                ? `${recallData.estimatedRepairHours} giờ` 
                                : 'N/A')}
                        {renderDetailRow('Ngày Tạo', recallData.createdAt)}
                    </div>
                    
                    {/* --- 3. INSTRUCTIONS (Full Width Blocks) --- */}
                    <h4 style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>Hướng dẫn:</h4>

                    <div className="instruction-block">
                        <strong>Mô tả (Chi tiết Vấn đề):</strong> 
                        <p>{recallData.description}</p>
                    </div>
                    
                    <div className="instruction-block">
                        <strong>Hành động Yêu cầu (Trung tâm Dịch vụ):</strong>
                        <p>{recallData.actionRequired}</p>
                    </div>

                </div>

                <div className="recall-action-buttons">
                    <button onClick={onCreateNew} className="recall-secondary-action-btn">
                        <FaPlusCircle style={{ marginRight: '0.5rem' }} /> Tạo Chiến dịch Thu hồi Mới
                    </button>
                    
                    {campaignStatus === 'draft' && (
                        <button 
                            onClick={handleActivate} 
                            className="recall-primary-action-btn"
                            disabled={isActivating}
                        >
                            {isActivating ? 'Đang kích hoạt...' : <><FaExclamationTriangle style={{ marginRight: '0.5rem' }} /> Kích hoạt Chiến dịch Thu hồi</>}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Helper function to generate next campaign code
const generateNextCampaignCode = (latestCode) => {
    if (!latestCode) {
        // If no previous code exists, start with RC-2025-001
        const currentYear = new Date().getFullYear();
        return `RC-${currentYear}-001`;
    }

    // Try to parse code in format RC-YYYY-NNN or similar
    const match = latestCode.match(/^(.+?)-(\d{4})-(\d+)([A-Z]*)$/i);
    if (match) {
        const [, prefix, year, number, suffix] = match;
        const currentYear = new Date().getFullYear();
        const codeYear = parseInt(year);
        let nextNumber = parseInt(number) + 1;
        let nextSuffix = suffix || '';

        // If year changed, reset to 001
        if (codeYear !== currentYear) {
            nextNumber = 1;
            nextSuffix = '';
        }

        // Format number with leading zeros
        const formattedNumber = String(nextNumber).padStart(3, '0');
        return `${prefix}-${currentYear}-${formattedNumber}${nextSuffix}`;
    }

    // If format doesn't match, try simpler pattern: extract last number
    const numberMatch = latestCode.match(/(\d+)([A-Z]*)$/);
    if (numberMatch) {
        const [, number, suffix] = numberMatch;
        const nextNumber = parseInt(number) + 1;
        const formattedNumber = String(nextNumber).padStart(3, '0');
        return latestCode.replace(/\d+[A-Z]*$/, `${formattedNumber}${suffix}`);
    }

    // Fallback: append -001
    return `${latestCode}-001`;
};

// --- Form Component ---
const NewRecallEventForm = ({ onCreationSuccess }) => {
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [isLoading, setIsLoading] = useState(false);
    const [vehicleModels, setVehicleModels] = useState([]);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [codeLoading, setCodeLoading] = useState(false);
    
    // New state for affected models with years
    const [affectedModelYears, setAffectedModelYears] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [availableYears, setAvailableYears] = useState([]);
    const [affectedVehiclesCount, setAffectedVehiclesCount] = useState(0);
    const [loadingVehicleCount, setLoadingVehicleCount] = useState(false);
    
    const maxAllowedYear = getMaxAllowedYear();

    // Fetch vehicle models on mount
    useEffect(() => {
        const fetchVehicleModels = async () => {
            setModelsLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const token = user.token;
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/vehicle-models/active`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (response.status === 200) {
                    setVehicleModels(response.data);
                }
            } catch (err) {
                toast.error('Không thể tải danh sách mẫu xe.', { position: 'top-right' });
            } finally {
                setModelsLoading(false);
            }
        };
        fetchVehicleModels();
    }, []);

    // Fetch latest campaign code and auto-generate next code
    useEffect(() => {
        const fetchLatestCampaignCode = async () => {
            setCodeLoading(true);
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const token = user.token;
                // Fetch first page with reasonable size to find the latest campaign
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/recall-campaigns?page=0&size=100`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (response.status === 200 && response.data.content && response.data.content.length > 0) {
                    // Find the campaign with the latest createdAt
                    const campaigns = response.data.content;
                    const latestCampaign = campaigns.reduce((latest, current) => {
                        const latestDate = new Date(latest.createdAt || 0);
                        const currentDate = new Date(current.createdAt || 0);
                        return currentDate > latestDate ? current : latest;
                    });
                    const latestCode = latestCampaign.code;
                    const nextCode = generateNextCampaignCode(latestCode);
                    setFormData(prev => ({ ...prev, code: nextCode }));
                } else {
                    // No campaigns exist yet, use default
                    const defaultCode = generateNextCampaignCode(null);
                    setFormData(prev => ({ ...prev, code: defaultCode }));
                }
            } catch (err) {
                // If error, use default code
                const defaultCode = generateNextCampaignCode(null);
                setFormData(prev => ({ ...prev, code: defaultCode }));
            } finally {
                setCodeLoading(false);
            }
        };
        fetchLatestCampaignCode();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Fetch available years and vehicle count when model is selected
    useEffect(() => {
        const fetchVehicleData = async () => {
            if (!selectedModelId) {
                setAvailableYears([]);
                setSelectedYear('');
                setAffectedVehiclesCount(0);
                return;
            }

            setLoadingVehicleCount(true);
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const token = user.token;
                
                // Get all vehicles to find years for this model
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/vehicles`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (response.status === 200) {
                    const selectedModel = vehicleModels.find(m => m.id === parseInt(selectedModelId));
                    if (!selectedModel) return;

                    // Filter vehicles by model name and extract unique years
                    const modelVehicles = response.data.filter(v => 
                        v.model === selectedModel.name || 
                        (v.vehicleModelType && v.vehicleModelType === selectedModel.type)
                    );

                    // Get unique years from vehicles of this model
                    const years = [...new Set(modelVehicles
                        .map(v => v.year)
                        .filter(year => year != null && isYearWithinRange(year))
                        .sort((a, b) => b - a) // Sort descending
                    )];

                    setAvailableYears(years);

                    // Auto-select the most recent year if available
                    if (years.length > 0) {
                        const mostRecentYear = years[0];
                        setSelectedYear(mostRecentYear.toString());
                        
                        // Count vehicles for this model and year
                        const count = modelVehicles.filter(v => v.year === mostRecentYear).length;
                        setAffectedVehiclesCount(count);
                    } else {
                        setSelectedYear('');
                        setAffectedVehiclesCount(0);
                    }
                }
            } catch (err) {
                console.error('Error fetching vehicle data:', err);
                setAvailableYears([]);
                setSelectedYear('');
                setAffectedVehiclesCount(0);
            } finally {
                setLoadingVehicleCount(false);
            }
        };

        fetchVehicleData();
    }, [selectedModelId, vehicleModels]);

    // Update vehicle count when year changes
    useEffect(() => {
        const updateVehicleCount = async () => {
            if (!selectedModelId || !selectedYear) {
                setAffectedVehiclesCount(0);
                return;
            }

            setLoadingVehicleCount(true);
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                const token = user.token;
                
                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/vehicles`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );

                if (response.status === 200) {
                    const selectedModel = vehicleModels.find(m => m.id === parseInt(selectedModelId));
                    if (!selectedModel) return;

                    const year = parseInt(selectedYear);
                    const modelName = selectedModel.name;
                    
                    // Use the same logic as backend: check model name (case-insensitive) or vehicleModelName
                    const count = response.data.filter(v => {
                        if (v.year !== year) return false;
                        
                        // Check if vehicle.model matches (case-insensitive) - same as backend
                        const modelMatches = v.model && 
                            v.model.toLowerCase() === modelName.toLowerCase();
                        
                        // Also check if vehicleModelName matches (case-insensitive) - same as backend
                        const vehicleModelMatches = v.vehicleModelName && 
                            v.vehicleModelName.toLowerCase() === modelName.toLowerCase();
                        
                        return modelMatches || vehicleModelMatches;
                    }).length;

                    setAffectedVehiclesCount(count);
                }
            } catch (err) {
                console.error('Error counting vehicles:', err);
                setAffectedVehiclesCount(0);
            } finally {
                setLoadingVehicleCount(false);
            }
        };

        updateVehicleCount();
    }, [selectedYear, selectedModelId, vehicleModels]);

    // Handle adding a model+year combination
    const handleAddModelYear = () => {
        if (!selectedModelId) {
            toast.error('Vui lòng chọn mẫu xe.', { position: 'top-right' });
            return;
        }
        if (!selectedYear) {
            toast.error('Vui lòng chọn năm.', { position: 'top-right' });
            return;
        }

        const year = parseInt(selectedYear);
        if (!isYearWithinRange(year)) {
            toast.error(`Năm ${year} phải nằm trong khoảng ${MIN_YEAR} - ${maxAllowedYear}.`, { position: 'top-right' });
            return;
        }

        const selectedModel = vehicleModels.find(m => m.id === parseInt(selectedModelId));
        if (!selectedModel) {
            toast.error('Mẫu xe không hợp lệ.', { position: 'top-right' });
            return;
        }

        // Check for duplicate model
        if (affectedModelYears.some(item => item.modelId === selectedModel.id)) {
            toast.error('Mẫu xe này đã được thêm vào danh sách. Mỗi mẫu xe chỉ có thể thêm một lần.', { position: 'top-right' });
            return;
        }

        // Add to list
        const newItem = {
            modelId: selectedModel.id,
            modelName: selectedModel.name,
            modelCode: selectedModel.code,
            year: year,
            affectedCount: affectedVehiclesCount
        };
        setAffectedModelYears(prev => [...prev, newItem]);
        
        // Update formData arrays
        const updatedModels = [...affectedModelYears.map(item => item.modelName), selectedModel.name];
        const updatedYears = [...affectedModelYears.map(item => item.year), year];
        setFormData(prev => ({
            ...prev,
            affectedModels: updatedModels,
            affectedYears: updatedYears
        }));

        // Reset selection
        setSelectedModelId('');
        setSelectedYear('');
        setAvailableYears([]);
        setAffectedVehiclesCount(0);
    };

    // Handle removing a model+year combination
    const handleRemoveModelYear = (index) => {
        const updated = affectedModelYears.filter((_, i) => i !== index);
        setAffectedModelYears(updated);
        
        // Update formData arrays
        setFormData(prev => ({
            ...prev,
            affectedModels: updated.map(item => item.modelName),
            affectedYears: updated.map(item => item.year)
        }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (affectedModelYears.length === 0) {
            toast.error('Vui lòng thêm ít nhất một mẫu xe bị ảnh hưởng.', { position: 'top-right' });
            return;
        }

        // Validate all years
        const invalidYears = affectedModelYears.filter(item => !isYearWithinRange(item.year));
        if (invalidYears.length > 0) {
            toast.error(`Các năm bị ảnh hưởng phải nằm trong khoảng ${MIN_YEAR} - ${maxAllowedYear}.`, { position: 'top-right' });
            return;
        }

        setIsLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const createdBy = user.username || 'unknown_staff';
            const token = user.token;
            
            // Construct the final payload for the API
            const payload = {
                ...formData,
                createdBy: createdBy,
                // Ensure array fields are sent correctly
                affectedModels: formData.affectedModels,
                affectedYears: formData.affectedYears,
                // Ensure numeric fields are correctly typed
                estimatedRepairHours: parseFloat(formData.estimatedRepairHours) || null,
            };
            
            delete payload.releasedAt; 

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/recall-campaigns`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200 || response.status === 201) {
                toast.success('Chiến dịch thu hồi đã được tạo dưới dạng nháp.', { position: 'top-right' });
                // Add the current creation time from the client side if the server doesn't return it immediately
                const responseData = { ...response.data, createdAt: new Date().toISOString() };
                onCreationSuccess(responseData); // Pass the full response data to the success screen
            } else {
                toast.error(`Không thể tạo chiến dịch thu hồi (Trạng thái: ${response.status}).`, { position: 'top-right' });
            }

        } catch (error) {
            const status = error.response?.status;
            if (status) {
                 toast.error(`Không thể tạo chiến dịch thu hồi (Trạng thái: ${status}).`, { position: 'top-right' });
            } else {
                toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="recall-form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3>Tạo Chiến dịch Thu hồi Mới</h3>
            <form onSubmit={handleSubmit}>
                <div className="recall-form-grid">
                    {/* Title (Full Width) */}
                    <div className="form-field full-width">
                        <label htmlFor="title" className="required-label">
                            Tiêu đề
                            <RequiredIndicator />
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="ví dụ: Cập nhật Hệ thống Quản lý Pin"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* Priority (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="priority" className="required-label">
                            Mức độ Ưu tiên
                            <RequiredIndicator />
                        </label>
                        <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            required
                        >
                            {PRIORITY_OPTIONS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    {/* Estimated Repair Hours (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="estimatedRepairHours">Giờ Sửa chữa Ước tính</label>
                        <input
                            type="number"
                            id="estimatedRepairHours"
                            name="estimatedRepairHours"
                            placeholder="ví dụ: 2.5 (để lập lịch cho kỹ thuật viên)"
                            value={formData.estimatedRepairHours}
                            onChange={handleChange}
                            min="0.1"
                            step="0.1"
                        />
                    </div>
                    
                    {/* Code Field (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="code" className="required-label">
                            Mã Chiến dịch
                            <RequiredIndicator />
                        </label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            placeholder="ví dụ: RC-2025-001A"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            disabled={codeLoading}
                        />
                        {codeLoading && (
                            <span className="affected-models-loading">
                                Đang tạo mã tự động...
                            </span>
                        )}
                    </div>

                    {/* Affected Models with Years (Full Width) */}
                    <div className="form-field full-width">
                        <label className="required-label">
                            Mẫu Bị ảnh hưởng
                            <RequiredIndicator />
                        </label>
                        <div className="affected-models-container">
                            {/* Add Model + Year Section */}
                            <div className="affected-models-add-section">
                                <select
                                    className="affected-models-select"
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    disabled={modelsLoading}
                                >
                                    <option value="">-- Chọn mẫu xe --</option>
                                    {vehicleModels
                                        .filter(model => !affectedModelYears.some(item => item.modelId === model.id))
                                        .map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} ({model.code})
                                            </option>
                                        ))}
                                </select>
                                <select
                                    className="affected-models-year-input"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    disabled={!selectedModelId || loadingVehicleCount || availableYears.length === 0}
                                >
                                    <option value="">
                                        {!selectedModelId 
                                            ? 'Chọn mẫu xe trước' 
                                            : loadingVehicleCount 
                                                ? 'Đang tải...' 
                                                : availableYears.length === 0 
                                                    ? 'Không có dữ liệu' 
                                                    : '-- Chọn năm --'}
                                    </option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="affected-models-add-btn"
                                    onClick={handleAddModelYear}
                                    disabled={!selectedModelId || !selectedYear || modelsLoading || loadingVehicleCount}
                                >
                                    <FaPlus /> Thêm
                                </button>
                            </div>
                            
                            {/* Display affected vehicles count */}
                            {selectedModelId && selectedYear && (
                                <div className="affected-vehicles-count-display">
                                    <strong>
                                        {loadingVehicleCount ? (
                                            'Đang đếm số xe bị ảnh hưởng...'
                                        ) : (
                                            `Số xe sẽ bị ảnh hưởng: ${affectedVehiclesCount} xe`
                                        )}
                                    </strong>
                                </div>
                            )}

                            {/* List of Added Models */}
                            {affectedModelYears.length > 0 ? (
                                <div className="affected-models-list">
                                    {affectedModelYears.map((item, index) => (
                                        <div
                                            key={`${item.modelId}-${item.year}-${index}`}
                                            className="affected-models-item"
                                        >
                                            <div className="affected-models-item-content">
                                                <div className="affected-models-item-info">
                                                    <span>{item.modelName}</span>
                                                    <span className="affected-models-item-code">({item.modelCode})</span>
                                                    <span>- Năm {item.year}</span>
                                                </div>
                                                {item.affectedCount !== undefined && (
                                                    <span className="affected-models-count-badge">
                                                        {item.affectedCount} xe
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                className="affected-models-remove-btn"
                                                onClick={() => handleRemoveModelYear(index)}
                                            >
                                                <FaTrash /> Xóa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="affected-models-empty">
                                    Chưa có mẫu xe nào được thêm. Vui lòng chọn mẫu xe và năm để thêm vào danh sách.
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Description (Full Width) */}
                    <div className="form-field full-width">
                        <label htmlFor="description" className="required-label">
                            Mô tả (Chi tiết Vấn đề)
                            <RequiredIndicator />
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Giải thích chi tiết về vấn đề an toàn hoặc tuân thủ."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* Action Required (Full Width) */}
                    <div className="form-field full-width">
                        <label htmlFor="actionRequired" className="required-label">
                            Hành động Yêu cầu (Hướng dẫn Dịch vụ)
                            <RequiredIndicator />
                        </label>
                        <textarea
                            id="actionRequired"
                            name="actionRequired"
                            placeholder="Tóm tắt rõ ràng về hành động trung tâm dịch vụ phải thực hiện (ví dụ: Thay thế phụ tùng X, Thực hiện cập nhật phần mềm Y)."
                            value={formData.actionRequired}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="recall-form-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Đang tạo Nháp...' : 'Tạo Chiến dịch Thu hồi (Nháp)'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// --- NEW: Wrapper Component for Creating a Campaign ---
// This component now manages the state of showing the form or the confirmation screen
const CreateRecallCampaign = () => {
    const [createdCampaign, setCreatedCampaign] = useState(null);

    const handleCreationSuccess = (data) => {
        setCreatedCampaign(data);
    };

    const handleCreateNew = () => {
        setCreatedCampaign(null);
    };

    // This function is passed to the confirmation screen
    // It updates the local state when activation is successful
    const handleActivationSuccess = () => {
        setCreatedCampaign(prev => ({ ...prev, status: 'active' }));
    };

    return (
        <>
            {createdCampaign ? (
                <RecallConfirmation 
                    recallData={createdCampaign} 
                    onCreateNew={handleCreateNew} 
                    onActivate={handleActivationSuccess} // Pass the handler
                />
            ) : (
                <NewRecallEventForm onCreationSuccess={handleCreationSuccess} />
            )}
        </>
    );
};


// --- NEW: Component to get and display all recall campaigns ---
const AllRecallCampaignsList = ({ sortOrder, statusFilter, userRole, onViewDetails }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState({}); // Track which campaign is being updated
  const isScStaff = userRole === 'SC_STAFF';
  const isEvmStaff = userRole === 'EVM_STAFF' || userRole === 'ADMIN';

  useEffect(() => {
    let isMounted = true;
    const fetchCampaigns = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/recall-campaigns`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        // The data is nested in a 'content' property
        if (response.status === 200 && isMounted && response.data.content) {
          toast.success('Đã tải danh sách chiến dịch thu hồi thành công!', { position: 'top-right' });
          setCampaigns(response.data.content);
        } else {
             toast.error('Không tìm thấy dữ liệu thu hồi.', { position: 'top-right' });
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Lỗi khi tải danh sách chiến dịch thu hồi.', { position: 'top-right' });
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
    fetchCampaigns();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // NEW: Filtering logic based on statusFilter
  const filteredCampaigns = campaigns.filter(campaign => {
      if (statusFilter === 'all') {
          return true;
      }
      if (statusFilter === 'active') {
          // Check for 'active' status
          return campaign.status === 'active';
      }
      if (statusFilter === 'draft') {
          return campaign.status === 'draft';
      }
      return true;
  });

  // Sorting logic based on createdAt, applied to the *filtered* list
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);

    if (sortOrder === 'desc') {
        return dateB - dateA; // Newest (descending date) first
    } else {
        return dateA - dateB; // Oldest (ascending date) first
    }
  });
  
  const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
          return new Date(dateString).toLocaleDateString('vi-VN');
      } catch (e) {
          return 'Ngày không hợp lệ';
      }
  };
  
  // Helper to render status with a specific class
  const renderStatus = (status) => {
      const statusClass = `status-${status.toLowerCase()}`;
      return <span className={`status-badge ${statusClass}`}>{status.toUpperCase()}</span>;
  };

  // Handle status update: active ↔ draft
  const handleUpdateStatus = async (campaignId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [campaignId]: true }));
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/recall-campaigns/${campaignId}/status?status=${newStatus}`,
        null,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200) {
        const statusText = newStatus === 'active' ? 'kích hoạt' : 'chuyển về nháp';
        toast.success(`Chiến dịch đã được ${statusText} thành công!`, { position: 'top-right' });
        // Update local state
        setCampaigns(prevCampaigns => 
          prevCampaigns.map(campaign => 
            campaign.id === campaignId 
              ? { ...campaign, status: newStatus }
              : campaign
          )
        );
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(`Không thể cập nhật trạng thái: ${errorMessage}`, { position: 'top-right' });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  if (loading) {
    return <div className="loading-message">Đang tải danh sách chiến dịch thu hồi...</div>;
  }

  if (sortedCampaigns.length === 0) {
    if (statusFilter !== 'all') {
        return <div className="loading-message">Không tìm thấy chiến dịch nào phù hợp với bộ lọc "{statusFilter}".</div>;
    }
    return <div className="loading-message">Không tìm thấy chiến dịch thu hồi nào.</div>;
  }

  return (
    <motion.div
      className="recall-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="recall-table-wrapper">
        <table className="recall-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Ngày Phát hành</th>
              <th>Ngày Tạo</th>
              <th>Được Tạo bởi</th>
              {(isScStaff || isEvmStaff) && <th>Hành động</th>}
            </tr>
          </thead>
          <tbody>
            {sortedCampaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td data-label="Mã">{campaign.code}</td>
                <td data-label="Tiêu đề">{campaign.title}</td>
                <td data-label="Trạng thái">{renderStatus(campaign.status)}</td>
                <td data-label="Ngày Phát hành">{formatDate(campaign.releasedAt)}</td>
                <td data-label="Ngày Tạo">{formatDate(campaign.createdAt)}</td>
                <td data-label="Được Tạo bởi">{campaign.createdBy}</td>
                {(isScStaff || isEvmStaff) && (
                  <td data-label="Hành động">
                    <div className="recall-action-buttons">
                      <button
                        onClick={() => onViewDetails(campaign.id)}
                        className="recall-view-details-button"
                        title="Xem chi tiết"
                      >
                        <FaEye />
                      </button>
                      {isEvmStaff && (
                        <>
                          {campaign.status === 'draft' && (
                            <button
                              onClick={() => handleUpdateStatus(campaign.id, 'active')}
                              className="recall-view-details-button"
                              title="Kích hoạt chiến dịch"
                              disabled={updatingStatus[campaign.id]}
                            >
                              {updatingStatus[campaign.id] ? (
                                <span className="spinner">...</span>
                              ) : (
                                <FaPowerOff />
                              )}
                            </button>
                          )}
                          {campaign.status === 'active' && (
                            <button
                              onClick={() => handleUpdateStatus(campaign.id, 'draft')}
                              className="recall-view-details-button"
                              title="Chuyển về nháp"
                              disabled={updatingStatus[campaign.id]}
                            >
                              {updatingStatus[campaign.id] ? (
                                <span className="spinner">...</span>
                              ) : (
                                <FaEdit />
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
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


// --- REMOVED: Recall Campaign Detail Modal Component ---
// This component has been moved to RecallCampaignDetailPage.js
// Component code removed - see RecallCampaignDetailPage.js for the new implementation

// --- Main Page Component (Refactored for Navigation) ---
// MODIFIED: Accept userRole and onViewCampaignDetail as props
const EVMRecallManagementPage = ({ handleBackClick, userRole, onViewCampaignDetail }) => {
    // MODIFIED: Check role
    const isEvmStaff = userRole === 'EVM_STAFF';
    const isScStaff = userRole === 'SC_STAFF';

    const [activeFunction, setActiveFunction] = useState('getAll'); // Default to 'getAll'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' is newest first (default)
    
    // MODIFIED: Set statusFilter based on role
    const [statusFilter, setStatusFilter] = useState(isEvmStaff ? 'all' : 'active');

    const handleViewDetails = (campaignId) => {
      if (onViewCampaignDetail) {
        onViewCampaignDetail(campaignId);
      }
    };

    const renderActiveFunction = () => {
        switch (activeFunction) {
          case 'getAll':
            return <AllRecallCampaignsList sortOrder={sortOrder} statusFilter={statusFilter} userRole={userRole} onViewDetails={handleViewDetails} />;
          case 'createNew':
            // MODIFIED: Only allow EVM staff to create new campaigns
            return isEvmStaff ? <CreateRecallCampaign /> : <AllRecallCampaignsList sortOrder={sortOrder} statusFilter={statusFilter} userRole={userRole} onViewDetails={handleViewDetails} />;
          default:
            return <AllRecallCampaignsList sortOrder={sortOrder} statusFilter={statusFilter} userRole={userRole} onViewDetails={handleViewDetails} />;
        }
    };

    return (
        <div className="recall-page-wrapper">
            <div className="recall-page-header">
                <button onClick={handleBackClick} className="recall-back-button">
                    ← Quay lại Bảng điều khiển
                </button>
                <h2 className="recall-page-title">Quản lý Thu hồi EVM</h2>

                {/* --- NEW: Header Nav Group Container (from CustomerPage) --- */}
                <div className="recall-header-nav-group">
                    <motion.div
                      className="recall-function-nav-bar"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <button
                        onClick={() => setActiveFunction('getAll')}
                        className={activeFunction === 'getAll' ? 'active' : ''}
                      >
                        Tất cả Chiến dịch Thu hồi
                      </button>
                      
                      {/* MODIFIED: Only show 'Create New' button to EVM_STAFF */}
                      {isEvmStaff && (
                        <button
                          onClick={() => setActiveFunction('createNew')}
                          className={activeFunction === 'createNew' ? 'active' : ''}
                        >
                          Tạo Chiến dịch Mới
                        </button>
                      )}
                    </motion.div>
                    
                    {/* --- NEW: Sorting Buttons (from CustomerPage) --- */}
                    {activeFunction === 'getAll' && (
                      <motion.div
                        className="recall-sort-button-group"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                      >
                        <span>Sắp xếp theo Ngày Tạo:</span> 
                        <button
                          onClick={() => setSortOrder('desc')} // Mới nhất Trước
                          className={sortOrder === 'desc' ? 'active' : ''}
                        >
                          Mới nhất Trước
                        </button>
                        <button
                          onClick={() => setSortOrder('asc')} // Cũ nhất Trước
                          className={sortOrder === 'asc' ? 'active' : ''}
                        >
                          Cũ nhất Trước
                        </button>
                      </motion.div>
                    )}
                    
                    {/* --- NEW: Filtering Buttons --- */}
                    {/* MODIFIED: Only show filters to EVM_STAFF */}
                    {isEvmStaff && activeFunction === 'getAll' && (
                      <motion.div
                        className="recall-filter-button-group"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <span>Lọc theo Trạng thái:</span> 
                        <button
                          onClick={() => setStatusFilter('all')}
                          className={statusFilter === 'all' ? 'active' : ''}
                        >
                          Tất cả
                        </button>
                        <button
                          onClick={() => setStatusFilter('active')}
                          className={statusFilter === 'active' ? 'active' : ''}
                        >
                          Hoạt động
                        </button>
                        <button
                          onClick={() => setStatusFilter('draft')}
                          className={statusFilter === 'draft' ? 'active' : ''}
                        >
                          Nháp
                        </button>
                      </motion.div>
                    )}
                </div>
            </div>
            
            <div className="recall-page-content-area">
                {renderActiveFunction()}
            </div>
        </div>
    );
};

export default EVMRecallManagementPage;