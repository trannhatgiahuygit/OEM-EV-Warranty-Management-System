// CancelRequestForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import RequiredIndicator from '../../common/RequiredIndicator';
import './CancelRequestForm.css';

const CancelRequestForm = ({ claimId, claimNumber, onCancel, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do yêu cầu hủy.');
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
        `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/request-cancel`,
        { reason: reason.trim() },
        {
          headers: { 
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'accept': '*/*'
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success('Yêu cầu hủy đã được gửi thành công!');
        if (onSuccess) onSuccess();
        if (onCancel) onCancel();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Không thể gửi yêu cầu hủy. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cancel-request-modal-overlay" onClick={onCancel}>
      <motion.div 
        className="cancel-request-modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="cancel-request-modal-header">
          <h3>Yêu cầu Hủy Yêu cầu</h3>
          <button className="cancel-request-modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="cancel-request-modal-body">
          <p className="cancel-request-info">
            Yêu cầu: <strong>{claimNumber}</strong>
          </p>
          <p className="cancel-request-warning">
            ⚠️ Yêu cầu hủy sẽ được gửi đến SC Staff để xem xét. Bạn chỉ có thể yêu cầu hủy tối đa 2 lần cho một claim.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="cancel-request-form-group">
              <label htmlFor="cancelReason" className="required-label">
                Lý do yêu cầu hủy
                <RequiredIndicator />
              </label>
              <textarea
                id="cancelReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do tại sao bạn muốn hủy yêu cầu này..."
                rows={5}
                required
                maxLength={1000}
                disabled={isSubmitting}
              />
              <small className="cancel-request-char-count">
                {reason.length}/1000 ký tự
              </small>
            </div>
            
            <div className="cancel-request-modal-actions">
              <button
                type="button"
                className="cancel-request-cancel-btn"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="cancel-request-submit-btn"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu cầu Hủy'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CancelRequestForm;

