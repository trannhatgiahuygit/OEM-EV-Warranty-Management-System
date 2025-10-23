import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle } from 'react-icons/fa';
import './NewRepairClaimPage.css'; // Updated CSS import

// --- NEW: Add draftClaimData prop ---
const NewRepairClaimPage = ({ handleBackClick, draftClaimData = null }) => {
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
  const [createdClaim, setCreatedClaim] = useState(null); // Renamed state
  
  // --- NEW: State to manage workflow ---
  const [flowMode, setFlowMode] = useState('new'); // 'new' or 'intake'
  const [draftId, setDraftId] = useState(null); // To store the ID for the PUT request

  // --- State for Search & Custom Dropdowns ---
  const [phoneQuery, setPhoneQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showVehicleResults, setShowVehicleResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW: Effect to populate form from draft data ---
  useEffect(() => {
    if (draftClaimData) {
      setFlowMode('intake');
      setDraftId(draftClaimData.id);
      
      // Helper to format ISO date to yyyy-MM-ddTHH:mm
      const formatToDateTimeLocal = (isoString) => {
        if (!isoString) return '';
        try {
          const date = new Date(isoString);
          // Adjust for local timezone offset
          const timezoneOffset = date.getTimezoneOffset() * 60000;
          const localDate = new Date(date.getTime() - timezoneOffset);
          return localDate.toISOString().slice(0, 16);
        } catch (e) {
          return '';
        }
      };

      setFormData({
        customerName: draftClaimData.customer?.name || '',
        customerPhone: draftClaimData.customer?.phone || '',
        customerEmail: draftClaimData.customer?.email || '',
        customerAddress: draftClaimData.customer?.address || '',
        vin: draftClaimData.vehicle?.vin || '',
        mileageKm: draftClaimData.vehicle?.mileageKm || '',
        claimTitle: draftClaimData.initialDiagnosis || '', // Map initialDiagnosis to claimTitle
        reportedFailure: draftClaimData.reportedFailure || '',
        appointmentDate: formatToDateTimeLocal(draftClaimData.appointmentDate),
        customerConsent: draftClaimData.customerConsent || false, // Default to false if not present
        assignedTechnicianId: '', // User must fill this
      });

      // Pre-fill search/vehicle data if possible
      if(draftClaimData.customer?.phone) {
        setPhoneQuery(draftClaimData.customer.phone);
      }
      if(draftClaimData.vehicle) {
        setCustomerVehicles([draftClaimData.vehicle]);
      }

    } else {
      setFlowMode('new');
      setFormData(initialFormData);
      setDraftId(null);
    }
  }, [draftClaimData]); // Re-run when prop changes

  // --- Debounced Search Effect ---
  useEffect(() => {
    if (phoneQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // --- MODIFIED: Don't run search if in intake mode and phone is already set ---
    if (flowMode === 'intake' && phoneQuery === draftClaimData?.customer?.phone) {
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
  }, [phoneQuery, flowMode, draftClaimData]); // Added flowMode and draftClaimData

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
  
  // --- This is the original CREATE claim ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const claimData = { // Renamed variable
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
        claimData, // Use renamed variable
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // --- MODIFIED: Added charset=UTF-8 ---
            'Content-Type': 'application/json; charset=UTF-8',
          },
        }
      );
      if (response.status === 201) {
        toast.success('Repair Claim created successfully!'); // Updated text
        setCreatedClaim(response.data); // Use renamed state setter
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'New Repair Claim creation failed.'); // Updated text
      setCreatedClaim(null); // Use renamed state setter
    }
  };

  // --- NEW: Handle PUT request for processing draft to intake ---
  const handleIntakeSubmit = async (e) => {
    e.preventDefault();

    // Construct the full payload as requested
    const intakeData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      vin: formData.vin,
      mileageKm: parseInt(formData.mileageKm, 10),
      claimTitle: formData.claimTitle,
      reportedFailure: formData.reportedFailure,
      appointmentDate: new Date(formData.appointmentDate).toISOString(),
      customerConsent: Boolean(formData.customerConsent),
      assignedTechnicianId: parseInt(formData.assignedTechnicianId, 10),
      flow: "INTAKE" // As specified
    };

    // Simple validation check
    for (const key in intakeData) {
      if (intakeData[key] === '' || intakeData[key] === null || (typeof intakeData[key] === 'number' && isNaN(intakeData[key]))) {
        if (key === 'flow') continue; // 'flow' is fine
        // Check for assignedTechnicianId specifically
        if (key === 'assignedTechnicianId' && (intakeData[key] === null || isNaN(intakeData[key]))) {
           toast.error(`Field 'Assigned Technician ID' is required.`);
           return;
        }
        if (key !== 'assignedTechnicianId') { // Other fields
            toast.error(`Field '${key}' is required.`);
            return;
        }
      }
    }
    if (!intakeData.customerConsent) {
        toast.error('Customer Consent is required.');
        return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${draftId}/to-intake`,
        intakeData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success('Claim processed to intake successfully!');
        setCreatedClaim(response.data); // Show success screen
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process claim.');
      setCreatedClaim(null);
    }
  };


  // --- NEW: Handle Save as Draft ---
  const handleSaveDraft = async () => {
    // Construct data, parsing values if they exist, but don't require them
    const draftData = {
      ...formData,
      mileageKm: formData.mileageKm ? parseInt(formData.mileageKm, 10) : null,
      appointmentDate: formData.appointmentDate ? new Date(formData.appointmentDate).toISOString() : null,
      customerConsent: Boolean(formData.customerConsent),
    };

    // Remove assignedTechnicianId as it's not part of the draft endpoint
    delete draftData.assignedTechnicianId;

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/claims/draft`,
        draftData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // --- MODIFIED: Added charset=UTF-8 ---
            'Content-Type': 'application/json; charset=UTF-8',
          },
        }
      );
      
      if (response.status === 201) {
        toast.success('Draft saved successfully!');
        setCreatedClaim(response.data); // Show success screen
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save draft.');
    }
  };

  const handleCreateAnother = () => {
    setFormData(initialFormData);
    setCreatedClaim(null); // Use renamed state setter
    setPhoneQuery('');
    setCustomerVehicles([]);
    setFlowMode('new'); // --- NEW: Reset flow mode ---
    // The parent component will be responsible for clearing the `draftClaimData` prop
    if (handleBackClick) {
        handleBackClick(); // Go back to dashboard/claim list
    }
  };

  if (createdClaim) { // Use renamed state
      const isDraft = createdClaim.status === 'DRAFT';
      const successMessage = isDraft ? 'Draft Saved Successfully!' : 'Claim Processed Successfully!'; // Updated text
      const detailsTitle = isDraft ? 'Draft Details:' : 'Claim Details:';
      const buttonText = isDraft ? 'Create New Claim' : 'Back to Dashboard'; // Updated button text

      return (
        <motion.div
            className="rc-form-container rc-confirmation-container" // Updated class
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="rc-confirmation-content"> {/* Updated class */}
                <FaCheckCircle className="rc-success-icon" /> {/* Updated class */}
                <h3 className="rc-success-message">{successMessage}</h3> {/* Updated text */}
                <div className="rc-claim-data"> {/* Updated class */}
                    <h4>{detailsTitle}</h4> {/* Updated text */}
                    <p><strong>Claim Number:</strong> {createdClaim.claimNumber}</p>
                    <p><strong>Status:</strong> {createdClaim.statusLabel}</p>
                    <p><strong>Customer:</strong> {createdClaim.customer.name}</p>
                    <p><strong>Vehicle VIN:</strong> {createdClaim.vehicle.vin}</p>
                    {/* Conditionally render Assigned To, as drafts may not have it */}
                    {createdClaim.assignedTechnician && (
                      <p><strong>Assigned To:</strong> {createdClaim.assignedTechnician.fullName}</p>
                    )}
                </div>
                <button onClick={handleCreateAnother} className="rc-create-another-button"> {/* Updated class */}
                    {buttonText} {/* Updated text */}
                </button>
            </div>
        </motion.div>
      );
  }

  // --- NEW: Determine title based on flow mode ---
  const pageTitle = flowMode === 'intake' ? 'Process Draft Claim' : 'New Repair Claim';
  const pageDescription = flowMode === 'intake' 
    ? 'Complete the remaining details to process this draft into an open claim.'
    : 'Create a new repair claim for a customer.';

  return (
    <div className="repair-claim-page-wrapper"> {/* Updated class */}
      <div className="repair-claim-page-header"> {/* Updated class */}
        <button onClick={handleBackClick} className="rc-back-to-dashboard-button"> {/* Updated class */}
          ← Back to Dashboard
        </button>
        <h2 className="rc-page-title">{pageTitle}</h2> {/* Updated text */}
        <p className="rc-page-description">{pageDescription}</p> {/* Updated text */}
      </div>
      <motion.div
        className="rc-form-container" // Updated class
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* --- NEW: Change form submit handler based on flow mode --- */}
        <form 
          onSubmit={flowMode === 'intake' ? handleIntakeSubmit : handleSubmit} 
          onClick={() => { setShowResults(false); setShowVehicleResults(false); }}
        >
          <h3>Customer & Vehicle Information</h3>
          <div className="rc-form-grid"> {/* Updated class */}
            <input type="text" name="customerName" placeholder="Customer Name" value={formData.customerName} onChange={handleChange} required disabled={flowMode === 'intake'} />
            <div className="rc-phone-search-container"> {/* Updated class */}
              <input
                type="text"
                name="customerPhone"
                placeholder="Customer Phone (type to search)"
                value={formData.customerPhone}
                onChange={handlePhoneChange}
                onClick={(e) => e.stopPropagation()}
                autoComplete="off"
                required
                disabled={flowMode === 'intake'} // --- NEW: Disable fields in intake mode
              />
              {showResults && searchResults.length > 0 && (
                <div className="rc-search-results"> {/* Updated class */}
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="rc-search-result-item" // Updated class
                      onClick={() => handleCustomerSelect(customer)}
                    >
                      <p><strong>{customer.name}</strong></p>
                      <p>{customer.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="email" name="customerEmail" placeholder="Customer Email" value={formData.customerEmail} onChange={handleChange} required disabled={flowMode === 'intake'} />
            <input type="text" name="customerAddress" placeholder="Customer Address" value={formData.customerAddress} onChange={handleChange} required disabled={flowMode === 'intake'} />
            
            {customerVehicles.length > 0 ? (
                <div className={`rc-custom-select-container ${showVehicleResults ? 'open' : ''}`}> {/* Updated class */}
                    <div 
                        className="rc-custom-select-trigger" // Updated class
                        onClick={(e) => { e.stopPropagation(); if (flowMode !== 'intake') setShowVehicleResults(!showVehicleResults); }} // --- NEW: Disable
                    >
                        {getSelectedVehicleDisplay()}
                    </div>
                    {showVehicleResults && (
                        <div className="rc-search-results"> {/* Updated class */}
                            {customerVehicles.map((vehicle) => (
                                <div
                                    key={vehicle.id}
                                    className="rc-search-result-item" // Updated class
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
                <input type="text" name="vin" placeholder="Vehicle VIN" value={formData.vin} onChange={handleChange} required disabled={flowMode === 'intake'} />
            )}

            <input type="number" name="mileageKm" placeholder="Mileage (km)" value={formData.mileageKm} onChange={handleChange} required />
          </div>
          
          <h3>Repair Claim Details</h3>
          <div className="rc-form-grid-single"> {/* Updated class */}
            <input type="text" name="claimTitle" placeholder="Claim Title / Issue Summary" value={formData.claimTitle} onChange={handleChange} required />
            <textarea name="reportedFailure" placeholder="Reported Failure (Detailed Description)" value={formData.reportedFailure} onChange={handleChange} rows="4" required />
          </div>

          <h3>Appointment & Assignment</h3>
          <div className="rc-form-grid"> {/* Updated class */}
            <div className="rc-datetime-container"> {/* Updated class */}
              <input type="datetime-local" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required />
            </div>
            {/* --- MODIFIED: This field is required for intake --- */}
            <input 
              type="number" 
              name="assignedTechnicianId" 
              placeholder="Assigned Technician ID" 
              value={formData.assignedTechnicianId} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="rc-consent-checkbox"> {/* Updated class */}
            <input type="checkbox" id="customerConsent" name="customerConsent" checked={formData.customerConsent} onChange={handleChange} required />
            <label htmlFor="customerConsent">Customer has given consent for the repair work.</label>
          </div>
          
          {/* --- MODIFIED: Button Wrapper --- */}
          {/* --- NEW: Conditionally render buttons based on flowMode --- */}
          <div className={`rc-form-actions ${flowMode === 'intake' ? 'intake-mode' : ''}`}>
            {flowMode === 'intake' ? (
              <button type="submit">Create Open Claim</button>
            ) : (
              <>
                <button 
                  type="button" 
                  className="rc-draft-button" // Updated class
                  onClick={handleSaveDraft}
                >
                  Save as Draft
                </button>
                <button type="submit">Create Claim</button> {/* Updated text */}
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NewRepairClaimPage;

