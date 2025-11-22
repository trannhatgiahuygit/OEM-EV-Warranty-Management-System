// ClaimCompletePage.js 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from '../EVMClaimActionModal/ClaimContextCard'; 
import '../EVMClaimActionModal/EVMClaimActionForm.css'; // Shared styles

const initialFormData = {
    handoverNotes: '',
    customerSignature: '',
    handoverLocation: '',
    vehicleConditionNotes: '',
    warrantyInfoProvided: false,
    followUpRequired: false,
    handoverPersonnel: '',
};

const ClaimCompletePage = ({ 
    claimId, 
    claimNumber, 
    vin, 
    reportedFailure, 
    warrantyCost,
    onActionComplete, 
    handleBack 
}) => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [claimData, setClaimData] = useState(null);

    // Fetch claim data to get total cost information
    useEffect(() => {
        const fetchClaimData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || !user.token) {
                    return;
                }

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/claims/${claimId}`,
                    { headers: { 'Authorization': `Bearer ${user.token}` } }
                );

                if (response.status === 200 && response.data) {
                    setClaimData(response.data);
                }
            } catch (error) {
                console.warn('Failed to fetch claim data:', error);
            }
        };

        fetchClaimData();
    }, [claimId]);

    // Auto-populate handover location and personnel on component mount
    useEffect(() => {
        const populateHandoverFields = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || !user.token) {
                    return;
                }

                // Fetch current user profile to get fullName
                try {
                    const userProfileResponse = await axios.get(
                        `${process.env.REACT_APP_API_URL}/api/users/profile`,
                        { headers: { 'Authorization': `Bearer ${user.token}` } }
                    );
                    
                    if (userProfileResponse.status === 200 && userProfileResponse.data) {
                        const userProfile = userProfileResponse.data;
                        
                        // Set personnel name from user profile
                        if (userProfile.fullName) {
                            setFormData(prev => ({
                                ...prev,
                                handoverPersonnel: userProfile.fullName
                            }));
                        }
                        
                        // Fetch service center information if serviceCenterId exists
                        if (userProfile.serviceCenterId) {
                            try {
                                const serviceCenterResponse = await axios.get(
                                    `${process.env.REACT_APP_API_URL}/api/service-centers/${userProfile.serviceCenterId}`,
                                    { headers: { 'Authorization': `Bearer ${user.token}` } }
                                );
                                
                                if (serviceCenterResponse.status === 200 && serviceCenterResponse.data) {
                                    const serviceCenter = serviceCenterResponse.data;
                                    // Use code and name or location for handover location
                                    const locationText = serviceCenter.code && serviceCenter.name 
                                        ? `${serviceCenter.code} - ${serviceCenter.name}`
                                        : (serviceCenter.location || serviceCenter.name || '');
                                    
                                    if (locationText) {
                                        setFormData(prev => ({
                                            ...prev,
                                            handoverLocation: locationText
                                        }));
                                    }
                                }
                            } catch (scError) {
                                console.warn('Failed to fetch service center:', scError);
                                // If service center fetch fails, try to use serviceCenterId as fallback
                                if (userProfile.serviceCenterId) {
                                    setFormData(prev => ({
                                        ...prev,
                                        handoverLocation: `Service Center ID: ${userProfile.serviceCenterId}`
                                    }));
                                }
                            }
                        }
                    }
                } catch (profileError) {
                    console.warn('Failed to fetch user profile:', profileError);
                    // Fallback: try to use localStorage user data
                    if (user.fullName) {
                        setFormData(prev => ({
                            ...prev,
                            handoverPersonnel: user.fullName
                        }));
                    }
                }
            } catch (error) {
                console.warn('Failed to populate handover fields:', error);
            }
        };

        populateHandoverFields();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.handoverNotes || formData.handoverNotes.trim() === '') {
            toast.error('Ghi chú bàn giao là bắt buộc.');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.token) {
                toast.error('Người dùng chưa được xác thực.');
                setIsSubmitting(false);
                return;
            }

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/claim-done`,
                null,
                {
                    params: { 
                        notes: formData.handoverNotes 
                    },
                    headers: { 
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (response.status === 200) {
                toast.success(`Yêu cầu ${claimNumber} đã được hoàn tất thành công!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Không thể hoàn tất yêu cầu.`;
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="evm-action-page-wrapper">
            <div className="evm-action-header">
                 <button onClick={handleBack} className="evm-back-button">
                    ← Quay lại Chi tiết
                </button>
                <h2 className="evm-action-title">Hoàn tất Yêu cầu - {claimNumber}</h2>
            </div>
            <motion.div 
                className="evm-action-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <ClaimContextCard
                    claimNumber={claimNumber}
                    vin={vin}
                    failure={reportedFailure}
                    warrantyCost={(() => {
                        // Determine the final total cost based on repair type
                        if (!claimData) {
                            // Fallback to warrantyCost if claim data not loaded yet
                            return warrantyCost;
                        }

                        // For SC_REPAIR: use totalEstimatedCost (the final total)
                        if (claimData.repairType === 'SC_REPAIR') {
                            return claimData.totalEstimatedCost || warrantyCost;
                        }

                        // For EVM_REPAIR: use warrantyCost or companyPaidCost (final costs)
                        if (claimData.repairType === 'EVM_REPAIR') {
                            // Prefer warrantyCost if available, otherwise companyPaidCost
                            return claimData.warrantyCost || claimData.companyPaidCost || warrantyCost;
                        }

                        // For other cases: use warrantyCost or companyPaidCost
                        return claimData.warrantyCost || claimData.companyPaidCost || warrantyCost;
                    })()} 
                />
                
                <form 
                    onSubmit={handleSubmit} 
                    className="evm-action-form"
                >
                    
                    {/* --- HANDOVER NOTES SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="handoverNotes">Ghi chú Bàn giao</label>
                        <textarea 
                            id="handoverNotes"
                            name="handoverNotes" 
                            value={formData.handoverNotes} 
                            onChange={handleChange} 
                            required
                            rows="4"
                            placeholder="Nhập thông tin về việc bàn giao xe cho khách hàng, tình trạng xe, và các ghi chú quan trọng..."
                        />
                    </div>

                    {/* --- HANDOVER DETAILS SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                            {/* Empty separator */}
                        </div>

                        {/* Handover Location */}
                        <div className="form-group">
                            <label htmlFor="handoverLocation">Địa điểm Bàn giao</label>
                            <input 
                                type="text" 
                                id="handoverLocation"
                                name="handoverLocation" 
                                value={formData.handoverLocation} 
                                onChange={handleChange} 
                                placeholder="Ví dụ: SC01-HN, SC02-HCM"
                                readOnly
                                style={{ 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    cursor: 'not-allowed',
                                    opacity: 0.8
                                }}
                            />
                        </div>

                        {/* Handover Personnel */}
                        <div className="form-group">
                            <label htmlFor="handoverPersonnel">Nhân viên Bàn giao</label>
                            <input 
                                type="text" 
                                id="handoverPersonnel"
                                name="handoverPersonnel" 
                                value={formData.handoverPersonnel} 
                                onChange={handleChange} 
                                placeholder="Tên nhân viên thực hiện bàn giao"
                                readOnly
                                style={{ 
                                    backgroundColor: 'var(--bg-secondary)', 
                                    cursor: 'not-allowed',
                                    opacity: 0.8
                                }}
                            />
                        </div>

                        {/* Customer Signature */}
                        <div className="form-group">
                            <label htmlFor="customerSignature">Chữ ký Khách hàng</label>
                            <input 
                                type="text" 
                                id="customerSignature"
                                name="customerSignature" 
                                value={formData.customerSignature} 
                                onChange={handleChange} 
                                placeholder="Tên khách hàng ký xác nhận"
                            />
                        </div>

                        {/* Vehicle Condition Notes */}
                        <div className="form-group full-width">
                            <label htmlFor="vehicleConditionNotes">Ghi chú Tình trạng Xe</label>
                            <textarea 
                                id="vehicleConditionNotes"
                                name="vehicleConditionNotes" 
                                value={formData.vehicleConditionNotes} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Mô tả tình trạng xe khi bàn giao (sạch sẽ, đầy đủ phụ kiện, v.v.)"
                            />
                        </div>

                        {/* Checkbox Group */}
                        <div className="form-group full-width">
                            <div className="checkbox-group" style={{ alignItems: 'flex-start' }}>
                                <input 
                                    type="checkbox" 
                                    id="warrantyInfoProvided" 
                                    name="warrantyInfoProvided" 
                                    checked={formData.warrantyInfoProvided}
                                    onChange={handleChange}
                                    style={{ marginTop: '0.25rem', flexShrink: 0 }}
                                />
                                <label htmlFor="warrantyInfoProvided" style={{ marginTop: 0, lineHeight: '1.5' }}>
                                    Đã cung cấp thông tin bảo hành cho khách hàng
                                </label>
                            </div>
                            <div className="checkbox-group" style={{ marginTop: '0.5rem', alignItems: 'flex-start' }}>
                                <input 
                                    type="checkbox" 
                                    id="followUpRequired" 
                                    name="followUpRequired" 
                                    checked={formData.followUpRequired}
                                    onChange={handleChange}
                                    style={{ marginTop: '0.25rem', flexShrink: 0 }}
                                />
                                <label htmlFor="followUpRequired" style={{ marginTop: 0, lineHeight: '1.5' }}>
                                    Yêu cầu theo dõi sau bàn giao
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* --- SUBMIT BUTTON --- */}
                    <div className="evm-action-actions">
                        <button 
                            type="button" 
                            onClick={handleBack}
                            className="evm-cancel-btn"
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="evm-primary-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất Yêu cầu'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ClaimCompletePage;

