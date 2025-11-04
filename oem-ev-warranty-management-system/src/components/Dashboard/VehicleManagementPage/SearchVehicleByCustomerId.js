// SearchVehicleByCustomerId.js

import React, { useState, useEffect, useRef } from 'react'; 
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

const SearchVehicleByCustomerId = ({ onPartsDetailClick, initialCustomerId }) => {
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false); 

  // New reusable function for fetching vehicles
  const fetchVehicles = async (idToSearch, ignoreFlag) => {
    if (!idToSearch) return; // Do nothing if there's no ID to search

    setLoading(true);
    setVehicles([]);
    setSearchAttempted(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/vehicles/customer/${idToSearch}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Only update state and show toast if the effect hasn't been cleaned up (ignoreFlag is true for cleanup)
      if (!ignoreFlag) { 
        if (response.status === 200) {
          if (response.data && response.data.length > 0) {
            toast.success(`Vehicles for Customer ID ${idToSearch} fetched successfully!`, { position: 'top-right' });
            setVehicles(response.data);
          } else {
            toast.warn(`No vehicles found for Customer ID ${idToSearch}.`, { position: 'top-right' });
            setVehicles([]);
          }
        }
      }
    } catch (error) {
      if (!ignoreFlag) {
        if (error.response) {
          toast.error(`Error searching for vehicles for Customer ID ${idToSearch}.`, { position: 'top-right' });
        } else {
          toast.error('Network error. Please try again later.', { position: 'top-right' });
        }
        setVehicles([]);
      }
    } finally {
      if (!ignoreFlag) {
        setLoading(false);
      }
    }
  };

  // Effect to handle initialCustomerId coming from another page (automatic search)
  useEffect(() => {
    // 1. Reset state if initialCustomerId is cleared (e.g., when switching tabs in parent)
    if (!initialCustomerId) {
      setSearchAttempted(false);
      setVehicles([]);
      setCustomerId(''); // Clear the input field
      return;
    }

    // 2. Set the customer ID state for the input field to reflect the initial prop
    setCustomerId(initialCustomerId);

    // 3. Flag for Strict Mode cleanup
    let ignore = false;
    
    // 4. Call the reusable fetch function for automatic search
    fetchVehicles(initialCustomerId, ignore);

    // The cleanup function
    return () => {
      ignore = true;
    };
  }, [initialCustomerId]); // Reruns when initialCustomerId changes.


  // The form submit handler for manual search
  const handleManualSubmit = async (e) => {
      e.preventDefault();
      
      // Basic validation
      if (!customerId || isNaN(customerId)) {
          toast.error("Please enter a valid Customer ID.");
          return;
      }
      
      // Call the reusable fetch function with the manually entered ID
      // Pass null for the ignore flag since this is a direct user action
      fetchVehicles(customerId, null); 
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Search Vehicle by Customer ID</h3>
      {/* Show form ONLY if NOT initialized by a prop */}
      {!initialCustomerId && (
        <form onSubmit={handleManualSubmit}>
          <input
            type="number"
            name="customerId"
            placeholder="Enter Customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
          <button type="submit">Search Vehicles</button>
        </form>
      )}

      {loading && <div className="loading-message">Searching for vehicles...</div>}

      {!loading && vehicles.length > 0 && (
        <motion.div
          className="vehicle-table-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: '1.5rem' }}
        >
          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>VIN</th>
                  <th>Model</th>
                  <th>Year</th>
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
                    <td>
                      <VehicleStatusBadge status={vehicle.warrantyStatus} />
                    </td>
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
      )}
      
      {/* Show "No vehicles found" message only after an attempt has been made */}
      {!loading && searchAttempted && vehicles.length === 0 && (
        <div className="no-parts-message">
          {`No vehicles found for Customer ID ${initialCustomerId || customerId}.`}
        </div>
      )}
    </motion.div>
  );
};

export default SearchVehicleByCustomerId;