import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartBar, FaSpinner, FaArrowUp, FaArrowDown, FaMinus, FaTimes, FaChevronRight, FaStar } from 'react-icons/fa';
import './AISections.css';

const CostPredictionSection = () => {
  const [loading, setLoading] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [filters, setFilters] = useState({
    forecastPeriod: 'NEXT_12_MONTHS',
    includeConfidenceInterval: true
  });

  const handlePredict = async () => {
    setLoading(true);
    setPredictionData(null);
    setSelectedPeriod(null);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        toast.error('Không tìm thấy token xác thực.');
        setLoading(false);
        return;
      }

      const requestBody = {
        forecastPeriod: filters.forecastPeriod,
        granularity: 'MONTHLY',
        includeConfidenceInterval: filters.includeConfidenceInterval
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/ai/predict-costs`,
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
        setPredictionData(response.data);
        toast.success('Dự báo thành công!');
      }
    } catch (err) {
      console.error('Error predicting costs:', err);
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        toast.error('Bạn không có quyền sử dụng tính năng này.');
      } else {
        toast.error('Không thể dự báo chi phí. Vui lòng thử lại sau.');
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

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'INCREASING':
        return <FaArrowUp className="trend-icon" />;
      case 'DECREASING':
        return <FaArrowDown className="trend-icon" />;
      default:
        return <FaMinus className="trend-icon" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'INCREASING':
        return 'var(--error)';
      case 'DECREASING':
        return 'var(--success)';
      default:
        return 'var(--text-secondary)';
    }
  };

  const getMaxValue = () => {
    if (!predictionData?.predictions) return 0;
    return Math.max(
      ...predictionData.predictions.map(p => 
        Math.max(
          p.predictedCost || 0,
          p.upperBound || 0
        )
      )
    );
  };

  const maxValue = getMaxValue();

  return (
    <div className="ai-section-card">
      <div className="ai-section-header-card">
        <div className="ai-section-title">
          <FaChartBar className="ai-section-icon" />
          <h3>Dự báo Chi phí Bảo hành</h3>
          <span className="ai-badge">
            <FaStar className="ai-badge-icon" />
            <span>AI</span>
          </span>
        </div>
      </div>

      <div className="ai-filters-compact">
        <select
          value={filters.forecastPeriod}
          onChange={(e) => setFilters({ ...filters, forecastPeriod: e.target.value })}
          className="ai-filter-select-compact"
        >
          <option value="NEXT_3_MONTHS">3 tháng tới</option>
          <option value="NEXT_6_MONTHS">6 tháng tới</option>
          <option value="NEXT_12_MONTHS">12 tháng tới</option>
        </select>

        <button
          className="ai-button-compact"
          onClick={handlePredict}
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className="spinning" />
              <span>AI đang dự báo...</span>
            </>
          ) : (
            <>
              <span>₫</span>
              <span>Dự báo</span>
            </>
          )}
        </button>
      </div>

      {predictionData && (
        <div className="ai-results-container">
          <div className="cost-summary-grid">
            <div className="cost-summary-item-compact">
              <span className="cost-summary-label-compact">Tổng dự báo</span>
              <span className="cost-summary-value-compact">
                {formatCurrency(predictionData.totalForecast)}
              </span>
            </div>
            {predictionData.trends && (
              <div className="cost-summary-item-compact">
                <span className="cost-summary-label-compact">Xu hướng</span>
                <span 
                  className="cost-summary-value-compact cost-trend-compact"
                  style={{ color: getTrendColor(predictionData.trends.overallTrend) }}
                >
                  {getTrendIcon(predictionData.trends.overallTrend)}
                  <span>
                    {predictionData.trends.overallTrend === 'INCREASING' ? 'Tăng' :
                     predictionData.trends.overallTrend === 'DECREASING' ? 'Giảm' : 'Ổn định'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {predictionData.predictions && predictionData.predictions.length > 0 && (
            <div className="cost-chart-compact">
              <div className="chart-compact">
                {predictionData.predictions.slice(0, 12).map((pred, idx) => {
                  const height = maxValue > 0 ? (pred.predictedCost / maxValue) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="chart-bar-compact-group"
                      onClick={() => setSelectedPeriod(pred)}
                    >
                      <div 
                        className="chart-bar-compact"
                        style={{ height: `${height}%` }}
                        title={formatCurrency(pred.predictedCost)}
                      />
                      <div className="chart-label-compact">{pred.period.split('-')[1]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {predictionData.recommendations && predictionData.recommendations.length > 0 && (
            <div className="ai-recommendations-compact">
              <div className="ai-recommendations-header">
                <h4>Khuyến nghị từ AI</h4>
              </div>
              <ul>
                {predictionData.recommendations.slice(0, 3).map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="ai-loading-state">
          <div className="ai-loading-content">
            <FaSpinner className="spinning ai-loading-spinner" />
            <p>AI đang tính toán dự báo chi phí...</p>
            <span className="ai-loading-subtitle">Đang phân tích xu hướng với mô hình Gemini AI</span>
          </div>
        </div>
      )}

      {!predictionData && !loading && (
        <div className="ai-empty-state">
          <p>Chọn kỳ dự báo và nhấn "Dự báo" để AI tính toán kết quả</p>
        </div>
      )}

      <AnimatePresence>
        {selectedPeriod && (
          <motion.div
            className="ai-detail-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPeriod(null)}
          >
            <motion.div
              className="ai-detail-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ai-detail-modal-header">
                <h3>Chi tiết dự báo: {selectedPeriod.period}</h3>
                <button
                  className="ai-detail-modal-close"
                  onClick={() => setSelectedPeriod(null)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="ai-detail-modal-content">
                <div className="ai-detail-stats">
                  <div className="ai-detail-stat-item">
                    <span className="ai-detail-stat-label">Chi phí dự báo</span>
                    <span className="ai-detail-stat-value">
                      {formatCurrency(selectedPeriod.predictedCost)}
                    </span>
                  </div>
                  {selectedPeriod.lowerBound && selectedPeriod.upperBound && (
                    <>
                      <div className="ai-detail-stat-item">
                        <span className="ai-detail-stat-label">Khoảng dưới</span>
                        <span className="ai-detail-stat-value">
                          {formatCurrency(selectedPeriod.lowerBound)}
                        </span>
                      </div>
                      <div className="ai-detail-stat-item">
                        <span className="ai-detail-stat-label">Khoảng trên</span>
                        <span className="ai-detail-stat-value">
                          {formatCurrency(selectedPeriod.upperBound)}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedPeriod.confidence && (
                    <div className="ai-detail-stat-item">
                      <span className="ai-detail-stat-label">Độ tin cậy</span>
                      <span className="ai-detail-stat-value">
                        {(selectedPeriod.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CostPredictionSection;
