import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import RequiredIndicator from '../../common/RequiredIndicator';
import { formatPhoneInput, isValidPhoneNumber, PHONE_PATTERN, PHONE_LENGTH, PHONE_ERROR_MESSAGE } from '../../../utils/validation';
import './NewRepairClaimPage.css';

// --- NEW: Add draftClaimData prop ---
const NewRepairClaimPage = ({ handleBackClick, draftClaimData = null }) => {
  // --- Local storage helpers to persist technician selection for drafts ---
  const DRAFT_TECH_MAP_KEY = 'draftTechSelections';
  const loadDraftTechSelections = () => {
    try {
      const raw = localStorage.getItem(DRAFT_TECH_MAP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const saveDraftTechSelection = (draftId, selection) => {
    if (!draftId) return;
    const map = loadDraftTechSelections();
    map[draftId] = selection;
    localStorage.setItem(DRAFT_TECH_MAP_KEY, JSON.stringify(map));
  };
  const removeDraftTechSelection = (draftId) => {
    if (!draftId) return;
    const map = loadDraftTechSelections();
    if (map[draftId]) {
      delete map[draftId];
      localStorage.setItem(DRAFT_TECH_MAP_KEY, JSON.stringify(map));
    }
  };
  // --- END Local storage helpers ---

  const initialFormData = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    vin: '',
    mileageKm: '',
    claimTitle: '',
    reportedFailure: '',
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
  // --- Ref to track if a technician has been selected to prevent search from running ---
  const technicianSelected = useRef(false);

  // --- Effect to populate form from draft data ---
  useEffect(() => {
    isSearchReady.current = false; // Disable search during data population

    if (draftClaimData) {
      const newFlowMode = draftClaimData.flowType === 'edit' ? 'edit-draft' : 'intake';
      setFlowMode(newFlowMode);
      setDraftId(draftClaimData.id);
      
      let assignedTechId = draftClaimData.assignedTechnician?.id || '';
      const customerPhone = formatPhoneInput(draftClaimData.customer?.phone || '');

      // Fallback: if server draft has no technician, try local storage
      if (!assignedTechId && draftClaimData.id) {
        const localSelections = loadDraftTechSelections();
        const localTech = localSelections[draftClaimData.id];
        if (localTech?.id) {
          assignedTechId = String(localTech.id);
          const fallbackName = localTech.name || String(localTech.id);
          setTechQuery(fallbackName);
        }
      }

      setFormData({
        customerName: draftClaimData.customer?.name || '',
        customerPhone,
        customerEmail: draftClaimData.customer?.email || '',
        customerAddress: draftClaimData.customer?.address || '',
        vin: draftClaimData.vehicle?.vin || '',
        mileageKm: draftClaimData.vehicle?.mileageKm || '',
        claimTitle: draftClaimData.initialDiagnosis || '',
        reportedFailure: draftClaimData.reportedFailure || '',
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
      
      // Set techQuery to show technician name if available, otherwise show ID
      if(assignedTechId) {
        const technicianName = draftClaimData.assignedTechnician?.fullName || 
                              draftClaimData.assignedTechnician?.username || 
                              String(assignedTechId);
        setTechQuery(technicianName);
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
    
    if (rawPhoneNumber.length === 0) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    if (rawPhoneNumber.length < PHONE_LENGTH) {
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
    
    // Don't search if a technician has been selected (prevents search from running after selection)
    if (technicianSelected.current) {
        technicianSelected.current = false; // Reset for next search
        return;
    }
    
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
            
            // Fetch both users and technician profiles
            const [usersResponse, profilesResponse] = await Promise.all([
                axios.get(
                    `${process.env.REACT_APP_API_URL}/api/users/technical`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                ),
                axios.get(
                    `${process.env.REACT_APP_API_URL}/api/technicians`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                ).catch(() => ({ data: [] })) // Fallback if profiles don't exist
            ]);

            let results = [];
            if (Array.isArray(usersResponse.data)) {
                // Create a map of technician profiles by userId
                const profileMap = new Map();
                if (Array.isArray(profilesResponse.data)) {
                    profilesResponse.data.forEach(profile => {
                        if (profile.userId) {
                            profileMap.set(profile.userId, profile);
                        }
                    });
                }

                // Filter by ID, Full Name, or Username (case-insensitive)
                const queryLower = techQuery.toLowerCase();
                results = usersResponse.data
                    .filter(tech => 
                        String(tech.id).includes(techQuery) || 
                        (tech.fullName && tech.fullName.toLowerCase().includes(queryLower)) ||
                        (tech.username && tech.username.toLowerCase().includes(queryLower))
                    )
                    .map(tech => {
                        // Attach profile information if available
                        const profile = profileMap.get(tech.id);
                        return {
                            ...tech,
                            profile: profile || null,
                            isAvailable: profile ? (profile.isAvailable || false) : null,
                            currentWorkload: profile ? (profile.currentWorkload || 0) : null,
                            maxWorkload: profile ? (profile.maxWorkload || 5) : null,
                            assignmentStatus: profile ? (profile.assignmentStatus || 'UNKNOWN') : null
                        };
                    });
            }

            setTechSearchResults(results);
            setShowTechResults(true);
        } catch (error) {
            console.error('Error searching technicians:', error);
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
        toast.warn('Khách hàng này chưa có xe nào.');
        setCustomerVehicles([]);
        setFormData(prev => ({ ...prev, vin: '' }));
      }
    } catch (error) {
      toast.error('Không thể tải thông tin xe của khách hàng.');
      setCustomerVehicles([]);
    }
  };

  // --- Handlers for custom dropdowns and form inputs ---
  // MODIFIED: handleCustomerSelect to only input phone number
  const handleCustomerSelect = (customer) => {
    const cleanedPhone = formatPhoneInput(customer.phone || '');
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerPhone: cleanedPhone, // Raw number for submission
      customerEmail: customer.email,
      customerAddress: customer.address,
    }));
    // Update phoneQuery to show ONLY the raw phone number
    setPhoneQuery(cleanedPhone);
    // Hide the search box
    setShowResults(false);
    setSearchResults([]);
    fetchVehiclesForCustomer(customer.id);
  };
  
  const handleVehicleSelect = (vehicle) => {
    setFormData(prev => ({ ...prev, vin: vehicle.vin }));
    setShowVehicleResults(false);
  };
  
  // --- Handle Technician Select: Display name but store ID ---
  const handleTechnicianSelect = (technician) => {
    const techIdString = String(technician.id);
    const techDisplayName = technician.fullName || technician.username || techIdString;

    // Mark that a technician has been selected to prevent search from running
    technicianSelected.current = true;
    
    // Update form data with technician ID
    setFormData(prev => ({
        ...prev,
        assignedTechnicianId: techIdString,
    }));
    
    // Update techQuery to show the technician's name for better UX
    setTechQuery(techDisplayName); 
    
    // Hide the search box immediately
    setShowTechResults(false); 
    setTechSearchResults([]);
    
    // Blur the input to remove focus and prevent immediate re-search
    const input = document.querySelector('input[name="assignedTechnicianId"]');
    if (input) {
        input.blur();
    }
  };
  // --- END Technician Select ---

  const getSelectedVehicleDisplay = () => {
    if (!formData.vin) return 'Chọn Xe của Khách hàng';
    
    // Find the selected vehicle to display only the model name
    const selectedVehicle = customerVehicles.find(v => v.vin === formData.vin);
    if (selectedVehicle && selectedVehicle.model) {
      const modelName = selectedVehicle.model;
      // Truncate the model name if it's too long for better visual appeal
      const maxLength = 35; // Adjust as needed based on field width
      if (modelName.length > maxLength) {
        return modelName.substring(0, maxLength - 3) + '...';
      }
      return modelName;
    }
    
    // Fallback to just VIN if model not found or vehicle not found
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
    const value = formatPhoneInput(e.target.value);
    
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
        setSearchResults([]);
        setShowResults(false);
    }
  };

  const ensureCustomerPhoneValid = (value = formData.customerPhone) => {
    if (!isValidPhoneNumber(value)) {
      toast.error(PHONE_ERROR_MESSAGE);
      return false;
    }
    return true;
  };
  
  // --- Handle Tech ID Change ---
  const handleTechIdChange = (e) => {
    const value = e.target.value;
    
    if (!isSearchReady.current) {
        isSearchReady.current = true;
    }

    // Reset selection flag when user starts typing
    technicianSelected.current = false;
    
    setTechQuery(value);
    
    // If user is typing a pure numeric ID, use it directly
    // If user is typing a name or clearing the field, handle accordingly
    if (value === '') {
      // Field is cleared, clear the ID as well
      setFormData(prev => ({ 
          ...prev, 
          assignedTechnicianId: '' 
      }));
    } else if (value.match(/^\d+$/)) {
      // Pure numeric input - treat as ID
      setFormData(prev => ({ 
          ...prev, 
          assignedTechnicianId: value 
      }));
    }
    // If user is typing a name (non-numeric), don't update assignedTechnicianId
    // The ID will be set when they select from the search results
    // This allows the name to be displayed while keeping the previously selected ID
  };
  
  // --- Handle Tech Input Focus ---
  const handleTechInputFocus = (e) => {
    e.stopPropagation();
    // Only show results if there's a query and we're not in a selected state
    if (techQuery.length > 0 && !technicianSelected.current) {
      setShowTechResults(true);
    }
  };
  // --- END Handle Tech ID Change ---
  
  // --- This is the original CREATE claim ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureCustomerPhoneValid()) {
      return;
    }
    const claimData = { // Renamed variable
      ...formData,
      mileageKm: parseInt(formData.mileageKm, 10),
      assignedTechnicianId: parseInt(formData.assignedTechnicianId, 10),
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
        toast.success('Yêu cầu Sửa chữa đã được tạo thành công!'); // Updated text
        // Check if work order was created (technician was assigned and claim is not DRAFT)
        const claimStatus = response.data?.status || '';
        if (claimData.assignedTechnicianId && claimStatus !== 'DRAFT') {
          toast.success('Work Order đã được tạo và phân công cho kỹ thuật viên được chọn!', {
            position: 'top-right',
            autoClose: 4000
          });
        }
        setCreatedClaim(response.data); // Use renamed state setter
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Không thể tạo Yêu cầu Sửa chữa Mới.';
      toast.error(errorMessage); // Updated text
      // If claim creation failed, also show work order error if technician was assigned
      if (claimData.assignedTechnicianId) {
        toast.error('Work Order không thể được tạo tự động. Vui lòng tạo thủ công sau.', {
          position: 'top-right',
          autoClose: 4000
        });
      }
      setCreatedClaim(null); // Use renamed state setter
    }
  };

  // --- NEW: Handle PUT request for processing draft to intake ---
  const handleIntakeSubmit = async (e) => {
    e.preventDefault();
    if (!ensureCustomerPhoneValid()) {
      return;
    }

    // Construct the full payload as requested
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const tokenForAuth = storedUser?.token;
    const intakeData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      vin: formData.vin,
      mileageKm: parseInt(formData.mileageKm, 10),
      claimTitle: formData.claimTitle,
      reportedFailure: formData.reportedFailure,
      customerConsent: Boolean(formData.customerConsent),
      assignedTechnicianId: parseInt(formData.assignedTechnicianId, 10),
      // Some backends expect 'technicianId' instead of 'assignedTechnicianId' for this route
      technicianId: parseInt(formData.assignedTechnicianId, 10),
      // Many backends require the service center context for SC_STAFF actions
      serviceCenterId: storedUser?.serviceCenterId ? parseInt(storedUser.serviceCenterId, 10) : undefined,
      flow: "INTAKE" // As specified
    };

    // Simple validation check (can be simplified, but keeping structure consistent)
    for (const key in intakeData) {
      if (key !== 'flow' && (intakeData[key] === '' || intakeData[key] === null || (typeof intakeData[key] === 'number' && isNaN(intakeData[key])))) {
        if (key === 'assignedTechnicianId' && (intakeData[key] === null || isNaN(intakeData[key]))) {
           toast.error(`Trường 'ID Kỹ thuật viên Được phân công' là bắt buộc.`);
           return;
        }
        if (key !== 'assignedTechnicianId') { // Other fields
            toast.error(`Trường '${key}' là bắt buộc.`);
            return;
        }
      }
    }
    if (!intakeData.customerConsent) {
        toast.error('Sự đồng ý của Khách hàng là bắt buộc.');
        return;
    }

    // Pre-check: ensure SC_STAFF is operating on a draft that belongs to the same Service Center
    // Also check that claim status is DRAFT before attempting to convert to intake
    try {
      if (draftId && tokenForAuth) {
        const draftDetailsResp = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/claims/${draftId}`,
          { headers: { 'Authorization': `Bearer ${tokenForAuth}` } }
        ).catch(() => null);

        if (draftDetailsResp && (draftDetailsResp.status === 200 || draftDetailsResp.status === 201)) {
          const d = draftDetailsResp.data || {};
          
          // Check claim status - must be DRAFT to convert to intake
          const claimStatus = d.status || '';
          if (claimStatus !== 'DRAFT') {
            toast.error(`Không thể chuyển yêu cầu này sang trạng thái mở. Yêu cầu hiện đang ở trạng thái "${claimStatus}". Chỉ có thể chuyển các yêu cầu ở trạng thái DRAFT.`);
            return;
          }
          
          // Service Center check for SC_STAFF
          if (storedUser?.role === 'SC_STAFF') {
            const claimServiceCenterId =
              d.serviceCenterId ||
              (d.serviceCenter && (d.serviceCenter.id || d.serviceCenter.serviceCenterId)) ||
              d.createdByServiceCenterId ||
              null;

            const userServiceCenterId = storedUser?.serviceCenterId ? parseInt(storedUser.serviceCenterId, 10) : null;

            if (userServiceCenterId && claimServiceCenterId && userServiceCenterId !== parseInt(claimServiceCenterId, 10)) {
              toast.error(`Nháp thuộc Trung tâm DV #${claimServiceCenterId}, tài khoản của bạn thuộc #${userServiceCenterId}. Vui lòng đăng nhập đúng trung tâm hoặc chuyển nháp sang trung tâm của bạn.`);
              return;
            }
          }
        }
      }
    } catch (error) {
      // If pre-check fails, still try the main request - backend will validate
      console.warn('Pre-check failed, proceeding with request:', error);
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // Log payload for debugging
      console.log('Sending to-intake request:', {
        draftId,
        intakeData,
        url: `${process.env.REACT_APP_API_URL}/api/claims/${draftId}/to-intake`
      });
      
      // Backend expects POST, not PUT (as confirmed by Swagger)
      // Based on Swagger, the endpoint might accept empty body or specific format
      // Try sending empty body first, then fallback to intakeData if needed
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/claims/${draftId}/to-intake`,
        {}, // Empty body as shown in Swagger
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success('Yêu cầu đã được xử lý thành công!');
        // Check if work order was created (technician was assigned)
        if (intakeData.assignedTechnicianId) {
          toast.success('Work Order đã được tạo và phân công cho kỹ thuật viên được chọn!', {
            position: 'top-right',
            autoClose: 4000
          });
        }
        // Cleanup any locally stored technician selection for this draft
        removeDraftTechSelection(draftId);
        setCreatedClaim(response.data); // Show success screen
      }
    } catch (error) {
      // Try to extract detailed backend error messages
      const status = error?.response?.status;
      let detailedMessage =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.errors) && error.response.data.errors[0]?.defaultMessage) ||
        error?.response?.data?.error ||
        error?.message ||
        'Không thể xử lý yêu cầu.';

      if (status === 400) {
        // Bad Request - likely payload format issue
        console.error('400 Bad Request - Payload issue:', {
          draftId,
          intakeData,
          errorResponse: error?.response?.data
        });
        detailedMessage = error?.response?.data?.message || 
                         error?.response?.data?.details || 
                         'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.';
      } else if (status === 401 || status === 403) {
        detailedMessage = 'Bạn không có quyền thực hiện thao tác này hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập bằng tài khoản có quyền SC_STAFF/EVM hoặc liên hệ quản trị viên.';
      }

      console.error('Error processing claim to intake:', error);
      console.error('Error response:', error?.response?.data);
      toast.error(detailedMessage);
      // If claim processing failed, also show work order error if technician was assigned
      if (intakeData.assignedTechnicianId) {
        toast.error('Work Order không thể được tạo tự động. Vui lòng tạo thủ công sau.', {
          position: 'top-right',
          autoClose: 4000
        });
      }
      setCreatedClaim(null);
    }
  };
  
  // --- NEW: Handle PUT request for updating draft claim ---
  const handleEditDraftSubmit = async (e) => {
    e.preventDefault();
    if (formData.customerPhone && !ensureCustomerPhoneValid()) {
      return;
    }

    // Construct data, removing customerConsent as it is not editable in this flow
    const editDraftData = {
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      vin: formData.vin,
      mileageKm: formData.mileageKm ? parseInt(formData.mileageKm, 10) : 0,
      claimTitle: formData.claimTitle,
      reportedFailure: formData.reportedFailure,
      // Removed customerConsent from the payload for draft update
    };

    // Basic validation for essential fields for a draft
    if (!editDraftData.claimTitle || !editDraftData.reportedFailure) {
        toast.error('Tiêu đề Yêu cầu và Lỗi Đã Báo cáo là bắt buộc.');
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
        toast.success('Yêu cầu nháp đã được cập nhật thành công!');
        setCreatedClaim(response.data); // Show success screen
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật yêu cầu nháp.');
      setCreatedClaim(null);
    }
  };


  // --- NEW: Handle Save as Draft (Original POST for new claims) ---
  const handleSaveDraft = async () => {
    if (formData.customerPhone && !ensureCustomerPhoneValid()) {
      return;
    }
    // Construct data, parsing values if they exist, but don't require them
    const draftData = {
      ...formData,
      mileageKm: formData.mileageKm ? parseInt(formData.mileageKm, 10) : null,
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
        // Persist selected technician locally keyed by the draft id so it remains available when processing the draft
        const responseDraftId = response?.data?.id ?? response?.data?.claimId ?? response?.data?.data?.id ?? null;
        if (responseDraftId && formData.assignedTechnicianId) {
          saveDraftTechSelection(responseDraftId, {
            id: formData.assignedTechnicianId,
            name: (typeof techQuery === 'string' && techQuery.trim()) ? techQuery : String(formData.assignedTechnicianId)
          });
        }
        toast.success('Nháp đã được lưu thành công!');
        setCreatedClaim(response.data); // Show success screen
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu nháp.');
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
      const successMessage = isEditDraftSuccess ? 'Chỉnh sửa Nháp đã được Lưu Thành công!' : (isDraft ? 'Nháp đã được Lưu Thành công!' : 'Yêu cầu đã được Xử lý Thành công!'); 
      const detailsTitle = isDraft ? 'Chi tiết Nháp:' : 'Chi tiết Yêu cầu:';
      const buttonText = isEditDraftSuccess ? 'Quay lại Chi tiết Yêu cầu' : 'Quay lại Bảng điều khiển';

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
                    <p><strong>Số Yêu cầu:</strong> {createdClaim.claimNumber}</p>
                    <p><strong>Trạng thái:</strong> {createdClaim.status}</p>
                    <p><strong>Khách hàng:</strong> {createdClaim.customer.name}</p>
                    <p><strong>Số VIN Xe:</strong> {createdClaim.vehicle.vin}</p>
                    {/* Conditionally render Assigned To, as drafts may not have it */}
                    {createdClaim.assignedTechnician && (
                      <p><strong>Được phân công cho:</strong> {createdClaim.assignedTechnician.fullName}</p>
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
    ? 'Xử lý Yêu cầu Nháp' 
    : (flowMode === 'edit-draft' ? `Chỉnh sửa Yêu cầu Nháp #${draftClaimData?.claimNumber}` : 'Yêu cầu Sửa chữa Mới');
    
  const pageDescription = flowMode === 'intake' 
    ? 'Hoàn tất các chi tiết còn lại để xử lý nháp này thành yêu cầu mở.'
    : (flowMode === 'edit-draft' ? 'Cập nhật thông tin khách hàng, xe hoặc chi tiết yêu cầu cho nháp này.' : 'Tạo yêu cầu sửa chữa mới cho khách hàng.');
    
  const isCustomerInfoDisabled = flowMode === 'intake';
  
  // Choose the correct submit handler
  let currentSubmitHandler = handleSubmit;
  if (flowMode === 'intake') {
      currentSubmitHandler = handleIntakeSubmit;
  } else if (flowMode === 'edit-draft') {
      currentSubmitHandler = handleEditDraftSubmit;
  }
  
  // --- Check if the Assignment section and checkbox should be hidden ---
  const shouldHideAppointmentAndConsent = flowMode === 'edit-draft';

  return (
    <div className="repair-claim-page-wrapper"> {/* Updated class */}
      <div className="repair-claim-page-header"> {/* Updated class */}
        <button onClick={handleBackClick} className="rc-back-to-dashboard-button"> {/* Updated class */}
          ← Quay lại {flowMode === 'edit-draft' ? 'Chi tiết Yêu cầu' : 'Bảng điều khiển'}
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
          <h3>Thông tin Khách hàng & Xe</h3>
          <div className="rc-form-grid"> {/* Updated class */}
            <div className="rc-field-group">
              <label htmlFor="customer-name" className="required-label">
                Tên Khách hàng
                <RequiredIndicator />
              </label>
              <input 
                  id="customer-name"
                  type="text" 
                  name="customerName" 
                  placeholder="Tên Khách hàng" 
                  value={formData.customerName} 
                  onChange={handleChange} 
                  required 
                  disabled={isCustomerInfoDisabled} 
                  // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                  autoComplete="customer-name-field"
              />
            </div>
            {/* MODIFIED: Phone Search Input */}
            <div className="rc-phone-search-container rc-field-group"> {/* Updated class */}
              <label htmlFor="customer-phone" className="required-label">
                Số điện thoại Khách hàng
                <RequiredIndicator />
              </label>
              <input
                id="customer-phone"
                type="tel"
                name="customerPhoneDisplay" // Use a display name for the input
                placeholder="Số điện thoại Khách hàng (nhập để tìm kiếm)"
                value={phoneQuery} // Use phoneQuery for search input/display
                onChange={handlePhoneChange}
                onClick={(e) => e.stopPropagation()}
                // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                autoComplete="new-phone-number-field" 
                required
                disabled={isCustomerInfoDisabled} // --- MODIFIED: Disable only in intake mode
                inputMode="numeric"
                maxLength={PHONE_LENGTH}
                pattern={PHONE_PATTERN}
                title={PHONE_ERROR_MESSAGE}
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
                        <p>Không tìm thấy khách hàng.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* END MODIFIED Phone Search Input */}
            
            <div className="rc-field-group">
              <label htmlFor="customer-email" className="required-label">
                Email Khách hàng
                <RequiredIndicator />
              </label>
              <input 
                  id="customer-email"
                  type="email" 
                  name="customerEmail" 
                  placeholder="Email Khách hàng" 
                  value={formData.customerEmail} 
                  onChange={handleChange} 
                  required 
                  disabled={isCustomerInfoDisabled}
                  // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                  autoComplete="customer-email-field"
              />
            </div>
            <div className="rc-field-group">
              <label htmlFor="customer-address" className="required-label">
                Địa chỉ Khách hàng
                <RequiredIndicator />
              </label>
              <input 
                  id="customer-address"
                  type="text" 
                  name="customerAddress" 
                  placeholder="Địa chỉ Khách hàng" 
                  value={formData.customerAddress} 
                  onChange={handleChange} 
                  required 
                  disabled={isCustomerInfoDisabled} 
                  // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                  autoComplete="customer-address-field"
              />
            </div>
            
            {customerVehicles.length > 0 ? (
                // --- Vehicle selection is NOT disabled for intake/edit-draft to allow changing VIN
                <div className="rc-field-group">
                  <label className="required-label">
                    Xe của Khách hàng
                    <RequiredIndicator />
                  </label>
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
                                      className="rc-search-result-item rc-vehicle-item" 
                                      onClick={(e) => { e.stopPropagation(); handleVehicleSelect(vehicle); }} // Stop propagation
                                  >
                                      <div className="rc-vehicle-item-content">
                                          <div className="rc-vehicle-item-primary">
                                              <span className="rc-vehicle-vin">{vehicle.vin || 'N/A'}</span>
                                          </div>
                                          <div className="rc-vehicle-item-secondary">
                                              {vehicle.model && (
                                                  <span className="rc-vehicle-model">{vehicle.model}</span>
                                              )}
                                              {vehicle.year && (
                                                  <span className="rc-vehicle-year">{vehicle.year}</span>
                                              )}
                                              {vehicle.mileageKm !== null && vehicle.mileageKm !== undefined && (
                                                  <span className="rc-vehicle-mileage">{vehicle.mileageKm.toLocaleString()} km</span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                </div>
            ) : (
                // --- Allow VIN input in all flows if no vehicles are linked/fetched ---
                <div className="rc-field-group">
                  <label htmlFor="customer-vin" className="required-label">
                    Số VIN Xe
                    <RequiredIndicator />
                  </label>
                  <input 
                      id="customer-vin"
                      type="text" 
                      name="vin" 
                      placeholder="Số VIN Xe" 
                      value={formData.vin} 
                      onChange={handleChange} 
                      required
                      // --- MODIFIED: Use unique value to aggressively suppress autocomplete ---
                      autoComplete="vehicle-vin-field"
                  />
                </div>
            )}

            <div className="rc-field-group">
              <label htmlFor="vehicle-mileage" className="required-label">
                Số km (km)
                <RequiredIndicator />
              </label>
              <input
                id="vehicle-mileage"
                type="number"
                name="mileageKm"
                placeholder="Số km (km)"
                value={formData.mileageKm}
                onChange={handleChange}
                required
                min="0"
                inputMode="numeric"
              />
            </div>
          </div>
          
          <h3>Chi tiết Yêu cầu Sửa chữa</h3>
          <div className="rc-form-grid-single"> {/* Updated class */}
            <div className="rc-field-group">
              <label htmlFor="claim-title" className="required-label">
                Tiêu đề Yêu cầu / Tóm tắt Vấn đề
                <RequiredIndicator />
              </label>
              <input
                id="claim-title"
                type="text"
                name="claimTitle"
                placeholder="Tiêu đề Yêu cầu / Tóm tắt Vấn đề"
                value={formData.claimTitle}
                onChange={handleChange}
                required
              />
            </div>
            <div className="rc-field-group">
              <label htmlFor="reported-failure" className="required-label">
                Lỗi Đã Báo cáo (Mô tả Chi tiết)
                <RequiredIndicator />
              </label>
              <textarea
                id="reported-failure"
                name="reportedFailure"
                placeholder="Lỗi Đã Báo cáo (Mô tả Chi tiết)"
                value={formData.reportedFailure}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>
          </div>

          {/* --- MODIFIED: Conditional rendering for Assignment section --- */}
          {!shouldHideAppointmentAndConsent && (
            <>
              <h3>Phân công</h3>
              <div className="rc-form-grid"> {/* Updated class */}
                {/* --- Technician ID Search Input & Results --- */}
                <div className="rc-technician-search-container rc-field-group">
                    <label
                      htmlFor="assignedTechnicianId"
                      className={flowMode === 'intake' ? 'required-label' : ''}
                    >
                      ID Kỹ thuật viên Được phân công
                      {flowMode === 'intake' && <RequiredIndicator />}
                    </label>
                    <input 
                      id="assignedTechnicianId"
                      type="text" // Change to text to allow for full name/ID search display
                      name="assignedTechnicianId" 
                      placeholder="ID Kỹ thuật viên Được phân công (Tìm kiếm theo ID/Tên)" 
                      value={techQuery} // Bind to techQuery for search/display
                      onChange={handleTechIdChange}
                      onFocus={handleTechInputFocus}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        // Delay hiding results to allow click on result item
                        setTimeout(() => {
                          if (!technicianSelected.current) {
                            setShowTechResults(false);
                          }
                        }, 200);
                      }}
                      required={flowMode === 'intake'} 
                      autoComplete="off"
                    />
                    {showTechResults && (techSearchResults.length > 0 || !techSearchLoading) && (
                        <div className="rc-search-results">
                            {techSearchResults.length > 0 ? (
                                techSearchResults.map((tech) => {
                                    const isAvailable = tech.isAvailable === true;
                                    const workloadInfo = tech.currentWorkload !== null && tech.maxWorkload !== null 
                                        ? `${tech.currentWorkload}/${tech.maxWorkload}` 
                                        : null;
                                    const statusClass = isAvailable ? 'rc-tech-available' : (tech.isAvailable === false ? 'rc-tech-busy' : 'rc-tech-unknown');
                                    
                                    return (
                                        <div
                                            key={tech.id}
                                            className={`rc-search-result-item ${statusClass}`}
                                            onMouseDown={(e) => { 
                                                e.preventDefault(); // Prevent input blur
                                                e.stopPropagation(); 
                                            }}
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleTechnicianSelect(tech); 
                                            }}
                                        >
                                            <div className="rc-tech-result-main">
                                                <p><strong>{tech.fullName || tech.username || `Technician #${tech.id}`}</strong></p>
                                                <p className="rc-tech-result-id">ID: {tech.id} {tech.active ? '• Hoạt động' : '• Không hoạt động'}</p>
                                                {tech.profile && tech.profile.specialization && (
                                                    <p className="rc-tech-result-spec">{tech.profile.specialization}</p>
                                                )}
                                            </div>
                                            {tech.isAvailable !== null && (
                                                <div className="rc-tech-result-status">
                                                    <span className={`rc-tech-status-badge ${isAvailable ? 'rc-available' : 'rc-busy'}`}>
                                                        {isAvailable ? 'Sẵn sàng' : 'Bận'}
                                                    </span>
                                                    {workloadInfo && (
                                                        <span className="rc-tech-workload">Khối lượng: {workloadInfo}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="rc-search-result-item">
                                    <p>Không tìm thấy kỹ thuật viên nào phù hợp với tìm kiếm của bạn.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* --- END Technician Search --- */}
              </div>

              {/* --- NEW: Work Order Creation Notification --- */}
              {flowMode !== 'edit-draft' && (
                <div className="rc-work-order-notification">
                  <FaInfoCircle className="rc-work-order-notification-icon" />
                  <span className="rc-work-order-notification-text">
                    Work Order sẽ được tự động tạo và phân công cho kỹ thuật viên đã chọn.
                  </span>
                </div>
              )}
            </>
          )}
          
          {/* --- MODIFIED: Customer Consent checkbox moved to bottom --- */}
          {!shouldHideAppointmentAndConsent && (
            <div className="rc-consent-checkbox"> {/* Updated class */}
              <input type="checkbox" id="customerConsent" name="customerConsent" checked={formData.customerConsent} onChange={handleChange} required />
              <label htmlFor="customerConsent" className="required-label">
                Khách hàng đã đồng ý cho công việc sửa chữa.
                <RequiredIndicator />
              </label>
            </div>
          )}
          
          {/* --- Button Wrapper --- */}
          {/* --- Conditionally render buttons based on flow mode --- */}
          <div className={`rc-form-actions ${flowMode !== 'new' ? 'intake-edit-mode' : ''}`}>
            {flowMode === 'intake' && (
              <button type="submit">Tạo Yêu cầu Mở</button>
            )}
            
            {flowMode === 'edit-draft' && (
                <button type="submit">Lưu Chỉnh sửa vào Yêu cầu Nháp</button>
            )}

            {flowMode === 'new' && (
              <>
                <button 
                  type="button" 
                  className="rc-draft-button" // Updated class
                  onClick={handleSaveDraft}
                >
                  Lưu làm Nháp
                </button>
                <button type="submit">Tạo Yêu cầu</button> {/* Updated text */}
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default NewRepairClaimPage;