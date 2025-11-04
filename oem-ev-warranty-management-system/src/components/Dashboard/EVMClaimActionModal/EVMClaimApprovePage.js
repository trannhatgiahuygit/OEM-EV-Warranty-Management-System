// EVMClaimApprovePage.js 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from './ClaimContextCard'; 
import './EVMClaimActionForm.css'; 

const initialApprovalData = {
    approvalNotes: '',
    warrantyCost: 0, 
    approvalReason: '',
    requiresPartsShipment: true,
    specialInstructions: '',
    internalNotes: '',
    companyPaidCost: '', 
};

const EVMClaimApprovePage = ({ 
    claimId, 
    claimNumber, 
    warrantyCost, // RENAMED PROP from estimatedCost
    vin, 
    reportedFailure, 
    onActionComplete, 
    handleBack 
}) => {
    // Debug: Log the warrantyCost prop received
    console.log('EVMClaimApprovePage - warrantyCost received:', warrantyCost, 'Type:', typeof warrantyCost);
    
    const [formData, setFormData] = useState({ 
        ...initialApprovalData, 
        warrantyCost: (warrantyCost === 0 || warrantyCost === undefined) ? '' : warrantyCost
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feesPaidConfirmation, setFeesPaidConfirmation] = useState(false); // Confirmation checkbox (not in payload)
    
    useEffect(() => {
        console.log('EVMClaimApprovePage - useEffect warrantyCost:', warrantyCost);
        setFormData(prev => ({ 
            ...prev, 
            warrantyCost: (warrantyCost === 0 || warrantyCost === undefined) ? '' : warrantyCost
        }));
    }, [warrantyCost]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' 
                ? checked 
                : (type === 'number' 
                    ? (value === '' ? '' : parseFloat(value)) 
                    : value),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.approvalReason || formData.approvalReason.trim() === '') {
            toast.error('Lý do phê duyệt là bắt buộc.');
            return;
        }

        if (!formData.warrantyCost || isNaN(formData.warrantyCost) || parseFloat(formData.warrantyCost) <= 0) {
            toast.error('Chi phí Bảo hành là bắt buộc và phải lớn hơn 0.');
            return;
        }

        if (!formData.companyPaidCost || isNaN(formData.companyPaidCost) || parseFloat(formData.companyPaidCost) <= 0) {
            toast.error('Chi phí Công ty Thanh toán là bắt buộc và phải lớn hơn 0.');
            return;
        }

        const warrantyCostNum = parseFloat(formData.warrantyCost);
        const companyPaidCostNum = parseFloat(formData.companyPaidCost);

        if (companyPaidCostNum < warrantyCostNum) {
            toast.error('Chi phí Công ty Thanh toán phải bằng hoặc cao hơn Chi phí Bảo hành.');
            return;
        }

        if (!formData.specialInstructions || formData.specialInstructions.trim() === '') {
            toast.error('Hướng dẫn Đặc biệt là bắt buộc.');
            return;
        }

        if (!formData.internalNotes || formData.internalNotes.trim() === '') {
            toast.error('Ghi chú Nội bộ là bắt buộc.');
            return;
        }

        if (!formData.approvalNotes || formData.approvalNotes.trim() === '') {
            toast.error('Ghi chú Phê duyệt EVM (Bên ngoài) là bắt buộc.');
            return;
        }

        if (!feesPaidConfirmation) {
            toast.error('Vui lòng xác nhận rằng tất cả phí đã được thanh toán cho Trung tâm Dịch vụ bởi EVM.');
            return;
        }

        // If Company Paid Cost is higher than Warranty Cost, ask for confirmation
        if (companyPaidCostNum > warrantyCostNum) {
            const confirmMessage = `Chi phí Công ty Thanh toán (₫${companyPaidCostNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) cao hơn Chi phí Bảo hành (₫${warrantyCostNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).\n\nĐiều này có đúng không?`;
            if (!window.confirm(confirmMessage)) {
                return; // User cancelled, don't submit
            }
        }

        setIsSubmitting(true);
        const endpoint = `${process.env.REACT_APP_API_URL}/api/evm/claims/${claimId}/approve`;
        
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            // Note: feesPaidConfirmation is NOT included in the payload
            const response = await axios.post(
                endpoint,
                formData,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );

            if (response.status === 200) {
                toast.success(`Yêu cầu ${claimNumber} đã được phê duyệt thành công!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Không thể phê duyệt yêu cầu.`;
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
                <h2 className="evm-action-title">Phê duyệt Yêu cầu - {claimNumber}</h2>
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
                    
                    {/* --- APPROVAL REASON SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="approvalReason">Lý do Phê duyệt</label>
                        <textarea 
                            id="approvalReason"
                            name="approvalReason" 
                            value={formData.approvalReason} 
                            onChange={handleChange} 
                            required
                            rows="3"
                            placeholder="Cung cấp lý do rõ ràng để phê duyệt yêu cầu này..."
                        />
                    </div>

                    {/* --- COSTS, INSTRUCTIONS, NOTES SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                            {/* Empty separator */}
                        </div>

                        {/* Cost Fields */}
                        <div className="form-group required">
                            <label htmlFor="warrantyCost">Chi phí Bảo hành (₫)</label>
                            <input 
                                type="number" 
                                id="warrantyCost"
                                name="warrantyCost" 
                                value={formData.warrantyCost} 
                                onChange={handleChange} 
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group required">
                            <label htmlFor="companyPaidCost">Chi phí Công ty Thanh toán (₫)</label>
                            <input 
                                type="number" 
                                id="companyPaidCost"
                                name="companyPaidCost" 
                                value={formData.companyPaidCost} 
                                onChange={handleChange} 
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Instructions (Full Width) */}
                        <div className="form-group full-width required">
                            <label htmlFor="specialInstructions">Hướng dẫn Đặc biệt</label>
                            <input 
                                type="text" 
                                id="specialInstructions"
                                name="specialInstructions" 
                                value={formData.specialInstructions} 
                                onChange={handleChange} 
                                required
                                placeholder="Bất kỳ hướng dẫn đặc biệt nào cho trung tâm dịch vụ..."
                            />
                        </div>
                        
                        {/* Internal Notes (Full Width) */}
                        <div className="form-group full-width required">
                            <label htmlFor="internalNotes">Ghi chú Nội bộ (Chỉ EVM)</label>
                            <textarea 
                                id="internalNotes"
                                name="internalNotes" 
                                value={formData.internalNotes} 
                                onChange={handleChange} 
                                required
                                rows="3"
                                placeholder="Ghi chú nội bộ chỉ hiển thị cho nhân viên EVM..."
                            />
                        </div>

                        {/* Approval Notes (External) (Full Width) */}
                        <div className="form-group full-width required">
                            <label htmlFor="approvalNotes">Ghi chú Phê duyệt EVM (Bên ngoài)</label>
                            <textarea 
                                id="approvalNotes"
                                name="approvalNotes" 
                                value={formData.approvalNotes} 
                                onChange={handleChange} 
                                required
                                rows="3"
                                placeholder="Ghi chú sẽ hiển thị cho trung tâm dịch vụ..."
                            />
                        </div>

                        {/* Checkbox Section (Full Width) */}
                        <div className="form-group full-width">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="requiresPartsShipment" 
                                    name="requiresPartsShipment" 
                                    checked={formData.requiresPartsShipment}
                                    onChange={handleChange}
                                />
                                <label htmlFor="requiresPartsShipment">Yêu cầu Vận chuyển Phụ tùng</label>
                            </div>
                        </div>

                        {/* Confirmation Checkbox (Full Width) - NOT in payload */}
                        <div className="form-group full-width required">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="feesPaidConfirmation" 
                                    checked={feesPaidConfirmation}
                                    onChange={(e) => setFeesPaidConfirmation(e.target.checked)}
                                    required
                                />
                                <label htmlFor="feesPaidConfirmation">Tất cả phí đã được thanh toán cho Trung tâm Dịch vụ bởi EVM</label>
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
                            className="evm-primary-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang phê duyệt...' : 'Phê duyệt & Hoàn tất'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EVMClaimApprovePage;