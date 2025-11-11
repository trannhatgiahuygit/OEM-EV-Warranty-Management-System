// ProblemResolutionPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from '../EVMClaimActionModal/ClaimContextCard';
import './ProblemResolutionPage.css';

const initialResolutionData = {
    resolutionAction: '',
    resolutionNotes: '',
    trackingNumber: '',
    estimatedArrival: '',
};

const ProblemResolutionPage = ({
    claimId,
    claimNumber,
    vin,
    reportedFailure,
    warrantyCost,
    problemType,
    problemDescription,
    onActionComplete,
    handleBack
}) => {
    const [formData, setFormData] = useState(initialResolutionData);
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
                }
            } catch (err) {
                console.error('Error fetching claim details:', err);
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

        if (!formData.resolutionAction) {
            toast.error('Vui lòng chọn hành động giải quyết.');
            return;
        }

        if (!formData.resolutionNotes || formData.resolutionNotes.trim().length < 10) {
            toast.error('Ghi chú giải quyết phải có ít nhất 10 ký tự.');
            return;
        }

        setIsSubmitting(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const payload = {
                resolutionAction: formData.resolutionAction,
                resolutionNotes: formData.resolutionNotes.trim(),
                ...(formData.trackingNumber && { trackingNumber: formData.trackingNumber.trim() }),
                ...(formData.estimatedArrival && { estimatedArrival: formData.estimatedArrival }),
            };

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/evm/claims/${claimId}/resolve-problem`,
                payload,
                {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }
            );

            if (response.status === 200) {
                toast.success('Vấn đề đã được giải quyết thành công!');
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = 'Không thể giải quyết vấn đề.';
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="problem-resolution-page-wrapper">
            <div className="problem-resolution-header">
                <button onClick={handleBack} className="problem-resolution-back-button">
                    ← Quay lại Chi tiết
                </button>
                <h2 className="problem-resolution-title">Giải quyết Vấn đề - {claimNumber}</h2>
            </div>
            <motion.div
                className="problem-resolution-content"
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

                {/* Problem Information Display */}
                {(problemType || problemDescription || (claim && (claim.problemType || claim.problemDescription))) && (
                    <div className="problem-info-card">
                        <h3 className="problem-info-title">Thông tin Vấn đề đã Báo cáo</h3>
                        <div className="problem-info-details">
                            {(problemType || (claim && claim.problemType)) && (
                                <div className="problem-info-item">
                                    <strong>Loại vấn đề:</strong>
                                    <span>{problemType || claim.problemType}</span>
                                </div>
                            )}
                            {(problemDescription || (claim && claim.problemDescription)) && (
                                <div className="problem-info-item">
                                    <strong>Mô tả:</strong>
                                    <span>{problemDescription || claim.problemDescription}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="problem-resolution-form">
                    {/* Resolution Action Selection */}
                    <div className="form-group required full-width">
                        <label htmlFor="resolutionAction">Hành động Giải quyết</label>
                        <select
                            id="resolutionAction"
                            name="resolutionAction"
                            value={formData.resolutionAction}
                            onChange={handleChange}
                            required
                            className="resolution-action-select"
                        >
                            <option value="">-- Chọn hành động giải quyết --</option>
                            <option value="PARTS_SHIPPED">Đã gửi phụ tùng (PARTS_SHIPPED)</option>
                            <option value="APPROVED_ALTERNATIVE">Phê duyệt giải pháp thay thế (APPROVED_ALTERNATIVE)</option>
                            <option value="CUSTOMER_CONTACTED">Đã liên hệ khách hàng (CUSTOMER_CONTACTED)</option>
                        </select>
                    </div>

                    {/* Resolution Notes */}
                    <div className="form-group required full-width">
                        <label htmlFor="resolutionNotes">Ghi chú Giải quyết</label>
                        <textarea
                            id="resolutionNotes"
                            name="resolutionNotes"
                            value={formData.resolutionNotes}
                            onChange={handleChange}
                            required
                            rows="5"
                            minLength="10"
                            placeholder="Mô tả chi tiết cách giải quyết vấn đề (tối thiểu 10 ký tự)..."
                        />
                        <div className="char-count">
                            {formData.resolutionNotes.length}/1000 ký tự
                        </div>
                    </div>

                    {/* Tracking Number (conditional) */}
                    {formData.resolutionAction === 'PARTS_SHIPPED' && (
                        <motion.div
                            className="form-group full-width"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <label htmlFor="trackingNumber">Số Theo dõi Vận chuyển (Tùy chọn)</label>
                            <input
                                type="text"
                                id="trackingNumber"
                                name="trackingNumber"
                                value={formData.trackingNumber}
                                onChange={handleChange}
                                placeholder="Nhập số tracking nếu có"
                            />
                        </motion.div>
                    )}

                    {/* Estimated Arrival (conditional) */}
                    {formData.resolutionAction === 'PARTS_SHIPPED' && (
                        <motion.div
                            className="form-group"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <label htmlFor="estimatedArrival">Ngày Dự kiến Nhận hàng (Tùy chọn)</label>
                            <input
                                type="date"
                                id="estimatedArrival"
                                name="estimatedArrival"
                                value={formData.estimatedArrival}
                                onChange={handleChange}
                            />
                        </motion.div>
                    )}

                    {/* Actions */}
                    <div className="problem-resolution-actions">
                        <button
                            type="button"
                            className="problem-resolution-cancel-btn"
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="problem-resolution-submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang giải quyết...' : 'Giải quyết Vấn đề'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ProblemResolutionPage;

