// AddNewVehicle.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
// FaCalendarAlt included for use in JSX
import { FaPlus, FaTrash, FaCheckCircle, FaSearch, FaCalendarAlt } from 'react-icons/fa'; 
import './AddNewVehicle.css';

// Initial state for an installed part (different from diagnostic part as this uses serialNumber)
const initialInstalledPart = {
  partId: '',
  partName: '',
  serialNumber: '',
  manufactureDate: '',
  installedAt: '',
  // Search state
  searchQuery: '',
  searchResults: [],
  showResults: false,
};

const initialFormData = {
  vin: '',
  licensePlate: '',
  model: '',
  year: '',
  mileageKm: '',
  customerId: '', // For existing customer
  // For new customer
  customerInfo: {
    name: '',
    email: '',
    phone: '',
    address: '',
  },
  registrationDate: '',
  warrantyStart: '',
  warrantyEnd: '',
  installedParts: [initialInstalledPart],
};

const AddNewVehicle = ({ handleBackClick, onVehicleAdded }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVehicle, setCreatedVehicle] = useState(null); // Keep this state for form reset logic if needed later, but remove confirmation screen
  
  // State for Customer Search
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  
  // State for Part Catalog
  const [allPartSerials, setAllPartSerials] = useState([]);
  const [partDataLoading, setPartDataLoading] = useState(false);
  
  // --- Effects ---

  // 1. Fetch Part Serials (for part search function)
  useEffect(() => {
    const fetchPartSerials = async () => {
      setPartDataLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const partResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/part-serials`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (partResponse.status === 200) {
          // We only need unique part types for searching the catalog
          const uniqueParts = [];
          const seenPartKeys = new Set();
          
          partResponse.data.forEach(part => {
              const partKey = `${part.partId}-${part.partName}`;
              if (!seenPartKeys.has(partKey)) {
                  uniqueParts.push(part);
                  seenPartKeys.add(partKey);
              }
          });
          setAllPartSerials(uniqueParts);
        }
      } catch (err) {
        toast.error('Failed to load parts catalog for search.');
      } finally {
        setPartDataLoading(false);
      }
    };
    fetchPartSerials();
  }, []);
  
  // 2. Customer Search Debounce Effect (Combined ID and Phone search)
  useEffect(() => {
    const query = customerSearchQuery.trim();
    
    // Clear selected customerId if the query is too short or invalid for ID
    if (query.length < 3) { 
        setFormData(prev => ({ ...prev, customerId: '' }));
    }
    
    if (query.length < 1) { // Changed to 1 to allow ID search (e.g., ID 1)
      setCustomerSearchResults([]);
      setShowCustomerResults(false);
      return;
    }

    const searchCustomer = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        let results = [];
        
        // --- 🔍 Attempt 1: Search by ID (if query is a number) ---
        if (!isNaN(query) && query.length < 10) { 
             try {
                 const idResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/customers/${query}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                 );
                 // FIX: Get Customer by ID returns a single object, wrap it in an array for display
                 if (idResponse.data && idResponse.data.id) { 
                     results = [idResponse.data];
                 }
             } catch (idError) {
                 // If ID search fails (e.g., 404), we proceed to phone search
             }
        } 
        
        // --- 🔍 Attempt 2: Search by Phone (if no results or query is likely a phone number) ---
        // If we didn't find a customer by ID OR if the query is long enough for a phone number
        if (results.length === 0 && query.length >= 3) { 
            const phoneResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/api/customers/search?phone=${query}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            // Phone search returns an array
            results = Array.isArray(phoneResponse.data) ? phoneResponse.data : [];
        }

        setCustomerSearchResults(results);
        setShowCustomerResults(true);

      } catch (error) {
        // Generic catch for any network or final failure
        setCustomerSearchResults([]);
        setShowCustomerResults(true); 
      }
    };
    const debounceTimer = setTimeout(() => searchCustomer(), 300);
    return () => clearTimeout(debounceTimer);
  }, [customerSearchQuery]);

  // --- General Change Handlers ---
  const handleGeneralChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [name]: value,
      },
      // FIX: Ensure customerId is completely cleared when user starts filling new customer info
      customerId: '', 
    }));
    // Clear search query to reflect that we are now creating a new customer
    setCustomerSearchQuery('');
  };
  
  // --- Customer Search Handlers ---
  const handleCustomerSelect = (customer) => {
    // FIX: Only set customerId and clear customerInfo
    setFormData(prev => ({
      ...prev,
      customerId: String(customer.id),
      customerInfo: initialFormData.customerInfo, // Clear new customer info
    }));
    setCustomerSearchQuery(String(customer.id));
    setShowCustomerResults(false);
    toast.info(`Existing Customer ID ${customer.id} selected. Customer Info fields are now ignored.`);
  };

  const handleCustomerQueryChange = (e) => {
    const value = e.target.value;
    setCustomerSearchQuery(value);

    // FIX: We need to clear customerId when the user types a new query,
    // as the selection is now invalid until a new customer is selected.
    setFormData(prev => ({
      ...prev,
      customerInfo: initialFormData.customerInfo,
      customerId: '', // Clear customerId while typing a new query
    }));
  };
  
  // --- Part Search Handlers ---
  const performPartSearch = (query) => {
    const queryLower = query.toLowerCase();
    if (queryLower.length < 2) return [];

    const filteredParts = allPartSerials.filter(part => 
      part.partName.toLowerCase().includes(queryLower) ||
      part.partNumber.toLowerCase().includes(queryLower) ||
      String(part.partId).includes(queryLower)
    );
    return filteredParts;
  };

  const handlePartChange = (index, field, value) => {
    const newParts = [...formData.installedParts];
    newParts[index][field] = value;

    if (field === 'searchQuery') {
      newParts[index].searchResults = performPartSearch(value);
      newParts[index].showResults = true;
      newParts[index].partId = '';
      newParts[index].partName = '';
      newParts[index].serialNumber = '';
    } else if (field === 'partId' || field === 'serialNumber') {
      newParts[index][field] = value;
    }

    setFormData(prev => ({ ...prev, installedParts: newParts }));
  };

  const handlePartSelect = (index, part) => {
    const newParts = [...formData.installedParts];
    newParts[index] = {
      ...newParts[index],
      partId: String(part.partId),
      partName: part.partName,
      searchQuery: part.partName,
      searchResults: [],
      showResults: false,
    };
    setFormData(prev => ({ ...prev, installedParts: newParts }));
    toast.info(`Part ID ${part.partId} selected. Enter Serial Number and Date fields.`);
  };

  const handleAddPart = () => {
    const lastPart = formData.installedParts[formData.installedParts.length - 1];
    if (lastPart && lastPart.partId && lastPart.serialNumber && lastPart.installedAt) {
      setFormData(prev => ({ 
        ...prev, 
        installedParts: [...prev.installedParts, initialInstalledPart] 
      }));
    } else {
      toast.warn('Please complete the current part entry before adding a new one.');
    }
  };

  const handleRemovePart = (index) => {
    const newParts = formData.installedParts.filter((_, i) => i !== index);
    setFormData(prev => ({ 
      ...prev, 
      installedParts: newParts.length > 0 ? newParts : [initialInstalledPart] 
    }));
  };
  
  // --- Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    let customerPayload = {};
    const customerIdInt = parseInt(formData.customerId, 10);
    // FIX: Use this boolean to control all customer-related logic
    const useExistingCustomer = !isNaN(customerIdInt) && customerIdInt > 0; 
    
    if (useExistingCustomer) {
      customerPayload.customerId = customerIdInt;
    } else {
      const info = formData.customerInfo;
      // FIX: Check if customerInfo fields are filled when customerId is not present
      if (!info.name || !info.email || !info.phone || !info.address) {
        toast.error('Customer ID is not provided. Please provide ALL New Customer Info fields for a new customer.');
        return;
      }
      customerPayload.customerInfo = info;
    }
    
    const requiredFields = ['vin', 'licensePlate', 'model', 'year', 'mileageKm', 'registrationDate', 'warrantyStart', 'warrantyEnd'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Field '${field}' is required.`);
        return;
      }
    }
    
    const cleanedParts = formData.installedParts
        .filter(part => part.partId && part.serialNumber && part.installedAt)
        .map(part => ({
            partId: Number(part.partId),
            serialNumber: part.serialNumber,
            // Use current date as fallback for manufactureDate if none is provided
            manufactureDate: part.manufactureDate || new Date().toISOString().slice(0, 10), 
            installedAt: new Date(part.installedAt).toISOString(),
        }));

    const hasIncompletePart = formData.installedParts.some(part => 
        (part.partId || part.serialNumber || part.installedAt) && 
        !(part.partId && part.serialNumber && part.installedAt));

    if (hasIncompletePart) {
        toast.error('Please complete all fields for every installed part, or remove the incomplete entries.');
        return;
    }

    const payload = {
      vin: formData.vin,
      licensePlate: formData.licensePlate,
      model: formData.model,
      year: Number(formData.year),
      mileageKm: Number(formData.mileageKm),
      ...customerPayload,
      registrationDate: formData.registrationDate,
      warrantyStart: formData.warrantyStart,
      warrantyEnd: formData.warrantyEnd,
      installedParts: cleanedParts,
    };

    setIsSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/vehicles/register`,
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Status check for 200 or 201
      if (response.status === 200 || response.status === 201) { 
        toast.success(`Vehicle VIN: ${response.data.vin} registered successfully!`);
        
        // ***************************************************************
        // * MODIFICATION: Explicitly reset all form state to initial    *
        // * values before notifying the parent to switch the view.      *
        // ***************************************************************
        setFormData(initialFormData);
        setCustomerSearchQuery('');
        setCreatedVehicle(null); // Clear any lingering confirmation state

        onVehicleAdded(); // Notify VehicleManagementPage to switch to 'all-vehicles'
        
      }
    } catch (error) {
      let errorMessage = 'Failed to register new vehicle.';
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // --- Form View ---
  const useExistingCustomer = !!formData.customerId; // Boolean to control new customer fields

  return (
    <motion.div
      className="add-vehicle-form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} autoComplete="off">
        
        {/* Vehicle Details */}
        <div className="vm-form-section">
            <h4 className="vm-form-subtitle">Vehicle Details</h4>
            
            {/* Main Vehicle Specs */}
            <div className="vm-form-grid">
              <div className="vm-form-group">
                <label htmlFor="vin">VIN (17 chars) *</label>
                <input id="vin" type="text" name="vin" placeholder="Enter VIN" value={formData.vin} onChange={handleGeneralChange} maxLength="17" required />
              </div>
              <div className="vm-form-group">
                <label htmlFor="licensePlate">License Plate *</label>
                <input id="licensePlate" type="text" name="licensePlate" placeholder="Enter License Plate" value={formData.licensePlate} onChange={handleGeneralChange} required />
              </div>
              <div className="vm-form-group">
                <label htmlFor="model">Model *</label>
                <input id="model" type="text" name="model" placeholder="e.g., Challenger" value={formData.model} onChange={handleGeneralChange} required />
              </div>
              <div className="vm-form-group">
                <label htmlFor="year">Year *</label>
                <input id="year" type="number" name="year" placeholder="e.g., 2024" value={formData.year} onChange={handleGeneralChange} required min="1900" max={new Date().getFullYear() + 1} />
              </div>
              <div className="vm-form-group">
                <label htmlFor="mileageKm">Mileage (km) *</label>
                <input id="mileageKm" type="number" name="mileageKm" placeholder="e.g., 500" value={formData.mileageKm} onChange={handleGeneralChange} required min="0" />
              </div>
            </div>

            {/* Date & Warranty Specs - FIXED Calendar Icon */}
            <div className="vm-form-date-group">
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="registrationDate">Registration Date *</label>
                <input id="registrationDate" type="date" name="registrationDate" value={formData.registrationDate} onChange={handleGeneralChange} required />
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="warrantyStart">Warranty Start Date *</label>
                <input id="warrantyStart" type="date" name="warrantyStart" value={formData.warrantyStart} onChange={handleGeneralChange} required />
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="warrantyEnd">Warranty End Date *</label>
                <input id="warrantyEnd" type="date" name="warrantyEnd" value={formData.warrantyEnd} onChange={handleGeneralChange} required />
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
            </div>
        </div>

        {/* Customer Information (Mutually Exclusive Search) */}
        <div className="vm-form-section">
            <h4 className="vm-form-subtitle">Customer Information</h4>
            <p className="vm-section-description">Search for an existing customer by ID or phone number, OR fill out the "New Customer Info" below.</p>
            
            <div className="vm-search-group">
                <label className="vm-search-label">
                    Existing Customer Search 
                    {/* FIX: Use useExistingCustomer variable to determine status/text */}
                    <span className={`vm-info-status ${useExistingCustomer ? 'active' : 'inactive'}`}>
                        {useExistingCustomer ? (
                            <>
                                <FaCheckCircle /> 
                                ID Selected: {formData.customerId}
                            </>
                        ) : (
                            <>
                                <FaSearch />
                                New Customer Required
                            </>
                        )}
                    </span>
                </label>
                <div className="vm-customer-search-container">
                    {/* The FaSearch icon was removed here to fix the overlap. */}
                    <input
                        type="text"
                        placeholder="Search Customer by ID or Phone Number..."
                        value={customerSearchQuery}
                        onChange={handleCustomerQueryChange}
                        onFocus={() => setShowCustomerResults(true)}
                        onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                        // Removed required attribute, as submission logic handles the requirement
                    />
                    {showCustomerResults && (
                        <div className="vm-search-results">
                            {customerSearchResults.length > 0 ? (
                                customerSearchResults.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className="vm-search-result-item"
                                        onMouseDown={(e) => { e.preventDefault(); handleCustomerSelect(customer); }}
                                    >
                                        <p><strong>{customer.name}</strong> (ID: {customer.id})</p>
                                        <p>Phone: {customer.phone}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="vm-search-result-item vm-no-results">
                                    <p>No customer found. Proceed to New Customer Info fields below.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* NEW Customer Info Fields (only active if no customerId is set) */}
            <h4 className="vm-form-subtitle vm-form-subtitle-secondary">New Customer Info (Only required if no Existing Customer is selected)</h4>
            <div className="vm-form-grid vm-customer-info-grid">
              <div className="vm-form-group">
                <label htmlFor="new-name">Name *</label>
                <input 
                  id="new-name" type="text" name="name" placeholder="Customer Name" 
                  value={formData.customerInfo.name} onChange={handleCustomerInfoChange} 
                  // FIX: Use useExistingCustomer for disable/required logic
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-phone">Phone *</label>
                <input 
                  id="new-phone" type="text" name="phone" placeholder="Phone Number" 
                  value={formData.customerInfo.phone} onChange={handleCustomerInfoChange} 
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-email">Email *</label>
                <input 
                  id="new-email" type="email" name="email" placeholder="Email Address" 
                  value={formData.customerInfo.email} onChange={handleCustomerInfoChange} 
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-address">Address *</label>
                <input 
                  id="new-address" type="text" name="address" placeholder="Physical Address" 
                  value={formData.customerInfo.address} onChange={handleCustomerInfoChange} 
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
            </div>
        </div>
        
        {/* Installed Parts Section */}
        <div className="vm-form-section">
            <h4 className="vm-form-subtitle">Installed Parts (Initial Factory Parts) {partDataLoading && ' (Loading Catalog...)'}</h4>
            <p className="vm-section-description">Register the main factory parts installed in the vehicle at registration. A minimum of one part is recommended.</p>
            
            <div className="vm-parts-list">
              {/* Part Header Row (Acts as labels for the grid) */}
              <div className="vm-part-header">
                <p className="part-name">Part Name / Search</p>
                <p>Part ID</p>
                <p>Serial Number</p>
                <p className="manufacture-col">Manuf. Date</p>
                <p className="installed-at-col">Installed At</p>
                <p className="remove-col">Del</p> {/* Changed 'Remove' to 'Del' */}
              </div>

              {formData.installedParts.map((part, index) => (
                <div key={index} className="vm-part-item vm-part-row">
                  
                  {/* Part Name / Search Input */}
                  <div className="vm-form-group vm-search-container">
                    <label>Part Name / Search *</label>
                    <input
                      type="text"
                      value={part.searchQuery}
                      onChange={(e) => handlePartChange(index, 'searchQuery', e.target.value)}
                      onFocus={() => handlePartChange(index, 'showResults', true)}
                      onBlur={() => setTimeout(() => handlePartChange(index, 'showResults', false), 200)}
                      placeholder="Search Part Name"
                      required
                      autoComplete="off"
                    />
                    {part.showResults && part.searchQuery.length > 0 && (
                        <div className="vm-search-results">
                            {part.searchResults.length > 0 ? (
                                part.searchResults.map((result) => (
                                    <div
                                        key={`${result.partId}-${result.partNumber}`}
                                        className="vm-search-result-item"
                                        onMouseDown={(e) => { e.preventDefault(); handlePartSelect(index, result); }}
                                    >
                                        <p><strong>{result.partName}</strong></p>
                                        <p>ID: {result.partId} | Number: {result.partNumber}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="vm-search-result-item vm-no-results">
                                    <p>Part not found in catalog.</p>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                  
                  {/* Part ID Input */}
                  <div className="vm-form-group">
                    <label>Part ID *</label>
                    <input
                      type="number"
                      name="partId"
                      value={part.partId}
                      onChange={(e) => handlePartChange(index, 'partId', e.target.value)}
                      placeholder="ID"
                      required
                      min="1"
                    />
                  </div>
                  
                  {/* Serial Number Input */}
                  <div className="vm-form-group">
                    <label>Serial Number *</label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={part.serialNumber}
                      onChange={(e) => handlePartChange(index, 'serialNumber', e.target.value)}
                      placeholder="Serial No."
                      required
                    />
                  </div>

                  {/* Manufacture Date Input - FIXED Calendar Icon */}
                  <div className="vm-form-group vm-date-group-with-icon">
                    <label>Manuf. Date</label>
                    <input
                      type="date"
                      name="manufactureDate"
                      value={part.manufactureDate}
                      onChange={(e) => handlePartChange(index, 'manufactureDate', e.target.value)}
                    />
                    <FaCalendarAlt className="vm-calendar-icon" />
                  </div>

                  {/* Installed At Date Input - FIXED Calendar Icon */}
                  <div className="vm-form-group vm-date-group-with-icon">
                    <label>Installed At *</label>
                    <input
                      type="datetime-local"
                      name="installedAt"
                      value={part.installedAt}
                      onChange={(e) => handlePartChange(index, 'installedAt', e.target.value)}
                      required
                    />
                    <FaCalendarAlt className="vm-calendar-icon" />
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePart(index)}
                    className="vm-remove-part-btn"
                    title="Delete Part"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={handleAddPart}
              className="vm-add-part-btn"
              disabled={partDataLoading}
            >
              <FaPlus /> Add Part
            </button>
        </div>


        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering Vehicle...' : 'Register New Vehicle'}
        </button>
      </form>
    </motion.div>
  );
};

export default AddNewVehicle;