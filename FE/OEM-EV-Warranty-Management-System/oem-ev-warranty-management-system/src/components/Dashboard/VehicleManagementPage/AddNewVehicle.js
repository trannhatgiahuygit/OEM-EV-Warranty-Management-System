// AddNewVehicle.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
// FaCalendarAlt included for use in JSX
import { FaPlus, FaTrash, FaCheckCircle, FaSearch, FaCalendarAlt, FaTimes } from 'react-icons/fa'; 
import { getAllVehicleTypes, normalizeVehicleTypeForAPI } from '../../../utils/vehicleClassification';
import RequiredIndicator from '../../common/RequiredIndicator';
import { formatPhoneInput, isValidPhoneNumber, PHONE_PATTERN, PHONE_LENGTH, PHONE_ERROR_MESSAGE, getMaxAllowedYear, MIN_YEAR, isYearWithinRange } from '../../../utils/validation';
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

const VEHICLE_TYPE_OPTIONS = getAllVehicleTypes();

const FIELD_LABELS = {
  vin: 'Số VIN',
  licensePlate: 'Biển số xe',
  model: 'Mẫu xe',
  vehicleType: 'Loại xe',
  year: 'Năm sản xuất',
  mileageKm: 'Số km',
  registrationDate: 'Ngày đăng ký',
  warrantyStart: 'Ngày bắt đầu bảo hành',
  warrantyEnd: 'Ngày kết thúc bảo hành'
};

const initialFormData = {
  vin: '',
  licensePlate: '',
  model: '',
  vehicleModelId: '', // ID of selected vehicle model
  vehicleType: '',
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
  const maxVehicleYear = getMaxAllowedYear();
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
  
  // State for Warranty Conditions
  const [warrantyConditions, setWarrantyConditions] = useState([]);
  const [warrantyConditionsLoading, setWarrantyConditionsLoading] = useState(false);
  const [selectedWarrantyCondition, setSelectedWarrantyCondition] = useState(null);
  
  // State for mileage validation
  const [mileageValidationError, setMileageValidationError] = useState(null);
  
  // State for warranty end date validation
  const [warrantyEndValidationError, setWarrantyEndValidationError] = useState(null);
  const [vehicleTypeError, setVehicleTypeError] = useState('');
  const [yearValidationError, setYearValidationError] = useState('');
  const [registrationDateValidationError, setRegistrationDateValidationError] = useState(null);
  
  // State for warranty status check
  const [warrantyStatus, setWarrantyStatus] = useState(null); // 'valid' | 'expired' | null
  const [warrantyStatusMessage, setWarrantyStatusMessage] = useState('');
  
  // Helper function to check warranty status based on AND logic
  // Xe còn bảo hành khi: (today <= registrationDate + coverageYears) AND (currentKm <= coverageKm)
  const checkWarrantyStatus = (registrationDate, currentKm, warrantyCondition) => {
    if (!warrantyCondition || !registrationDate) {
      return { status: null, message: '' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check date condition: today <= registrationDate + coverageYears
    let dateValid = false;
    let dateMessage = '';
    
    if (warrantyCondition.coverageYears) {
      const regDate = new Date(registrationDate);
      regDate.setHours(0, 0, 0, 0);
      const warrantyEndDate = new Date(regDate);
      warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + warrantyCondition.coverageYears);
      warrantyEndDate.setHours(23, 59, 59, 999); // End of day
      
      dateValid = today <= warrantyEndDate;
      dateMessage = dateValid 
        ? `Còn trong thời hạn bảo hành (đến ${warrantyEndDate.toLocaleDateString('vi-VN')})`
        : `Đã hết thời hạn bảo hành (hết hạn từ ${warrantyEndDate.toLocaleDateString('vi-VN')})`;
    } else {
      // No coverageYears means no date limit
      dateValid = true;
      dateMessage = 'Không có giới hạn thời gian';
    }
    
    // Check mileage condition: currentKm <= coverageKm (if coverageKm exists)
    let mileageValid = true; // Default to true if no km limit
    let mileageMessage = '';
    
    if (warrantyCondition.coverageKm != null && warrantyCondition.coverageKm !== undefined) {
      const km = currentKm ? Number(currentKm) : 0;
      mileageValid = km <= warrantyCondition.coverageKm;
      mileageMessage = mileageValid
        ? `Số km (${km.toLocaleString('vi-VN')} km) trong giới hạn (${warrantyCondition.coverageKm.toLocaleString('vi-VN')} km)`
        : `Số km (${km.toLocaleString('vi-VN')} km) vượt quá giới hạn (${warrantyCondition.coverageKm.toLocaleString('vi-VN')} km)`;
    } else {
      mileageMessage = 'Không có giới hạn km';
    }
    
    // AND logic: Both conditions must be true
    const isWarrantyValid = dateValid && mileageValid;
    
    // Build message
    let message = '';
    if (isWarrantyValid) {
      const parts = [];
      if (warrantyCondition.coverageYears) {
        parts.push(dateMessage);
      }
      if (warrantyCondition.coverageKm != null) {
        parts.push(mileageMessage);
      }
      message = parts.length > 0 ? parts.join('. ') : 'Xe còn trong thời hạn bảo hành';
    } else {
      const reasons = [];
      if (!dateValid) {
        reasons.push(dateMessage);
      }
      if (!mileageValid) {
        reasons.push(mileageMessage);
      }
      message = `Xe đã hết điều kiện bảo hành: ${reasons.join('. ')}`;
    }
    
    return {
      status: isWarrantyValid ? 'valid' : 'expired',
      message: message
    };
  };
  
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

    if (name === 'year') {
      // Cho phép nhập tự do, chỉ validate khi blur hoặc submit
      // Cập nhật formData ngay lập tức để người dùng có thể nhập được
      setFormData(prev => ({ ...prev, year: value }));
      
      // Clear validation error khi đang nhập (sẽ validate lại khi blur)
      if (value === '') {
        setYearValidationError('');
        return;
      }

      // Không validate ngay khi đang gõ, chỉ validate khi blur
      setYearValidationError('');
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));

    if (name === 'vehicleType') {
      setVehicleTypeError('');
    }
    
    // Validate mileage against warranty condition coverageKm in real-time (từ warranty condition, không hard-code)
    if (name === 'mileageKm' && selectedWarrantyCondition) {
      const mileage = value === '' ? 0 : Number(value);
      const condition = selectedWarrantyCondition;
      
      if (condition.coverageKm != null && mileage > condition.coverageKm) {
        setMileageValidationError(
          `Số km (${mileage.toLocaleString('vi-VN')} km) vượt quá giới hạn bảo hành (${condition.coverageKm.toLocaleString('vi-VN')} km) cho mẫu xe này.`
        );
      } else {
        setMileageValidationError(null);
      }
      
      // Check warranty status using AND logic when mileage changes
      if (formData.registrationDate) {
        const statusCheck = checkWarrantyStatus(formData.registrationDate, mileage, condition);
        setWarrantyStatus(statusCheck.status);
        setWarrantyStatusMessage(statusCheck.message);
      }
    } else if (name === 'mileageKm' && !selectedWarrantyCondition) {
      // Clear error if no warranty condition is selected
      setMileageValidationError(null);
    }
    
    // Validate warrantyEnd against warranty condition effectiveTo in real-time
    if (name === 'warrantyEnd' && value && selectedWarrantyCondition) {
      const warrantyEndDate = new Date(value);
      const condition = selectedWarrantyCondition;
      
      // Only validate if effectiveTo is not null (not lifetime warranty)
      if (condition.effectiveTo !== null && condition.effectiveTo !== undefined) {
        const effectiveTo = new Date(condition.effectiveTo);
        effectiveTo.setHours(23, 59, 59, 999); // Set to end of day for accurate comparison
        warrantyEndDate.setHours(23, 59, 59, 999);
        
        if (warrantyEndDate > effectiveTo) {
          setWarrantyEndValidationError(
            `Ngày kết thúc bảo hành (${warrantyEndDate.toLocaleDateString('vi-VN')}) vượt quá ngày hết hiệu lực của điều kiện bảo hành (${effectiveTo.toLocaleDateString('vi-VN')}).`
          );
        } else {
          setWarrantyEndValidationError(null);
        }
      } else {
        // Lifetime warranty - no validation needed
        setWarrantyEndValidationError(null);
      }
    } else if (name === 'warrantyEnd' && !selectedWarrantyCondition) {
      // Clear error if no warranty condition is selected
      setWarrantyEndValidationError(null);
    }
    
    // Validate registration date: không được lớn hơn ngày hiện tại
    if (name === 'registrationDate') {
      if (value) {
        const regDate = new Date(value);
        regDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (regDate > today) {
          setRegistrationDateValidationError('Ngày đăng ký không được lớn hơn ngày hiện tại.');
          // Vẫn cập nhật formData để hiển thị giá trị người dùng nhập, nhưng hiển thị lỗi
          setFormData(prev => ({
            ...prev,
            registrationDate: value,
          }));
          return; // Không tiếp tục xử lý warranty dates nếu validation fail
        } else {
          setRegistrationDateValidationError(null);
        }
      } else {
        setRegistrationDateValidationError(null);
      }
    }
    
    // Auto-suggest warranty dates and check warranty status when registration date changes
    if (name === 'registrationDate' && value && selectedWarrantyCondition && !registrationDateValidationError) {
      const regDate = new Date(value);
      const warrantyStart = regDate.toISOString().split('T')[0];
      
      // Calculate warranty end based on coverageYears (from warranty condition, not hard-coded)
      let warrantyEnd = '';
      let shouldUpdateWarrantyEnd = false;
      
      if (selectedWarrantyCondition.coverageYears) {
        const endDate = new Date(regDate);
        endDate.setFullYear(endDate.getFullYear() + selectedWarrantyCondition.coverageYears);
        warrantyEnd = endDate.toISOString().split('T')[0];
        shouldUpdateWarrantyEnd = true;
      }
      
      // Check warranty status using AND logic (date AND mileage)
      const currentKm = formData.mileageKm || 0;
      const statusCheck = checkWarrantyStatus(value, currentKm, selectedWarrantyCondition);
      setWarrantyStatus(statusCheck.status);
      setWarrantyStatusMessage(statusCheck.message);
      
      setFormData(prev => {
        return {
          ...prev,
          registrationDate: value,
          warrantyStart: warrantyStart,
          warrantyEnd: shouldUpdateWarrantyEnd ? warrantyEnd : prev.warrantyEnd,
        };
      });
    } else if (name === 'registrationDate' && value && !selectedWarrantyCondition && !registrationDateValidationError) {
      // Nếu chưa có warranty condition, chỉ cập nhật registrationDate và warrantyStart
      const regDate = new Date(value);
      const warrantyStart = regDate.toISOString().split('T')[0];
      
      setFormData(prev => {
        return {
          ...prev,
          registrationDate: value,
          warrantyStart: warrantyStart,
        };
      });
    }
    
    // Check warranty status when mileage changes
    if (name === 'mileageKm' && formData.registrationDate && selectedWarrantyCondition) {
      const currentKm = value || 0;
      const statusCheck = checkWarrantyStatus(formData.registrationDate, currentKm, selectedWarrantyCondition);
      setWarrantyStatus(statusCheck.status);
      setWarrantyStatusMessage(statusCheck.message);
    }
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
      // Clear warranty conditions when model is cleared
      setWarrantyConditions([]);
      setSelectedWarrantyCondition(null);
      setMileageValidationError(null);
      setWarrantyEndValidationError(null);
    }
  };

  // Fetch warranty conditions when model is selected
  const fetchWarrantyConditions = async (modelId) => {
    if (!modelId) {
      setWarrantyConditions([]);
      setSelectedWarrantyCondition(null);
      return;
    }
    
    setWarrantyConditionsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // Try to fetch all warranty conditions for this model first
      // Then filter for active ones (since effective endpoint might not work with new simplified conditions)
      let conditions = [];
      
      try {
        // First, try the effective endpoint
        const effectiveResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/warranty-conditions/effective?modelId=${modelId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (effectiveResponse.status === 200) {
          conditions = effectiveResponse.data || [];
        }
      } catch (effectiveErr) {
        console.log('Effective endpoint failed, trying all conditions:', effectiveErr);
      }
      
      // If no conditions found from effective endpoint, try fetching all and filter by modelId
      if (conditions.length === 0) {
        try {
          const allResponse = await axios.get(
            `${process.env.REACT_APP_API_URL}/api/warranty-conditions`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          if (allResponse.status === 200) {
            const allConditions = allResponse.data || [];
            console.log('All warranty conditions:', allConditions);
            console.log('Looking for modelId:', modelId, 'type:', typeof modelId);
            // Filter by vehicleModelId and active status
            conditions = allConditions.filter(condition => {
              const matchesModel = condition.vehicleModelId === parseInt(modelId, 10) || 
                                   condition.vehicleModelId === Number(modelId) ||
                                   String(condition.vehicleModelId) === String(modelId);
              const isActive = condition.active === true || condition.active === undefined; // Default to true if undefined
              console.log('Condition:', condition.id, 'vehicleModelId:', condition.vehicleModelId, 'matchesModel:', matchesModel, 'isActive:', isActive);
              return matchesModel && isActive;
            });
            console.log('Filtered conditions for modelId', modelId, ':', conditions);
          }
        } catch (allErr) {
          console.error('Error fetching all warranty conditions:', allErr);
        }
      } else {
        console.log('Found conditions from effective endpoint:', conditions);
      }
      
      setWarrantyConditions(conditions);
      
      // Auto-select the first condition if available
      if (conditions.length > 0) {
        const firstCondition = conditions[0];
        setSelectedWarrantyCondition(firstCondition);
        
        // Validate mileage against new warranty condition
        if (formData.mileageKm) {
          const mileage = Number(formData.mileageKm);
          if (firstCondition.coverageKm != null && mileage > firstCondition.coverageKm) {
            setMileageValidationError(
              `Số km (${mileage.toLocaleString('vi-VN')} km) vượt quá giới hạn bảo hành (${firstCondition.coverageKm.toLocaleString('vi-VN')} km) cho mẫu xe này.`
            );
          } else {
            setMileageValidationError(null);
          }
        }
        
        // Tự động tính và hiển thị ngày kết thúc bảo hành khi có registrationDate và coverageYears
        if (formData.registrationDate && firstCondition.coverageYears) {
          const regDate = new Date(formData.registrationDate);
          const warrantyStart = regDate.toISOString().split('T')[0];
          
          // Tính toán ngày kết thúc bảo hành: registrationDate + coverageYears (từ warranty condition)
          const endDate = new Date(regDate);
          endDate.setFullYear(endDate.getFullYear() + firstCondition.coverageYears);
          const warrantyEnd = endDate.toISOString().split('T')[0];
          
          // Tự động cập nhật warrantyStart và warrantyEnd
          setFormData(prev => ({
            ...prev,
            warrantyStart: warrantyStart,
            warrantyEnd: warrantyEnd,
          }));
          
          // Check warranty status using AND logic: (date condition) AND (mileage condition)
          // Lấy coverageYears và coverageKm từ warranty condition (không hard-code)
          const currentKm = formData.mileageKm || 0;
          const statusCheck = checkWarrantyStatus(formData.registrationDate, currentKm, firstCondition);
          setWarrantyStatus(statusCheck.status);
          setWarrantyStatusMessage(statusCheck.message);
        } else if (formData.registrationDate) {
          // Nếu có registrationDate nhưng không có coverageYears, chỉ set warrantyStart
          const regDate = new Date(formData.registrationDate);
          const warrantyStart = regDate.toISOString().split('T')[0];
          setFormData(prev => ({
            ...prev,
            warrantyStart: warrantyStart,
          }));
        }
          
          toast.info(`Đã tải ${conditions.length} điều kiện bảo hành cho mẫu xe này.`);
      } else {
        setSelectedWarrantyCondition(null);
        setMileageValidationError(null);
        setWarrantyEndValidationError(null);
        toast.warn('Mẫu xe này chưa có điều kiện bảo hành. Vui lòng nhập thủ công.');
      }
    } catch (err) {
      console.error('Error fetching warranty conditions:', err);
      setWarrantyConditions([]);
      setSelectedWarrantyCondition(null);
      setWarrantyEndValidationError(null);
      toast.warn('Không thể tải điều kiện bảo hành. Vui lòng nhập thủ công.');
    } finally {
      setWarrantyConditionsLoading(false);
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
    
    // Reset warranty status when model changes
    setWarrantyStatus(null);
    setWarrantyStatusMessage('');
    
    // Fetch warranty conditions for the selected model
    fetchWarrantyConditions(model.id);
  };

  const handleClearModel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear all model-related data
    setFormData(prev => ({
      ...prev,
      vehicleModelId: '',
      model: '',
    }));
    setModelSearchQuery('');
    setModelSearchResults([]);
    setShowModelResults(false);
    setWarrantyConditions([]);
    setSelectedWarrantyCondition(null);
    setMileageValidationError(null);
    setWarrantyEndValidationError(null);
    
    toast.info('Đã xóa mẫu xe. Vui lòng chọn lại.');
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? formatPhoneInput(value) : value;
    setFormData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [name]: nextValue,
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

    // Filter by search query
    let filteredParts = allPartSerials.filter(part => 
      part.partName.toLowerCase().includes(queryLower) ||
      part.partNumber.toLowerCase().includes(queryLower) ||
      String(part.partId).includes(queryLower)
    );
    
    // Filter by vehicleType if vehicleType is selected
    if (formData.vehicleType) {
      const normalizedVehicleType = normalizeVehicleTypeForAPI(formData.vehicleType);
      if (normalizedVehicleType) {
        filteredParts = filteredParts.filter(part => {
          // If part has vehicleType, it must match
          if (part.vehicleType) {
            const partVehicleType = normalizeVehicleTypeForAPI(part.vehicleType);
            return partVehicleType === normalizedVehicleType;
          }
          // If part doesn't have vehicleType, allow it (universal part)
          return true;
        });
      }
    }
    
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
    // Validate part vehicleType matches vehicle vehicleType
    if (formData.vehicleType && part.vehicleType) {
      const normalizedVehicleType = normalizeVehicleTypeForAPI(formData.vehicleType);
      const partVehicleType = normalizeVehicleTypeForAPI(part.vehicleType);
      
      if (normalizedVehicleType && partVehicleType && normalizedVehicleType !== partVehicleType) {
        toast.error(
          `Phụ tùng "${part.partName}" (ID: ${part.partId}) không phù hợp với loại xe "${formData.vehicleType}". ` +
          `Phụ tùng này dành cho loại xe "${part.vehicleType}". Vui lòng chọn phụ tùng phù hợp.`,
          { position: 'top-right', autoClose: 5000 }
        );
        return; // Don't select the part
      }
    }
    
    const newParts = [...formData.installedParts];
    newParts[index] = {
      ...newParts[index],
      partId: String(part.partId),
      partName: part.partName,
      // Tự động điền số serial từ partNumber nếu có
      serialNumber: part.partNumber || '',
      searchQuery: part.partName,
      searchResults: [],
      showResults: false,
    };
    setFormData(prev => ({ ...prev, installedParts: newParts }));
    toast.info(`Đã chọn phụ tùng: ${part.partName} (ID: ${part.partId}${part.partNumber ? `, Số Serial: ${part.partNumber}` : ''}). Vui lòng kiểm tra và nhập các trường Ngày.`);
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
    setVehicleTypeError('');

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
      if (!isValidPhoneNumber(info.phone)) {
        toast.error(PHONE_ERROR_MESSAGE);
        return;
      }
      customerPayload.customerInfo = info;
    }
    
    // Validate vehicleModelId is selected
    if (!formData.vehicleModelId) {
      toast.error('Vui lòng chọn mẫu xe từ danh sách.');
      return;
    }

    // Check if warranty is lifetime (effectiveTo = null)
    const isLifetimeWarranty = selectedWarrantyCondition && 
                                (selectedWarrantyCondition.effectiveTo === null || 
                                 selectedWarrantyCondition.effectiveTo === undefined);
    
    const requiredFields = ['vin', 'licensePlate', 'model', 'vehicleType', 'year', 'mileageKm', 'registrationDate', 'warrantyStart'];
    // warrantyEnd is only required if not lifetime warranty
    if (!isLifetimeWarranty) {
      requiredFields.push('warrantyEnd');
    }
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        if (field === 'vehicleType') {
          setVehicleTypeError('Vui lòng chọn đúng loại xe theo tiêu chuẩn OEM.');
        }
        const fieldLabel = FIELD_LABELS[field] || field;
        toast.error(`Trường '${fieldLabel}' là bắt buộc.`);
        return;
      }
    }
    
    // Validate against warranty conditions if available
    if (selectedWarrantyCondition) {
      const condition = selectedWarrantyCondition;
      const warrantyStart = new Date(formData.warrantyStart);
      const registrationDate = new Date(formData.registrationDate);
      const mileageKm = Number(formData.mileageKm);
      const today = new Date();
      
      // Use the isLifetimeWarranty variable already defined above
      
      // Check if warranty start is after registration date
      if (warrantyStart < registrationDate) {
        toast.error('Ngày bắt đầu bảo hành phải sau hoặc bằng ngày đăng ký.');
        return;
      }
      
      // Check warranty end only if not lifetime warranty
      if (!isLifetimeWarranty) {
        if (!formData.warrantyEnd) {
          toast.error('Ngày kết thúc bảo hành là bắt buộc (trừ khi là bảo hành trọn đời).');
          return;
        }
        
        const warrantyEnd = new Date(formData.warrantyEnd);
        
        // Check if warranty end is after warranty start
        if (warrantyEnd <= warrantyStart) {
          toast.error('Ngày kết thúc bảo hành phải sau ngày bắt đầu bảo hành.');
          return;
        }
        
        // Check effective date range if condition has effectiveTo
        if (condition.effectiveTo) {
          const effectiveTo = new Date(condition.effectiveTo);
          effectiveTo.setHours(23, 59, 59, 999); // Set to end of day for accurate comparison
          warrantyEnd.setHours(23, 59, 59, 999);
          if (warrantyEnd > effectiveTo) {
            toast.error(`Lỗi: Ngày kết thúc bảo hành (${warrantyEnd.toLocaleDateString('vi-VN')}) vượt quá ngày hết hiệu lực của điều kiện bảo hành (${effectiveTo.toLocaleDateString('vi-VN')}).`);
            return;
          }
        }
        
        // Also check if warrantyEnd has validation error (from real-time validation)
        if (warrantyEndValidationError) {
          toast.error('Vui lòng sửa lỗi ở trường "Ngày Kết thúc Bảo hành" trước khi submit.');
          return;
        }
        
        // Check warranty duration against coverageYears
        if (condition.coverageYears != null) {
          const warrantyDurationYears = (warrantyEnd - warrantyStart) / (1000 * 60 * 60 * 24 * 365);
          if (warrantyDurationYears > condition.coverageYears + 0.1) { // Allow small margin for rounding
            toast.warn(`Cảnh báo: Thời hạn bảo hành (${warrantyDurationYears.toFixed(1)} năm) vượt quá thời hạn quy định (${condition.coverageYears} năm) cho mẫu xe này.`);
          }
        }
      }
      
      // Check effective date range if condition has effectiveFrom
      if (condition.effectiveFrom) {
        const effectiveFrom = new Date(condition.effectiveFrom);
        if (warrantyStart < effectiveFrom) {
          toast.warn(`Cảnh báo: Ngày bắt đầu bảo hành (${warrantyStart.toLocaleDateString('vi-VN')}) sớm hơn ngày hiệu lực của điều kiện (${effectiveFrom.toLocaleDateString('vi-VN')}).`);
        }
      }
      
      // Check mileage against coverageKm - chỉ cảnh báo, không chặn submit
      // Cho phép lưu xe hết bảo hành với status EXPIRED
      if (condition.coverageKm != null && mileageKm > condition.coverageKm) {
        toast.warn(`Cảnh báo: Số km (${mileageKm.toLocaleString('vi-VN')} km) vượt quá giới hạn bảo hành (${condition.coverageKm.toLocaleString('vi-VN')} km) cho mẫu xe này. Xe sẽ được lưu với status EXPIRED.`);
        // Không return, cho phép tiếp tục submit
      }
    }
    
    // Validate parts before cleaning
    const partsValidationErrors = [];
    formData.installedParts.forEach((part, index) => {
      if (part.partId && part.serialNumber && part.installedAt) {
        // Validate: installedAt must be >= manufactureDate
        if (part.manufactureDate && part.installedAt) {
          const manufactureDate = new Date(part.manufactureDate);
          const installedAt = new Date(part.installedAt);
          manufactureDate.setHours(0, 0, 0, 0);
          installedAt.setHours(0, 0, 0, 0);
          
          if (installedAt < manufactureDate) {
            partsValidationErrors.push(
              `Phụ tùng ${index + 1} (${part.partName || `ID: ${part.partId}`}): Ngày cài đặt (${installedAt.toLocaleDateString('vi-VN')}) không được trước ngày sản xuất (${manufactureDate.toLocaleDateString('vi-VN')}).`
            );
          }
        }
      }
    });
    
    if (partsValidationErrors.length > 0) {
      toast.error(partsValidationErrors.join(' '));
      return;
    }
    
    const cleanedParts = formData.installedParts
        .filter(part => part.partId && part.serialNumber && part.installedAt)
        .map(part => {
            // Ensure manufactureDate is set - use installedAt as fallback if not provided
            let manufactureDate = part.manufactureDate;
            if (!manufactureDate && part.installedAt) {
              // If no manufactureDate, use installedAt (same day is acceptable)
              manufactureDate = part.installedAt.split('T')[0] || part.installedAt.split(' ')[0];
            } else if (!manufactureDate) {
              // Last resort: use current date
              manufactureDate = new Date().toISOString().slice(0, 10);
            }
            
            return {
                partId: Number(part.partId),
                serialNumber: part.serialNumber,
                manufactureDate: manufactureDate,
                installedAt: new Date(part.installedAt).toISOString(),
            };
        });

    const hasIncompletePart = formData.installedParts.some(part => 
        (part.partId || part.serialNumber || part.installedAt) && 
        !(part.partId && part.serialNumber && part.installedAt));

    if (hasIncompletePart) {
        toast.error('Vui lòng hoàn tất tất cả các trường cho mỗi phụ tùng đã cài đặt, hoặc xóa các mục chưa hoàn tất.');
        return;
    }

    // Use the isLifetimeWarranty variable already defined above in validation
    // Clean up warrantyEnd: if empty string or not lifetime warranty but empty, send null
    let warrantyEndValue = null;
    if (!isLifetimeWarranty) {
      // For non-lifetime warranty, send the value or null if empty
      warrantyEndValue = formData.warrantyEnd && formData.warrantyEnd.trim() !== '' ? formData.warrantyEnd : null;
    }
    
    // Xác định status dựa trên warranty status - CHECK LẠI NGAY TRƯỚC KHI SUBMIT
    // Đảm bảo tính chính xác bằng cách check lại một lần nữa
    let finalWarrantyStatus = warrantyStatus; // Sử dụng giá trị hiện tại
    if (selectedWarrantyCondition && formData.registrationDate) {
      // Check lại warranty status một lần nữa để đảm bảo tính chính xác
      const currentKm = Number(formData.mileageKm) || 0;
      const statusCheck = checkWarrantyStatus(formData.registrationDate, currentKm, selectedWarrantyCondition);
      finalWarrantyStatus = statusCheck.status; // 'valid' | 'expired' | null
    }
    
    // Set vehicle status dựa trên final warranty status
    let vehicleStatus = 'ACTIVE'; // Mặc định là ACTIVE
    if (finalWarrantyStatus === 'expired') {
      vehicleStatus = 'EXPIRED';
    } else if (finalWarrantyStatus === 'valid') {
      vehicleStatus = 'ACTIVE';
    }
    // Nếu finalWarrantyStatus là null (chưa có điều kiện bảo hành hoặc chưa check), để mặc định ACTIVE
    
    // Log để debug
    console.log('Warranty Status Check:', {
      warrantyStatus: warrantyStatus,
      finalWarrantyStatus: finalWarrantyStatus,
      vehicleStatus: vehicleStatus,
      registrationDate: formData.registrationDate,
      mileageKm: formData.mileageKm,
      selectedWarrantyCondition: selectedWarrantyCondition
    });
    
    const payload = {
      vin: formData.vin,
      licensePlate: formData.licensePlate,
      model: formData.model,
      vehicleModelId: formData.vehicleModelId ? Number(formData.vehicleModelId) : null,
      vehicleType: formData.vehicleType,
      year: Number(formData.year),
      mileageKm: Number(formData.mileageKm),
      ...customerPayload,
      registrationDate: formData.registrationDate,
      warrantyStart: formData.warrantyStart,
      // If lifetime warranty, send warrantyEnd as null, otherwise send the value or null
      warrantyEnd: warrantyEndValue,
      status: vehicleStatus, // Thêm trường status vào payload
      warrantyStatus: vehicleStatus, // Thêm trường warrantyStatus để đảm bảo backend nhận được
      installedParts: cleanedParts,
    };
    
    // Debug: Log payload to console
    console.log('Submitting vehicle payload:', payload);

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
        // Clear warranty conditions
        setWarrantyConditions([]);
        setSelectedWarrantyCondition(null);
        setMileageValidationError(null);
        setWarrantyEndValidationError(null);
        setYearValidationError('');

        onVehicleAdded(); // Notify VehicleManagementPage to switch to 'all-vehicles'
        
      }
    } catch (error) {
      console.error('Error submitting vehicle:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Không thể đăng ký xe mới.';
      if (error.response) {
        // Try to get detailed error message
        const responseData = error.response.data;
        
        // Check for part type mismatch errors
        if (responseData?.details) {
          const details = responseData.details.toLowerCase();
          if (details.includes('part type') && details.includes('does not match') && details.includes('vehicle type')) {
            // Extract part information from error message
            const partMatch = responseData.details.match(/Part ID: (\d+), Part: (.+?)(?:\.|$)/);
            const vehicleTypeMatch = responseData.details.match(/vehicle type ['"](.+?)['"]/);
            const partTypeMatch = responseData.details.match(/Part type ['"](.+?)['"]/);
            
            let partInfo = '';
            if (partMatch) {
              partInfo = `Phụ tùng ID ${partMatch[1]}: "${partMatch[2]}"`;
            }
            
            let typeInfo = '';
            if (partTypeMatch && vehicleTypeMatch) {
              typeInfo = `Phụ tùng loại "${partTypeMatch[1]}" không phù hợp với loại xe "${vehicleTypeMatch[1]}".`;
            }
            
            errorMessage = `${typeInfo} ${partInfo} Vui lòng chọn phụ tùng phù hợp với loại xe "${formData.vehicleType}".`;
          } else if (details.includes('duplicate') || details.includes('constraint')) {
            // Try to identify which field is duplicate
            if (details.includes('vin') || details.includes('uk') && formData.vin) {
              errorMessage = `Số VIN "${formData.vin}" đã tồn tại trong hệ thống. Vui lòng sử dụng số VIN khác.`;
            } else if (details.includes('license') || details.includes('plate') && formData.licensePlate) {
              errorMessage = `Biển số "${formData.licensePlate}" đã tồn tại trong hệ thống. Vui lòng sử dụng biển số khác.`;
            } else {
              errorMessage = 'Dữ liệu đã tồn tại trong hệ thống. Vui lòng kiểm tra lại Số VIN hoặc Biển số xe.';
            }
          } else if (responseData?.message) {
            errorMessage = responseData.message;
          } else if (responseData?.error) {
            errorMessage = responseData.error;
          } else {
            errorMessage = responseData.details || 'Lỗi từ server. Vui lòng thử lại.';
          }
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData?.errors) {
          // Handle validation errors array
          const validationErrors = Array.isArray(responseData.errors) 
            ? responseData.errors.map(err => err.defaultMessage || err.message).join(', ')
            : JSON.stringify(responseData.errors);
          errorMessage = `Lỗi validation: ${validationErrors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
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
                <label htmlFor="vin" className="required-label">
                  Số VIN (17 ký tự)
                  <RequiredIndicator />
                </label>
                <input id="vin" type="text" name="vin" placeholder="Nhập Số VIN" value={formData.vin} onChange={handleGeneralChange} maxLength="17" required />
              </div>
              <div className="vm-form-group">
                <label htmlFor="licensePlate" className="required-label">
                  Biển số Xe
                  <RequiredIndicator />
                </label>
                <input id="licensePlate" type="text" name="licensePlate" placeholder="Nhập Biển số Xe" value={formData.licensePlate} onChange={handleGeneralChange} required />
              </div>
              <div className="vm-form-group">
                <label htmlFor="model" className="required-label">
                  Mẫu xe
                  <RequiredIndicator />
                </label>
                <div className="vm-customer-search-container vm-model-search-container">
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
                    className={formData.vehicleModelId ? 'vm-model-input-with-clear' : ''}
                  />
                  {formData.vehicleModelId && !modelsLoading && (
                    <button
                      type="button"
                      className="vm-model-clear-btn"
                      onClick={handleClearModel}
                      onMouseDown={(e) => e.preventDefault()}
                      title="Xóa mẫu xe đã chọn"
                      aria-label="Xóa mẫu xe đã chọn"
                    >
                      <FaTimes />
                    </button>
                  )}
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
                <label htmlFor="vehicleType" className="required-label">
                  Loại xe
                  <RequiredIndicator />
                </label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleGeneralChange}
                  onBlur={() => {
                    if (!formData.vehicleType) {
                      setVehicleTypeError('Vui lòng chọn đúng loại xe theo tiêu chuẩn OEM.');
                    }
                  }}
                  required
                >
                  <option value="">Chọn loại xe</option>
                  {VEHICLE_TYPE_OPTIONS.map((type) => (
                    <option key={type.apiType} value={type.apiType}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {vehicleTypeError ? (
                  <span className="vm-validation-error">{vehicleTypeError}</span>
                ) : (
                  <span className="vm-field-hint">Giữ đồng bộ với phân loại từ hệ thống BE để tránh lỗi đăng ký.</span>
                )}
              </div>
              <div className="vm-form-group">
                <label htmlFor="year" className="required-label">
                  Năm
                  <RequiredIndicator />
                </label>
                <input
                  id="year"
                  type="text"
                  name="year"
                  placeholder="ví dụ: 2024"
                  value={formData.year}
                  onChange={handleGeneralChange}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setYearValidationError('');
                      return;
                    }

                    const numericYear = Number(value);
                    if (isNaN(numericYear) || !Number.isInteger(numericYear)) {
                      setYearValidationError('Năm phải là số hợp lệ.');
                      return;
                    }

                    if (!isYearWithinRange(numericYear)) {
                      setYearValidationError(`Năm hợp lệ nằm trong khoảng ${MIN_YEAR} - ${maxVehicleYear}.`);
                      return;
                    }

                    setYearValidationError('');
                    // Cập nhật lại giá trị dưới dạng số
                    setFormData(prev => ({ ...prev, year: numericYear }));
                  }}
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={yearValidationError ? 'vm-input-error' : ''}
                />
                {yearValidationError && (
                  <span className="vm-validation-error">{yearValidationError}</span>
                )}
              </div>
              <div className="vm-form-group">
                <label htmlFor="mileageKm" className="required-label">
                  Số km (km)
                  <RequiredIndicator />
                </label>
                <input 
                  id="mileageKm" 
                  type="number" 
                  name="mileageKm" 
                  placeholder="ví dụ: 500" 
                  value={formData.mileageKm} 
                  onChange={handleGeneralChange} 
                  required 
                  min="0"
                  className={mileageValidationError ? 'vm-input-error' : (selectedWarrantyCondition && formData.mileageKm && !mileageValidationError && selectedWarrantyCondition.coverageKm && Number(formData.mileageKm) <= selectedWarrantyCondition.coverageKm ? 'vm-input-valid' : '')}
                />
                {mileageValidationError && (
                  <span className="vm-validation-error">{mileageValidationError}</span>
                )}
              </div>
            </div>

            {/* Warranty Conditions - Show immediately after model selection */}
            {formData.vehicleModelId && selectedWarrantyCondition && !warrantyConditionsLoading && (
              <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <h4 className="vm-form-subtitle" style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Điều kiện Bảo hành cho Mẫu Xe</h4>
                
                <div className="vm-warranty-condition-info">
                  <div className="vm-warranty-info-grid">
                    {selectedWarrantyCondition.coverageYears && (
                      <div className="vm-warranty-info-item">
                        <span className="vm-warranty-info-label">Thời hạn:</span>
                        <span className="vm-warranty-info-value">{selectedWarrantyCondition.coverageYears} năm</span>
                      </div>
                    )}
                    {selectedWarrantyCondition.coverageKm && (
                      <div className="vm-warranty-info-item">
                        <span className="vm-warranty-info-label">Quãng đường:</span>
                        <span className="vm-warranty-info-value">{selectedWarrantyCondition.coverageKm.toLocaleString('vi-VN')} km</span>
                      </div>
                    )}
                    {/* Tự động hiển thị ngày kết thúc bảo hành nếu đã có registrationDate */}
                    {formData.registrationDate && selectedWarrantyCondition.coverageYears && formData.warrantyEnd && (
                      <div className="vm-warranty-info-item">
                        <span className="vm-warranty-info-label">Ngày kết thúc bảo hành:</span>
                        <span className="vm-warranty-info-value" style={{ color: 'var(--glow1)', fontWeight: 500 }}>
                          {new Date(formData.warrantyEnd).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Warranty Status Check - Auto check when registration date is entered */}
                  {formData.registrationDate && warrantyStatus && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.75rem 1rem', 
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${warrantyStatus === 'valid' ? 'rgba(0, 242, 255, 0.3)' : 'rgba(255, 59, 48, 0.3)'}`,
                      background: warrantyStatus === 'valid' ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        color: warrantyStatus === 'valid' ? 'var(--glow1)' : 'var(--error)',
                        fontWeight: 500,
                      }}>
                        {warrantyStatus === 'valid' ? (
                          <>
                            <FaCheckCircle />
                            <span>{warrantyStatusMessage}</span>
                          </>
                        ) : (
                          <>
                            <FaTimes />
                            <span>{warrantyStatusMessage}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Date & Warranty Specs - FIXED Calendar Icon */}
            <div className="vm-form-date-group">
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="registrationDate" className="required-label">
                  Ngày Đăng ký
                  <RequiredIndicator />
                </label>
                <input 
                  id="registrationDate" 
                  type="date" 
                  name="registrationDate" 
                  value={formData.registrationDate} 
                  onChange={handleGeneralChange} 
                  required
                  max={new Date().toISOString().split('T')[0]} // Giới hạn tối đa là ngày hiện tại
                  className={registrationDateValidationError ? 'vm-input-error' : ''}
                />
                {registrationDateValidationError && (
                  <span className="vm-validation-error">{registrationDateValidationError}</span>
                )}
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="warrantyStart" className="required-label">
                  Ngày Bắt đầu Bảo hành
                  <RequiredIndicator />
                </label>
                <input id="warrantyStart" type="date" name="warrantyStart" value={formData.warrantyStart} onChange={handleGeneralChange} required />
                <FaCalendarAlt className="vm-calendar-icon" /> 
              </div>
              <div className="vm-form-group vm-date-group-with-icon">
                <label htmlFor="warrantyEnd" className="required-label">
                  Ngày Kết thúc Bảo hành 
                  {selectedWarrantyCondition && selectedWarrantyCondition.coverageYears ? <RequiredIndicator /> : null}
                  {selectedWarrantyCondition && selectedWarrantyCondition.coverageYears && formData.registrationDate && 
                   <span style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                     (Tự động tính)
                   </span>}
                </label>
                {selectedWarrantyCondition && selectedWarrantyCondition.coverageYears ? (
                  <>
                    <input 
                      id="warrantyEnd" 
                      type="date" 
                      name="warrantyEnd" 
                      value={formData.warrantyEnd || ''} 
                      onChange={handleGeneralChange} 
                      required
                      readOnly={!!formData.registrationDate} // Chỉ đọc nếu đã có registrationDate (tự động tính)
                      style={formData.registrationDate ? {
                        background: 'var(--bg-secondary)',
                        cursor: 'not-allowed',
                        opacity: 0.8
                      } : {}}
                      className={warrantyEndValidationError ? 'vm-input-error' : (formData.warrantyEnd ? 'vm-input-valid' : '')}
                    />
                    {formData.registrationDate && formData.warrantyEnd && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: 'var(--glow1)', 
                        marginTop: '0.25rem',
                        fontWeight: 500
                      }}>
                        ✓ Tự động: {new Date(formData.warrantyEnd).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                    {warrantyEndValidationError && (
                      <span className="vm-validation-error">{warrantyEndValidationError}</span>
                    )}
                  </>
                ) : (
                  <input 
                    id="warrantyEnd" 
                    type="text" 
                    name="warrantyEnd" 
                    value="Chưa có thời hạn bảo hành" 
                    disabled 
                    style={{ 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-secondary)', 
                      fontStyle: 'italic',
                      cursor: 'not-allowed'
                    }} 
                  />
                )}
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
                <label htmlFor="new-name" className="required-label">
                  Tên
                  <RequiredIndicator />
                </label>
                <input 
                  id="new-name" type="text" name="name" placeholder="Tên Khách hàng" 
                  value={formData.customerInfo.name} onChange={handleCustomerInfoChange} 
                  // FIX: Use useExistingCustomer for disable/required logic
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-phone" className="required-label">
                  Số điện thoại
                  <RequiredIndicator />
                </label>
                <input 
                  id="new-phone"
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại"
                  value={formData.customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                  disabled={useExistingCustomer}
                  required={!useExistingCustomer}
                  inputMode="numeric"
                  maxLength={PHONE_LENGTH}
                  pattern={PHONE_PATTERN}
                  title={PHONE_ERROR_MESSAGE}
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-email" className="required-label">
                  Email
                  <RequiredIndicator />
                </label>
                <input 
                  id="new-email" type="email" name="email" placeholder="Địa chỉ Email" 
                  value={formData.customerInfo.email} onChange={handleCustomerInfoChange} 
                  disabled={useExistingCustomer} required={!useExistingCustomer} 
                />
              </div>
              <div className="vm-form-group">
                <label htmlFor="new-address" className="required-label">
                  Địa chỉ
                  <RequiredIndicator />
                </label>
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
                    <label className="required-label">
                      Tên Phụ tùng / Tìm kiếm
                      <RequiredIndicator />
                    </label>
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
                    <label className="required-label">
                      ID Phụ tùng
                      <RequiredIndicator />
                    </label>
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
                    <label className="required-label">
                      Số Serial
                      <RequiredIndicator />
                    </label>
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
                    <label className="required-label">
                      Đã Cài đặt Lúc
                      <RequiredIndicator />
                    </label>
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