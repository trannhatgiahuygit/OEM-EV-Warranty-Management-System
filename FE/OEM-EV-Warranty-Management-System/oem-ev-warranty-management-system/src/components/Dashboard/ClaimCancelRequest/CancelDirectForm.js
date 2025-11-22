// CancelDirectForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import RequiredIndicator from '../../common/RequiredIndicator';
import './CancelDirectForm.css';

const CancelDirectForm = ({ claimId, claimNumber, onCancel, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do hủy yêu cầu.');
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
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/cancel-direct`,
        {
          reason: reason.trim()
        },
        {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success('Yêu cầu đã được hủy thành công!');
        if (onSuccess) onSuccess();
        if (onCancel) onCancel();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Không thể hủy yêu cầu. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cancel-direct-modal-overlay" onClick={onCancel}>
      <motion.div 
        className="cancel-direct-modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="cancel-direct-modal-header">
          <h3>Xác nhận Hủy Yêu cầu</h3>
          <button className="cancel-direct-modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="cancel-direct-modal-body">
          <p className="cancel-direct-info">
            Yêu cầu: <strong>{claimNumber}</strong>
          </p>
          <p className="cancel-direct-warning">
            ⚠️ Khi hủy, claim sẽ chuyển sang trạng thái "CANCELED_READY_TO_HANDOVER" và bạn cần xác nhận trả xe cho khách hàng.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="cancel-direct-form-group">
              <label htmlFor="cancelReason" className="required-label">
                Lý do hủy yêu cầu
                <RequiredIndicator />
              </label>
              <textarea
                id="cancelReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do tại sao bạn hủy yêu cầu này..."
                rows={5}
                required
                maxLength={1000}
                disabled={isSubmitting}
              />
              <small className="cancel-direct-char-count">
                {reason.length}/1000 ký tự
              </small>
            </div>
            
            <div className="cancel-direct-modal-actions">
              <button
                type="button"
                className="cancel-direct-cancel-btn"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="cancel-direct-submit-btn"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Hủy'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CancelDirectForm;

