import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaPlusCircle } from 'react-icons/fa';
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
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/recall-campaigns/${campaignId}/status`,
                {
                    status: "released", // Use "released" instead of "active" for better lifecycle clarity
                    updatedBy: updatedBy
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200 || response.status === 201) {
                toast.success('Chiến dịch thu hồi đã được kích hoạt thành công!', { position: 'top-right' });
                setCampaignStatus('released'); // Update local status
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

    // Use "released" for consistency with the API call
    const statusColor = campaignStatus === 'released' ? '#34c759' : '#ff9500'; // Green for Released, Orange for Draft
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
                    {campaignStatus === 'released' ? 'Chiến dịch đã được Kích hoạt!' : 'Chiến dịch Thu hồi đã được Tạo dưới dạng Nháp!'}
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
                        {renderDetailRow('Giờ Sửa chữa', recallData.estimatedRepairHours)}
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

// --- Form Component ---
// (This component remains largely the same as before)
const NewRecallEventForm = ({ onCreationSuccess }) => {
    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [isLoading, setIsLoading] = useState(false);

    // Separate state to manage comma-separated input strings for arrays
    const [modelInput, setModelInput] = useState('');
    const [yearInput, setYearInput] = useState('');
    const [yearInputError, setYearInputError] = useState('');
    const maxAllowedYear = getMaxAllowedYear();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleModelChange = (e) => {
        const { value } = e.target;
        setModelInput(value);
        // Process array value immediately for API payload readiness
        const arrayValue = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        setFormData(prev => ({ ...prev, affectedModels: arrayValue }));
    };

    const handleYearChange = (e) => {
        const sanitizedValue = sanitizeYearListInput(e.target.value);
        setYearInput(sanitizedValue);
        const parsedYears = parseYearList(sanitizedValue);
        const invalidYear = parsedYears.find(year => !isYearWithinRange(year));

        if (invalidYear !== undefined) {
            setYearInputError(`Năm ${invalidYear} phải nằm trong khoảng ${MIN_YEAR} - ${maxAllowedYear}.`);
        } else {
            setYearInputError('');
        }

        setFormData(prev => ({ ...prev, affectedYears: parsedYears }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (yearInputError) {
            toast.error(yearInputError, { position: 'top-right' });
            return;
        }

        if (!formData.affectedYears.length) {
            toast.error('Vui lòng nhập ít nhất một năm bị ảnh hưởng hợp lệ.', { position: 'top-right' });
            return;
        }

        const invalidYears = formData.affectedYears.filter(year => !isYearWithinRange(year));
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
                    
                    {/* Affected Models (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="affectedModels" className="required-label">
                            Mẫu Bị ảnh hưởng (Phân cách bằng dấu phẩy)
                            <RequiredIndicator />
                        </label>
                        <input
                            type="text"
                            id="affectedModels"
                            name="affectedModels"
                            placeholder="ví dụ: Model S, Model X"
                            value={modelInput}
                            onChange={handleModelChange}
                            required
                        />
                    </div>

                    {/* Affected Years (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="affectedYears" className="required-label">
                            Năm Bị ảnh hưởng (Phân cách bằng dấu phẩy)
                            <RequiredIndicator />
                        </label>
                        <input
                            type="text"
                            id="affectedYears"
                            name="affectedYears"
                            placeholder="ví dụ: 2022, 2023"
                            value={yearInput}
                            onChange={handleYearChange}
                            required
                            className={yearInputError ? 'recall-input-error' : ''}
                        />
                        {yearInputError && (
                            <span className="recall-field-error">{yearInputError}</span>
                        )}
                    </div>
                    
                    {/* RESTORED: Code Field (Multi-Column Field) */}
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
                        />
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
        setCreatedCampaign(prev => ({ ...prev, status: 'released' }));
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
const AllRecallCampaignsList = ({ sortOrder, statusFilter }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

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
          // Check for both 'active' and 'released' as they are used for the active state
          return campaign.status === 'active' || campaign.status === 'released';
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};


// --- Main Page Component (Refactored for Navigation) ---
// MODIFIED: Accept userRole as a prop
const EVMRecallManagementPage = ({ handleBackClick, userRole }) => {
    // MODIFIED: Check role
    const isEvmStaff = userRole === 'EVM_STAFF';

    const [activeFunction, setActiveFunction] = useState('getAll'); // Default to 'getAll'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' is newest first (default)
    
    // MODIFIED: Set statusFilter based on role
    const [statusFilter, setStatusFilter] = useState(isEvmStaff ? 'all' : 'active');

    const renderActiveFunction = () => {
        switch (activeFunction) {
          case 'getAll':
            return <AllRecallCampaignsList sortOrder={sortOrder} statusFilter={statusFilter} />;
          case 'createNew':
            // MODIFIED: Only allow EVM staff to create new campaigns
            return isEvmStaff ? <CreateRecallCampaign /> : <AllRecallCampaignsList sortOrder={sortOrder} statusFilter={statusFilter} />;
          default:
            return <AllRecallCampaignsList sortOrder={sortOrder} statusFilter={statusFilter} />;
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