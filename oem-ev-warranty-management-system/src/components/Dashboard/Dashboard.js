import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const roleFunctions = {
  SC_STAFF: [
    { title: 'New Customer', path: '/dashboard/new-customer' }
  ],
  SC_TECHNICIAN: [
    { title: 'View All Claims', path: '/dashboard/view-claims' }
  ],
};

const HomePageContent = () => (
  <div className="dashboard-content-page">
    <h2>Welcome to Your Dashboard</h2>
    <p>Select a function from the sidebar to get started.</p>
  </div>
);

const Dashboard = () => {
  const [userRole, setUserRole] = useState(null);
  const [activePage, setActivePage] = useState('home');
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/', { replace: true });
    } else {
      const parsedUser = JSON.parse(user);
      setUserRole(parsedUser.role);
    }
  }, [navigate]);

  const getSidebarLinks = () => {
    return roleFunctions[userRole] || [];
  };

  const renderContent = () => {
    return <HomePageContent />;
  };

  return (
    <>
      <div className="hero-bg">
        <div className="animated-grid" />
        <div className="gradient-bg" />
      </div>
      <div className="dashboard-page">
        <div className="dashboard-container">
          <motion.div
            className="dashboard-sidebar"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {getSidebarLinks().map((link, index) => (
              <motion.button
                key={index}
                className="sidebar-button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => setActivePage(link.path.split('/').pop())}
              >
                {link.title}
              </motion.button>
            ))}
          </motion.div>
          <div className="dashboard-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;