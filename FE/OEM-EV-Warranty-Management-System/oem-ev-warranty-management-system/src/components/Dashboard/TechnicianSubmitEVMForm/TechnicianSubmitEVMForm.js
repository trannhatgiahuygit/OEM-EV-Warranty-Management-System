// TechnicianSubmitEVMForm.js

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaSave } from 'react-icons/fa';
// --- MODIFIED IMPORT ---
import './TechnicianSubmitEVMForm.css'; 

const TechnicianSubmitEVMForm = ({ claimId, claimNumber, onSubmissionSuccess, handleBackClick }) => {
    const [submissionNotes, setSubmissionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!submissionNotes) {
            toast.warn('Ghi chú Gửi là bắt buộc trước khi gửi đến EVM.');
            return;
        }

        setIsSubmitting(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user.token;
            
            const payload = {
                claimId: claimId,
                submissionNotes: submissionNotes,
            };

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/claims/submit`,
                payload,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.status === 200) {
                // Success case
                toast.success('Yêu cầu đã được gửi để Phê duyệt EVM thành công! Trạng thái yêu cầu hiện là ĐANG CHỜ PHÊ DUYỆT EVM.');
                // Trigger the success handler to return to the detail page and refresh the data
                onSubmissionSuccess(response.data); 
            } else {
                // Handle unexpected 2xx status codes if necessary
                 toast.info(`Gửi thành công với mã trạng thái: ${response.status}.`);
                 onSubmissionSuccess(response.data);
            }

        } catch (error) {
            let errorMessage = `Đã xảy ra lỗi khi gửi Yêu cầu ${claimNumber}.`;
            if (error.response) {
                errorMessage = error.response.data?.message || `Lỗi: ${error.response.status} - ${error.response.statusText}`;
            } else if (error.request) {
                errorMessage = 'Không có phản hồi từ máy chủ. Kiểm tra kết nối mạng.';
            } else {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            // --- MODIFIED CLASSES ---
            className="tsef-page-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="tsef-page-header">
                <button onClick={handleBackClick} className="tsef-back-button">
                    ← Quay lại Chi tiết Yêu cầu
                </button>
                <h2 className="tsef-page-title">
                    Gửi Chẩn đoán để Phê duyệt EVM - Yêu cầu {claimNumber}
                </h2>
                <p className="tsef-page-description">
                    Hoàn tất báo cáo chẩn đoán và gửi đến Nhân viên EVM để phê duyệt chi phí cuối cùng.
                </p>
            </div>

            <div className="tsef-content-area">
                <motion.form 
                    onSubmit={handleSubmit}
                    className="tsef-form-grid"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                    <motion.div className="tsef-form-section tsef-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
                        <h3 className="tsef-section-title">Ghi chú Gửi</h3>
                        
                        <div className="tsef-form-group">
                            <label htmlFor="submissionNotes">Ghi chú Gửi *</label>
                            <textarea
                                id="submissionNotes"
                                value={submissionNotes}
                                onChange={(e) => setSubmissionNotes(e.target.value)}
                                placeholder="Nhập bất kỳ ghi chú cuối cùng hoặc đề xuất cho nhóm phê duyệt EVM (Bắt buộc)."
                                required
                                rows="8"
                            />
                        </div>

                    </motion.div>

                    <motion.div 
                        className="tsef-submit-area tsef-full-width"
                        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    >
                        <button
                            type="submit"
                            className="tsef-submit-button"
                            disabled={isSubmitting || !submissionNotes} 
                        >
                            <FaSave /> {isSubmitting ? 'Đang gửi...' : 'Gửi đến EVM để Phê duyệt'}
                        </button>
                    </motion.div>
                </motion.form>
            </div>
        </motion.div>
    );
};

export default TechnicianSubmitEVMForm;