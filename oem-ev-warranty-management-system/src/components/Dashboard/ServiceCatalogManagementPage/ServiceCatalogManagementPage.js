import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './ServiceCatalogManagementPage.css';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSpinner, FaEye, FaEdit, FaBan } from 'react-icons/fa';

const ServiceCatalogManagementPage = ({ handleBackClick }) => {
  const [activeTab, setActiveTab] = useState('services'); // 'services', 'prices', 'estimate', 'manage'
  const [userRole, setUserRole] = useState(null);
  
  // Service Items state
  const [serviceItems, setServiceItems] = useState([]);
  const [serviceItemsLoading, setServiceItemsLoading] = useState(false);
  const [serviceItemsPage, setServiceItemsPage] = useState(0);
  const [serviceItemsTotalPages, setServiceItemsTotalPages] = useState(0);
  const [serviceItemsFilters, setServiceItemsFilters] = useState({
    category: '',
    search: '',
    active: true
  });
  const [selectedServiceItem, setSelectedServiceItem] = useState(null);
  
  // Admin Management Form state
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    serviceCode: '',
    name: '',
    description: '',
    standardLaborHours: '',
    category: '',
    active: true,
    priceNorth: '',
    priceSouth: '',
    priceCentral: '',
    currency: 'VND'
  });
  const [formLoading, setFormLoading] = useState(false);

  // Catalog Prices state
  const [catalogPrices, setCatalogPrices] = useState([]);
  const [catalogPricesLoading, setCatalogPricesLoading] = useState(false);
  const [catalogPricesPage, setCatalogPricesPage] = useState(0);
  const [catalogPricesTotalPages, setCatalogPricesTotalPages] = useState(0);
  const [catalogPricesFilters, setCatalogPricesFilters] = useState({
    itemType: '',
    region: '',
    serviceCenterId: ''
  });
  
  // State for Loại dropdown search
  const [itemTypeSearchQuery, setItemTypeSearchQuery] = useState('');
  const [showItemTypeResults, setShowItemTypeResults] = useState(false);
  
  // State for estimate dropdowns
  const [showPartsDropdown, setShowPartsDropdown] = useState(false);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  
  // State for manage form dropdowns
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  // State for region and service center dropdowns
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showServiceCenterDropdown, setShowServiceCenterDropdown] = useState(false);
  const [showEstimateRegionDropdown, setShowEstimateRegionDropdown] = useState(false);
  const [showEstimateServiceCenterDropdown, setShowEstimateServiceCenterDropdown] = useState(false);
  const [serviceCenters, setServiceCenters] = useState([]);
  const [serviceCenterSearchQuery, setServiceCenterSearchQuery] = useState('');
  const [estimateServiceCenterSearchQuery, setEstimateServiceCenterSearchQuery] = useState('');

  // Refs for dropdown containers to handle click outside
  const itemTypeRef = useRef(null);
  const partsRef = useRef(null);
  const servicesRef = useRef(null);
  const statusRef = useRef(null);
  const currencyRef = useRef(null);
  const regionRef = useRef(null);
  const serviceCenterRef = useRef(null);
  const estimateRegionRef = useRef(null);
  const estimateServiceCenterRef = useRef(null);

  // Refs for current filter values to avoid dependency issues
  const serviceItemsFiltersRef = useRef(serviceItemsFilters);
  const catalogPricesFiltersRef = useRef(catalogPricesFilters);

  // Update refs when filters change
  useEffect(() => {
    serviceItemsFiltersRef.current = serviceItemsFilters;
  }, [serviceItemsFilters]);

  useEffect(() => {
    catalogPricesFiltersRef.current = catalogPricesFilters;
  }, [catalogPricesFilters]);

  // Get auth headers - memoized (must be defined first)
  const getAuthHeaders = useCallback(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.token
      ? { 'Authorization': `Bearer ${user.token}`, 'Content-Type': 'application/json' }
      : {};
  }, []);

  // Function to close all dropdowns - memoized
  const closeAllDropdowns = useCallback(() => {
    setShowItemTypeResults(false);
    setShowPartsDropdown(false);
    setShowServicesDropdown(false);
    setShowStatusDropdown(false);
    setShowCurrencyDropdown(false);
    setShowRegionDropdown(false);
    setShowServiceCenterDropdown(false);
    setShowEstimateRegionDropdown(false);
    setShowEstimateServiceCenterDropdown(false);
  }, []);

  // Fetch service centers - memoized
  const fetchServiceCenters = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-centers`,
        { headers: getAuthHeaders() }
      );
      const centers = Array.isArray(response.data) ? response.data : (response.data.content || []);
      setServiceCenters(centers);
    } catch (error) {
      console.error('Error fetching service centers:', error);
      // Don't show error toast as this is optional
    }
  }, [getAuthHeaders]);

  // Effect for clicking outside to close dropdowns - optimized
  useEffect(() => {
    const handleClickOutside = (event) => {
      const refs = [
        { ref: itemTypeRef, setter: setShowItemTypeResults },
        { ref: partsRef, setter: setShowPartsDropdown },
        { ref: servicesRef, setter: setShowServicesDropdown },
        { ref: statusRef, setter: setShowStatusDropdown },
        { ref: currencyRef, setter: setShowCurrencyDropdown },
        { ref: regionRef, setter: setShowRegionDropdown },
        { ref: serviceCenterRef, setter: setShowServiceCenterDropdown },
        { ref: estimateRegionRef, setter: setShowEstimateRegionDropdown },
        { ref: estimateServiceCenterRef, setter: setShowEstimateServiceCenterDropdown }
      ];

      refs.forEach(({ ref, setter }) => {
        if (ref.current && !ref.current.contains(event.target)) {
          setter(false);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch service centers on mount
  useEffect(() => {
    fetchServiceCenters();
  }, [fetchServiceCenters]);

  // Memoized filtered service centers for prices filter
  const filteredServiceCenters = useMemo(() => {
    if (!serviceCenterSearchQuery || serviceCenters.length === 0) return [];
    return serviceCenters
      .filter(sc => 
        String(sc.id).includes(serviceCenterSearchQuery) ||
        (sc.name && sc.name.toLowerCase().includes(serviceCenterSearchQuery.toLowerCase()))
      )
      .slice(0, 10);
  }, [serviceCenters, serviceCenterSearchQuery]);

  // Memoized filtered service centers for estimate
  const filteredEstimateServiceCenters = useMemo(() => {
    if (!estimateServiceCenterSearchQuery || serviceCenters.length === 0) return [];
    return serviceCenters
      .filter(sc => 
        String(sc.id).includes(estimateServiceCenterSearchQuery) ||
        (sc.name && sc.name.toLowerCase().includes(estimateServiceCenterSearchQuery.toLowerCase()))
      )
      .slice(0, 10);
  }, [serviceCenters, estimateServiceCenterSearchQuery]);

  // Sync service center search query with existing filter value
  useEffect(() => {
    if (catalogPricesFilters.serviceCenterId && serviceCenters.length > 0) {
      const sc = serviceCenters.find(c => String(c.id) === String(catalogPricesFilters.serviceCenterId));
      if (sc && serviceCenterSearchQuery === '') {
        setServiceCenterSearchQuery(sc.name || `ID: ${sc.id}`);
      }
    } else if (!catalogPricesFilters.serviceCenterId) {
      setServiceCenterSearchQuery('');
    }
  }, [catalogPricesFilters.serviceCenterId, serviceCenters, serviceCenterSearchQuery]);
  
  // Item type options
  const itemTypeOptions = [
    { value: '', label: 'Tất cả' },
    { value: 'PART', label: 'Phụ tùng' },
    { value: 'SERVICE', label: 'Dịch vụ' }
  ];

  // Estimate Calculator state
  const [estimateData, setEstimateData] = useState({
    partItems: [],
    serviceItems: [],
    region: '',
    serviceCenterId: '',
    currency: 'VND'
  });
  const [estimateResult, setEstimateResult] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [newPartItem, setNewPartItem] = useState({ itemId: '', quantity: 1 });
  const [newServiceItem, setNewServiceItem] = useState({ itemId: '', quantity: 1 });
  const [availableParts, setAvailableParts] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // Sync estimate service center search query with existing data value
  useEffect(() => {
    if (estimateData.serviceCenterId && serviceCenters.length > 0) {
      const sc = serviceCenters.find(c => String(c.id) === String(estimateData.serviceCenterId));
      if (sc && estimateServiceCenterSearchQuery === '') {
        setEstimateServiceCenterSearchQuery(sc.name || `ID: ${sc.id}`);
      }
    } else if (!estimateData.serviceCenterId) {
      setEstimateServiceCenterSearchQuery('');
    }
  }, [estimateData.serviceCenterId, serviceCenters]);

  // Fetch service items - memoized
  const fetchServiceItems = useCallback(async (page = 0, showToast = false) => {
    setServiceItemsLoading(true);
    try {
      const currentFilters = serviceItemsFiltersRef.current;
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20',
        active: currentFilters.active.toString()
      });
      
      if (currentFilters.category) params.append('category', currentFilters.category);
      if (currentFilters.search) params.append('search', currentFilters.search);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/services?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (response.status === 200) {
        setServiceItems(response.data.content || []);
        setServiceItemsPage(response.data.number || 0);
        setServiceItemsTotalPages(response.data.totalPages || 0);
        if (showToast) {
          toast.success(`Đã tải ${response.data.totalElements || 0} dịch vụ`);
        }
      }
    } catch (error) {
      console.error('Error fetching service items:', error);
      toast.error('Lỗi khi tải danh sách dịch vụ');
    } finally {
      setServiceItemsLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch catalog prices - memoized
  const fetchCatalogPrices = useCallback(async (page = 0, showToast = false) => {
    setCatalogPricesLoading(true);
    try {
      const currentFilters = catalogPricesFiltersRef.current;
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20'
      });
      
      if (currentFilters.itemType) params.append('itemType', currentFilters.itemType);
      if (currentFilters.region) params.append('region', currentFilters.region);
      if (currentFilters.serviceCenterId) params.append('serviceCenterId', currentFilters.serviceCenterId);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/prices?${params.toString()}`,
        { headers: getAuthHeaders() }
      );

      if (response.status === 200) {
        setCatalogPrices(response.data.content || []);
        setCatalogPricesPage(response.data.number || 0);
        setCatalogPricesTotalPages(response.data.totalPages || 0);
        if (showToast) {
          toast.success(`Đã tải ${response.data.totalElements || 0} bảng giá`);
        }
      }
    } catch (error) {
      console.error('Error fetching catalog prices:', error);
      toast.error('Lỗi khi tải danh sách bảng giá');
    } finally {
      setCatalogPricesLoading(false);
    }
  }, [getAuthHeaders]);

  // Fetch available parts for estimate - memoized
  const fetchAvailableParts = useCallback(async () => {
    try {
      // Try to get parts from inventory stock endpoint
      // This endpoint requires EVM_STAFF, so SC_STAFF/SC_TECHNICIAN may not have access
      // We'll handle this gracefully by allowing manual part ID entry
      const params = new URLSearchParams({ page: '0', size: '100' });
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/inventory/stock?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      if (response.status === 200) {
        // Extract unique parts from inventory stock
        const stockItems = response.data.content || [];
        const uniquePartsMap = new Map();
        stockItems.forEach(item => {
          if (item.partId && !uniquePartsMap.has(item.partId)) {
            uniquePartsMap.set(item.partId, {
              id: item.partId,
              partNumber: item.partNumber,
              name: item.partName
            });
          }
        });
        setAvailableParts(Array.from(uniquePartsMap.values()));
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
      // If access denied, parts list will be empty and users can enter IDs manually
      // Don't show error toast as this is optional for SC_STAFF/SC_TECHNICIAN
      setAvailableParts([]);
    }
  }, [getAuthHeaders]);

  // Fetch available services for estimate - memoized
  const fetchAvailableServices = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: '0', size: '100', active: 'true' });
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/services?${params.toString()}`,
        { headers: getAuthHeaders() }
      );
      if (response.status === 200) {
        setAvailableServices(response.data.content || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }, [getAuthHeaders]);

  // Calculate estimate
  const calculateEstimate = async () => {
    if (estimateData.partItems.length === 0 && estimateData.serviceItems.length === 0) {
      toast.error('Vui lòng thêm ít nhất một phụ tùng hoặc dịch vụ');
      return;
    }

    setEstimateLoading(true);
    try {
      const requestData = {
        partItems: estimateData.partItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        })),
        serviceItems: estimateData.serviceItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity
        })),
        region: estimateData.region || null,
        serviceCenterId: estimateData.serviceCenterId || null,
        currency: estimateData.currency
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/calculate-estimate`,
        requestData,
        { headers: getAuthHeaders() }
      );

      if (response.status === 200) {
        setEstimateResult(response.data);
        toast.success('Đã tính toán ước tính thành công');
      }
    } catch (error) {
      console.error('Error calculating estimate:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi tính toán ước tính';
      toast.error(errorMessage);
    } finally {
      setEstimateLoading(false);
    }
  };

  // Add part item to estimate
  const addPartItem = () => {
    if (!newPartItem.itemId || !newPartItem.quantity || newPartItem.quantity < 1) {
      toast.error('Vui lòng nhập ID phụ tùng và số lượng');
      return;
    }

    const partId = parseInt(newPartItem.itemId);
    const part = availableParts.find(p => p.id === partId);
    
    setEstimateData(prev => ({
      ...prev,
      partItems: [...prev.partItems, {
        itemId: partId,
        quantity: parseInt(newPartItem.quantity),
        itemName: part ? part.name : `Phụ tùng #${partId}`,
        itemCode: part ? part.partNumber : `PART-${partId}`
      }]
    }));
    setNewPartItem({ itemId: '', quantity: 1 });
  };

  // Add service item to estimate
  const addServiceItem = () => {
    if (!newServiceItem.itemId || !newServiceItem.quantity || newServiceItem.quantity < 1) {
      toast.error('Vui lòng chọn dịch vụ và nhập số lượng');
      return;
    }

    const service = availableServices.find(s => s.id === parseInt(newServiceItem.itemId));
    if (service) {
      setEstimateData(prev => ({
        ...prev,
        serviceItems: [...prev.serviceItems, {
          itemId: parseInt(newServiceItem.itemId),
          quantity: parseInt(newServiceItem.quantity),
          itemName: service.name,
          itemCode: service.serviceCode
        }]
      }));
      setNewServiceItem({ itemId: '', quantity: 1 });
    }
  };

  // Remove item from estimate
  const removePartItem = (index) => {
    setEstimateData(prev => ({
      ...prev,
      partItems: prev.partItems.filter((_, i) => i !== index)
    }));
  };

  const removeServiceItem = (index) => {
    setEstimateData(prev => ({
      ...prev,
      serviceItems: prev.serviceItems.filter((_, i) => i !== index)
    }));
  };

  // Format currency - memoized
  const formatCurrency = useCallback((amount, currency = 'VND') => {
    if (!amount) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }, []);

  // Format date - memoized
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }, []);

  // Get user role on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    }
  }, []);

  // Effects - optimized to prevent duplicate fetches
  useEffect(() => {
    if (activeTab === 'estimate') {
      fetchAvailableParts();
      fetchAvailableServices();
    } else if (activeTab === 'manage' && !editingService) {
      resetForm();
    }
  }, [activeTab, editingService, fetchAvailableParts, fetchAvailableServices]);

  // Separate effect for filter changes - debounced to prevent excessive API calls
  useEffect(() => {
    if (activeTab !== 'services') return;
    const timeoutId = setTimeout(() => {
      fetchServiceItems(0);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [activeTab, serviceItemsFilters, fetchServiceItems]);

  useEffect(() => {
    if (activeTab !== 'prices') return;
    const timeoutId = setTimeout(() => {
      fetchCatalogPrices(0);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [activeTab, catalogPricesFilters, fetchCatalogPrices]);

  // Reset form
  const resetForm = () => {
    setFormData({
      serviceCode: '',
      name: '',
      description: '',
      standardLaborHours: '',
      category: '',
      active: true,
      priceNorth: '',
      priceSouth: '',
      priceCentral: '',
      currency: 'VND'
    });
    setEditingService(null);
  };

  // Load service for editing
  const loadServiceForEdit = async (serviceId) => {
    setFormLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/services/${serviceId}`,
        { headers: getAuthHeaders() }
      );

      if (response.status === 200) {
        const service = response.data;
        setEditingService(service);
        setFormData({
          serviceCode: service.serviceCode || '',
          name: service.name || '',
          description: service.description || '',
          standardLaborHours: service.standardLaborHours || '',
          category: service.category || '',
          active: service.active !== undefined ? service.active : true,
          priceNorth: '',
          priceSouth: '',
          priceCentral: '',
          currency: 'VND'
        });

        // Fetch prices for all regions
        const regions = ['NORTH', 'SOUTH', 'CENTRAL'];
        const pricePromises = regions.map(region =>
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/service-catalog/prices/current/SERVICE/${serviceId}?region=${region}`,
            { headers: getAuthHeaders() }
          ).catch(() => null)
        );

        const priceResults = await Promise.all(pricePromises);
        
        setFormData(prev => ({
          ...prev,
          priceNorth: priceResults[0]?.data?.price || '',
          priceSouth: priceResults[1]?.data?.price || '',
          priceCentral: priceResults[2]?.data?.price || '',
          currency: priceResults[0]?.data?.currency || priceResults[1]?.data?.currency || priceResults[2]?.data?.currency || 'VND'
        }));

        setActiveTab('manage');
      }
    } catch (error) {
      console.error('Error loading service for edit:', error);
      toast.error('Lỗi khi tải thông tin dịch vụ');
    } finally {
      setFormLoading(false);
    }
  };

  // Create service with prices
  const createService = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Validate required fields
      if (!formData.serviceCode || !formData.name || !formData.standardLaborHours ||
          !formData.priceNorth || !formData.priceSouth || !formData.priceCentral) {
        toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
        setFormLoading(false);
        return;
      }

      // Create service item
      const serviceRequest = {
        serviceCode: formData.serviceCode,
        name: formData.name,
        description: formData.description || '',
        standardLaborHours: parseFloat(formData.standardLaborHours),
        category: formData.category || '',
        active: formData.active
      };

      const serviceResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/services`,
        serviceRequest,
        { headers: getAuthHeaders() }
      );

      if (serviceResponse.status === 201) {
        const createdService = serviceResponse.data;
        const serviceId = createdService.id;

        // Create prices for all 3 regions
        const today = new Date().toISOString().split('T')[0];
        const regions = [
          { name: 'NORTH', price: formData.priceNorth },
          { name: 'SOUTH', price: formData.priceSouth },
          { name: 'CENTRAL', price: formData.priceCentral }
        ];

        const pricePromises = regions.map(region =>
          axios.post(
            `${process.env.REACT_APP_API_URL}/api/service-catalog/prices`,
            {
              itemType: 'SERVICE',
              itemId: serviceId,
              price: parseFloat(region.price),
              currency: formData.currency,
              region: region.name,
              effectiveFrom: today
            },
            { headers: getAuthHeaders() }
          )
        );

        await Promise.all(pricePromises);

        toast.success('Tạo dịch vụ và giá thành công');
        resetForm();
        fetchServiceItems(0, true);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi tạo dịch vụ';
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Update service
  const updateService = async (e) => {
    e.preventDefault();
    if (!editingService) return;

    setFormLoading(true);

    try {
      // Update service item
      const serviceUpdateRequest = {
        name: formData.name,
        description: formData.description || '',
        standardLaborHours: formData.standardLaborHours ? parseFloat(formData.standardLaborHours) : null,
        category: formData.category || '',
        active: formData.active
      };

      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/services/${editingService.id}`,
        serviceUpdateRequest,
        { headers: getAuthHeaders() }
      );

      // Update prices if provided
      if (formData.priceNorth || formData.priceSouth || formData.priceCentral) {
        const today = new Date().toISOString().split('T')[0];
        const regions = [
          { name: 'NORTH', price: formData.priceNorth },
          { name: 'SOUTH', price: formData.priceSouth },
          { name: 'CENTRAL', price: formData.priceCentral }
        ];

        // For each region, get current price and update if new price provided
        for (const region of regions) {
          if (region.price) {
            try {
              // Try to get current price
              const currentPriceResponse = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/service-catalog/prices/current/SERVICE/${editingService.id}?region=${region.name}`,
                { headers: getAuthHeaders() }
              );

              if (currentPriceResponse.data) {
                // Update existing price
                await axios.put(
                  `${process.env.REACT_APP_API_URL}/api/service-catalog/prices/${currentPriceResponse.data.id}`,
                  {
                    price: parseFloat(region.price),
                    currency: formData.currency
                  },
                  { headers: getAuthHeaders() }
                );
              }
            } catch (error) {
              // If no current price exists, create new one
              await axios.post(
                `${process.env.REACT_APP_API_URL}/api/service-catalog/prices`,
                {
                  itemType: 'SERVICE',
                  itemId: editingService.id,
                  price: parseFloat(region.price),
                  currency: formData.currency,
                  region: region.name,
                  effectiveFrom: today
                },
                { headers: getAuthHeaders() }
              );
            }
          }
        }
      }

      toast.success('Cập nhật dịch vụ thành công');
      resetForm();
      fetchServiceItems(0, true);
      setActiveTab('services');
    } catch (error) {
      console.error('Error updating service:', error);
      const errorMessage = error.response?.data?.message || 'Lỗi khi cập nhật dịch vụ';
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  // Deactivate service
  const deactivateService = async (serviceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa dịch vụ này?')) {
      return;
    }

    setFormLoading(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/service-catalog/services/${serviceId}`,
        { active: false },
        { headers: getAuthHeaders() }
      );

      toast.success('Đã vô hiệu hóa dịch vụ');
      fetchServiceItems(0, true);
      if (editingService && editingService.id === serviceId) {
        resetForm();
        setActiveTab('services');
      }
    } catch (error) {
      console.error('Error deactivating service:', error);
      toast.error('Lỗi khi vô hiệu hóa dịch vụ');
    } finally {
      setFormLoading(false);
    }
  };
  
  // Initialize item type search query
  useEffect(() => {
    if (activeTab === 'prices') {
      const selectedOption = itemTypeOptions.find(opt => opt.value === catalogPricesFilters.itemType);
      setItemTypeSearchQuery(selectedOption ? selectedOption.label : '');
    }
  }, [activeTab, catalogPricesFilters.itemType]);

  return (
    <div className="service-catalog-page-wrapper">
      <div className="service-catalog-page-header">
        <button className="service-catalog-back-button" onClick={handleBackClick}>
          ← Quay lại
        </button>
        <h1 className="service-catalog-page-title">Quản lý Danh mục Dịch vụ</h1>
        <div className="service-catalog-nav-bar-group">
          <div className="service-catalog-function-nav-bar">
            <button
              className={`service-catalog-tab-button ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Dịch vụ
            </button>
            <button
              className={`service-catalog-tab-button ${activeTab === 'prices' ? 'active' : ''}`}
              onClick={() => setActiveTab('prices')}
            >
              Bảng giá
            </button>
            <button
              className={`service-catalog-tab-button ${activeTab === 'estimate' ? 'active' : ''}`}
              onClick={() => setActiveTab('estimate')}
            >
              Tính ước tính
            </button>
            {userRole === 'ADMIN' && (
              <button
                className={`service-catalog-tab-button ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage')}
              >
                Quản lý
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="service-catalog-page-content-area">

      {/* Service Items Tab */}
      {activeTab === 'services' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="service-catalog-content-box"
        >
          <div className="service-catalog-filters-section">
            <div className="service-catalog-filter-group">
              <label>Tìm kiếm:</label>
              <input
                type="text"
                placeholder="Tên hoặc mã dịch vụ..."
                value={serviceItemsFilters.search}
                onChange={(e) => setServiceItemsFilters({ ...serviceItemsFilters, search: e.target.value })}
                className="service-catalog-filter-input"
              />
            </div>
            <div className="service-catalog-filter-group">
              <label>Danh mục:</label>
              <input
                type="text"
                placeholder="Danh mục..."
                value={serviceItemsFilters.category}
                onChange={(e) => setServiceItemsFilters({ ...serviceItemsFilters, category: e.target.value })}
                className="service-catalog-filter-input"
              />
            </div>
            <div className="service-catalog-filter-group service-catalog-checkbox-group">
              <label className="service-catalog-checkbox-spacer"></label>
              <label className="service-catalog-checkbox-label">
                <input
                  type="checkbox"
                  checked={serviceItemsFilters.active}
                  onChange={(e) => setServiceItemsFilters({ ...serviceItemsFilters, active: e.target.checked })}
                />
                <span>Chỉ hiển thị dịch vụ đang hoạt động</span>
              </label>
            </div>
            <button className="service-catalog-filter-button" onClick={() => fetchServiceItems(0, true)}>
              Tìm kiếm
            </button>
          </div>

          {serviceItemsLoading ? (
            <div className="service-catalog-loading-container">
              <FaSpinner className="service-catalog-spinner" /> Đang tải...
            </div>
          ) : (
            <>
              <div className="service-catalog-table-container">
                <div className="service-catalog-table-wrapper">
                  <table className="service-catalog-data-table">
                    <thead>
                      <tr>
                        <th>Mã dịch vụ</th>
                        <th>Tên dịch vụ</th>
                        <th>Danh mục</th>
                        <th>Giờ lao động chuẩn</th>
                        <th>Giá hiện tại</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="service-catalog-empty-state">Không có dữ liệu</td>
                        </tr>
                      ) : (
                        serviceItems.map((item) => (
                          <tr key={item.id}>
                            <td>{item.serviceCode}</td>
                            <td>{item.name}</td>
                            <td>{item.category || '-'}</td>
                            <td>{item.standardLaborHours || 0} giờ</td>
                            <td>
                              {item.currentPrice
                                ? formatCurrency(item.currentPrice, item.priceRegion ? 'VND' : 'VND')
                                : '-'}
                            </td>
                            <td>
                              <span className={`service-catalog-status-badge ${item.active ? 'active' : 'inactive'}`}>
                                {item.active ? 'Hoạt động' : 'Không hoạt động'}
                              </span>
                            </td>
                            <td>
                              <div className="service-catalog-action-buttons">
                                <button
                                  className="service-catalog-action-button"
                                  onClick={() => setSelectedServiceItem(item)}
                                  title="Chi tiết"
                                >
                                  <FaEye />
                                </button>
                                {userRole === 'ADMIN' && (
                                  <>
                                    <button
                                      className="service-catalog-edit-button"
                                      onClick={() => loadServiceForEdit(item.id)}
                                      title="Sửa"
                                    >
                                      <FaEdit />
                                    </button>
                                    {item.active && (
                                      <button
                                        className="service-catalog-deactivate-button"
                                        onClick={() => deactivateService(item.id)}
                                        title="Vô hiệu hóa"
                                      >
                                        <FaBan />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {serviceItemsTotalPages > 1 && (
                <div className="service-catalog-pagination">
                  <button
                    disabled={serviceItemsPage === 0}
                    onClick={() => fetchServiceItems(serviceItemsPage - 1)}
                  >
                    Trước
                  </button>
                  <span>
                    Trang {serviceItemsPage + 1} / {serviceItemsTotalPages}
                  </span>
                  <button
                    disabled={serviceItemsPage >= serviceItemsTotalPages - 1}
                    onClick={() => fetchServiceItems(serviceItemsPage + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}

          {/* Service Item Detail Modal */}
          <AnimatePresence>
            {selectedServiceItem && (
              <motion.div
                className="service-catalog-modal-overlay"
                onClick={() => setSelectedServiceItem(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="service-catalog-modal-content"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="service-catalog-modal-header">
                    <h2>Chi tiết dịch vụ</h2>
                    <button className="service-catalog-close-button" onClick={() => setSelectedServiceItem(null)}>×</button>
                  </div>
                  <div className="service-catalog-modal-body">
                    <div className="service-catalog-detail-row">
                      <strong>Mã dịch vụ:</strong> <span>{selectedServiceItem.serviceCode}</span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Tên dịch vụ:</strong> <span>{selectedServiceItem.name}</span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Mô tả:</strong> <span>{selectedServiceItem.description || '-'}</span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Danh mục:</strong> <span>{selectedServiceItem.category || '-'}</span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Giờ lao động chuẩn:</strong> <span>{selectedServiceItem.standardLaborHours || 0} giờ</span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Giá hiện tại:</strong>{' '}
                      <span>
                        {selectedServiceItem.currentPrice
                          ? formatCurrency(selectedServiceItem.currentPrice)
                          : 'Chưa có giá'}
                      </span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Trạng thái:</strong>{' '}
                      <span className={`service-catalog-status-badge ${selectedServiceItem.active ? 'active' : 'inactive'}`}>
                        {selectedServiceItem.active ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Ngày tạo:</strong> <span>{formatDate(selectedServiceItem.createdAt)}</span>
                    </div>
                    <div className="service-catalog-detail-row">
                      <strong>Ngày cập nhật:</strong> <span>{formatDate(selectedServiceItem.updatedAt)}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Catalog Prices Tab */}
      {activeTab === 'prices' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="service-catalog-content-box"
        >
          <div className="service-catalog-filters-section">
            <div className="service-catalog-filter-group">
              <label>Loại:</label>
              <div className="service-catalog-dropdown-container" ref={itemTypeRef}>
                <button
                  type="button"
                  onClick={() => { closeAllDropdowns(); setShowItemTypeResults(!showItemTypeResults); }}
                  className="service-catalog-filter-input service-catalog-dropdown-button"
                >
                  <span>{itemTypeSearchQuery || 'Tất cả'}</span>
                  <span className="service-catalog-dropdown-arrow">▼</span>
                </button>
                {showItemTypeResults && (
                  <div className="service-catalog-dropdown-results">
                    {itemTypeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="service-catalog-dropdown-result-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setItemTypeSearchQuery(option.label);
                          setCatalogPricesFilters({ ...catalogPricesFilters, itemType: option.value });
                          setShowItemTypeResults(false);
                        }}
                      >
                        <p><strong>{option.label}</strong></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="service-catalog-filter-group">
              <label>Khu vực:</label>
              <div className="service-catalog-dropdown-container" ref={regionRef}>
                <button
                  type="button"
                  onClick={() => { closeAllDropdowns(); setShowRegionDropdown(!showRegionDropdown); }}
                  className="service-catalog-filter-input service-catalog-dropdown-button"
                >
                  <span>{catalogPricesFilters.region || 'Chọn khu vực...'}</span>
                  <span className="service-catalog-dropdown-arrow">▼</span>
                </button>
                {showRegionDropdown && (
                  <div className="service-catalog-filter-dropdown-results">
                    <div
                      className="service-catalog-dropdown-result-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCatalogPricesFilters({ ...catalogPricesFilters, region: '' });
                        setShowRegionDropdown(false);
                      }}
                    >
                      <p><strong>Chọn khu vực...</strong></p>
                    </div>
                    <div
                      className="service-catalog-dropdown-result-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCatalogPricesFilters({ ...catalogPricesFilters, region: 'NORTH' });
                        setShowRegionDropdown(false);
                      }}
                    >
                      <p><strong>NORTH</strong></p>
                    </div>
                    <div
                      className="service-catalog-dropdown-result-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCatalogPricesFilters({ ...catalogPricesFilters, region: 'CENTRAL' });
                        setShowRegionDropdown(false);
                      }}
                    >
                      <p><strong>CENTRAL</strong></p>
                    </div>
                    <div
                      className="service-catalog-dropdown-result-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCatalogPricesFilters({ ...catalogPricesFilters, region: 'SOUTH' });
                        setShowRegionDropdown(false);
                      }}
                    >
                      <p><strong>SOUTH</strong></p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="service-catalog-filter-group">
              <label>ID Trung tâm:</label>
              <div className="service-catalog-dropdown-container" ref={serviceCenterRef}>
                <input
                  type="text"
                  placeholder="Nhập ID hoặc tìm kiếm..."
                  value={serviceCenterSearchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setServiceCenterSearchQuery(query);
                    // If it's a number, update the filter directly
                    if (/^\d+$/.test(query)) {
                      setCatalogPricesFilters({ ...catalogPricesFilters, serviceCenterId: query });
                    } else if (query === '') {
                      setCatalogPricesFilters({ ...catalogPricesFilters, serviceCenterId: '' });
                    }
                    setShowServiceCenterDropdown(true);
                  }}
                  onFocus={() => setShowServiceCenterDropdown(true)}
                  className="service-catalog-filter-input"
                />
                {showServiceCenterDropdown && serviceCenters.length > 0 && (
                  <div className="service-catalog-filter-dropdown-results">
                    {(serviceCenterSearchQuery ? filteredServiceCenters : serviceCenters.slice(0, 10))
                      .map((sc) => (
                        <div
                          key={sc.id}
                          className="service-catalog-dropdown-result-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setServiceCenterSearchQuery(sc.name || `ID: ${sc.id}`);
                            setCatalogPricesFilters({ ...catalogPricesFilters, serviceCenterId: String(sc.id) });
                            setShowServiceCenterDropdown(false);
                          }}
                        >
                          <p><strong>{sc.name || `Service Center ${sc.id}`}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>(ID: {sc.id})</span></p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <button className="service-catalog-filter-button" onClick={() => fetchCatalogPrices(0, true)}>
              Tìm kiếm
            </button>
          </div>

          {catalogPricesLoading ? (
            <div className="service-catalog-loading-container">
              <FaSpinner className="service-catalog-spinner" /> Đang tải...
            </div>
          ) : (
            <>
              <div className="service-catalog-table-container">
                <div className="service-catalog-table-wrapper">
                  <table className="service-catalog-data-table">
                    <thead>
                      <tr>
                        <th>Loại</th>
                        <th>Mã</th>
                        <th>Tên</th>
                        <th>Giá</th>
                        <th>Tiền tệ</th>
                        <th>Khu vực</th>
                        <th>Hiệu lực từ</th>
                        <th>Hiệu lực đến</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalogPrices.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="service-catalog-empty-state">Không có dữ liệu</td>
                        </tr>
                      ) : (
                        catalogPrices.map((price) => (
                          <tr key={price.id}>
                            <td>
                              <span className={`service-catalog-type-badge ${price.itemType?.toLowerCase()}`}>
                                {price.itemType === 'PART' ? 'Phụ tùng' : 'Dịch vụ'}
                              </span>
                            </td>
                            <td>{price.itemCode}</td>
                            <td>{price.itemName}</td>
                            <td>{formatCurrency(price.price, price.currency)}</td>
                            <td>{price.currency || 'VND'}</td>
                            <td>{price.region || '-'}</td>
                            <td>{formatDate(price.effectiveFrom)}</td>
                            <td>{formatDate(price.effectiveTo) || 'Không giới hạn'}</td>
                            <td>
                              <span className={`service-catalog-status-badge ${price.isCurrentlyEffective ? 'active' : 'inactive'}`}>
                                {price.isCurrentlyEffective ? 'Đang hiệu lực' : 'Hết hiệu lực'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {catalogPricesTotalPages > 1 && (
                <div className="service-catalog-pagination">
                  <button
                    disabled={catalogPricesPage === 0}
                    onClick={() => fetchCatalogPrices(catalogPricesPage - 1)}
                  >
                    Trước
                  </button>
                  <span>
                    Trang {catalogPricesPage + 1} / {catalogPricesTotalPages}
                  </span>
                  <button
                    disabled={catalogPricesPage >= catalogPricesTotalPages - 1}
                    onClick={() => fetchCatalogPrices(catalogPricesPage + 1)}
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Estimate Calculator Tab */}
      {activeTab === 'estimate' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="service-catalog-content-box"
        >
          <div className="estimate-section">
            <h3>Tính toán ước tính dịch vụ</h3>
            
            <div className="service-catalog-filters-section">
              <div className="service-catalog-filter-group">
                <label>Khu vực:</label>
                <div className="service-catalog-dropdown-container" ref={estimateRegionRef}>
                  <button
                    type="button"
                    onClick={() => { closeAllDropdowns(); setShowEstimateRegionDropdown(!showEstimateRegionDropdown); }}
                    className="service-catalog-filter-input service-catalog-dropdown-button"
                  >
                    <span>{estimateData.region || 'Chọn khu vực (tùy chọn)...'}</span>
                    <span className="service-catalog-dropdown-arrow">▼</span>
                  </button>
                  {showEstimateRegionDropdown && (
                    <div className="service-catalog-filter-dropdown-results">
                      <div
                        className="service-catalog-dropdown-result-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setEstimateData({ ...estimateData, region: '' });
                          setShowEstimateRegionDropdown(false);
                        }}
                      >
                        <p><strong>Chọn khu vực (tùy chọn)...</strong></p>
                      </div>
                      <div
                        className="service-catalog-dropdown-result-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setEstimateData({ ...estimateData, region: 'NORTH' });
                          setShowEstimateRegionDropdown(false);
                        }}
                      >
                        <p><strong>NORTH</strong></p>
                      </div>
                      <div
                        className="service-catalog-dropdown-result-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setEstimateData({ ...estimateData, region: 'CENTRAL' });
                          setShowEstimateRegionDropdown(false);
                        }}
                      >
                        <p><strong>CENTRAL</strong></p>
                      </div>
                      <div
                        className="service-catalog-dropdown-result-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setEstimateData({ ...estimateData, region: 'SOUTH' });
                          setShowEstimateRegionDropdown(false);
                        }}
                      >
                        <p><strong>SOUTH</strong></p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="service-catalog-filter-group">
                <label>ID Trung tâm dịch vụ:</label>
                <div className="service-catalog-dropdown-container" ref={estimateServiceCenterRef}>
                  <input
                    type="text"
                    placeholder="Nhập ID hoặc tìm kiếm (tùy chọn)..."
                    value={estimateServiceCenterSearchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setEstimateServiceCenterSearchQuery(query);
                      // If it's a number, update the estimate data directly
                      if (/^\d+$/.test(query)) {
                        setEstimateData({ ...estimateData, serviceCenterId: query });
                      } else if (query === '') {
                        setEstimateData({ ...estimateData, serviceCenterId: '' });
                      }
                      setShowEstimateServiceCenterDropdown(true);
                    }}
                    onFocus={() => setShowEstimateServiceCenterDropdown(true)}
                    className="service-catalog-filter-input"
                  />
                  {showEstimateServiceCenterDropdown && serviceCenters.length > 0 && (
                    <div className="service-catalog-filter-dropdown-results">
                      {(estimateServiceCenterSearchQuery ? filteredEstimateServiceCenters : serviceCenters.slice(0, 10))
                        .map((sc) => (
                          <div
                            key={sc.id}
                            className="service-catalog-dropdown-result-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setEstimateServiceCenterSearchQuery(sc.name || `ID: ${sc.id}`);
                              setEstimateData({ ...estimateData, serviceCenterId: String(sc.id) });
                              setShowEstimateServiceCenterDropdown(false);
                            }}
                          >
                            <p><strong>{sc.name || `Service Center ${sc.id}`}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>(ID: {sc.id})</span></p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Parts Section */}
            <div className="estimate-items-section">
              <h4>Phụ tùng</h4>
              <div className="add-item-form">
                {availableParts.length > 0 ? (
                  <div className="service-catalog-dropdown-container" style={{ flex: 2 }} ref={partsRef}>
                    <button
                      type="button"
                      onClick={() => { closeAllDropdowns(); setShowPartsDropdown(!showPartsDropdown); }}
                      className="item-select service-catalog-dropdown-button"
                    >
                      <span>
                        {newPartItem.itemId && newPartItem.itemId !== ''
                          ? (() => {
                              const part = availableParts.find(p => p.id === parseInt(newPartItem.itemId) || p.id === newPartItem.itemId);
                              return part ? `${part.partNumber} - ${part.name}` : 'Chọn phụ tùng...';
                            })()
                          : 'Chọn phụ tùng...'}
                      </span>
                      <span className="service-catalog-dropdown-arrow">▼</span>
                    </button>
                    {showPartsDropdown && (
                      <div className="service-catalog-parts-dropdown-results">
                        <div
                          className="service-catalog-dropdown-result-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setNewPartItem({ ...newPartItem, itemId: '' });
                            setShowPartsDropdown(false);
                          }}
                        >
                          <p><strong>Chọn phụ tùng...</strong></p>
                        </div>
                        {availableParts.map((part) => (
                          <div
                            key={part.id}
                            className="service-catalog-dropdown-result-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewPartItem({ ...newPartItem, itemId: part.id });
                              setShowPartsDropdown(false);
                            }}
                          >
                            <p><strong>{part.partNumber} - {part.name}</strong></p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="number"
                    placeholder="Nhập ID phụ tùng..."
                    value={newPartItem.itemId}
                    onChange={(e) => setNewPartItem({ ...newPartItem, itemId: e.target.value })}
                    className="item-select"
                  />
                )}
                <input
                  type="number"
                  min="1"
                  placeholder="Số lượng"
                  value={newPartItem.quantity}
                  onChange={(e) => setNewPartItem({ ...newPartItem, quantity: parseInt(e.target.value) || 1 })}
                  className="quantity-input"
                />
                <button className="add-button" onClick={addPartItem}>
                  Thêm
                </button>
              </div>
              {estimateData.partItems.length > 0 && (
                <div className="items-list">
                  {estimateData.partItems.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item.itemCode} - {item.itemName}</span>
                      <span>Số lượng: {item.quantity}</span>
                      <button className="remove-button" onClick={() => removePartItem(index)}>
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Services Section */}
            <div className="estimate-items-section">
              <h4>Dịch vụ</h4>
              <div className="add-item-form">
                <div className="service-catalog-dropdown-container" style={{ flex: 2 }} ref={servicesRef}>
                  <button
                    type="button"
                    onClick={() => { closeAllDropdowns(); setShowServicesDropdown(!showServicesDropdown); }}
                    className="item-select service-catalog-dropdown-button"
                  >
                    <span>
                      {newServiceItem.itemId && newServiceItem.itemId !== ''
                        ? (() => {
                            const service = availableServices.find(s => s.id === parseInt(newServiceItem.itemId) || s.id === newServiceItem.itemId);
                            return service ? `${service.serviceCode} - ${service.name}` : 'Chọn dịch vụ...';
                          })()
                        : 'Chọn dịch vụ...'}
                    </span>
                    <span className="service-catalog-dropdown-arrow">▼</span>
                  </button>
                  {showServicesDropdown && (
                    <div className="service-catalog-dropdown-results">
                      <div
                        className="service-catalog-dropdown-result-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewServiceItem({ ...newServiceItem, itemId: '' });
                          setShowServicesDropdown(false);
                        }}
                      >
                        <p><strong>Chọn dịch vụ...</strong></p>
                      </div>
                      {availableServices.map((service) => (
                        <div
                          key={service.id}
                          className="service-catalog-dropdown-result-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setNewServiceItem({ ...newServiceItem, itemId: service.id });
                            setShowServicesDropdown(false);
                          }}
                        >
                          <p><strong>{service.serviceCode} - {service.name}</strong></p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder="Số lượng"
                  value={newServiceItem.quantity}
                  onChange={(e) => setNewServiceItem({ ...newServiceItem, quantity: parseInt(e.target.value) || 1 })}
                  className="quantity-input"
                />
                <button className="add-button" onClick={addServiceItem}>
                  Thêm
                </button>
              </div>
              {estimateData.serviceItems.length > 0 && (
                <div className="items-list">
                  {estimateData.serviceItems.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item.itemCode} - {item.itemName}</span>
                      <span>Số lượng: {item.quantity}</span>
                      <button className="remove-button" onClick={() => removeServiceItem(index)}>
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="calculate-button"
              onClick={calculateEstimate}
              disabled={estimateLoading || (estimateData.partItems.length === 0 && estimateData.serviceItems.length === 0)}
            >
              {estimateLoading ? <FaSpinner className="service-catalog-spinner" /> : null}
              Tính toán ước tính
            </button>

            {/* Estimate Result */}
            {estimateResult && (
              <div className="estimate-result">
                <h4>Kết quả ước tính</h4>
                <div className="result-breakdown">
                  {estimateResult.partItems && estimateResult.partItems.length > 0 && (
                    <div className="result-section">
                      <h5>Phụ tùng:</h5>
                      <table className="result-table">
                        <thead>
                          <tr>
                            <th>Mã</th>
                            <th>Tên</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estimateResult.partItems.map((item, index) => (
                            <tr key={index}>
                              <td>{item.itemCode}</td>
                              <td>{item.itemName}</td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.unitPrice, estimateResult.currency)}</td>
                              <td>{formatCurrency(item.totalPrice, estimateResult.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="result-total">
                        Tổng phụ tùng: {formatCurrency(estimateResult.totalPartsAmount, estimateResult.currency)}
                      </div>
                    </div>
                  )}

                  {estimateResult.serviceItems && estimateResult.serviceItems.length > 0 && (
                    <div className="result-section">
                      <h5>Dịch vụ:</h5>
                      <table className="result-table">
                        <thead>
                          <tr>
                            <th>Mã</th>
                            <th>Tên</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estimateResult.serviceItems.map((item, index) => (
                            <tr key={index}>
                              <td>{item.itemCode}</td>
                              <td>{item.itemName}</td>
                              <td>{item.quantity}</td>
                              <td>{formatCurrency(item.unitPrice, estimateResult.currency)}</td>
                              <td>{formatCurrency(item.totalPrice, estimateResult.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="result-total">
                        Tổng lao động: {formatCurrency(estimateResult.totalLaborAmount, estimateResult.currency)}
                      </div>
                      {estimateResult.estimatedLaborHours && (
                        <div className="result-total">
                          Tổng giờ lao động: {estimateResult.estimatedLaborHours} giờ
                        </div>
                      )}
                    </div>
                  )}

                  <div className="result-grand-total">
                    <strong>Tổng cộng: {formatCurrency(estimateResult.totalAmount, estimateResult.currency)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Admin Management Tab */}
      {activeTab === 'manage' && userRole === 'ADMIN' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="service-catalog-content-box"
        >
          <div className="service-management-form">
            <h3>{editingService ? 'Chỉnh sửa Dịch vụ' : 'Tạo Dịch vụ Mới'}</h3>
            
            <form onSubmit={editingService ? updateService : createService}>
              {/* Service Details Section */}
              <div className="service-form-section">
                <h4>Thông tin Dịch vụ</h4>
                
                <div className="service-form-grid">
                  <div className="service-form-group">
                    <label>Mã dịch vụ *</label>
                    <input
                      type="text"
                      value={formData.serviceCode}
                      onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
                      className="service-catalog-filter-input"
                      required={!editingService}
                      disabled={!!editingService}
                      placeholder="VD: SVC-001"
                    />
                  </div>

                  <div className="service-form-group">
                    <label>Tên dịch vụ *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="service-catalog-filter-input"
                      required
                      placeholder="VD: Battery Diagnostic"
                    />
                  </div>

                  <div className="service-form-group">
                    <label>Danh mục</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="service-catalog-filter-input"
                      placeholder="VD: Diagnostic, Repair, Maintenance"
                    />
                  </div>

                  <div className="service-form-group">
                    <label>Giờ lao động chuẩn *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.standardLaborHours}
                      onChange={(e) => setFormData({ ...formData, standardLaborHours: e.target.value })}
                      className="service-catalog-filter-input"
                      required
                      placeholder="VD: 2.0"
                    />
                  </div>

                  <div className="service-form-group service-form-group-full">
                    <label>Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="service-catalog-filter-input"
                      rows="3"
                      placeholder="Mô tả chi tiết về dịch vụ..."
                    />
                  </div>

                  <div className="service-form-group">
                    <label>Trạng thái</label>
                    <div className="service-catalog-dropdown-container" ref={statusRef}>
                      <button
                        type="button"
                        onClick={() => { closeAllDropdowns(); setShowStatusDropdown(!showStatusDropdown); }}
                        className="service-catalog-filter-input service-catalog-dropdown-button"
                      >
                        <span>{formData.active ? 'Hoạt động' : 'Không hoạt động'}</span>
                        <span className="service-catalog-dropdown-arrow">▼</span>
                      </button>
                      {showStatusDropdown && (
                        <div className="service-catalog-dropdown-results">
                          <div
                            className="service-catalog-dropdown-result-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, active: true });
                              setShowStatusDropdown(false);
                            }}
                          >
                            <p><strong>Hoạt động</strong></p>
                          </div>
                          <div
                            className="service-catalog-dropdown-result-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, active: false });
                              setShowStatusDropdown(false);
                            }}
                          >
                            <p><strong>Không hoạt động</strong></p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Regional Prices Section */}
              <div className="service-form-section">
                <h4>Giá theo Khu vực *</h4>
                <p className="service-form-note">Vui lòng nhập giá cho cả 3 khu vực</p>
                
                <div className="service-form-grid">
                  <div className="service-form-group">
                    <label>Giá khu vực Bắc (NORTH) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceNorth}
                      onChange={(e) => setFormData({ ...formData, priceNorth: e.target.value })}
                      className="service-catalog-filter-input"
                      required={!editingService}
                      placeholder="Nhập giá"
                    />
                  </div>

                  <div className="service-form-group">
                    <label>Giá khu vực Nam (SOUTH) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceSouth}
                      onChange={(e) => setFormData({ ...formData, priceSouth: e.target.value })}
                      className="service-catalog-filter-input"
                      required={!editingService}
                      placeholder="Nhập giá"
                    />
                  </div>

                  <div className="service-form-group">
                    <label>Giá khu vực Trung (CENTRAL) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceCentral}
                      onChange={(e) => setFormData({ ...formData, priceCentral: e.target.value })}
                      className="service-catalog-filter-input"
                      required={!editingService}
                      placeholder="Nhập giá"
                    />
                  </div>

                  <div className="service-form-group">
                    <label>Tiền tệ</label>
                    <div className="service-catalog-dropdown-container" ref={currencyRef}>
                      <button
                        type="button"
                        onClick={() => { closeAllDropdowns(); setShowCurrencyDropdown(!showCurrencyDropdown); }}
                        className="service-catalog-filter-input service-catalog-dropdown-button"
                      >
                        <span>{formData.currency}</span>
                        <span className="service-catalog-dropdown-arrow">▼</span>
                      </button>
                      {showCurrencyDropdown && (
                        <div className="service-catalog-dropdown-results">
                          <div
                            className="service-catalog-dropdown-result-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, currency: 'VND' });
                              setShowCurrencyDropdown(false);
                            }}
                          >
                            <p><strong>VND</strong></p>
                          </div>
                          <div
                            className="service-catalog-dropdown-result-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, currency: 'USD' });
                              setShowCurrencyDropdown(false);
                            }}
                          >
                            <p><strong>USD</strong></p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="service-form-actions">
                <button
                  type="button"
                  className="service-form-button-cancel"
                  onClick={() => {
                    resetForm();
                    setActiveTab('services');
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="service-form-button-submit"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <FaSpinner className="service-catalog-spinner" /> Đang xử lý...
                    </>
                  ) : (
                    editingService ? 'Cập nhật' : 'Tạo mới'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default ServiceCatalogManagementPage;

