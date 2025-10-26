import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle } from 'react-icons/fa';
import './NewRepairClaimPage.css';

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
  
  // --- MODIFIED: flowMode can now be 'new', 'intake', or 'edit-draft' ---
  const [flowMode, setFlowMode] = useState('new'); 
  const [draftId, setDraftId] = useState(null); // To store the ID for the PUT request

  // --- State for Search & Custom Dropdowns ---
  // MODIFIED: phoneQuery now holds the display value (phone number or search text)
  const [phoneQuery, setPhoneQuery] = useState(''); 
  const [searchResults, setSearchResults] = useState([]);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showVehicleResults, setShowVehicleResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- State for Technician Search ---
  const [techQuery, setTechQuery] = useState('');
  const [techSearchResults, setTechSearchResults] = useState([]);
  const [showTechResults, setShowTechResults] = useState(false);
  const [techSearchLoading, setTechSearchLoading] = useState(false);
  // --- END NEW Technician State ---

  // --- Ref to prevent search on initial load when pre-populating data ---
  const isSearchReady = useRef(false);

  // --- Effect to populate form from draft data ---
  useEffect(() => {
    isSearchReady.current = false; // Disable search during data population

    if (draftClaimData) {
      const newFlowMode = draftClaimData.flowType === 'edit' ? 'edit-draft' : 'intake';
      setFlowMode(newFlowMode);
      setDraftId(draftClaimData.id);
      
      const formatToDateTimeLocal = (isoString) => {
        if (!isoString) return '';
        try {
          const date = new Date(isoString);
          const timezoneOffset = date.getTimezoneOffset() * 60000;
          const localDate = new Date(date.getTime() - timezoneOffset);
          return localDate.toISOString().slice(0, 16);
        } catch (e) {
          return '';
        }
      };
      
      const assignedTechId = draftClaimData.assignedTechnician?.id || '';
      const customerPhone = draftClaimData.customer?.phone || '';

      setFormData({
        customerName: draftClaimData.customer?.name || '',
        customerPhone: customerPhone,
        customerEmail: draftClaimData.customer?.email || '',
        customerAddress: draftClaimData.customer?.address || '',
        vin: draftClaimData.vehicle?.vin || '',
        mileageKm: draftClaimData.vehicle?.mileageKm || '',
        claimTitle: draftClaimData.initialDiagnosis || '',
        reportedFailure: draftClaimData.reportedFailure || '',
        appointmentDate: formatToDateTimeLocal(draftClaimData.appointmentDate),
        customerConsent: draftClaimData.customerConsent || false,
        assignedTechnicianId: assignedTechId, 
      });

      // MODIFIED: Set phoneQuery to show ONLY the raw phone number from draft data
      if (customerPhone) {
        setPhoneQuery(customerPhone);
      }
      
      if(draftClaimData.vehicle) {
        setCustomerVehicles([draftClaimData.vehicle]);
      }
      
      // Set techQuery to show only the ID from draft data
      if(assignedTechId) {
        setTechQuery(String(assignedTechId));
      }
    } else {
      setFlowMode('new');
      setFormData(initialFormData);
      setDraftId(null);
    }
    
    // Allow search after initial load, but debounce hook must respect flowMode
    const timer = setTimeout(() => {
        isSearchReady.current = true;
    }, 100); 

    return () => clearTimeout(timer);
  }, [draftClaimData]); // Re-run when prop changes

  // --- Debounced Customer Phone Search Effect ---
  useEffect(() => {
    // The search logic is based on the raw number stored in `formData.customerPhone`.
    const rawPhoneNumber = formData.customerPhone;
    
    if (!isSearchReady.current) {
        return;
    }
    
    if (rawPhoneNumber.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    if (flowMode === 'intake' && rawPhoneNumber === draftClaimData?.customer?.phone) {
      return;
    }

    const searchCustomers = async () => {
      setIsLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/customers/search?phone=${rawPhoneNumber}`,
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
  }, [formData.customerPhone, flowMode, draftClaimData]); // Dependency changed to formData.customerPhone

  // --- Debounced Technician Search Effect ---
  useEffect(() => {
    
    // Only search if the component is ready and the query is not empty
    if (!isSearchReady.current || techQuery.length === 0) {
        setTechSearchResults([]);
        setShowTechResults(false);
        return;
    }

    const searchTechnicians = async () => {
        setTechSearchLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user.token;
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/users/technical`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            let results = [];
            if (Array.isArray(response.data)) {
                // Filter by ID, Full Name, or Username (case-insensitive)
                const queryLower = techQuery.toLowerCase();
                results = response.data.filter(tech => 
                    String(tech.id).includes(techQuery) || 
                    tech.fullName.toLowerCase().includes(queryLower) ||
                    tech.username.toLowerCase().includes(queryLower)
                );
            }

            setTechSearchResults(results);
            setShowTechResults(true);
        } catch (error) {
            setTechSearchResults([]);
            setShowTechResults(true); // Show a blank list/error state
        } finally {
            setTechSearchLoading(false);
        }
    };

    const debounceTimer = setTimeout(() => searchTechnicians(), 300);
    return () => clearTimeout(debounceTimer);
  }, [techQuery]);
  // --- END Technician Search Effect ---


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
  // MODIFIED: handleCustomerSelect to only input phone number
  const handleCustomerSelect = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone, // Raw number for submission
      customerEmail: customer.email,
      customerAddress: customer.address,
    }));
    // Update phoneQuery to show ONLY the raw phone number
    setPhoneQuery(customer.phone);
    // Hide the search box
    setShowResults(false);
    setSearchResults([]);
    fetchVehiclesForCustomer(customer.id);
  };
  
  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({ ...prev, vin: vehicle.vin }));
    setShowVehicleResults(false);
  };
  
  // --- Handle Technician Select to only input the ID ---
  const handleTechnicianSelect = (technician) => {
    const techIdString = String(technician.id);

    setFormData(prev => ({
        ...prev,
        assignedTechnicianId: techIdString,
    }));
    // Update techQuery to show only the ID
    setTechQuery(techIdString); 
    // Hide the search box
    setShowTechResults(false); 
    setTechSearchResults([]);
  };
  // --- END Technician Select ---

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
    
    if (!isSearchReady.current) {
        isSearchReady.current = true;
    }
    
    // 1. Update the display query state immediately
    setPhoneQuery(value);
    
    // 2. Update the form data with the raw phone number for search/submission
    setFormData(prev => ({ ...prev, customerPhone: value }));
    
    // 3. Clear related fields if the phone input is cleared
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
  
  // --- Handle Tech ID Change ---
  const handleTechIdChange = (e) => {
    const value = e.target.value;
    
    if (!isSearchReady.current) {
        isSearchReady.current = true;
    }

    setTechQuery(value);
    
    // Set formData.assignedTechnicianId to the value only if it's numeric/empty, 
    // otherwise clear it to ensure we submit a valid ID or null.
    const rawIdValue = value.match(/^\d+$/) ? value : '';
    setFormData(prev => ({ 
        ...prev, 
        assignedTechnicianId: rawIdValue 
    }));
  };
  // --- END Handle Tech ID Change ---
  
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

    // Simple validation check (can be simplified, but keeping structure consistent)
    for (const key in intakeData) {
      if (key !== 'flow' && (intakeData[key] === '' || intakeData[key] === null || (typeof intakeData[key] === 'number' && isNaN(intakeData[key])))) {
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
  
  // --- NEW: Handle PUT request for updating draft claim ---
  const handleEditDraftSubmit = async (e) => {
    e.preventDefault();

    // Construct data, removing appointmentDate and customerConsent as they are not editable in this flow
    const editDraftData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      vin: formData.vin,
      mileageKm: formData.mileageKm ? parseInt(formData.mileageKm, 10) : 0,
      claimTitle: formData.claimTitle,
      reportedFailure: formData.reportedFailure,
      // Removed appointmentDate and customerConsent from the payload for draft update
    };

    // Basic validation for essential fields for a draft
    if (!editDraftData.claimTitle || !editDraftData.reportedFailure) {
        toast.error('Claim Title and Reported Failure are required.');
        return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/claims/${draftId}/draft`, // Use the specific draft endpoint
        editDraftData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success('Draft claim updated successfully!');
        setCreatedClaim(response.data); // Show success screen
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update draft claim.');
      setCreatedClaim(null);
    }
  };


  // --- NEW: Handle Save as Draft (Original POST for new claims) ---
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
    setPhoneQuery(''); // Reset phone query
    setTechQuery(''); // Reset technician query
    setCustomerVehicles([]);
    setFlowMode('new'); // --- NEW: Reset flow mode ---
    // The parent component will be responsible for clearing the `draftClaimData` prop
    if (handleBackClick) {
        handleBackClick(); // Go back to dashboard/claim list
    }
  };

  if (createdClaim) { // Use renamed state
      const isDraft = createdClaim.status === 'DRAFT';
      const isEditDraftSuccess = flowMode === 'edit-draft';
      const successMessage = isEditDraftSuccess ? 'Draft Edits Saved Successfully!' : (isDraft ? 'Draft Saved Successfully!' : 'Claim Processed Successfully!'); 
      const detailsTitle = isDraft ? 'Draft Details:' : 'Claim Details:';
      const buttonText = isEditDraftSuccess ? 'Back to Claim Details' : 'Back to Dashboard';

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

  // --- Determine title based on flow mode ---
  const pageTitle = flowMode === 'intake' 
    ? 'Process Draft Claim' 
    : (flowMode === 'edit-draft' ? `Edit Draft Claim #${draftClaimData?.claimNumber}` : 'New Repair Claim');
    
  const pageDescription = flowMode === 'intake' 
    ? 'Complete the remaining details to process this draft into an open claim.'
    : (flowMode === 'edit-draft' ? 'Update customer, vehicle, or claim details for this draft.' : 'Create a new repair claim for a customer.');
    
  const isCustomerInfoDisabled = flowMode === 'intake';
  
  // Choose the correct submit handler
  let currentSubmitHandler = handleSubmit;
  if (flowMode === 'intake') {
      currentSubmitHandler = handleIntakeSubmit;
  } else if (flowMode === 'edit-draft') {
      currentSubmitHandler = handleEditDraftSubmit;
  }
  
  // --- Check if the Appointment & Assignment section and checkbox should be hidden ---
  const shouldHideAppointmentAndConsent = flowMode === 'edit-draft';

  return (
    <div className="repair-claim-page-wrapper"> {/* Updated class */}
      <div className="repair-claim-page-header"> {/* Updated class */}
        <button onClick={handleBackClick} className="rc-back-to-dashboard-button"> {/* Updated class */}
          ← Back to {flowMode === 'edit-draft' ? 'Claim Details' : 'Dashboard'}
        </button>
        <h2 className="rc-page-title">{pageTitle}</h2> {/* Updated text */}
        {/* MODIFIED: Conditionally render description. Hide if flowMode is 'new'. */}
        {flowMode !== 'new' && (
          <p className="rc-page-description">{pageDescription}</p> 
        )}
      </div>
      <motion.div
        className="rc-form-container" // Updated class
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form 
          onSubmit={currentSubmitHandler} 
          // Stop propagation for all custom search results
          onClick={() => { 
            setShowResults(false); 
            setShowVehicleResults(false); 
            setShowTechResults(false); // Hide tech results on general form click
          }}
          // --- NEW: Disable browser autocomplete/autofill for the entire form ---
          autoComplete="off"
        >
          <h3>Customer & Vehicle Information</h3>
          <div className="rc-form-grid"> {/* Updated class */}
            <input 
                type="text" 
                name="customerName" 
                placeholder="Customer Name" 
                value={formData.customerName} 
                onChange={handleChange} 
                required 
                disabled={isCustomerInfoDisabled} 
                // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                autocomplete="customer-name-field"
            />
            {/* MODIFIED: Phone Search Input */}
            <div className="rc-phone-search-container"> {/* Updated class */}
              <input
                type="text"
                name="customerPhoneDisplay" // Use a display name for the input
                placeholder="Customer Phone (type to search)"
                value={phoneQuery} // Use phoneQuery for search input/display
                onChange={handlePhoneChange}
                onClick={(e) => e.stopPropagation()}
                // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                autocomplete="new-phone-number-field" 
                required
                disabled={isCustomerInfoDisabled} // --- MODIFIED: Disable only in intake mode
              />
              {/* MODIFIED: Added logic to display "No customer found." */}
              {showResults && (searchResults.length > 0 || !isLoading) && (
                <div className="rc-search-results"> {/* Updated class */}
                  {searchResults.length > 0 ? (
                    searchResults.map((customer) => (
                      <div
                        key={customer.id}
                        className="rc-search-result-item" // Updated class
                        onClick={(e) => { e.stopPropagation(); handleCustomerSelect(customer); }} // Stop propagation
                      >
                        {/* Display full info in the result item for context */}
                        <p><strong>{customer.name}</strong></p>
                        <p>{customer.phone}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rc-search-result-item">
                        <p>No customer found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* END MODIFIED Phone Search Input */}
            
            <input 
                type="email" 
                name="customerEmail" 
                placeholder="Customer Email" 
                value={formData.customerEmail} 
                onChange={handleChange} 
                required 
                disabled={isCustomerInfoDisabled}
                // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                autocomplete="customer-email-field"
            />
            <input 
                type="text" 
                name="customerAddress" 
                placeholder="Customer Address" 
                value={formData.customerAddress} 
                onChange={handleChange} 
                required 
                disabled={isCustomerInfoDisabled} 
                // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                autocomplete="customer-address-field"
            />
            
            {customerVehicles.length > 0 ? (
                // --- Vehicle selection is NOT disabled for intake/edit-draft to allow changing VIN
                <div className={`rc-custom-select-container ${showVehicleResults ? 'open' : ''}`}> 
                    <div 
                        className="rc-custom-select-trigger" 
                        onClick={(e) => { e.stopPropagation(); setShowVehicleResults(!showVehicleResults); }} 
                    >
                        {getSelectedVehicleDisplay()}
                    </div>
                    {showVehicleResults && (
                        <div className="rc-search-results"> 
                            {customerVehicles.map((vehicle) => (
                                <div
                                    key={vehicle.id}
                                    className="rc-search-result-item" 
                                    onClick={(e) => { e.stopPropagation(); handleVehicleSelect(vehicle); }} // Stop propagation
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
                // --- Allow VIN input in all flows if no vehicles are linked/fetched ---
                <input 
                    type="text" 
                    name="vin" 
                    placeholder="Vehicle VIN" 
                    value={formData.vin} 
                    onChange={handleChange} 
                    required
                    // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                    autocomplete="vehicle-vin-field"
                />
            )}

            <input type="number" name="mileageKm" placeholder="Mileage (km)" value={formData.mileageKm} onChange={handleChange} required />
          </div>
          
          <h3>Repair Claim Details</h3>
          <div className="rc-form-grid-single"> {/* Updated class */}
            <input type="text" name="claimTitle" placeholder="Claim Title / Issue Summary" value={formData.claimTitle} onChange={handleChange} required />
            <textarea name="reportedFailure" placeholder="Reported Failure (Detailed Description)" value={formData.reportedFailure} onChange={handleChange} rows="4" required />
          </div>

          {/* --- MODIFIED: Conditional rendering for Appointment & Assignment section --- */}
          {!shouldHideAppointmentAndConsent && (
            <>
              <h3>Appointment & Assignment</h3>
              <div className="rc-form-grid"> {/* Updated class */}
                <div className="rc-datetime-container"> {/* Updated class */}
                  <input type="datetime-local" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange} required />
                </div>
                
                {/* --- Technician ID Search Input & Results --- */}
                <div className="rc-technician-search-container">
                    <input 
                      type="text" // Change to text to allow for full name/ID search display
                      name="assignedTechnicianId" 
                      placeholder="Assigned Technician ID (Search by ID/Name)" 
                      value={techQuery} // Bind to techQuery for search/display
                      onChange={handleTechIdChange}
                      onClick={(e) => e.stopPropagation()}
                      required={flowMode === 'intake'} 
                      autocomplete="off"
                    />
                    {showTechResults && (techSearchResults.length > 0 || !techSearchLoading) && (
                        <div className="rc-search-results">
                            {techSearchResults.length > 0 ? (
                                techSearchResults.map((tech) => (
                                    <div
                                        key={tech.id}
                                        className="rc-search-result-item"
                                        onClick={(e) => { e.stopPropagation(); handleTechnicianSelect(tech); }}
                                    >
                                        {/* Display full info in the result item for context */}
                                        <p><strong>{tech.fullName}</strong></p>
                                        <p>ID: {tech.id} ({tech.active ? 'Active' : 'Inactive'})</p>
                                    </div>
                                ))
                            ) : (
                                <div className="rc-search-result-item">
                                    <p>No technician found matching your search.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* --- END Technician Search --- */}
              </div>

              {/* --- MODIFIED: Conditional rendering for Customer Consent checkbox --- */}
              <div className="rc-consent-checkbox"> {/* Updated class */}
                <input type="checkbox" id="customerConsent" name="customerConsent" checked={formData.customerConsent} onChange={handleChange} required />
                <label htmlFor="customerConsent">Customer has given consent for the repair work.</label>
              </div>
            </>
          )}
          
          {/* --- Button Wrapper --- */}
          {/* --- Conditionally render buttons based on flow mode --- */}
          <div className={`rc-form-actions ${flowMode !== 'new' ? 'intake-edit-mode' : ''}`}>
            {flowMode === 'intake' && (
              <button type="submit">Create Open Claim</button>
            )}
            
            {flowMode === 'edit-draft' && (
                <button type="submit">Save Edits to Draft Claim</button>
            )}

            {flowMode === 'new' && (
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