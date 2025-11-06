// ClaimReopenPage.js 
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from '../EVMClaimActionModal/ClaimContextCard'; 
import '../EVMClaimActionModal/EVMClaimActionForm.css'; // Shared styles

const initialFormData = {
    reopenReason: '',
    diagnosticNotes: '',
    additionalActions: '',
    estimatedRepairTime: '',
    notifyCustomer: false,
};

const ClaimReopenPage = ({ 
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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.reopenReason || formData.reopenReason.trim() === '') {
            toast.error('Lý do mở lại yêu cầu là bắt buộc.');
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

            // Update claim status to OPEN (English status code)
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/status`,
                { 
                    status: 'OPEN' // English status code
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (response.status === 200) {
                toast.success(`Yêu cầu ${claimNumber} đã được mở lại thành công!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Không thể mở lại yêu cầu.`;
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
                <h2 className="evm-action-title">Mở lại Yêu cầu - {claimNumber}</h2>
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
                    
                    {/* --- REOPEN REASON SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="reopenReason">Lý do Mở lại Yêu cầu</label>
                        <textarea 
                            id="reopenReason"
                            name="reopenReason" 
                            value={formData.reopenReason} 
                            onChange={handleChange} 
                            required
                            rows="4"
                            placeholder="Cung cấp lý do rõ ràng để mở lại yêu cầu này. Ví dụ: Khách hàng phản ánh vấn đề sau khi bàn giao, cần kiểm tra thêm, v.v..."
                        />
                    </div>

                    {/* --- DIAGNOSTIC AND ACTIONS SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                            {/* Empty separator */}
                        </div>

                        {/* Diagnostic Notes */}
                        <div className="form-group full-width">
                            <label htmlFor="diagnosticNotes">Ghi chú Chẩn đoán Mới</label>
                            <textarea 
                                id="diagnosticNotes"
                                name="diagnosticNotes" 
                                value={formData.diagnosticNotes} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Nhập thông tin chẩn đoán mới nếu có (sẽ được cập nhật vào yêu cầu)..."
                            />
                        </div>

                        {/* Additional Actions */}
                        <div className="form-group full-width">
                            <label htmlFor="additionalActions">Hành động Bổ sung Cần thực hiện</label>
                            <textarea 
                                id="additionalActions"
                                name="additionalActions" 
                                value={formData.additionalActions} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Mô tả các hành động cần thực hiện để giải quyết vấn đề..."
                            />
                        </div>

                        {/* Estimated Repair Time */}
                        <div className="form-group">
                            <label htmlFor="estimatedRepairTime">Thời gian Sửa chữa Ước tính</label>
                            <input 
                                type="text" 
                                id="estimatedRepairTime"
                                name="estimatedRepairTime" 
                                value={formData.estimatedRepairTime} 
                                onChange={handleChange} 
                                placeholder="Ví dụ: 2-3 ngày, 1 tuần"
                            />
                        </div>

                        {/* Checkbox Group */}
                        <div className="form-group full-width">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="notifyCustomer" 
                                    name="notifyCustomer" 
                                    checked={formData.notifyCustomer}
                                    onChange={handleChange}
                                />
                                <label htmlFor="notifyCustomer">Thông báo cho khách hàng về việc mở lại yêu cầu</label>
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
                            {isSubmitting ? 'Đang xử lý...' : 'Mở lại Yêu cầu'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ClaimReopenPage;

