import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSort, FaSortUp, FaSortDown, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaUser, FaCheckCircle, FaTimes, FaArrowLeft } from 'react-icons/fa';
import RequiredIndicator from '../../common/RequiredIndicator';
import { formatPhoneInput, isValidPhoneNumber, PHONE_PATTERN, PHONE_LENGTH, PHONE_ERROR_MESSAGE, isValidEmail, EMAIL_ERROR_MESSAGE } from '../../../utils/validation';
import './ServiceCenterManagementPage.css';

const ServiceCenterManagementPage = ({ handleBackClick }) => {
  const [serviceCenters, setServiceCenters] = useState([]);
  const [filteredCenters, setFilteredCenters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null); // null, 'NORTH', 'CENTRAL', 'SOUTH'
  const [selectedStatus, setSelectedStatus] = useState(null); // null, true (active), false (inactive)
  const [displayedCenters, setDisplayedCenters] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'detail', 'deactivate', or 'add'
  const [selectedCenterId, setSelectedCenterId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    region: '',
    parentServiceCenterId: null,
    isMainBranch: false,
    capacity: '',
    notes: ''
  });
  const [availableServiceCenters, setAvailableServiceCenters] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    }
    fetchServiceCenters();
  }, []);

  useEffect(() => {
    // Apply filtering to get displayed centers
    let centers = [...serviceCenters];
    
    // Filter by region
    if (selectedRegion) {
      centers = centers.filter(center => center.region === selectedRegion);
    }
    
    // Filter by status
    if (selectedStatus !== null) {
      centers = centers.filter(center => center.active === selectedStatus);
    }
    
    setDisplayedCenters(centers);
  }, [serviceCenters, selectedRegion, selectedStatus]);

  useEffect(() => {
    // Then apply search to displayed centers
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = displayedCenters.filter(center =>
        center.code?.toLowerCase().includes(query) ||
        center.name?.toLowerCase().includes(query) ||
        center.location?.toLowerCase().includes(query) ||
        center.region?.toLowerCase().includes(query)
      );
      setFilteredCenters(filtered);
    } else {
      setFilteredCenters(displayedCenters);
    }
  }, [displayedCenters, searchQuery]);

  const fetchServiceCenters = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-centers`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setServiceCenters(response.data);
      }
    } catch (error) {
      console.error('Error fetching service centers:', error);
      toast.error('Không thể tải danh sách trung tâm dịch vụ', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServiceCenters = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-centers/active`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setAvailableServiceCenters(response.data);
      }
    } catch (error) {
      console.error('Error fetching available service centers:', error);
    }
  };


  const handleRegionFilter = (region) => {
    if (selectedRegion === region) {
      setSelectedRegion(null); // Toggle off if already selected
    } else {
      setSelectedRegion(region);
    }
  };

  const handleStatusFilter = (status) => {
    if (selectedStatus === status) {
      setSelectedStatus(null); // Toggle off if already selected
    } else {
      setSelectedStatus(status);
    }
  };

  const clearFilters = () => {
    setSelectedRegion(null);
    setSelectedStatus(null);
  };

  const handleAddClick = () => {
    setFormData({
      code: '',
      name: '',
      location: '',
      address: '',
      phone: '',
      email: '',
      managerName: '',
      region: '',
      parentServiceCenterId: null,
      isMainBranch: false,
      capacity: '',
      notes: ''
    });
    fetchAvailableServiceCenters();
    setViewMode('add');
  };

  const handleEditClick = (center) => {
    setSelectedCenter(center);
    setFormData({
      code: center.code,
      name: center.name,
      location: center.location || '',
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      managerName: center.managerName || '',
      region: center.region || '',
      parentServiceCenterId: center.parentServiceCenterId || null,
      isMainBranch: center.isMainBranch || false,
      capacity: center.capacity || '',
      notes: center.notes || ''
    });
    fetchAvailableServiceCenters();
    setShowEditForm(true);
  };

  const handleEditFromDetail = (center) => {
    // Set edit mode in detail view instead of opening modal
    setSelectedCenter(center);
    setFormData({
      code: center.code,
      name: center.name,
      location: center.location || '',
      address: center.address || '',
      phone: center.phone || '',
      email: center.email || '',
      managerName: center.managerName || '',
      region: center.region || '',
      parentServiceCenterId: center.parentServiceCenterId || null,
      isMainBranch: center.isMainBranch || false,
      capacity: center.capacity || '',
      notes: center.notes || ''
    });
    fetchAvailableServiceCenters();
  };


  const handleDeactivateFromDetail = (center) => {
    setSelectedCenter(center);
    setSelectedCenterId(center.id);
    setViewMode('deactivate');
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = name === 'phone' ? formatPhoneInput(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'parentServiceCenterId' || name === 'capacity' ? (value ? parseInt(value) : null) : nextValue)
    }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast.error(PHONE_ERROR_MESSAGE, { position: 'top-right' });
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      toast.error(EMAIL_ERROR_MESSAGE, { position: 'top-right' });
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        parentServiceCenterId: formData.parentServiceCenterId || null
      };
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/service-centers`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 201) {
        toast.success('Đã tạo trung tâm dịch vụ thành công!', { position: 'top-right' });
        setViewMode('list');
        fetchServiceCenters();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi tạo trung tâm dịch vụ.';
      toast.error(errorMessage, { position: 'top-right' });
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      toast.error(PHONE_ERROR_MESSAGE, { position: 'top-right' });
      return;
    }
    if (formData.email && !isValidEmail(formData.email)) {
      toast.error(EMAIL_ERROR_MESSAGE, { position: 'top-right' });
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        parentServiceCenterId: formData.parentServiceCenterId || null
      };
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/service-centers/${selectedCenter.id}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        toast.success('Đã cập nhật trung tâm dịch vụ thành công!', { position: 'top-right' });
        setShowEditForm(false);
        setSelectedCenter(null);
        await fetchServiceCenters();
        // Refresh detail view if we're viewing that center
        if (viewMode === 'detail' && selectedCenterId === selectedCenter.id) {
          // Detail view will refresh automatically when serviceCenters updates
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi cập nhật trung tâm dịch vụ.';
      toast.error(errorMessage, { position: 'top-right' });
    }
  };



  const handleViewDetails = (center) => {
    setSelectedCenterId(center.id);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCenterId(null);
    setSelectedCenter(null);
  };

  const handleBackToDetail = () => {
    setViewMode('detail');
    setSelectedCenter(null);
  };

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="service-center-page-wrapper">
      <div className="service-center-page-header">
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h1 className="page-title">Quản lý Trung tâm Dịch vụ</h1>
        <div className="function-nav-bar">
          {isAdmin && (
            <button onClick={handleAddClick} className="add-button">
              <FaPlus /> Thêm Trung tâm Mới
            </button>
          )}
        </div>
        {viewMode === 'list' && (
          <div className="scm-controls">
            <div className="scm-controls-left">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo mã, tên, địa điểm, khu vực..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="scm-controls-right">
              <div className="filter-buttons-group">
                <div className="filter-group">
                  <span className="filter-label">Khu vực:</span>
                  <button
                    onClick={() => handleRegionFilter('NORTH')}
                    className={`filter-button ${selectedRegion === 'NORTH' ? 'active' : ''}`}
                  >
                    Bắc
                  </button>
                  <button
                    onClick={() => handleRegionFilter('CENTRAL')}
                    className={`filter-button ${selectedRegion === 'CENTRAL' ? 'active' : ''}`}
                  >
                    Trung
                  </button>
                  <button
                    onClick={() => handleRegionFilter('SOUTH')}
                    className={`filter-button ${selectedRegion === 'SOUTH' ? 'active' : ''}`}
                  >
                    Nam
                  </button>
                </div>
                <div className="filter-group">
                  <span className="filter-label">Trạng thái:</span>
                  <button
                    onClick={() => handleStatusFilter(true)}
                    className={`filter-button ${selectedStatus === true ? 'active' : ''}`}
                  >
                    Hoạt động
                  </button>
                  <button
                    onClick={() => handleStatusFilter(false)}
                    className={`filter-button ${selectedStatus === false ? 'active' : ''}`}
                  >
                    Không hoạt động
                  </button>
                </div>
                {(selectedRegion || selectedStatus !== null) && (
                  <button
                    onClick={clearFilters}
                    className="filter-button clear-filter"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="service-center-page-content-area">
        {viewMode === 'list' ? (
          <>
            {loading ? (
              <div className="loading-message">Đang tải danh sách trung tâm dịch vụ...</div>
            ) : filteredCenters.length === 0 ? (
              <div className="loading-message">
                {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
              </div>
            ) : (
              <motion.div
                className="service-center-table-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="service-center-table-wrapper">
                  <table className="service-center-table">
                    <thead>
                      <tr>
                        <th>Mã</th>
                        <th>Tên</th>
                        <th>Khu vực</th>
                        <th>Địa điểm</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCenters.map((center) => (
                        <tr
                          key={center.id}
                          onClick={() => handleViewDetails(center)}
                          className={`service-center-row ${!center.active ? 'inactive-row' : ''} ${center.isMainBranch ? 'main-center-row' : ''}`}
                        >
                          <td>
                            <div className="code-cell">
                              {center.code}
                              {center.isMainBranch && (
                                <span className="main-center-badge">Trung tâm chính</span>
                              )}
                            </div>
                          </td>
                          <td>{center.name}</td>
                          <td>{center.region || 'N/A'}</td>
                          <td>{center.location || 'N/A'}</td>
                          <td>
                            <span className={`status-badge ${center.active ? 'active' : 'inactive'}`}>
                              {center.active ? 'Hoạt động' : 'Vô hiệu hóa'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </>
        ) : viewMode === 'detail' ? (
          <ServiceCenterDetailPage
            centerId={selectedCenterId}
            serviceCenters={serviceCenters}
            onBack={handleBackToList}
            onEdit={handleEditFromDetail}
            onDeactivate={handleDeactivateFromDetail}
            isAdmin={isAdmin}
            fetchServiceCenters={fetchServiceCenters}
          />
        ) : viewMode === 'deactivate' ? (
          <ServiceCenterDeactivatePage
            centerId={selectedCenterId}
            serviceCenters={serviceCenters}
            onBack={handleBackToDetail}
            onDeactivate={() => {}}
            isAdmin={isAdmin}
            fetchServiceCenters={fetchServiceCenters}
            onDeactivateComplete={() => {
              handleBackToList();
            }}
          />
        ) : (
          <ServiceCenterAddPage
            formData={formData}
            handleFormChange={handleFormChange}
            handleSubmitAdd={handleSubmitAdd}
            availableServiceCenters={availableServiceCenters}
            onBack={handleBackToList}
          />
        )}
      </div>


      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Chỉnh sửa Trung tâm Dịch vụ</h2>
              <button onClick={() => setShowEditForm(false)} className="close-button">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="scm-form">
              <div className="form-row">
              <div className="form-group">
                <label className="required-label">
                  Mã trung tâm
                  <RequiredIndicator />
                </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="required-label">
                    Khu vực
                    <RequiredIndicator />
                  </label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Chọn khu vực --</option>
                    <option value="NORTH">Bắc</option>
                    <option value="SOUTH">Nam</option>
                    <option value="CENTRAL">Trung</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="required-label">
                  Tên trung tâm
                  <RequiredIndicator />
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Địa điểm</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  rows="3"
                />
              </div>
              <div className="form-row">
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  inputMode="numeric"
                  maxLength={PHONE_LENGTH}
                  pattern={PHONE_PATTERN}
                  title={PHONE_ERROR_MESSAGE}
                />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    title={EMAIL_ERROR_MESSAGE}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Tên quản lý</label>
                <input
                  type="text"
                  name="managerName"
                  value={formData.managerName}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Trung tâm cha (nếu là chi nhánh)</label>
                  <select
                    name="parentServiceCenterId"
                    value={formData.parentServiceCenterId || ''}
                    onChange={handleFormChange}
                  >
                    <option value="">-- Không có (Trung tâm chính) --</option>
                    {availableServiceCenters
                      .filter(sc => sc.id !== selectedCenter?.id)
                      .map(sc => (
                        <option key={sc.id} value={sc.id}>
                          {sc.code} - {sc.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sức chứa (xe/ngày)</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isMainBranch"
                    checked={formData.isMainBranch}
                    onChange={handleFormChange}
                    disabled={formData.parentServiceCenterId}
                  />
                  Trung tâm chính
                </label>
                {formData.parentServiceCenterId && (
                  <small className="form-hint">
                    Chi nhánh không thể là trung tâm chính
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Ghi chú</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditForm(false)} className="cancel-button">
                  Hủy
                </button>
                <button type="submit" className="submit-button">
                  Cập nhật
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
};

// Service Center Detail Page Component
const ServiceCenterDetailPage = ({ centerId, serviceCenters, onBack, onEdit, onDeactivate, isAdmin, fetchServiceCenters }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    managerName: '',
    region: '',
    parentServiceCenterId: null,
    isMainBranch: false,
    capacity: '',
    notes: ''
  });
  const [availableServiceCenters, setAvailableServiceCenters] = useState([]);
  const [saving, setSaving] = useState(false);

  const center = serviceCenters.find(sc => sc.id === centerId);

  useEffect(() => {
    if (center && !isEditMode) {
      // Reset form data when center changes or exiting edit mode
      setFormData({
        code: center.code,
        name: center.name,
        location: center.location || '',
        address: center.address || '',
        phone: center.phone || '',
        email: center.email || '',
        managerName: center.managerName || '',
        region: center.region || '',
        parentServiceCenterId: center.parentServiceCenterId || null,
        isMainBranch: center.isMainBranch || false,
        capacity: center.capacity || '',
        notes: center.notes || ''
      });
    }
  }, [center, isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      fetchAvailableServiceCenters();
    }
  }, [isEditMode]);

  const fetchAvailableServiceCenters = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-centers/active`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        setAvailableServiceCenters(response.data);
      }
    } catch (error) {
      console.error('Error fetching available service centers:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = name === 'phone' ? formatPhoneInput(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'parentServiceCenterId' || name === 'capacity' ? (value ? parseInt(value) : null) : nextValue)
    }));
  };

  const handleSave = async () => {
    // Validate: If this was a sub-center (had a parent), and parent is removed, must select a new one
    if (center && center.parentServiceCenterId && !formData.parentServiceCenterId) {
      toast.error('Vui lòng chọn trung tâm cha mới trước khi lưu. Không thể để chi nhánh không có trung tâm cha.', { position: 'top-right' });
      return;
    }

    // Validate: If changing parent, ensure the new parent is different
    if (center && center.parentServiceCenterId && formData.parentServiceCenterId === center.parentServiceCenterId) {
      // Same parent, no change needed - allow save
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        parentServiceCenterId: formData.parentServiceCenterId || null
      };
      
      // If parent is being changed, show a confirmation message
      if (center && center.parentServiceCenterId && formData.parentServiceCenterId && formData.parentServiceCenterId !== center.parentServiceCenterId) {
        const oldParent = availableServiceCenters.find(sc => sc.id === center.parentServiceCenterId);
        const newParent = availableServiceCenters.find(sc => sc.id === formData.parentServiceCenterId);
        if (oldParent && newParent) {
          toast.info(`Đang chuyển từ ${oldParent.code} sang ${newParent.code}...`, { position: 'top-right' });
        }
      }
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/service-centers/${centerId}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        toast.success('Đã cập nhật trung tâm dịch vụ thành công!', { position: 'top-right' });
        setIsEditMode(false);
        await fetchServiceCenters();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi cập nhật trung tâm dịch vụ.';
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    // Reset form data to original center data
    if (center) {
      setFormData({
        code: center.code,
        name: center.name,
        location: center.location || '',
        address: center.address || '',
        phone: center.phone || '',
        email: center.email || '',
        managerName: center.managerName || '',
        region: center.region || '',
        parentServiceCenterId: center.parentServiceCenterId || null,
        isMainBranch: center.isMainBranch || false,
        capacity: center.capacity || '',
        notes: center.notes || ''
      });
    }
  };

  if (!center) {
    return (
      <div className="loading-message">Không tìm thấy trung tâm dịch vụ</div>
    );
  }

  return (
    <motion.div
      className="service-center-detail-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button onClick={onBack} className="back-to-list-button">
        <FaArrowLeft /> Quay lại danh sách
      </button>

      <div className="service-center-detail-header">
        <div>
          {isEditMode ? (
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="detail-title-input"
              placeholder="Tên trung tâm"
            />
          ) : (
            <h2 className="detail-title">{center.name}</h2>
          )}
          {isEditMode ? (
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleFormChange}
              className="detail-code-input"
              placeholder="Mã trung tâm"
            />
          ) : (
            <p className="detail-code">Mã: {center.code}</p>
          )}
        </div>
        {isAdmin && (
          <div className="detail-actions">
            {isEditMode ? (
              <>
                <button onClick={handleSave} className="save-detail-button" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button onClick={handleCancel} className="cancel-detail-button" disabled={saving}>
                  Hủy
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setIsEditMode(true)} className="edit-detail-button">
                  <FaEdit /> Chỉnh sửa
                </button>
                {center.active && (
                  <button onClick={() => onDeactivate(center)} className="deactivate-detail-button">
                    <FaTrash /> Vô hiệu hóa
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="service-center-detail-content">
        <div className="detail-section">
          <h3 className="detail-section-title">Thông tin cơ bản</h3>
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-label">Khu vực:</span>
              {isEditMode ? (
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleFormChange}
                  className="detail-input"
                >
                  <option value="">-- Chọn khu vực --</option>
                  <option value="NORTH">Bắc</option>
                  <option value="SOUTH">Nam</option>
                  <option value="CENTRAL">Trung</option>
                </select>
              ) : (
                <span className="detail-value">{center.region || 'N/A'}</span>
              )}
            </div>
            <div className="detail-info-item">
              <span className="detail-label">Địa điểm:</span>
              {isEditMode ? (
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  className="detail-input"
                />
              ) : (
                <span className="detail-value">{center.location || 'N/A'}</span>
              )}
            </div>
            <div className="detail-info-item detail-info-item-full">
              <span className="detail-label">Địa chỉ:</span>
              {isEditMode ? (
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="detail-input detail-textarea"
                  rows="3"
                />
              ) : (
                <span className="detail-value">{center.address || 'N/A'}</span>
              )}
            </div>
            <div className="detail-info-item">
              <span className="detail-label">Loại:</span>
              {isEditMode ? (
                <div className="detail-checkbox-group">
                  <label className="detail-checkbox-label">
                    <input
                      type="checkbox"
                      name="isMainBranch"
                      checked={formData.isMainBranch}
                      onChange={handleFormChange}
                      disabled={formData.parentServiceCenterId}
                    />
                    Trung tâm chính
                  </label>
                  {formData.parentServiceCenterId && (
                    <small className="detail-hint">Chi nhánh không thể là trung tâm chính</small>
                  )}
                </div>
              ) : (
                <span className="detail-value">
                  {center.isMainBranch ? 'Trung tâm chính' : 'Chi nhánh'}
                </span>
              )}
            </div>
            {isEditMode ? (
              <div className="detail-info-item">
                <span className="detail-label">Trung tâm cha:</span>
                <div className="parent-center-controls">
                  {center.parentServiceCenterId && (
                    <div className="current-parent-info">
                      <span>Hiện tại: <strong>{center.parentServiceCenterCode}</strong> - {center.parentServiceCenterName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, parentServiceCenterId: null }));
                        }}
                        className="remove-parent-button"
                      >
                        Xóa liên kết
                      </button>
                    </div>
                  )}
                  {center.parentServiceCenterId && !formData.parentServiceCenterId && (
                    <div className="parent-required-warning">
                      <small>⚠️ Bạn cần chọn trung tâm cha mới trước khi lưu</small>
                    </div>
                  )}
                  <select
                    name="parentServiceCenterId"
                    value={formData.parentServiceCenterId || ''}
                    onChange={handleFormChange}
                    className="detail-input"
                    required={center.parentServiceCenterId && !formData.parentServiceCenterId}
                  >
                    <option value="">
                      {center.parentServiceCenterId 
                        ? `-- Chọn trung tâm cha mới (hiện tại: ${center.parentServiceCenterCode}) --`
                        : '-- Không có (Trung tâm chính) --'}
                    </option>
                    {availableServiceCenters
                      .filter(sc => sc.id !== centerId && sc.active && sc.isMainBranch)
                      .map(sc => (
                        <option key={sc.id} value={sc.id}>
                          {sc.code} - {sc.name}
                        </option>
                      ))}
                  </select>
                  {!center.parentServiceCenterId && formData.parentServiceCenterId && (
                    <small className="detail-hint">
                      Chi nhánh này sẽ được chuyển sang trung tâm cha mới
                    </small>
                  )}
                </div>
              </div>
            ) : center.parentServiceCenterName && (
              <div className="detail-info-item">
                <span className="detail-label">Trung tâm cha:</span>
                <span className="detail-value">
                  {center.parentServiceCenterCode} - {center.parentServiceCenterName}
                </span>
              </div>
            )}
            <div className="detail-info-item">
              <span className="detail-label">Sức chứa:</span>
              {isEditMode ? (
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  className="detail-input"
                  min="0"
                />
              ) : (
                <span className="detail-value">{center.capacity ? `${center.capacity} xe/ngày` : 'N/A'}</span>
              )}
            </div>
            <div className="detail-info-item">
              <span className="detail-label">Trạng thái:</span>
              <span className="detail-value">{center.active ? 'Hoạt động' : 'Vô hiệu hóa'}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">Thông tin liên hệ</h3>
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="detail-label">Số điện thoại:</span>
              {isEditMode ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="detail-input"
                  inputMode="numeric"
                  maxLength={PHONE_LENGTH}
                  pattern={PHONE_PATTERN}
                  title={PHONE_ERROR_MESSAGE}
                />
              ) : (
                <span className="detail-value">{center.phone || 'N/A'}</span>
              )}
            </div>
            <div className="detail-info-item">
              <span className="detail-label">Email:</span>
              {isEditMode ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="detail-input"
                  title={EMAIL_ERROR_MESSAGE}
                />
              ) : (
                <span className="detail-value">{center.email || 'N/A'}</span>
              )}
            </div>
            <div className="detail-info-item">
              <span className="detail-label">Quản lý:</span>
              {isEditMode ? (
                <input
                  type="text"
                  name="managerName"
                  value={formData.managerName}
                  onChange={handleFormChange}
                  className="detail-input"
                />
              ) : (
                <span className="detail-value">{center.managerName || 'N/A'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">Ghi chú</h3>
          {isEditMode ? (
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              className="detail-input detail-textarea"
              rows="4"
            />
          ) : (
            <p className="detail-notes">{center.notes || 'Không có ghi chú'}</p>
          )}
        </div>

        {center.branchCount > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title">Chi nhánh ({center.branchCount})</h3>
            {center.branches && center.branches.length > 0 && (
              <div className="branches-list">
                {center.branches.map(branch => (
                  <div key={branch.id} className="branch-item">
                    <span className="branch-code">{branch.code}</span>
                    <span className="branch-name">{branch.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Service Center Deactivate Page Component
const ServiceCenterDeactivatePage = ({ centerId, serviceCenters, onBack, onDeactivate, isAdmin, fetchServiceCenters, onDeactivateComplete }) => {
  const [center, setCenter] = useState(null);
  const [usersToReassign, setUsersToReassign] = useState([]);
  const [branchesToReassign, setBranchesToReassign] = useState([]);
  const [availableServiceCenters, setAvailableServiceCenters] = useState([]);
  const [reassignmentData, setReassignmentData] = useState({});
  const [branchReassignmentData, setBranchReassignmentData] = useState({});
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const currentCenter = serviceCenters.find(sc => sc.id === centerId);
    setCenter(currentCenter);
    if (currentCenter) {
      fetchUsersAndBranches(currentCenter.id);
      fetchAvailableServiceCenters();
    } else {
      setLoading(false);
    }
  }, [centerId, serviceCenters]);

  const fetchUsersAndBranches = async (serviceCenterId) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      
      // Get all users and filter by service center ID
      const usersResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/users`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (usersResponse.status === 200) {
        const users = usersResponse.data.filter(u => 
          u.serviceCenterId === serviceCenterId && 
          (u.role === 'SC_STAFF' || u.role === 'SC_TECHNICIAN') &&
          u.active
        );
        setUsersToReassign(users);
        
        // Initialize user reassignment data
        const initialReassignment = {};
        users.forEach(u => {
          initialReassignment[u.id] = { action: 'reassign', newServiceCenterId: null };
        });
        setReassignmentData(initialReassignment);
      }

      // Get branches of this service center
      const branches = serviceCenters.filter(sc => sc.parentServiceCenterId === serviceCenterId);
      setBranchesToReassign(branches);
      
      // Initialize branch reassignment data
      const initialBranchReassignment = {};
      branches.forEach(branch => {
        initialBranchReassignment[branch.id] = { newParentServiceCenterId: null };
      });
      setBranchReassignmentData(initialBranchReassignment);
    } catch (error) {
      console.error('Error fetching users and branches:', error);
      toast.error('Không thể tải dữ liệu', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServiceCenters = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/service-centers/active`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        // Exclude the current center and its branches from available centers
        const filtered = response.data.filter(sc => 
          sc.id !== centerId && 
          sc.parentServiceCenterId !== centerId
        );
        setAvailableServiceCenters(filtered);
      }
    } catch (error) {
      console.error('Error fetching available service centers:', error);
    }
  };

  const handleReassignmentChange = (userId, field, value) => {
    setReassignmentData(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: field === 'newServiceCenterId' ? (value ? parseInt(value) : null) : value
      }
    }));
  };

  const handleBranchReassignmentChange = (branchId, value) => {
    setBranchReassignmentData(prev => ({
      ...prev,
      [branchId]: {
        newParentServiceCenterId: value ? parseInt(value) : null
      }
    }));
  };

  const handleDeactivate = async () => {
    // Validate that all required reassignments are done
    if (center?.isMainBranch && branchesToReassign.length > 0) {
      const missingBranchReassignment = Object.keys(branchReassignmentData).some(
        branchId => !branchReassignmentData[branchId]?.newParentServiceCenterId
      );
      if (missingBranchReassignment) {
        toast.error('Vui lòng chọn trung tâm cha mới cho tất cả các chi nhánh', { position: 'top-right' });
        return;
      }
    }

    if (usersToReassign.length > 0) {
      const missingUserReassignment = Object.values(reassignmentData).some(
        r => r.action === 'reassign' && !r.newServiceCenterId
      );
      if (missingUserReassignment) {
        toast.error('Vui lòng hoàn tất việc xử lý tất cả người dùng', { position: 'top-right' });
        return;
      }
    }

    setDeactivating(true);
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;

      // First, handle branch reassignments if this is a main center
      if (center?.isMainBranch && branchesToReassign.length > 0) {
        for (const branchId of Object.keys(branchReassignmentData)) {
          const reassignment = branchReassignmentData[branchId];
          if (reassignment.newParentServiceCenterId) {
            const branchResponse = await axios.put(
              `${process.env.REACT_APP_API_URL}/api/service-centers/${branchId}`,
              {
                parentServiceCenterId: reassignment.newParentServiceCenterId
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );
            if (branchResponse.status === 200) {
              const branch = branchesToReassign.find(b => b.id === parseInt(branchId));
              toast.success(`Đã chuyển chi nhánh ${branch?.code} sang trung tâm mới`, { position: 'top-right' });
            }
          }
        }
      }

      // Then, handle user reassignments/deactivations
      for (const userId of Object.keys(reassignmentData)) {
        const reassignment = reassignmentData[userId];
        if (reassignment.action === 'reassign' && reassignment.newServiceCenterId) {
          const userResponse = await axios.put(
            `${process.env.REACT_APP_API_URL}/api/users/${userId}`,
            {
              serviceCenterId: reassignment.newServiceCenterId
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (userResponse.status === 200) {
            const user = usersToReassign.find(u => u.id === parseInt(userId));
            toast.success(`Đã chuyển người dùng ${user?.username} sang trung tâm mới`, { position: 'top-right' });
          }
        } else if (reassignment.action === 'deactivate') {
          const userResponse = await axios.put(
            `${process.env.REACT_APP_API_URL}/api/users/${userId}`,
            {
              active: false
            },
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (userResponse.status === 200) {
            const user = usersToReassign.find(u => u.id === parseInt(userId));
            toast.success(`Đã vô hiệu hóa tài khoản ${user?.username}`, { position: 'top-right' });
          }
        }
      }

      // Finally, deactivate the service center
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/service-centers/${centerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 204) {
        toast.success('Đã vô hiệu hóa trung tâm dịch vụ thành công!', { position: 'top-right' });
        await fetchServiceCenters();
        onDeactivateComplete();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi vô hiệu hóa trung tâm dịch vụ.';
      toast.error(errorMessage, { position: 'top-right' });
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-message">Đang tải dữ liệu...</div>
    );
  }

  if (!center) {
    return (
      <div className="loading-message">Không tìm thấy trung tâm dịch vụ</div>
    );
  }

  return (
    <motion.div
      className="service-center-deactivate-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button onClick={onBack} className="back-to-detail-button">
        <FaArrowLeft /> Quay lại chi tiết
      </button>

      <div className="deactivate-page-header">
        <div>
          <h2 className="deactivate-title">Vô hiệu hóa Trung tâm Dịch vụ</h2>
          <p className="deactivate-subtitle">
            {center.name} ({center.code})
          </p>
        </div>
      </div>

      <div className="deactivate-warning-section">
        <FaTimes className="warning-icon" />
        <div>
          <p className="warning-text">
            Bạn có chắc chắn muốn vô hiệu hóa trung tâm <strong>{center.name}</strong> ({center.code})?
          </p>
          {center.isMainBranch && (
            <p className="warning-note">
              <strong>Lưu ý:</strong> Đây là trung tâm chính. Bạn cần chỉ định trung tâm cha mới cho tất cả các chi nhánh trước khi vô hiệu hóa.
            </p>
          )}
        </div>
      </div>

      {center.isMainBranch && branchesToReassign.length > 0 && (
        <div className="deactivate-section">
          <h3 className="deactivate-section-title">Xử lý Chi nhánh ({branchesToReassign.length})</h3>
          <p className="deactivate-section-description">
            Vui lòng chọn trung tâm cha mới cho từng chi nhánh:
          </p>
          <div className="branches-reassignment-list">
            {branchesToReassign.map(branch => (
              <div key={branch.id} className="branch-reassignment-item">
                <div className="branch-reassignment-info">
                  <strong>{branch.code}</strong> - {branch.name}
                </div>
                <select
                  className="branch-reassignment-select"
                  value={branchReassignmentData[branch.id]?.newParentServiceCenterId || ''}
                  onChange={(e) => handleBranchReassignmentChange(branch.id, e.target.value)}
                >
                  <option value="">-- Chọn trung tâm cha mới --</option>
                  {availableServiceCenters
                    .filter(sc => sc.id !== centerId && sc.active && sc.isMainBranch)
                    .map(sc => (
                      <option key={sc.id} value={sc.id}>
                        {sc.code} - {sc.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {usersToReassign.length > 0 ? (
        <div className="deactivate-section">
          <h3 className="deactivate-section-title">Xử lý Người dùng tại trung tâm này ({usersToReassign.length})</h3>
          <div className="users-reassignment-list">
            {usersToReassign.map(user => (
              <div key={user.id} className="user-reassignment-item">
                <div className="user-reassignment-info">
                  <strong>{user.username}</strong> ({user.fullname || 'N/A'})
                  <span className="user-role-badge">{user.role}</span>
                </div>
                <div className="reassignment-options">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`action-${user.id}`}
                      value="reassign"
                      checked={reassignmentData[user.id]?.action === 'reassign'}
                      onChange={() => handleReassignmentChange(user.id, 'action', 'reassign')}
                    />
                    Chuyển sang trung tâm khác
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`action-${user.id}`}
                      value="deactivate"
                      checked={reassignmentData[user.id]?.action === 'deactivate'}
                      onChange={() => handleReassignmentChange(user.id, 'action', 'deactivate')}
                    />
                    Vô hiệu hóa tài khoản
                  </label>
                </div>
                {reassignmentData[user.id]?.action === 'reassign' && (
                  <select
                    className="reassignment-select"
                    value={reassignmentData[user.id]?.newServiceCenterId || ''}
                    onChange={(e) => handleReassignmentChange(user.id, 'newServiceCenterId', e.target.value)}
                  >
                    <option value="">-- Chọn trung tâm --</option>
                    {availableServiceCenters
                      .filter(sc => sc.id !== centerId && sc.active)
                      .map(sc => (
                        <option key={sc.id} value={sc.id}>
                          {sc.code} - {sc.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="deactivate-section">
          <p className="no-users-message">Không có người dùng nào tại trung tâm này.</p>
        </div>
      )}

      <div className="deactivate-actions">
        <button
          onClick={onBack}
          className="cancel-deactivate-button"
          disabled={deactivating}
        >
          Hủy
        </button>
        <button
          onClick={handleDeactivate}
          className="confirm-deactivate-button"
          disabled={
            deactivating ||
            (center.isMainBranch && branchesToReassign.length > 0 &&
              Object.values(branchReassignmentData).some(
                r => !r.newParentServiceCenterId
              )) ||
            (usersToReassign.length > 0 &&
              Object.values(reassignmentData).some(
                r => r.action === 'reassign' && !r.newServiceCenterId
              ))
          }
        >
          {deactivating ? 'Đang xử lý...' : 'Xác nhận Vô hiệu hóa'}
        </button>
      </div>
    </motion.div>
  );
};

// Service Center Add Page Component
const ServiceCenterAddPage = ({ formData, handleFormChange, handleSubmitAdd, availableServiceCenters, onBack }) => {
  return (
    <motion.div
      className="service-center-add-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <button onClick={onBack} className="back-to-list-button">
        <FaArrowLeft /> Quay lại danh sách
      </button>

      <div className="add-page-header">
        <div>
          <h2 className="add-title">Thêm Trung tâm Dịch vụ Mới</h2>
          <p className="add-subtitle">
            Điền thông tin để tạo trung tâm dịch vụ mới
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitAdd} className="add-form">
        <div className="add-form-section">
          <h3 className="add-section-title">Thông tin cơ bản</h3>
          <div className="add-form-grid">
            <div className="add-form-group">
              <label className="required-label">
                Mã trung tâm
                <RequiredIndicator />
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                required
                placeholder="VD: SC-HCM-001"
                className="add-input"
              />
            </div>
            <div className="add-form-group">
              <label className="required-label">
                Khu vực
                <RequiredIndicator />
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleFormChange}
                required
                className="add-input"
              >
                <option value="">-- Chọn khu vực --</option>
                <option value="NORTH">Bắc</option>
                <option value="SOUTH">Nam</option>
                <option value="CENTRAL">Trung</option>
              </select>
            </div>
            <div className="add-form-group add-form-group-full">
              <label className="required-label">
                Tên trung tâm
                <RequiredIndicator />
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                className="add-input"
              />
            </div>
            <div className="add-form-group">
              <label>Địa điểm</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                className="add-input"
              />
            </div>
            <div className="add-form-group add-form-group-full">
              <label>Địa chỉ</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                rows="3"
                className="add-input add-textarea"
              />
            </div>
          </div>
        </div>

        <div className="add-form-section">
          <h3 className="add-section-title">Thông tin liên hệ</h3>
          <div className="add-form-grid">
            <div className="add-form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                className="add-input"
                inputMode="numeric"
                maxLength={PHONE_LENGTH}
                pattern={PHONE_PATTERN}
                title={PHONE_ERROR_MESSAGE}
              />
            </div>
            <div className="add-form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                className="add-input"
                title={EMAIL_ERROR_MESSAGE}
              />
            </div>
            <div className="add-form-group add-form-group-full">
              <label>Tên quản lý</label>
              <input
                type="text"
                name="managerName"
                value={formData.managerName}
                onChange={handleFormChange}
                className="add-input"
              />
            </div>
          </div>
        </div>

        <div className="add-form-section">
          <h3 className="add-section-title">Cấu hình trung tâm</h3>
          <div className="add-form-grid">
            <div className="add-form-group">
              <label>Trung tâm cha (nếu là chi nhánh)</label>
              <select
                name="parentServiceCenterId"
                value={formData.parentServiceCenterId || ''}
                onChange={handleFormChange}
                className="add-input"
              >
                <option value="">-- Không có (Trung tâm chính) --</option>
                {availableServiceCenters
                  .filter(sc => sc.active && sc.isMainBranch)
                  .map(sc => (
                    <option key={sc.id} value={sc.id}>
                      {sc.code} - {sc.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="add-form-group">
              <label>Sức chứa (xe/ngày)</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleFormChange}
                min="0"
                className="add-input"
              />
            </div>
            <div className="add-form-group add-form-group-full">
              <label className="add-checkbox-label">
                <input
                  type="checkbox"
                  name="isMainBranch"
                  checked={formData.isMainBranch}
                  onChange={handleFormChange}
                  disabled={formData.parentServiceCenterId}
                />
                Trung tâm chính
              </label>
              {formData.parentServiceCenterId && (
                <small className="add-form-hint">
                  Chi nhánh không thể là trung tâm chính
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="add-form-section">
          <h3 className="add-section-title">Ghi chú</h3>
          <div className="add-form-group add-form-group-full">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="4"
              className="add-input add-textarea"
              placeholder="Nhập ghi chú (nếu có)..."
            />
          </div>
        </div>

        <div className="add-form-actions">
          <button type="button" onClick={onBack} className="cancel-add-button">
            Hủy
          </button>
          <button type="submit" className="submit-add-button">
            Tạo Trung tâm
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ServiceCenterManagementPage;

