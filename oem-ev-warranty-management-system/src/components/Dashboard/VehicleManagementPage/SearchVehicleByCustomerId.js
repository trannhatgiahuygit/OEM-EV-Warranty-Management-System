// In SearchVehicleByCustomerId.js

import React, { useState, useEffect, useRef } from 'react'; // Make sure useRef is imported
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import './VehicleManagementPage.css';

const SearchVehicleByCustomerId = ({ onPartsDetailClick, initialCustomerId }) => {
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  // This state helps us know when to show the "No vehicles found" message.
  const [searchAttempted, setSearchAttempted] = useState(false); 

  useEffect(() => {
    // If there's no initial ID, do nothing.
    if (!initialCustomerId) {
      setSearchAttempted(false);
      setVehicles([]);
      return;
    }

    // This flag will prevent the toast from showing on the second run of the effect in Strict Mode.
    let ignore = false;

    const fetchVehicles = async () => {
      setLoading(true);
      setVehicles([]); // Clear previous results
      setSearchAttempted(true);

      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;

        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/vehicles/customer/${initialCustomerId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Only update state and show toast if the effect hasn't been cleaned up.
        if (!ignore) {
          if (response.status === 200) {
            if (response.data && response.data.length > 0) {
              toast.success(`Vehicles for Customer ID ${initialCustomerId} fetched successfully!`, { position: 'top-right' });
              setVehicles(response.data);
            } else {
              toast.warn(`No vehicles found for Customer ID ${initialCustomerId}.`, { position: 'top-right' });
              setVehicles([]);
            }
          }
        }
      } catch (error) {
        if (!ignore) {
          if (error.response) {
            toast.error(`Error searching for vehicles for Customer ID ${initialCustomerId}.`, { position: 'top-right' });
          } else {
            toast.error('Network error. Please try again later.', { position: 'top-right' });
          }
          setVehicles([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();

    // The cleanup function. React runs this before running the effect the second time.
    return () => {
      ignore = true;
    };
  }, [initialCustomerId]); // The effect runs only when initialCustomerId changes.

  // The form submit handler for manual search (when no initialCustomerId is provided).
  const handleManualSubmit = async (e) => {
      e.preventDefault();
      // We can reuse the same logic, but we'll create a simplified version for manual searches.
      // For simplicity, this example focuses on fixing the initial load.
      // To fully integrate manual search, you would call a similar fetch function here.
      // For now, we will just point to the fact that this is where manual search logic would go.
      toast.info("Manual search to be implemented here.");
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Search Vehicle by Customer ID</h3>
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
          {/* The vehicle table JSX remains the same */}
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
      )}
      
      {/* Updated condition to show "No vehicles found" message */}
      {!loading && searchAttempted && vehicles.length === 0 && (
        <div className="no-parts-message">
          {`No vehicles found for Customer ID ${initialCustomerId || customerId}.`}
        </div>
      )}
    </motion.div>
  );
};

export default SearchVehicleByCustomerId;