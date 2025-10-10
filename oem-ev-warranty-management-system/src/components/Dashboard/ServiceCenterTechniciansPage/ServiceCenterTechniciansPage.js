import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import './ServiceCenterTechniciansPage.css';

const ServiceCenterTechniciansPage = ({ handleBackClick }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const fetchTechnicians = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/users`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.status === 200 && isMounted) {
          const scTechnicians = response.data.filter(user => user.role === 'SC_TECHNICIAN');
          setTechnicians(scTechnicians);
          toast.success('Technicians list fetched successfully!', { position: 'top-right' });
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Error fetching technicians.', { position: 'top-right' });
          } else {
            toast.error('Network error. Please try again later.', { position: 'top-right' });
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchTechnicians();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="loading-message">Loading technicians list...</div>;
  }

  if (technicians.length === 0) {
    return (
      <motion.div
        className="technician-page-wrapper"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="technician-page-header">
          <button onClick={handleBackClick} className="back-to-dashboard-button">
            ← Back to Dashboard
          </button>
          <h2 className="technician-page-title">Service Center Technicians</h2>
          <p className="technician-page-description">A list of all active Service Center Technicians in the system.</p>
        </div>
        <div className="loading-message">No technicians found.</div>
      </motion.div>
    );
  }

  const filteredTechnicians = filter === 'active'
    ? technicians.filter(tech => tech.active)
    : technicians;

  return (
    <motion.div
      className="technician-page-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="technician-page-header">
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Back to Dashboard
        </button>
        <h2 className="technician-page-title">Service Center Technicians</h2>
        <p className="technician-page-description">A list of all active Service Center Technicians in the system.</p>
      </div>
      <div className="technician-table-container">
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'filter-active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'active' ? 'filter-active' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
        </div>
        <div className="technician-table-wrapper">
          <table className="technician-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTechnicians.map(tech => (
                <tr key={tech.id}>
                  <td>{tech.id}</td>
                  <td>{tech.fullName}</td>
                  <td>{tech.email}</td>
                  <td>{tech.phone}</td>
                  <td>{tech.role}</td>
                  <td>{tech.active ? 'Active' : 'Inactive'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCenterTechniciansPage;