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
  vehicleModelId: '', // ID of selected vehicle model
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
  
  // State for Vehicle Models
  const [vehicleModels, setVehicleModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [modelSearchResults, setModelSearchResults] = useState([]);
  const [showModelResults, setShowModelResults] = useState(false);
  
  // --- Effects ---

  // 1. Fetch Vehicle Models (for model dropdown)
  useEffect(() => {
    const fetchVehicleModels = async () => {
      setModelsLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const modelsResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/vehicle-models/active`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (modelsResponse.status === 200) {
          setVehicleModels(modelsResponse.data);
          setModelSearchResults(modelsResponse.data);
        }
      } catch (err) {
        toast.error('Không thể tải danh sách mẫu xe.');
      } finally {
        setModelsLoading(false);
      }
    };
    fetchVehicleModels();
  }, []);

  // 2. Fetch Part Serials (for part search function)
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
        toast.error('Không thể tải danh mục phụ tùng để tìm kiếm.');
      } finally {
        setPartDataLoading(false);
      }
    };
    fetchPartSerials();
  }, []);
  
  // 3. Customer Search Debounce Effect (Combined ID and Phone search)
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

  // Handle Vehicle Model Search
  const performModelSearch = (query) => {
    const queryLower = query.toLowerCase();
    if (queryLower.length < 1) return vehicleModels;

    return vehicleModels.filter(model => 
      model.name.toLowerCase().includes(queryLower) ||
      (model.brand && model.brand.toLowerCase().includes(queryLower)) ||
      (model.code && model.code.toLowerCase().includes(queryLower)) ||
      String(model.id).includes(queryLower)
    );
  };

  const handleModelQueryChange = (e) => {
    const value = e.target.value;
    setModelSearchQuery(value);
    
    // Update search results
    const results = performModelSearch(value);
    setModelSearchResults(results);
    setShowModelResults(true);

    // Clear selection if user is typing something different from the selected model
    if (value !== formData.model) {
      setFormData(prev => ({
        ...prev,
        vehicleModelId: '',
        model: '',
      }));
    }
  };

  const handleModelSelect = (model) => {
    setFormData(prev => ({
      ...prev,
      vehicleModelId: model.id,
      model: model.name, // Auto-fill model name
    }));
    setModelSearchQuery(model.name);
    setShowModelResults(false);
    toast.info(`Đã chọn mẫu xe: ${model.name}`);
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
    toast.info(`Đã chọn ID Khách hàng Hiện có ${customer.id}. Các trường Thông tin Khách hàng hiện bị bỏ qua.`);
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
    toast.info(`Đã chọn ID Phụ tùng ${part.partId}. Nhập Số Serial và các trường Ngày.`);
  };

  const handleAddPart = () => {
    const lastPart = formData.installedParts[formData.installedParts.length - 1];
    if (lastPart && lastPart.partId && lastPart.serialNumber && lastPart.installedAt) {
      setFormData(prev => ({ 
        ...prev, 
        installedParts: [...prev.installedParts, initialInstalledPart] 
      }));
    } else {
      toast.warn('Vui lòng hoàn tất mục phụ tùng hiện tại trước khi thêm mục mới.');
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
        toast.error('ID Khách hàng không được cung cấp. Vui lòng điền TẤT CẢ các trường Thông tin Khách hàng Mới cho khách hàng mới.');
        return;
      }
      customerPayload.customerInfo = info;
    }
    
    // Validate vehicleModelId is selected
    if (!formData.vehicleModelId) {
      toast.error('Vui lòng chọn mẫu xe từ danh sách.');
      return;
    }

    const requiredFields = ['vin', 'licensePlate', 'model', 'year', 'mileageKm', 'registrationDate', 'warrantyStart', 'warrantyEnd'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error(`Trường '${field}' là bắt buộc.`);
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
        toast.error('Vui lòng hoàn tất tất cả các trường cho mỗi phụ tùng đã cài đặt, hoặc xóa các mục chưa hoàn tất.');
        return;
    }

    const payload = {
      vin: formData.vin,
      licensePlate: formData.licensePlate,
      model: formData.model,
      vehicleModelId: formData.vehicleModelId ? Number(formData.vehicleModelId) : null,
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
        toast.success(`Số VIN Xe: ${response.data.vin} đã được đăng ký thành công!`);
        
        // ***************************************************************
        // * MODIFICATION: Explicitly reset all form state to initial    *
        // * values before notifying the parent to switch the view.      *
        // ***************************************************************
        setFormData(initialFormData);
        setCustomerSearchQuery('');
        setModelSearchQuery('');
        setShowModelResults(false);
        setCreatedVehicle(null); // Clear any lingering confirmation state

        onVehicleAdded(); // Notify VehicleManagementPage to switch to 'all-vehicles'
        
      }
    } catch (error) {
      let errorMessage = 'Không thể đăng ký xe mới.';
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
            <h4 className="vm-form-subtitle">Chi tiết Xe</h4>
            
            {/* Main Vehicle Specs */}
            <div className="vm-form-grid">
              <div className="vm-form-group">
                <label htmlFor="vin">Số VIN (17 ký tự) *</label>
                <input id="vin" type="text" name="vin" placeholder="Nhập Số VIN" value={formData.vin} onChange={handleGeneralChange} maxLength="17" required />
              </div>
              <div className="vm-form-group">
                <label htmlFor="licensePlate">Biển số Xe *</label>
                <input id="licensePlate" type="text" name="licensePlate" placeholder="Nhập Biển số Xe" value={formData.licensePlate} onChange={handleGeneralChange} required />
              </div>
              <div className="vm-form-group">
                <label htmlFor="model">Mẫu xe *</label>
                <div className="vm-customer-search-container">
                  <input
                    id="model"
                    type="text"
                    name="model"
                    placeholder={modelsLoading ? "Đang tải danh sách mẫu xe..." : "Tìm kiếm mẫu xe theo tên, thương hiệu, mã hoặc ID..."}
                    value={modelSearchQuery}
                    onChange={handleModelQueryChange}
                    onFocus={() => {
                      if (vehicleModels.length > 0) {
                        setModelSearchResults(performModelSearch(modelSearchQuery));
                        setShowModelResults(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowModelResults(false), 200)}
                    required
                    disabled={modelsLoading}
                    autoComplete="off"
                  />
                  {showModelResults && !modelsLoading && (
                    <div className="vm-search-results">
                      {modelSearchResults.length > 0 ? (
                        modelSearchResults.map((model) => (
                          <div
                            key={model.id}
                            className="vm-search-result-item"
                            onMouseDown={(e) => { e.preventDefault(); handleModelSelect(model); }}
                          >
                            <p><strong>{model.name}</strong> {model.brand ? `(${model.brand})` : ''}</p>
                            {model.code && <p>Mã: {model.code}</p>}
                          </div>
                        ))
                      ) : (
                        <div className="vm-search-result-item vm-no-results">
                          <p>Không tìm thấy mẫu xe phù hợp.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="vm-form-group">
                <label htmlFor="year">Năm *</label>
                <input id="year" type="number" name="year" placeholder="ví dụ: 2024" value={formData.year} onChange={handleGeneralChange} required min="1900" max={new Date().getFullYear() + 1} />
              </div>
              <div className="vm-form-group">
                <label htmlFor="mileageKm">Số km (km) *</label>
                <input id="mileageKm" type="number" name="mileageKm" placeholder="ví dụ: 500" value={formData.mileageKm} onChange={handleGeneralChange} required min="0" />
              </div>
            </div>

            {/* Date & Warranty Specs - FIXED Calendar Icon */}
            <div className="vm-form-date-group">
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="registrationDate">Ngày Đăng ký *</label>
                <input id="registrationDate" type="date" name="registrationDate" value={formData.registrationDate} onChange={handleGeneralChange} required />
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="warrantyStart">Ngày Bắt đầu Bảo hành *</label>
                <input id="warrantyStart" type="date" name="warrantyStart" value={formData.warrantyStart} onChange={handleGeneralChange} required />
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="warrantyEnd">Ngày Kết thúc Bảo hành *</label>
                <input id="warrantyEnd" type="date" name="warrantyEnd" value={formData.warrantyEnd} onChange={handleGeneralChange} required />
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
            </div>
        </div>

        {/* Customer Information (Mutually Exclusive Search) */}
        <div className="vm-form-section">
            <h4 className="vm-form-subtitle">Thông tin Khách hàng</h4>
            <p className="vm-section-description">Tìm kiếm khách hàng hiện có theo ID hoặc số điện thoại, HOẶC điền "Thông tin Khách hàng Mới" bên dưới.</p>
            
            <div className="vm-search-group">
                <label className="vm-search-label">
                    Tìm kiếm Khách hàng Hiện có 
                    {/* FIX: Use useExistingCustomer variable to determine status/text */}
                    <span className={`vm-info-status ${useExistingCustomer ? 'active' : 'inactive'}`}>
                        {useExistingCustomer ? (
                            <>
                                <FaCheckCircle /> 
                                Đã chọn ID: {formData.customerId}
                            </>
                        ) : (
                            <>
                                <FaSearch />
                                Cần Khách hàng Mới
                            </>
                        )}
                    </span>
                </label>
                <div className="vm-customer-search-container">
                    {/* The FaSearch icon was removed here to fix the overlap. */}
                    <input
                        type="text"
                        placeholder="Tìm kiếm Khách hàng theo ID hoặc Số điện thoại..."
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
                                        <p>Số điện thoại: {customer.phone}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="vm-search-result-item vm-no-results">
                                    <p>Không tìm thấy khách hàng. Tiếp tục với các trường Thông tin Khách hàng Mới bên dưới.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* NEW Customer Info Fields (only active if no customerId is set) */}
            <h4 className="vm-form-subtitle vm-form-subtitle-secondary">Thông tin Khách hàng Mới (Chỉ bắt buộc nếu không chọn Khách hàng Hiện có)</h4>
            <div className="vm-form-grid vm-customer-info-grid">
              <div className="vm-form-group">
                <label htmlFor="new-name">Tên *</label>
                <input 
                  id="new-name" type="text" name="name" placeholder="Tên Khách hàng" 
                  value={formData.customerInfo.name} onChange={handleCustomerInfoChange} 
                  // FIX: Use useExistingCustomer for disable/required logic
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-phone">Số điện thoại *</label>
                <input 
                  id="new-phone" type="text" name="phone" placeholder="Số điện thoại" 
                  value={formData.customerInfo.phone} onChange={handleCustomerInfoChange} 
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-email">Email *</label>
                <input 
                  id="new-email" type="email" name="email" placeholder="Địa chỉ Email" 
                  value={formData.customerInfo.email} onChange={handleCustomerInfoChange} 
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-address">Địa chỉ *</label>
                <input 
                  id="new-address" type="text" name="address" placeholder="Địa chỉ Thực tế" 
                  value={formData.customerInfo.address} onChange={handleCustomerInfoChange} 
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
            </div>
        </div>
        
        {/* Installed Parts Section */}
        <div className="vm-form-section">
            <h4 className="vm-form-subtitle">Phụ tùng Đã Cài đặt (Phụ tùng Nhà máy Ban đầu) {partDataLoading && ' (Đang tải Danh mục...)'}</h4>
            <p className="vm-section-description">Đăng ký các phụ tùng nhà máy chính được cài đặt trong xe khi đăng ký. Khuyến nghị tối thiểu một phụ tùng.</p>
            
            <div className="vm-parts-list">
              {/* Part Header Row (Acts as labels for the grid) */}
              <div className="vm-part-header">
                <p className="part-name">Tên Phụ tùng / Tìm kiếm</p>
                <p>ID Phụ tùng</p>
                <p>Số Serial</p>
                <p className="manufacture-col">Ngày Sản xuất</p>
                <p className="installed-at-col">Đã Cài đặt Lúc</p>
                <p className="remove-col">Xóa</p> {/* Changed 'Remove' to 'Del' */}
              </div>

              {formData.installedParts.map((part, index) => (
                <div key={index} className="vm-part-item vm-part-row">
                  
                  {/* Part Name / Search Input */}
                  <div className="vm-form-group vm-search-container">
                    <label>Tên Phụ tùng / Tìm kiếm *</label>
                    <input
                      type="text"
                      value={part.searchQuery}
                      onChange={(e) => handlePartChange(index, 'searchQuery', e.target.value)}
                      onFocus={() => handlePartChange(index, 'showResults', true)}
                      onBlur={() => setTimeout(() => handlePartChange(index, 'showResults', false), 200)}
                      placeholder="Tìm kiếm Tên Phụ tùng"
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
                                        <p>ID: {result.partId} | Số: {result.partNumber}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="vm-search-result-item vm-no-results">
                                    <p>Không tìm thấy phụ tùng trong danh mục.</p>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                  
                  {/* Part ID Input */}
                  <div className="vm-form-group">
                    <label>ID Phụ tùng *</label>
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
                    <label>Số Serial *</label>
                    <input
                      type="text"
                      name="serialNumber"
                      value={part.serialNumber}
                      onChange={(e) => handlePartChange(index, 'serialNumber', e.target.value)}
                      placeholder="Số Serial"
                      required
                    />
                  </div>

                  {/* Manufacture Date Input - FIXED Calendar Icon */}
                  <div className="vm-form-group vm-date-group-with-icon">
                    <label>Ngày Sản xuất</label>
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
                    <label>Đã Cài đặt Lúc *</label>
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
                    title="Xóa Phụ tùng"
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
              <FaPlus /> Thêm Phụ tùng
            </button>
        </div>


        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng ký Xe...' : 'Đăng ký Xe Mới'}
        </button>
      </form>
    </motion.div>
  );
};

export default AddNewVehicle;