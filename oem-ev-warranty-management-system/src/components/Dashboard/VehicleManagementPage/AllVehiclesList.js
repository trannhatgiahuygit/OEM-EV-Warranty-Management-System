// AllVehiclesList.js

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';

// MODIFIED: Accept sortOrder and toggleSortOrder as props
const AllVehiclesList = ({ onPartsDetailClick, sortOrder, toggleSortOrder }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  // REMOVED: const [sortOrder, setSortOrder] = useState('desc'); 
  // REMOVED: Sort state is now in VehicleManagementPage.js

  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/vehicles`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.status === 200 && isMounted) {
          toast.success('Vehicle list fetched successfully!', { position: 'top-right' });
          setVehicles(response.data);
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Error fetching list of all vehicles.', { position: 'top-right' });
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
    fetchVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized function to sort vehicles
  const sortedVehicles = useMemo(() => {
    // Create a copy to avoid mutating state directly
    return [...vehicles].sort((a, b) => {
      // Assuming 'id' represents the creation order (higher id = newer)
      if (a.id < b.id) {
        return sortOrder === 'asc' ? -1 : 1; // Oldest first: -1. Latest first: 1.
      }
      if (a.id > b.id) {
        return sortOrder === 'asc' ? 1 : -1; // Oldest first: 1. Latest first: -1.
      }
      return 0;
    });
  }, [vehicles, sortOrder]); // Recalculate only when vehicles or sortOrder changes

  // REMOVED: Handler to toggle sorting - now in parent

  if (loading) {
    return <div className="loading-message">Loading vehicle list...</div>;
  }

  if (vehicles.length === 0) {
    return <div className="loading-message">No vehicles found.</div>;
  }

  return (
    <motion.div
      className="vehicle-list-content-wrapper"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* REMOVED: The sorting button is now in VehicleManagementPage.js */}

      <div className="vehicle-table-container">
        <div className="vehicle-table-wrapper">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>VIN</th>
                <th>Model</th>
                <th>Year</th>
                <th>Customer</th>
                <th>Warranty Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* MODIFIED: Use sortedVehicles for rendering */}
              {sortedVehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.vin}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.year}</td>
                  <td>{vehicle.customer?.name || 'N/A'}</td>
                  <td>{vehicle.warrantyStatus}</td>
                  <td>
                    <button
                      onClick={() => onPartsDetailClick(vehicle)}
                      className="avl-parts-detail-btn"
                    >
                      Parts Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AllVehiclesList;