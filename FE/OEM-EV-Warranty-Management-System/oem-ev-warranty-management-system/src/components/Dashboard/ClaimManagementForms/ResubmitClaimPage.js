// ResubmitClaimPage.js 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from '../EVMClaimActionModal/ClaimContextCard'; 
import '../EVMClaimActionModal/EVMClaimActionForm.css'; // Shared styles

const initialFormData = {
    revisedDiagnostic: '',
    responseToRejection: '',
    additionalEvidence: []
};

const ResubmitClaimPage = ({ 
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
    const [claim, setClaim] = useState(null);

    useEffect(() => {
        const fetchClaimDetails = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || !user.token) return;

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/claims/${claimId}`,
                    {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    }
                );

                if (response.status === 200) {
                    setClaim(response.data);
                    // Pre-fill form with existing diagnosis
                    setFormData(prev => ({
                        ...prev,
                        revisedDiagnostic: response.data.diagnosticSummary || response.data.initialDiagnosis || ''
                    }));
                }
            } catch (err) {
                console.error('Error fetching claim details:', err);
                toast.error('Không thể tải chi tiết yêu cầu.');
            }
        };

        if (claimId) {
            fetchClaimDetails();
        }
    }, [claimId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!formData.revisedDiagnostic || formData.revisedDiagnostic.trim().length < 20) {
            toast.error('Chẩn đoán đã sửa đổi phải có ít nhất 20 ký tự.');
            return;
        }

        if (!formData.responseToRejection || formData.responseToRejection.trim().length < 10) {
            toast.error('Phản hồi về việc từ chối phải có ít nhất 10 ký tự.');
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

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/resubmit`,
                {
                    revisedDiagnostic: formData.revisedDiagnostic.trim(),
                    responseToRejection: formData.responseToRejection.trim(),
                    additionalEvidence: formData.additionalEvidence || []
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (response.status === 200) {
                toast.success(`Yêu cầu ${claimNumber} đã được gửi lại thành công!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Không thể gửi lại yêu cầu.`;
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
                <h2 className="evm-action-title">Gửi lại Yêu cầu Bảo hành - {claimNumber}</h2>
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
                
                {/* Display Rejection Information if available */}
                {claim && (claim.rejectionReason || claim.rejectionNotes) && (
                    <div className="evm-rejection-info-card">
                        <h4 className="evm-rejection-info-title">Thông tin Từ chối</h4>
                        {claim.rejectionReason && (
                            <div className="evm-rejection-info-item">
                                <strong>Lý do từ chối:</strong>
                                <p>{claim.rejectionReason}</p>
                            </div>
                        )}
                        {claim.rejectionNotes && (
                            <div className="evm-rejection-info-item">
                                <strong>Ghi chú từ chối:</strong>
                                <p>{claim.rejectionNotes}</p>
                            </div>
                        )}
                        {claim.resubmitCount !== null && claim.resubmitCount !== undefined && (
                            <div className="evm-rejection-info-item">
                                <strong>Số lần đã gửi lại:</strong>
                                <p>{claim.resubmitCount} / 1</p>
                            </div>
                        )}
                    </div>
                )}
                
                <form 
                    onSubmit={handleSubmit} 
                    className="evm-action-form"
                >
                    
                    {/* --- REVISED DIAGNOSTIC SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="revisedDiagnostic">Chẩn đoán đã Sửa đổi</label>
                        <textarea 
                            id="revisedDiagnostic"
                            name="revisedDiagnostic" 
                            value={formData.revisedDiagnostic} 
                            onChange={handleChange} 
                            required
                            rows="6"
                            minLength={20}
                            maxLength={2000}
                            placeholder="Nhập chẩn đoán đã được sửa đổi dựa trên phản hồi từ EVM. Mô tả chi tiết các thay đổi và cải tiến trong chẩn đoán (tối thiểu 20 ký tự, tối đa 2000 ký tự)..."
                        />
                        <small className="form-hint">
                            {formData.revisedDiagnostic.length} / 2000 ký tự (tối thiểu 20 ký tự)
                        </small>
                    </div>

                    {/* --- RESPONSE TO REJECTION SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="responseToRejection">Phản hồi về Việc Từ chối</label>
                        <textarea 
                            id="responseToRejection"
                            name="responseToRejection" 
                            value={formData.responseToRejection} 
                            onChange={handleChange} 
                            required
                            rows="5"
                            minLength={10}
                            maxLength={1000}
                            placeholder="Giải thích cách bạn đã xử lý các vấn đề được nêu trong lý do từ chối. Mô tả các thay đổi, cải tiến hoặc bổ sung thông tin để giải quyết các vấn đề đã được chỉ ra (tối thiểu 10 ký tự, tối đa 1000 ký tự)..."
                        />
                        <small className="form-hint">
                            {formData.responseToRejection.length} / 1000 ký tự (tối thiểu 10 ký tự)
                        </small>
                    </div>

                    {/* --- INFORMATION SECTION --- */}
                    <div className="evm-form-grid">
                        <div className="form-group full-width form-section-separator">
                            {/* Empty separator */}
                        </div>

                        <div className="form-group full-width">
                            <div className="evm-info-box">
                                <strong>Lưu ý quan trọng:</strong>
                                <ul>
                                    <li>Bạn chỉ có thể gửi lại yêu cầu tối đa 1 lần sau khi bị từ chối.</li>
                                    <li>Hãy đảm bảo rằng bạn đã xử lý tất cả các vấn đề được nêu trong lý do từ chối.</li>
                                    <li>Chẩn đoán đã sửa đổi sẽ được thêm vào lịch sử chẩn đoán của yêu cầu.</li>
                                    <li>Sau khi gửi lại, yêu cầu sẽ chuyển sang trạng thái "Chờ Phê duyệt EVM".</li>
                                </ul>
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
                            {isSubmitting ? 'Đang gửi...' : 'Gửi lại Yêu cầu'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ResubmitClaimPage;

