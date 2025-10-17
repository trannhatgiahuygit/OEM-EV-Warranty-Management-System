import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle } from 'react-icons/fa';
import './NewRepairTicketPage.css';

const NewRepairTicketPage = ({ handleBackClick }) => {
  const initialFormData = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    vin: '',
    mileageKm: '',
    claimTitle: '',
    reportedFailure: '',
    appointmentDate: '',
    customerConsent: false,
    assignedTechnicianId: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [createdTicket, setCreatedTicket] = useState(null);

  // --- State for Search & Custom Dropdowns ---
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showVehicleResults, setShowVehicleResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- Debounced Search Effect ---
  useEffect(() => {
    if (phoneQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const searchCustomers = async () => {
      setIsLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/customers/search?phone=${phoneQuery}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const results = Array.isArray(response.data) ? response.data : [response.data];
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    const debounceTimer = setTimeout(() => searchCustomers(), 300);
    return () => clearTimeout(debounceTimer);
  }, [phoneQuery]);

  // --- Function to fetch vehicles for a selected customer ---
  const fetchVehiclesForCustomer = async (customerId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/vehicles/customer/${customerId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.data && response.data.length > 0) {
        setCustomerVehicles(response.data);
        setFormData(prev => ({ ...prev, vin: response.data[0].vin })); // Auto-select first vehicle
      } else {
        toast.warn('No vehicle by this customer.');
        setCustomerVehicles([]);
        setFormData(prev => ({ ...prev, vin: '' }));
      }
    } catch (error) {
      toast.error('Failed to fetch customer vehicles.');
      setCustomerVehicles([]);
    }
  };

  // --- Handlers for custom dropdowns and form inputs ---
  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address,
    }));
    setPhoneQuery(customer.phone);
    setShowResults(false);
    setSearchResults([]);
    fetchVehiclesForCustomer(customer.id);
  };
  
  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({ ...prev, vin: vehicle.vin }));
    setShowVehicleResults(false);
  };

  const getSelectedVehicleDisplay = () => {
    if (!formData.vin) return 'Select Customer Vehicle';
    // Display only the VIN as requested
    return formData.vin;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneQuery(value);
    setFormData(prev => ({ ...prev, customerPhone: value }));
    if (value === '') {
        setCustomerVehicles([]);
        setFormData(prev => ({
            ...prev,
            customerName: '',
            customerEmail: '',
            customerAddress: '',
            vin: ''
        }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const ticketData = {
      ...formData,
      mileageKm: parseInt(formData.mileageKm, 10),
      assignedTechnicianId: parseInt(formData.assignedTechnicianId, 10),
      appointmentDate: new Date(formData.appointmentDate).toISOString(),
      customerConsent: Boolean(formData.customerConsent),
    };

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/claims/intake`,
        ticketData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.status === 201) {
        toast.success('Repair Ticket created successfully!');
        setCreatedTicket(response.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'New Repair Ticket creation failed.');
      setCreatedTicket(null);
    }
  };

  const handleCreateAnother = () => {
    setFormData(initialFormData);
    setCreatedTicket(null);
    setPhoneQuery('');
    setCustomerVehicles([]);
  };

  if (createdTicket) {
      return (
        <motion.div
            className="rt-form-container rt-confirmation-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="rt-confirmation-content">
                <FaCheckCircle className="rt-success-icon" />
                <h3 className="rt-success-message">Repair Ticket Created!</h3>
                <div className="rt-ticket-data">
                    <h4>Ticket Details:</h4>
                    <p><strong>Claim Number:</strong> {createdTicket.claimNumber}</p>
                    <p><strong>Status:</strong> {createdTicket.statusLabel}</p>
                    <p><strong>Customer:</strong> {createdTicket.customer.name}</p>
                    <p><strong>Vehicle VIN:</strong> {createdTicket.vehicle.vin}</p>
                    <p><strong>Assigned To:</strong> {createdTicket.assignedTechnician.fullName}</p>
                </div>
                <button onClick={handleCreateAnother} className="rt-create-another-button">
                    Create Another Ticket
                </button>
            </div>
        </motion.div>
      );
  }

  return (
    <div className="repair-ticket-page-wrapper">
      <div className="repair-ticket-page-header">
        <button onClick={handleBackClick} className="rt-back-to-dashboard-button">
          ← Back to Dashboard
        </button>
        <h2 className="rt-page-title">New Repair Ticket</h2>
        <p className="rt-page-description">Create a new repair ticket for a customer.</p>
      </div>
      <motion.div
        className="rt-form-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleSubmit} onClick={() => { setShowResults(false); setShowVehicleResults(false); }}>
          <h3>Customer & Vehicle Information</h3>
          <div className="rt-form-grid">
            <input type="text" name="customerName" placeholder="Customer Name" value={formData.customerName} onChange={handleChange} required />
            <div className="rt-phone-search-container">
              <input
                type="text"
                name="customerPhone"
                placeholder="Customer Phone (type to search)"
                value={formData.customerPhone}
                onChange={handlePhoneChange}
                onClick={(e) => e.stopPropagation()}
                autoComplete="off"
                required
              />
              {showResults && searchResults.length > 0 && (
                <div className="rt-search-results">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="rt-search-result-item"
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <p><strong>{customer.name}</strong></p>
                      <p>{customer.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="email" name="customerEmail" placeholder="Customer Email" value={formData.customerEmail} onChange={handleChange} required />
            <input type="text" name="customerAddress" placeholder="Customer Address" value={formData.customerAddress} onChange={handleChange} required />
            
            {customerVehicles.length > 0 ? (
                <div className={`rt-custom-select-container ${showVehicleResults ? 'open' : ''}`}>
                    <div 
                        className="rt-custom-select-trigger" 
                        onClick={(e) => { e.stopPropagation(); setShowVehicleResults(!showVehicleResults); }}
                    >
                        {getSelectedVehicleDisplay()}
                    </div>
                    {showVehicleResults && (
                        <div className="rt-search-results">
                            {customerVehicles.map((vehicle) => (
                                <div
                                    key={vehicle.id}
                                    className="rt-search-result-item"
                                    onClick={() => handleVehicleSelect(vehicle)}
                                >
                                    {/* Prioritize VIN, show model as secondary info */}
                                    <p><strong>{vehicle.vin}</strong></p>
                                    <p>{vehicle.model} - {vehicle.year}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <input type="text" name="vin" placeholder="Vehicle VIN" value={formData.vin} onChange={handleChange} required />
            )}

            <input type="number" name="mileageKm" placeholder="Mileage (km)" value={formData.mileageKm} onChange={handleChange} required />
          </div>
          
          <h3>Repair Claim Details</h3>
          <div className="rt-form-grid-single">
            <input type="text" name="claimTitle" placeholder="Claim Title / Issue Summary" value={formData.claimTitle} onChange={handleChange} required />
            <textarea name="reportedFailure" placeholder="Reported Failure (Detailed Description)" value={formData.reportedFailure} onChange={handleChange} rows="4" required />
          </div>

          <h3>Appointment & Assignment</h3>
          <div className="rt-form-grid">
            <div className="rt-datetime-container">
              <input type="datetime-local" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required />
            </div>
            <input type="number" name="assignedTechnicianId" placeholder="Assigned Technician ID" value={formData.assignedTechnicianId} onChange={handleChange} required />
          </div>

          <div className="rt-consent-checkbox">
            <input type="checkbox" id="customerConsent" name="customerConsent" checked={formData.customerConsent} onChange={handleChange} required />
            <label htmlFor="customerConsent">Customer has given consent for the repair work.</label>
          </div>
          
          <button type="submit">Create Ticket</button>
        </form>
      </motion.div>
    </div>
  );
};

export default NewRepairTicketPage;