import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import './VehicleManagementPage.css';

// --- Vehicle Status Badge Component ---
const VehicleStatusBadge = ({ status }) => {
    // Normalize status to lowercase and handle spaces/underscores
    const normalizedStatus = status ? status.toLowerCase().replace(/\s+/g, '_') : '';
    const badgeClass = `vehicle-status-badge ${normalizedStatus}`;
    return <span className={badgeClass}>{status}</span>;
};

const SearchVehicleByVin = ({ onPartsDetailClick }) => {
  const [vin, setVin] = useState('');
  const [vehicle, setVehicle] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setVehicle(null); // Clear previous results
    
    // Simple validation for VIN format (e.g., must be 17 characters)
    if (!vin || vin.length !== 17) {
        toast.error('Please enter a valid 17-character VIN.', { position: 'top-right' });
        return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/vehicles/vin/${vin}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Response code 200: Vehicle found
      if (response.status === 200) {
        toast.success('Vehicle fetched successfully!', { position: 'top-right' });
        setVehicle(response.data);
      }
    } catch (error) {
        if (error.response) {
            // Response code 404: Vehicle not found
            if (error.response.status === 404) {
                toast.warn('Vehicle by VIN not found.', { position: 'top-right' });
            } else {
                // Other HTTP errors
                toast.error('Searching Vehicle by VIN failed.', { position: 'top-right' });
            }
        } else {
            // Network or other generic error
            toast.error('Network error. Please try again later.', { position: 'top-right' });
        }
        setVehicle(null);
    }
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Search Vehicle by VIN</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="vin"
          placeholder="Enter 17-character VIN"
          value={vin}
          onChange={(e) => setVin(e.target.value)}
          maxLength="17"
          required
        />
        <button type="submit">Search Vehicle</button>
      </form>

      {vehicle && (
        <motion.div
          className="vehicle-data"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h4>Vehicle Details:</h4>
          <p><strong>Model:</strong> {vehicle.model}</p>
          <p><strong>VIN:</strong> {vehicle.vin}</p>
          <p><strong>Year:</strong> {vehicle.year}</p>
          <p><strong>Customer:</strong> {vehicle.customer?.name || 'N/A'}</p>
          <p><strong>Warranty Status:</strong> <VehicleStatusBadge status={vehicle.warrantyStatus} /></p>
          <p><strong>Mileage (Km):</strong> {vehicle.mileageKm}</p>
          <div style={{ marginTop: '1rem' }}>
             <button
                onClick={() => onPartsDetailClick(vehicle)}
                className="parts-detail-button"
             >
                Parts Detail
             </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SearchVehicleByVin;