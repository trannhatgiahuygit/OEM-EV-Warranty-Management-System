import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './TechnicianAvailabilityWidget.css';

const TechnicianAvailabilityWidget = () => {
  const [technicians, setTechnicians] = useState([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTechnicianStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTechnicianStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTechnicianStatus = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) return;

      const user = JSON.parse(userString);
      const token = user.token;

      // Fetch available technicians
      const availableResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/technicians/available`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      // Fetch all technicians for total count
      const allResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/technicians`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const availableTechs = availableResponse.data || [];
      const allTechs = allResponse.data || [];

      // Get busy technicians (those not in available list)
      const availableIds = new Set(availableTechs.map(t => t.userId));
      const busyTechs = allTechs.filter(t => !availableIds.has(t.userId));

      // Combine and sort: available first, then busy
      const sortedTechs = [
        ...availableTechs.map(t => ({ ...t, isAvailable: true })),
        ...busyTechs.map(t => ({ ...t, isAvailable: false }))
      ];

      setTechnicians(sortedTechs);
      setAvailableCount(availableTechs.length);
      setTotalCount(allTechs.length);
      setIsLoading(false);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching technician status:', error);
      setIsLoading(false);
      setError('Không thể tải trạng thái kỹ thuật viên');
      // Only show toast if we had data before (refresh scenario)
      if (technicians.length > 0) {
        toast.error('Không thể cập nhật trạng thái kỹ thuật viên');
      }
    }
  };

  const getStatusBadge = (tech) => {
    if (tech.isAvailable) {
      return <span className="taw-status-badge taw-available">Sẵn sàng</span>;
    } else {
      return <span className="taw-status-badge taw-busy">Bận</span>;
    }
  };

  const getWorkloadInfo = (tech) => {
    const workload = tech.currentWorkload || 0;
    const maxWorkload = tech.maxWorkload || 5;
    const percentage = maxWorkload > 0 ? Math.round((workload / maxWorkload) * 100) : 0;
    return `${workload}/${maxWorkload} (${percentage}%)`;
  };

  if (isLoading) {
    return (
      <div className="technician-availability-widget">
        <div className="taw-header">
          <h3>Trạng thái Kỹ thuật viên</h3>
          <span className="taw-loading">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="technician-availability-widget">
      <div className="taw-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="taw-header-left">
          <h3>Trạng thái Kỹ thuật viên</h3>
          <span className="taw-summary">
            {error ? (
              <span style={{ color: '#f44336' }}>Lỗi: {error}</span>
            ) : totalCount > 0 ? (
              `${availableCount}/${totalCount} kỹ thuật viên sẵn sàng nhận yêu cầu mới`
            ) : (
              'Không có kỹ thuật viên nào'
            )}
          </span>
        </div>
        <div className="taw-header-right">
          {!error && (
            <span className={`taw-indicator ${availableCount > 0 ? 'taw-ready' : 'taw-not-ready'}`}>
              {availableCount > 0 ? '✓' : '✗'}
            </span>
          )}
          <span className="taw-toggle">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="taw-content">
          {error ? (
            <div className="taw-error">
              <p>{error}</p>
              <button className="taw-refresh-btn" onClick={fetchTechnicianStatus}>
                🔄 Thử lại
              </button>
            </div>
          ) : technicians.length === 0 ? (
            <p className="taw-empty">Không có kỹ thuật viên nào</p>
          ) : (
            <>
              <div className="taw-technician-list">
                {technicians.map((tech) => (
                  <div key={tech.userId || tech.id} className="taw-technician-item">
                    <div className="taw-tech-info">
                      <div className="taw-tech-name">
                        {tech.fullName || tech.username || `Technician #${tech.userId}`}
                      </div>
                      {tech.specialization && (
                        <div className="taw-tech-specialization">{tech.specialization}</div>
                      )}
                    </div>
                    <div className="taw-tech-status">
                      {getStatusBadge(tech)}
                      <div className="taw-workload">
                        Khối lượng: {getWorkloadInfo(tech)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="taw-refresh-btn" onClick={fetchTechnicianStatus}>
                🔄 Làm mới
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TechnicianAvailabilityWidget;

