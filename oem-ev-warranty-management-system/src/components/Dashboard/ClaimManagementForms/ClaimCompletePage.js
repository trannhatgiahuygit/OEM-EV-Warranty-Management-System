// ClaimCompletePage.js 
import React, { useState } from 'react';
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
                    warrantyCost={warrantyCost} 
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
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="warrantyInfoProvided" 
                                    name="warrantyInfoProvided" 
                                    checked={formData.warrantyInfoProvided}
                                    onChange={handleChange}
                                />
                                <label htmlFor="warrantyInfoProvided">Đã cung cấp thông tin bảo hành cho khách hàng</label>
                            </div>
                            <div className="checkbox-group" style={{ marginTop: '0.5rem' }}>
                                <input 
                                    type="checkbox" 
                                    id="followUpRequired" 
                                    name="followUpRequired" 
                                    checked={formData.followUpRequired}
                                    onChange={handleChange}
                                />
                                <label htmlFor="followUpRequired">Yêu cầu theo dõi sau bàn giao</label>
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

