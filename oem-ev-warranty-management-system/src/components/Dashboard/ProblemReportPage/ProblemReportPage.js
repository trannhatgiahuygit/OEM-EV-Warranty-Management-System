// ProblemReportPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from '../EVMClaimActionModal/ClaimContextCard';
import './ProblemReportPage.css';

const initialProblemData = {
    problemType: '',
    problemDescription: '',
    missingPartSerials: [],
    estimatedResolutionDays: null,
};

const ProblemReportPage = ({
    claimId,
    claimNumber,
    vin,
    reportedFailure,
    warrantyCost,
    onActionComplete,
    handleBack
}) => {
    const [formData, setFormData] = useState(initialProblemData);
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
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? (value === '' ? null : parseInt(value, 10)) : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.problemType) {
            toast.error('Vui lòng chọn loại vấn đề.');
            return;
        }

        if (!formData.problemDescription || formData.problemDescription.trim().length < 10) {
            toast.error('Mô tả vấn đề phải có ít nhất 10 ký tự.');
            return;
        }

        setIsSubmitting(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const payload = {
                problemType: formData.problemType,
                problemDescription: formData.problemDescription.trim(),
                ...(formData.missingPartSerials.length > 0 && { missingPartSerials: formData.missingPartSerials }),
                ...(formData.estimatedResolutionDays && { estimatedResolutionDays: formData.estimatedResolutionDays }),
            };

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/report-problem`,
                payload,
                {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }
            );

            if (response.status === 200) {
                toast.success('Vấn đề đã được báo cáo thành công!');
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = 'Không thể báo cáo vấn đề.';
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="problem-report-page-wrapper">
            <div className="problem-report-header">
                <button onClick={handleBack} className="problem-back-button">
                    ← Quay lại Chi tiết
                </button>
                <h2 className="problem-report-title">Báo cáo Vấn đề - {claimNumber}</h2>
            </div>
            <motion.div
                className="problem-report-content"
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

                <form onSubmit={handleSubmit} className="problem-report-form">
                    {/* Problem Type Selection */}
                    <div className="form-group required full-width">
                        <label htmlFor="problemType">Loại Vấn đề</label>
                        <select
                            id="problemType"
                            name="problemType"
                            value={formData.problemType}
                            onChange={handleChange}
                            required
                            className="problem-type-select"
                        >
                            <option value="">-- Chọn loại vấn đề --</option>
                            <option value="PARTS_SHORTAGE">Thiếu phụ tùng (PARTS_SHORTAGE)</option>
                            <option value="WRONG_DIAGNOSIS">Chẩn đoán sai (WRONG_DIAGNOSIS)</option>
                            <option value="CUSTOMER_ISSUE">Vấn đề khách hàng (CUSTOMER_ISSUE)</option>
                            <option value="OTHER">Khác (OTHER)</option>
                        </select>
                    </div>

                    {/* Problem Description */}
                    <div className="form-group required full-width">
                        <label htmlFor="problemDescription">Mô tả Chi tiết Vấn đề</label>
                        <textarea
                            id="problemDescription"
                            name="problemDescription"
                            value={formData.problemDescription}
                            onChange={handleChange}
                            required
                            rows="5"
                            minLength="10"
                            placeholder="Mô tả chi tiết vấn đề gặp phải (tối thiểu 10 ký tự)..."
                        />
                        <div className="char-count">
                            {formData.problemDescription.length}/1000 ký tự
                        </div>
                    </div>

                    {/* Estimated Resolution Days */}
                    <div className="form-group">
                        <label htmlFor="estimatedResolutionDays">Số Ngày Dự kiến Giải quyết (Tùy chọn)</label>
                        <input
                            type="number"
                            id="estimatedResolutionDays"
                            name="estimatedResolutionDays"
                            value={formData.estimatedResolutionDays || ''}
                            onChange={handleChange}
                            min="1"
                            placeholder="Số ngày dự kiến"
                        />
                    </div>

                    {/* Actions */}
                    <div className="problem-report-actions">
                        <button
                            type="button"
                            className="problem-cancel-btn"
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="problem-submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi Báo cáo Vấn đề'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ProblemReportPage;

