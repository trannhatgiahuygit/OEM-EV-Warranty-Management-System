// Dashboard.js

import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import CustomerPage from './CustomerPage/CustomerPage';
import ServiceCenterTechniciansPage from './ServiceCenterTechniciansPage/ServiceCenterTechniciansPage';
import UserManagementPage from './UserManagementPage/UserManagementPage';
import VehicleManagementPage from './VehicleManagementPage/VehicleManagementPage';
import NewRepairTicketPage from './NewRepairTicketPage/NewRepairTicketPage'; // Import the new component

const roleFunctions = {
  SC_STAFF: [
    { title: 'Customer', path: 'customer' },
    { title: 'Vehicle Management', path: 'vehicle-management' },
    { title: 'New Repair Ticket', path: 'new-repair-ticket' }, // <-- Added this line
    { title: 'Service Center Technicians', path: 'sc-technicians' },
  ],
  SC_TECHNICIAN: [
    { title: 'Customer', path: 'customer' },
    { title: 'Vehicle Management', path: 'vehicle-management' },
  ],
  ADMIN: [
    { title: 'User Management', path: 'user-management' },
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
  const [activePage, setActivePage] = useState(null);
  const [customerVehiclesId, setCustomerVehiclesId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const getSidebarLinks = () => {
    return roleFunctions[userRole] || [];
  };

  const renderContent = () => {
    const handleBackClick = () => {
      setActivePage(null);
      setCustomerVehiclesId(null);
    };

    const handleViewVehiclesClick = (customerId) => {
      setCustomerVehiclesId(customerId);
      setActivePage('vehicle-management');
    };

    switch (activePage) {
      case 'customer':
        return <CustomerPage handleBackClick={handleBackClick} onViewVehiclesClick={handleViewVehiclesClick} />;
      case 'sc-technicians':
        return <ServiceCenterTechniciansPage handleBackClick={handleBackClick} />;
      case 'user-management':
        return <UserManagementPage handleBackClick={handleBackClick} />;
      case 'vehicle-management':
        return <VehicleManagementPage handleBackClick={handleBackClick} customerId={customerVehiclesId} />;
      case 'new-repair-ticket': // <-- Added this case
        return <NewRepairTicketPage handleBackClick={handleBackClick} />;
      default:
        return <HomePageContent />;
    }
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
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {getSidebarLinks().map((link, index) => (
              <motion.button
                key={index}
                className="sidebar-button"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => {
                  setActivePage(link.path);
                  setCustomerVehiclesId(null);
                }}
              >
                {link.title}
              </motion.button>
            ))}
          </motion.div>
          <div className="dashboard-content">{renderContent()}</div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;