import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaChartLine, FaSpinner, FaTimes, FaChevronRight, FaStar } from 'react-icons/fa';
import './AISections.css';

const FailureAnalysisSection = () => {
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [filters, setFilters] = useState({
    timeframe: 'LAST_6_MONTHS',
    groupBy: 'PART',
    topN: 10
  });

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisData(null);
    setSelectedPattern(null);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        toast.error('Không tìm thấy token xác thực.');
        setLoading(false);
        return;
      }

      const requestBody = {
        timeframe: filters.timeframe,
        groupBy: filters.groupBy,
        topN: filters.topN
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/analyze-failures`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            'X-User': user.username || 'system'
          }
        }
      );

      if (response.status === 200) {
        setAnalysisData(response.data);
        toast.success('Phân tích thành công!');
      }
    } catch (err) {
      console.error('Error analyzing failures:', err);
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        toast.error('Bạn không có quyền sử dụng tính năng này.');
      } else {
        toast.error('Không thể phân tích dữ liệu. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    const formatted = new Intl.NumberFormat('vi-VN').format(amount);
    return `${formatted} ₫`;
  };

  return (
    <div className="ai-section-card">
      <div className="ai-section-header-card">
        <div className="ai-section-title">
          <FaChartLine className="ai-section-icon" />
          <h3>Phân tích Nguyên nhân Lỗi</h3>
          <span className="ai-badge">
            <FaStar className="ai-badge-icon" />
            <span>AI</span>
          </span>
        </div>
      </div>

      <div className="ai-filters-compact">
        <select
          value={filters.timeframe}
          onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}
          className="ai-filter-select-compact"
        >
          <option value="LAST_3_MONTHS">3 tháng</option>
          <option value="LAST_6_MONTHS">6 tháng</option>
          <option value="LAST_12_MONTHS">12 tháng</option>
        </select>
        
        <select
          value={filters.groupBy}
          onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
          className="ai-filter-select-compact"
        >
          <option value="PART">Theo phụ tùng</option>
          <option value="MODEL">Theo mẫu xe</option>
          <option value="CATEGORY">Theo danh mục</option>
        </select>

        <button
          className="ai-button-compact"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="spinning" />
              <span>AI đang phân tích...</span>
            </>
          ) : (
            <>
              <FaSearch />
              <span>Phân tích</span>
            </>
          )}
        </button>
      </div>

      {analysisData && (
        <div className="ai-results-container">
          {analysisData.summary && (
            <div className="ai-summary-card">
              <div className="ai-summary-header">
                <span className="ai-summary-badge">Phân tích AI</span>
              </div>
              <p>{analysisData.summary.split('\n')[0] || analysisData.summary}</p>
            </div>
          )}

          {analysisData.topFailurePatterns && analysisData.topFailurePatterns.length > 0 && (
            <div className="ai-patterns-grid-compact">
              {analysisData.topFailurePatterns.slice(0, 6).map((pattern, idx) => (
                <div
                  key={idx}
                  className="ai-pattern-card-compact"
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <div className="ai-pattern-card-header-compact">
                    <span className="ai-pattern-rank-compact">{idx + 1}</span>
                    <span className="ai-pattern-name-compact">{pattern.pattern}</span>
                    <FaChevronRight className="ai-pattern-arrow" />
                  </div>
                  <div className="ai-pattern-stats-compact">
                    <span>{pattern.frequency} lần</span>
                    <span>{formatCurrency(pattern.averageCost)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="ai-loading-state">
          <div className="ai-loading-content">
            <FaSpinner className="spinning ai-loading-spinner" />
            <p>AI đang phân tích dữ liệu bảo hành...</p>
            <span className="ai-loading-subtitle">Đang xử lý với mô hình Gemini AI</span>
          </div>
        </div>
      )}

      {!analysisData && !loading && (
        <div className="ai-empty-state">
          <p>Chọn bộ lọc và nhấn "Phân tích" để AI phân tích kết quả</p>
        </div>
      )}

      <AnimatePresence>
        {selectedPattern && (
          <motion.div
            className="ai-detail-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPattern(null)}
          >
            <motion.div
              className="ai-detail-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ai-detail-modal-header">
                <h3>Chi tiết: {selectedPattern.pattern}</h3>
                <button
                  className="ai-detail-modal-close"
                  onClick={() => setSelectedPattern(null)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="ai-detail-modal-content">
                <div className="ai-detail-stats">
                  <div className="ai-detail-stat-item">
                    <span className="ai-detail-stat-label">Tần suất</span>
                    <span className="ai-detail-stat-value">{selectedPattern.frequency} lần</span>
                  </div>
                  <div className="ai-detail-stat-item">
                    <span className="ai-detail-stat-label">Chi phí trung bình</span>
                    <span className="ai-detail-stat-value">{formatCurrency(selectedPattern.averageCost)}</span>
                  </div>
                  <div className="ai-detail-stat-item">
                    <span className="ai-detail-stat-label">Tổng chi phí</span>
                    <span className="ai-detail-stat-value">
                      {formatCurrency(selectedPattern.averageCost && selectedPattern.frequency 
                        ? selectedPattern.averageCost * selectedPattern.frequency 
                        : 0)}
                    </span>
                  </div>
                </div>
                {selectedPattern.affectedModels && selectedPattern.affectedModels.length > 0 && (
                  <div className="ai-detail-models">
                    <h4>Mẫu xe bị ảnh hưởng ({selectedPattern.affectedModels.length})</h4>
                    <div className="ai-detail-models-list">
                      {selectedPattern.affectedModels.map((model, mIdx) => (
                        <span key={mIdx} className="ai-detail-model-tag">{model}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPattern.rootCause && (
                  <div className="ai-detail-root-cause">
                    <h4>Nguyên nhân gốc rễ</h4>
                    <p>{selectedPattern.rootCause}</p>
                  </div>
                )}
                {selectedPattern.recommendation && (
                  <div className="ai-detail-recommendation">
                    <h4>Khuyến nghị</h4>
                    <p>{selectedPattern.recommendation}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FailureAnalysisSection;
