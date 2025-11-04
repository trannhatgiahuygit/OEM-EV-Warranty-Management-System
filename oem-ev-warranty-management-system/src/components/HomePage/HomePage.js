import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { motion } from 'framer-motion';

const HomePage = () => {
  const navigate = useNavigate();
  const systemOverviewRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLearnMoreClick = () => {
    if (systemOverviewRef.current) {
      const headerHeight = 80; // Approximate height of the fixed header
      const elementPosition = systemOverviewRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      icon: '🔧',
      title: 'Nhân viên Trung tâm Dịch vụ',
      role: 'SC_STAFF',
      items: [
        'Quản lý hồ sơ xe và khách hàng',
        'Đăng ký xe theo số VIN',
        'Theo dõi lịch sử dịch vụ và bảo hành',
        'Xử lý yêu cầu bảo hành',
        'Giám sát trạng thái yêu cầu'
      ]
    },
    {
      icon: '🔩',
      title: 'Kỹ thuật viên Trung tâm Dịch vụ',
      role: 'SC_TECHNICIAN',
      items: [
        'Đính kèm báo cáo, hình ảnh, chẩn đoán',
        'Thực hiện sửa chữa bảo hành',
        'Cập nhật tiến độ sửa chữa',
        'Quản lý chiến dịch thu hồi'
      ]
    },
    {
      icon: '⚙️',
      title: 'Nhân viên EVM',
      role: 'EVM_STAFF',
      items: [
        'Quản lý cơ sở dữ liệu phụ tùng EV',
        'Phê duyệt yêu cầu bảo hành',
        'Giám sát chiến dịch thu hồi',
        'Phân tích dữ liệu bảo hành'
      ]
    },
    {
      icon: '📊',
      title: 'Quản trị viên',
      role: 'ADMIN',
      items: [
        'Phân công kỹ thuật viên cho các trường hợp',
        'Phân tích dữ liệu bảo hành',
        'Tạo báo cáo',
        'Quản lý hoạt động nội bộ'
      ]
    }
  ];

  const stats = [
    { number: '99.9%', label: 'Thời gian hoạt động' },
    { number: '10K+', label: 'Yêu cầu đã xử lý' },
    { number: '500+', label: 'Trung tâm Dịch vụ' },
    { number: '24/7', label: 'Hỗ trợ' }
  ];

  return (
    <div className="homepage">
      {/* Full-Page Background */}
      <div className="hero-bg">
        <div className="animated-grid" />
        <div className="gradient-bg" />
      </div>

      {/* Hero Section */}
      <motion.header
        className="homepage-header"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1>Hệ thống Quản lý Bảo hành Xe Điện OEM</h1>
        <p>
          Trao quyền cho Trung tâm Dịch vụ và Nhà sản xuất với quản lý bảo hành liền mạch.
          Trải nghiệm tương lai của dịch vụ ô tô xuất sắc.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => navigate('/login')}>Bắt đầu</button>
          <button className="btn-secondary" onClick={handleLearnMoreClick}>Tìm hiểu thêm</button>
        </div>
      </motion.header>

      {/* Features Section */}
      <section className="section-container" ref={systemOverviewRef}>
        <div className="features-header">
          <h2>Tổng quan Hệ thống</h2>
          <p className="features-subtitle">
            Kiểm soát truy cập dựa trên vai trò toàn diện cho hoạt động bảo hành được tối ưu hóa
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="feature-icon">
                <span>{feature.icon}</span>
              </div>
              <h3>{feature.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                {feature.role}
              </p>
              <ul>
                {feature.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-container">
        <div className="stats-header">
          <h2>Tiến độ của Chúng tôi</h2>
          <p className="stats-subtitle">
            Các chỉ số quan trọng phản ánh độ tin cậy và quy mô của nền tảng của chúng tôi.
          </p>
        </div>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <p>&copy; 2025 Hệ thống Quản lý Bảo hành Xe Điện OEM. Bảo lưu mọi quyền.</p>
      </footer>
    </div>
  );
};

export default HomePage;