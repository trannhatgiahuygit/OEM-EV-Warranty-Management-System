// WorkDonePage.js 
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from '../EVMClaimActionModal/ClaimContextCard'; 
import '../EVMClaimActionModal/EVMClaimActionForm.css'; // Shared styles

const initialFormData = {
    workNotes: '',
    repairSummary: '',
    testResults: '',
    partsUsed: '',
    issuesEncountered: '',
    recommendations: '',
};

const WorkDonePage = ({ 
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
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.workNotes || formData.workNotes.trim() === '') {
            toast.error('Ghi chú công việc là bắt buộc.');
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

            // Combine all notes into a single notes field for the API
            let combinedNotes = formData.workNotes;
            if (formData.repairSummary) {
                combinedNotes += `\n\nTóm tắt Sửa chữa:\n${formData.repairSummary}`;
            }
            if (formData.testResults) {
                combinedNotes += `\n\nKết quả Kiểm tra:\n${formData.testResults}`;
            }
            if (formData.partsUsed) {
                combinedNotes += `\n\nPhụ tùng Đã sử dụng:\n${formData.partsUsed}`;
            }
            if (formData.issuesEncountered) {
                combinedNotes += `\n\nVấn đề Gặp phải:\n${formData.issuesEncountered}`;
            }
            if (formData.recommendations) {
                combinedNotes += `\n\nKhuyến nghị:\n${formData.recommendations}`;
            }

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/work-done`,
                null,
                {
                    params: { 
                        notes: combinedNotes
                    },
                    headers: { 
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            if (response.status === 200) {
                toast.success(`Công việc cho yêu cầu ${claimNumber} đã được đánh dấu hoàn thành thành công!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Không thể đánh dấu công việc hoàn thành.`;
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
                <h2 className="evm-action-title">Đánh dấu Công việc Hoàn thành - {claimNumber}</h2>
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
                    
                    {/* --- WORK NOTES SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="workNotes">Ghi chú Công việc</label>
                        <textarea 
                            id="workNotes"
                            name="workNotes" 
                            value={formData.workNotes} 
                            onChange={handleChange} 
                            required
                            rows="4"
                            placeholder="Nhập ghi chú về công việc đã hoàn thành, các bước đã thực hiện, và kết quả..."
                        />
                    </div>

                    {/* --- REPAIR DETAILS SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                            {/* Empty separator */}
                        </div>

                        {/* Repair Summary */}
                        <div className="form-group full-width">
                            <label htmlFor="repairSummary">Tóm tắt Sửa chữa</label>
                            <textarea 
                                id="repairSummary"
                                name="repairSummary" 
                                value={formData.repairSummary} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Mô tả tóm tắt về công việc sửa chữa đã thực hiện..."
                            />
                        </div>

                        {/* Test Results */}
                        <div className="form-group full-width">
                            <label htmlFor="testResults">Kết quả Kiểm tra</label>
                            <textarea 
                                id="testResults"
                                name="testResults" 
                                value={formData.testResults} 
                                onChange={handleChange} 
                                rows="3"
                                placeholder="Nhập kết quả kiểm tra sau khi sửa chữa (nếu có)..."
                            />
                        </div>

                        {/* Parts Used */}
                        <div className="form-group full-width">
                            <label htmlFor="partsUsed">Phụ tùng Đã sử dụng</label>
                            <textarea 
                                id="partsUsed"
                                name="partsUsed" 
                                value={formData.partsUsed} 
                                onChange={handleChange} 
                                rows="2"
                                placeholder="Liệt kê các phụ tùng đã được sử dụng trong quá trình sửa chữa..."
                            />
                        </div>

                        {/* Issues Encountered */}
                        <div className="form-group full-width">
                            <label htmlFor="issuesEncountered">Vấn đề Gặp phải</label>
                            <textarea 
                                id="issuesEncountered"
                                name="issuesEncountered" 
                                value={formData.issuesEncountered} 
                                onChange={handleChange} 
                                rows="2"
                                placeholder="Mô tả bất kỳ vấn đề nào gặp phải trong quá trình sửa chữa (nếu có)..."
                            />
                        </div>

                        {/* Recommendations */}
                        <div className="form-group full-width">
                            <label htmlFor="recommendations">Khuyến nghị</label>
                            <textarea 
                                id="recommendations"
                                name="recommendations" 
                                value={formData.recommendations} 
                                onChange={handleChange} 
                                rows="2"
                                placeholder="Nhập các khuyến nghị cho khách hàng hoặc cho lần bảo trì tiếp theo..."
                            />
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
                            {isSubmitting ? 'Đang xử lý...' : 'Đánh dấu Hoàn thành'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default WorkDonePage;

