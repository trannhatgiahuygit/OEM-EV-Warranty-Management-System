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
      title: 'Service Center Staff',
      role: 'SC_STAFF',
      items: [
        'Manage vehicle & customer records',
        'Register vehicles by VIN',
        'Track service & warranty history',
        'Handle warranty claims',
        'Monitor claim statuses'
      ]
    },
    {
      icon: '🔩',
      title: 'Service Center Technician',
      role: 'SC_TECHNICIAN',
      items: [
        'Attach reports, images, diagnostics',
        'Perform warranty repairs',
        'Update repair progress',
        'Manage recall campaigns'
      ]
    },
    {
      icon: '⚙️',
      title: 'EVM Staff',
      role: 'EVM_STAFF',
      items: [
        'Manage EV parts database',
        'Approve warranty requests',
        'Oversee recall campaigns',
        'Analyze warranty data'
      ]
    },
    {
      icon: '📊',
      title: 'Administrator',
      role: 'ADMIN',
      items: [
        'Assign technicians to cases',
        'Analyze warranty data',
        'Generate reports',
        'Manage internal operations'
      ]
    }
  ];

  const stats = [
    { number: '99.9%', label: 'Uptime' },
    { number: '10K+', label: 'Claims Processed' },
    { number: '500+', label: 'Service Centers' },
    { number: '24/7', label: 'Support' }
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
        <h1>OEM EV Warranty Management System</h1>
        <p>
          Empowering Service Centers and Manufacturers with seamless warranty management.
          Experience the future of automotive service excellence.
        </p>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => navigate('/login')}>Get Started</button>
          <button className="btn-secondary" onClick={handleLearnMoreClick}>Learn More</button>
        </div>
      </motion.header>

      {/* Features Section */}
      <section className="section-container" ref={systemOverviewRef}>
        <div className="features-header">
          <h2>System Overview</h2>
          <p className="features-subtitle">
            Comprehensive role-based access control for streamlined warranty operations
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
          <h2>Our Progress</h2>
          <p className="stats-subtitle">
            Key metrics that reflect the reliability and scale of our platform.
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
        <p>&copy; 2025 OEM EV Warranty Management System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;