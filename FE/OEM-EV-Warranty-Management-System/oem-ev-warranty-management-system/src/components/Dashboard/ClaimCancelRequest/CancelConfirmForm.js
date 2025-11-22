// CancelConfirmForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import RequiredIndicator from '../../common/RequiredIndicator';
import './CancelConfirmForm.css';

const CancelConfirmForm = ({ claimId, claimNumber, cancelReason, onCancel, onSuccess }) => {
  const [action, setAction] = useState('approve'); // 'approve' or 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postWithFallback = async (endpoints, payload, headers) => {
    let lastError = null;
    for (const ep of endpoints) {
      try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}${ep}`, payload, { headers });
        if (res.status === 200 || res.status === 201) return res;
      } catch (e) {
        lastError = e;
        // Try next variant on 404/405/401; break only on 2xx
        const status = e?.response?.status;
        if (![401, 403, 404, 405].includes(status)) {
          // Unknown error → stop early
          break;
        }
      }
    }
    throw lastError || new Error('All endpoint variants failed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (action === 'reject' && !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối hủy.');
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

      // Use Swagger-defined endpoints
      const endpoints = action === 'approve'
        ? [`/api/claims/${claimId}/cancel/accept`]
        : [`/api/claims/${claimId}/cancel/reject`];

      const payload = action === 'reject' 
        ? { reason: rejectReason.trim() }
        : {};

      const response = await postWithFallback(endpoints, payload, {
        'Authorization': `Bearer ${user.token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'accept': '*/*'
      });

      if (response.status === 200 || response.status === 201) {
        const message = action === 'approve' 
          ? 'Yêu cầu hủy đã được chấp nhận.'
          : 'Yêu cầu hủy đã bị từ chối.';
        toast.success(message);
        if (onSuccess) onSuccess();
        if (onCancel) onCancel();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Không thể xử lý yêu cầu hủy. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cancel-confirm-modal-overlay" onClick={onCancel}>
      <motion.div 
        className="cancel-confirm-modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="cancel-confirm-modal-header">
          <h3>Xử lý Yêu cầu Hủy</h3>
          <button className="cancel-confirm-modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="cancel-confirm-modal-body">
          <p className="cancel-confirm-info">
            Yêu cầu: <strong>{claimNumber}</strong>
          </p>
          
          {cancelReason && (
            <div className="cancel-confirm-reason-box">
              <p className="cancel-confirm-reason-label">Lý do yêu cầu hủy từ Technician:</p>
              <p className="cancel-confirm-reason-text">{cancelReason}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="cancel-confirm-action-group">
              <label className="cancel-confirm-action-label">Hành động:</label>
              <div className="cancel-confirm-radio-group">
                <label className="cancel-confirm-radio-label">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={action === 'approve'}
                    onChange={(e) => setAction(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <span>Chấp nhận hủy yêu cầu</span>
                </label>
                <label className="cancel-confirm-radio-label">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={action === 'reject'}
                    onChange={(e) => setAction(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <span>Từ chối yêu cầu hủy</span>
                </label>
              </div>
            </div>
            
            {action === 'reject' && (
              <div className="cancel-confirm-form-group">
                <label htmlFor="rejectReason" className="required-label">
                  Lý do từ chối
                  <RequiredIndicator />
                </label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do tại sao bạn từ chối yêu cầu hủy..."
                  rows={4}
                  required
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <small className="cancel-confirm-char-count">
                  {rejectReason.length}/500 ký tự
                </small>
              </div>
            )}
            
            {action === 'approve' && (
              <div className="cancel-confirm-warning">
                ⚠️ Khi chấp nhận, claim sẽ chuyển sang trạng thái "CANCELED_READY_TO_HANDOVER" và bạn cần xác nhận trả xe cho khách hàng.
              </div>
            )}
            
            <div className="cancel-confirm-modal-actions">
              <button
                type="button"
                className="cancel-confirm-cancel-btn"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`cancel-confirm-submit-btn ${action === 'approve' ? 'approve' : 'reject'}`}
                disabled={isSubmitting || (action === 'reject' && !rejectReason.trim())}
              >
                {isSubmitting ? 'Đang xử lý...' : action === 'approve' ? 'Chấp nhận Hủy' : 'Từ chối Hủy'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CancelConfirmForm;

