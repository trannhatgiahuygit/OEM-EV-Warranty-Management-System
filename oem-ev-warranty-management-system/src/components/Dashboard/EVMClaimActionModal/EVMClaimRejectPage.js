// EVMClaimRejectPage.js 
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from './ClaimContextCard'; 
import './EVMClaimActionForm.css'; // Shared styles

const initialRejectionData = {
    rejectionReason: '',
    rejectionNotes: '',
    suggestedAction: '', 
    requiresAdditionalInfo: false,
    additionalInfoRequired: '',
    internalNotes: '',
    notifyCustomer: true,
};

const EVMClaimRejectPage = ({ 
    claimId, 
    claimNumber, 
    vin, 
    reportedFailure, 
    warrantyCost, // RENAMED PROP from estimatedCost
    onActionComplete, 
    handleBack 
}) => {
    const [formData, setFormData] = useState(initialRejectionData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.rejectionReason) {
            toast.error('Lý do từ chối là bắt buộc.');
            return;
        }

        setIsSubmitting(true);
        const endpoint = `${process.env.REACT_APP_API_URL}/api/evm/claims/${claimId}/reject`;
        
        const dataToSend = formData.requiresAdditionalInfo ? formData : { ...formData, additionalInfoRequired: '' };

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.post(
                endpoint,
                dataToSend,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );

            if (response.status === 200) {
                toast.success(`Yêu cầu ${claimNumber} đã được từ chối thành công!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Không thể từ chối yêu cầu.`;
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
                <h2 className="evm-action-title">Từ chối Yêu cầu - {claimNumber}</h2>
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
                    warrantyCost={warrantyCost} 
                />
                
                <form 
                    onSubmit={handleSubmit} 
                    className="evm-action-form"
                >
                    
                    {/* --- REJECTION REASON SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="rejectionReason">Lý do Từ chối</label>
                        <textarea 
                            id="rejectionReason"
                            name="rejectionReason" 
                            value={formData.rejectionReason} 
                            onChange={handleChange} 
                            required
                            rows="3"
                            placeholder="Cung cấp lý do rõ ràng để từ chối yêu cầu này..."
                        />
                    </div>
                    
                    {/* --- ADDITIONAL INFO/NOTES SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                           {/* Empty separator, used for visual break */}
                        </div>

                        <div className="form-group">
                            <label htmlFor="suggestedAction">Hành động Đề xuất cho Trung tâm Dịch vụ</label>
                            <input 
                                type="text" 
                                id="suggestedAction"
                                name="suggestedAction" 
                                value={formData.suggestedAction} 
                                onChange={handleChange} 
                                placeholder="Trung tâm dịch vụ nên thực hiện hành động gì?"
                            />
                        </div>
                        
                        {/* Checkbox Group and Conditional Input (Spans full width when needed) */}
                        <div className="form-group full-width">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="requiresAdditionalInfo" 
                                    name="requiresAdditionalInfo" 
                                    checked={formData.requiresAdditionalInfo}
                                    onChange={handleChange}
                                />
                                <label htmlFor="requiresAdditionalInfo">Yêu cầu Thông tin Bổ sung</label>
                            </div>
                            {formData.requiresAdditionalInfo && (
                                <motion.div 
                                    className="form-group" 
                                    style={{ marginTop: '1rem' }}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <label htmlFor="additionalInfoRequired">Thông tin Cụ thể Yêu cầu</label>
                                    <input 
                                        type="text" 
                                        id="additionalInfoRequired"
                                        name="additionalInfoRequired" 
                                        value={formData.additionalInfoRequired} 
                                        onChange={handleChange} 
                                        placeholder="Chỉ định thông tin bổ sung cần thiết..."
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* External Notes (Full Width) */}
                        <div className="form-group full-width">
                            <label htmlFor="rejectionNotes">Ghi chú Từ chối EVM (Bên ngoài)</label>
                            <textarea 
                                id="rejectionNotes"
                                name="rejectionNotes" 
                                value={formData.rejectionNotes} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Ghi chú sẽ hiển thị cho trung tâm dịch vụ..."
                            />
                        </div>

                        {/* Internal Notes (Full Width) */}
                        <div className="form-group full-width">
                            <label htmlFor="internalNotes">Ghi chú Nội bộ (Chỉ EVM)</label>
                            <textarea 
                                id="internalNotes"
                                name="internalNotes" 
                                value={formData.internalNotes} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Ghi chú nội bộ chỉ hiển thị cho nhân viên EVM..."
                            />
                        </div>

                        {/* Checkbox Section (Full Width) */}
                        <div className="form-group full-width">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="notifyCustomer" 
                                    name="notifyCustomer" 
                                    checked={formData.notifyCustomer}
                                    onChange={handleChange}
                                />
                                <label htmlFor="notifyCustomer">Thông báo Khách hàng về Việc Từ chối</label>
                            </div>
                        </div>
                    </div>
                    
                    <div className="evm-action-actions">
                        <button 
                            type="button" 
                            className="evm-cancel-btn" 
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="evm-reject-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang từ chối...' : 'Từ chối Yêu cầu'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EVMClaimRejectPage;