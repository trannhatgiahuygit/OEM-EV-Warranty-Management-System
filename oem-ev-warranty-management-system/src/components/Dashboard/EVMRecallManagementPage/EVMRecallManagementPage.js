import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle, FaPlusCircle } from 'react-icons/fa';
import './EVMRecallManagementPage.css';

// --- Field Constants ---
const PRIORITY_OPTIONS = ['Safety Critical', 'High', 'Medium', 'Low'];
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
                toast.success('Recall campaign successfully Activated!', { position: 'top-right' });
                setCampaignStatus('released'); // Update local status
                // Call the onActivate prop to notify the parent component
                if(onActivate) {
                    onActivate();
                }
            } else {
                toast.error('Recall campaign activation failed.', { position: 'top-right' });
            }

        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            toast.error(`Activation failed: ${errorMessage}`, { position: 'top-right' });
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
             displayValue = `${value} hours`;
        } else if (label === 'Creation Date' && value && value !== 'N/A') {
            try {
                // Ensure we use the value for date parsing
                displayValue = new Date(value).toLocaleDateString();
            } catch (e) {
                displayValue = 'Invalid Date';
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
                    {campaignStatus === 'released' ? 'Campaign Activated!' : 'Recall Campaign Created as Draft!'}
                </h3>
                
                <div className="recall-campaign-details">
                    
                    {/* --- 1. KEY IDENTIFICATION & STATUS --- */}
                    <h4>Key Identification & Status:</h4>
                    <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                        {renderDetailRow('ID', recallData.id)}
                        {renderDetailRow('Code', recallData.code)}
                        <div className="detail-row">
                            <strong>STATUS</strong>
                            <span className="detail-value" style={{ color: statusColor, fontWeight: 700 }}>{statusText}</span>
                        </div>
                    </div>

                    {/* --- 2. SCOPE AND LOGISTICS --- */}
                    <h4 style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>Scope and Logistics:</h4>
                    <div className="detail-grid">
                        {renderDetailRow('Title', recallData.title)}
                        {renderDetailRow('Priority', recallData.priority)}
                        {renderDetailRow('Affected Models', recallData.affectedModels)}
                        {renderDetailRow('Affected Years', recallData.affectedYears)}
                        {renderDetailRow('Repair Hours', recallData.estimatedRepairHours)}
                        {renderDetailRow('Creation Date', recallData.createdAt)}
                    </div>
                    
                    {/* --- 3. INSTRUCTIONS (Full Width Blocks) --- */}
                    <h4 style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>Instructions:</h4>

                    <div className="instruction-block">
                        <strong>Description (Issue Details):</strong> 
                        <p>{recallData.description}</p>
                    </div>
                    
                    <div className="instruction-block">
                        <strong>Action Required (Service Center):</strong>
                        <p>{recallData.actionRequired}</p>
                    </div>

                </div>

                <div className="recall-action-buttons">
                    <button onClick={onCreateNew} className="recall-secondary-action-btn">
                        <FaPlusCircle style={{ marginRight: '0.5rem' }} /> Create New Recall Campaign
                    </button>
                    
                    {campaignStatus === 'draft' && (
                        <button 
                            onClick={handleActivate} 
                            className="recall-primary-action-btn"
                            disabled={isActivating}
                        >
                            {isActivating ? 'Activating...' : <><FaExclamationTriangle style={{ marginRight: '0.5rem' }} /> Activate Recall Campaign</>}
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
        const { value } = e.target;
        setYearInput(value);
        // Process array value immediately for API payload readiness
        const arrayValue = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const finalValue = arrayValue.map(s => parseInt(s)).filter(n => !isNaN(n));
        setFormData(prev => ({ ...prev, affectedYears: finalValue }));
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
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
                toast.success('Recall campaign created as draft.', { position: 'top-right' });
                // Add the current creation time from the client side if the server doesn't return it immediately
                const responseData = { ...response.data, createdAt: new Date().toISOString() };
                onCreationSuccess(responseData); // Pass the full response data to the success screen
            } else {
                toast.error(`Recall campaign creation failed (Status: ${response.status}).`, { position: 'top-right' });
            }

        } catch (error) {
            const status = error.response?.status;
            if (status) {
                 toast.error(`Recall campaign creation failed (Status: ${status}).`, { position: 'top-right' });
            } else {
                toast.error('Network error. Please try again later.', { position: 'top-right' });
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
            <h3>Create New Recall Campaign</h3>
            <form onSubmit={handleSubmit}>
                <div className="recall-form-grid">
                    {/* Title (Full Width) */}
                    <div className="form-field full-width">
                        <label htmlFor="title">Title <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            placeholder="e.g., Battery Management System Update"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* Priority (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="priority">Priority <span style={{ color: 'red' }}>*</span></label>
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
                        <label htmlFor="estimatedRepairHours">Estimated Repair Hours</label>
                        <input
                            type="number"
                            id="estimatedRepairHours"
                            name="estimatedRepairHours"
                            placeholder="e.g., 2.5 (for technician scheduling)"
                            value={formData.estimatedRepairHours}
                            onChange={handleChange}
                            min="0.1"
                            step="0.1"
                        />
                    </div>
                    
                    {/* Affected Models (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="affectedModels">Affected Models (Comma-Separated) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            id="affectedModels"
                            name="affectedModels"
                            placeholder="e.g., Model S, Model X"
                            value={modelInput}
                            onChange={handleModelChange}
                            required
                        />
                    </div>

                    {/* Affected Years (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="affectedYears">Affected Years (Comma-Separated) <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            id="affectedYears"
                            name="affectedYears"
                            placeholder="e.g., 2022, 2023"
                            value={yearInput}
                            onChange={handleYearChange}
                            required
                        />
                    </div>
                    
                    {/* RESTORED: Code Field (Multi-Column Field) */}
                    <div className="form-field">
                        <label htmlFor="code">Campaign Code <span style={{ color: 'red' }}>*</span></label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            placeholder="e.g., RC-2025-001A"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* Description (Full Width) */}
                    <div className="form-field full-width">
                        <label htmlFor="description">Description (Issue Details) <span style={{ color: 'red' }}>*</span></label>
                        <textarea
                            id="description"
                            name="description"
                            placeholder="Detailed explanation of the safety or compliance issue."
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* Action Required (Full Width) */}
                    <div className="form-field full-width">
                        <label htmlFor="actionRequired">Action Required (Service Instructions) <span style={{ color: 'red' }}>*</span></label>
                        <textarea
                            id="actionRequired"
                            name="actionRequired"
                            placeholder="Clear summary of the action the service center must take (e.g., Replace part X, Perform software update Y)."
                            value={formData.actionRequired}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="recall-form-submit-btn" disabled={isLoading}>
                        {isLoading ? 'Creating Draft...' : 'Create Recall Campaign (Draft)'}
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
          toast.success('Recall campaigns fetched successfully!', { position: 'top-right' });
          setCampaigns(response.data.content);
        } else {
             toast.error('Could not find recall data.', { position: 'top-right' });
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Error fetching recall campaigns.', { position: 'top-right' });
          } else {
            toast.error('Network error. Please try again later.', { position: 'top-right' });
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
          return new Date(dateString).toLocaleDateString();
      } catch (e) {
          return 'Invalid Date';
      }
  };
  
  // Helper to render status with a specific class
  const renderStatus = (status) => {
      const statusClass = `status-${status.toLowerCase()}`;
      return <span className={`status-badge ${statusClass}`}>{status.toUpperCase()}</span>;
  };

  if (loading) {
    return <div className="loading-message">Loading recall campaigns...</div>;
  }

  if (sortedCampaigns.length === 0) {
    if (statusFilter !== 'all') {
        return <div className="loading-message">No campaigns found matching the filter "{statusFilter}".</div>;
    }
    return <div className="loading-message">No recall campaigns found.</div>;
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
              <th>Code</th>
              <th>Title</th>
              <th>Status</th>
              <th>Released At</th>
              <th>Created At</th>
              <th>Created By</th>
            </tr>
          </thead>
          <tbody>
            {sortedCampaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td data-label="Code">{campaign.code}</td>
                <td data-label="Title">{campaign.title}</td>
                <td data-label="Status">{renderStatus(campaign.status)}</td>
                <td data-label="Released At">{formatDate(campaign.releasedAt)}</td>
                <td data-label="Created At">{formatDate(campaign.createdAt)}</td>
                <td data-label="Created By">{campaign.createdBy}</td>
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
                    ← Back to Dashboard
                </button>
                <h2 className="recall-page-title">EVM Recall Management</h2>

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
                        All Recall Campaigns
                      </button>
                      
                      {/* MODIFIED: Only show 'Create New' button to EVM_STAFF */}
                      {isEvmStaff && (
                        <button
                          onClick={() => setActiveFunction('createNew')}
                          className={activeFunction === 'createNew' ? 'active' : ''}
                        >
                          Create New Campaign
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
                        <span>Sort by Creation Date:</span> 
                        <button
                          onClick={() => setSortOrder('desc')} // Latest First
                          className={sortOrder === 'desc' ? 'active' : ''}
                        >
                          Latest First
                        </button>
                        <button
                          onClick={() => setSortOrder('asc')} // Oldest First
                          className={sortOrder === 'asc' ? 'active' : ''}
                        >
                          Oldest First
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
                        <span>Filter by Status:</span> 
                        <button
                          onClick={() => setStatusFilter('all')}
                          className={statusFilter === 'all' ? 'active' : ''}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setStatusFilter('active')}
                          className={statusFilter === 'active' ? 'active' : ''}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setStatusFilter('draft')}
                          className={statusFilter === 'draft' ? 'active' : ''}
                        >
                          Draft
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