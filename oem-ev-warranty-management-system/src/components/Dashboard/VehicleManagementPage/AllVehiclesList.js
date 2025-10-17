import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';

const AllVehiclesList = ({ onPartsDetailClick }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="loading-message">Loading vehicle list...</div>;
  }

  if (vehicles.length === 0) {
    return <div className="loading-message">No vehicles found.</div>;
  }

  return (
    <motion.div
      className="vehicle-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
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
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.vin}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.year}</td>
                <td>{vehicle.customer?.name || 'N/A'}</td>
                <td>{vehicle.warrantyStatus}</td>
                <td>
                  <button
                    onClick={() => onPartsDetailClick(vehicle)}
                    className="parts-detail-button"
                  >
                    Parts Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AllVehiclesList;