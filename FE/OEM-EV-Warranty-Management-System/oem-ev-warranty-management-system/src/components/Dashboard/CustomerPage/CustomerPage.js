import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import ServiceHistoryModal from '../ServiceHistoryModal/ServiceHistoryModal';
import RequiredIndicator from '../../common/RequiredIndicator';
import { formatPhoneInput, isValidPhoneNumber, PHONE_PATTERN, PHONE_LENGTH, PHONE_ERROR_MESSAGE } from '../../../utils/validation';
import './CustomerPage.css';

// Component to handle adding a new customer
const AddNewCustomer = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [createdCustomer, setCreatedCustomer] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'phone' ? formatPhoneInput(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPhoneNumber(formData.phone)) {
      toast.error(PHONE_ERROR_MESSAGE);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/customers/createCustomer`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 201) {
        toast.success('Khách hàng đã được tạo thành công!', { position: 'top-right' });
        setCreatedCustomer(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Lỗi khi tạo khách hàng.', { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
      setCreatedCustomer(null);
    }
  };

  const handleCreateAnother = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: ''
    });
    setCreatedCustomer(null);
  };

  if (createdCustomer) {
    return (
      <motion.div
        className="form-container confirmation-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="confirmation-content">
          <FaCheckCircle className="success-icon" />
          <h3 className="success-message">Khách hàng đã được tạo thành công!</h3>
          <div className="customer-data">
            <h4>Chi tiết Khách hàng:</h4>
            <p><strong>ID:</strong> {createdCustomer.id}</p>
            <p><strong>Tên:</strong> {createdCustomer.name}</p>
            <p><strong>Số điện thoại:</strong> {createdCustomer.phone}</p>
            <p><strong>Email:</strong> {createdCustomer.email}</p>
            <p><strong>Địa chỉ:</strong> {createdCustomer.address}</p>
          </div>
          <button onClick={handleCreateAnother} className="create-another-button">
            Tạo Khách hàng Khác
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Thêm Khách hàng Mới</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="customer-name" className="required-label">
            Tên
            <RequiredIndicator />
          </label>
          <input
            id="customer-name"
            type="text"
            name="name"
            placeholder="Nhập tên khách hàng"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="customer-phone" className="required-label">
            Số điện thoại
            <RequiredIndicator />
          </label>
          <input
            id="customer-phone"
            type="tel"
            name="phone"
            placeholder="Ví dụ: 0901234567"
            value={formData.phone}
            onChange={handleChange}
            required
            inputMode="numeric"
            maxLength={PHONE_LENGTH}
            pattern={PHONE_PATTERN}
            title={PHONE_ERROR_MESSAGE}
          />
        </div>
        <div className="form-field">
          <label htmlFor="customer-email" className="required-label">
            Email
            <RequiredIndicator />
          </label>
          <input
            id="customer-email"
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="customer-address" className="required-label">
            Địa chỉ
            <RequiredIndicator />
          </label>
          <input
            id="customer-address"
            type="text"
            name="address"
            placeholder="Địa chỉ"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Tạo Khách hàng</button>
      </form>
    </motion.div>
  );
};

// Component to get a single customer by ID
const GetCustomerById = () => {
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showServiceHistory, setShowServiceHistory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/customers/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        toast.success('Đã tải thông tin khách hàng thành công!', { position: 'top-right' });
        setCustomer(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Lỗi khi tải thông tin khách hàng.', { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
      setCustomer(null);
    }
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Tìm Khách hàng theo ID</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="customer-id-input" className="required-label">
            ID Khách hàng
            <RequiredIndicator />
          </label>
          <input
            id="customer-id-input"
            type="number"
            name="id"
            placeholder="ID Khách hàng"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
            min="1"
          />
        </div>
        <button type="submit">Tìm Khách hàng</button>
      </form>
      {customer && (
        <div className="customer-data">
          <h4>Chi tiết Khách hàng:</h4>
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Tên:</strong> {customer.name}</p>
          <p><strong>Số điện thoại:</strong> {customer.phone}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <button 
            onClick={() => setShowServiceHistory(true)}
            className="view-service-history-button"
          >
            Xem Lịch sử Dịch vụ
          </button>
        </div>
      )}
      {showServiceHistory && customer && (
        <ServiceHistoryModal
          isOpen={showServiceHistory}
          onClose={() => setShowServiceHistory(false)}
          type="customer"
          id={customer.id}
          title={`Lịch sử Dịch vụ - ${customer.name}`}
        />
      )}
    </motion.div>
  );
};

// Component to search by phone number
const SearchCustomerByPhone = () => {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showServiceHistory, setShowServiceHistory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPhoneNumber(phone)) {
      toast.error(PHONE_ERROR_MESSAGE);
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = user.token;
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/customers/search?phone=${phone}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.status === 200) {
        toast.success('Đã tải thông tin khách hàng thành công!', { position: 'top-right' });
        setCustomer(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Lỗi khi tải thông tin khách hàng.', { position: 'top-right' });
      } else {
        toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
      }
      setCustomer(null);
    }
  };

  return (
    <motion.div
      className="form-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3>Tìm Khách hàng theo Số điện thoại</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="search-phone" className="required-label">
            Số điện thoại Khách hàng
            <RequiredIndicator />
          </label>
          <input
            id="search-phone"
            type="tel"
            name="phone"
            placeholder="Nhập số điện thoại 10 chữ số"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            required
            inputMode="numeric"
            maxLength={PHONE_LENGTH}
            pattern={PHONE_PATTERN}
            title={PHONE_ERROR_MESSAGE}
          />
        </div>
        <button type="submit">Tìm Khách hàng</button>
      </form>
      {customer && (
        <div className="customer-data">
          <h4>Chi tiết Khách hàng:</h4>
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Tên:</strong> {customer.name}</p>
          <p><strong>Số điện thoại:</strong> {customer.phone}</p>
          <p><strong>Email:</strong> {customer.email}</p>
          <button 
            onClick={() => setShowServiceHistory(true)}
            className="view-service-history-button"
          >
            Xem Lịch sử Dịch vụ
          </button>
        </div>
      )}
      {showServiceHistory && customer && (
        <ServiceHistoryModal
          isOpen={showServiceHistory}
          onClose={() => setShowServiceHistory(false)}
          type="customer"
          id={customer.id}
          title={`Lịch sử Dịch vụ - ${customer.name}`}
        />
      )}
    </motion.div>
  );
};

// Component to get and display all customers (MODIFIED with sorting logic)
const AllCustomersList = ({ onViewVehiclesClick, sortOrder }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceHistory, setShowServiceHistory] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCustomers = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user.token;
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/customers`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.status === 200 && isMounted) {
          toast.success('Đã tải danh sách khách hàng thành công!', { position: 'top-right' });
          setCustomers(response.data);
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Lỗi khi tải danh sách khách hàng.', { position: 'top-right' });
          } else {
            toast.error('Lỗi mạng. Vui lòng thử lại sau.', { position: 'top-right' });
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchCustomers();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // NEW: Sorting logic applied to the list
  const sortedCustomers = [...customers].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);

    if (sortOrder === 'desc') {
        return dateB - dateA; // Newest (descending date) first
    } else {
        return dateA - dateB; // Oldest (ascending date) first
    }
  });

  if (loading) {
    return <div className="loading-message">Đang tải danh sách khách hàng...</div>;
  }

  if (sortedCustomers.length === 0) {
    return <div className="loading-message">Không tìm thấy khách hàng nào.</div>;
  }

  return (
    <motion.div
      className="customer-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="customer-table-wrapper">
        <table className="customer-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Địa chỉ</th>
              <th>Ngày Tạo</th>
              <th>Hành động</th> 
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((customer) => ( // Use sortedCustomers
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.address}</td>
                <td>{new Date(customer.createdAt).toLocaleDateString('vi-VN')}</td>
                <td>
                  <div className="customer-action-buttons">
                    <button 
                      onClick={() => onViewVehiclesClick(customer.id)}
                      className="view-vehicles-button"
                    >
                      Xem Xe
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setSelectedCustomerName(customer.name);
                        setShowServiceHistory(true);
                      }}
                      className="view-service-history-button"
                    >
                      Lịch sử Dịch vụ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showServiceHistory && selectedCustomerId && (
        <ServiceHistoryModal
          isOpen={showServiceHistory}
          onClose={() => {
            setShowServiceHistory(false);
            setSelectedCustomerId(null);
            setSelectedCustomerName(null);
          }}
          type="customer"
          id={selectedCustomerId}
          title={`Lịch sử Dịch vụ - ${selectedCustomerName}`}
        />
      )}
    </motion.div>
  );
};


// Main CustomerPage component (MODIFIED to manage sorting state and UI)
const CustomerPage = ({ handleBackClick, onViewVehiclesClick }) => {
  const [activeFunction, setActiveFunction] = useState('getAll');
  // NEW: Sorting state for All Customers view
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' is newest first (default)

  const renderActiveFunction = () => {
    switch (activeFunction) {
      case 'add':
        return <AddNewCustomer />;
      case 'getById':
        return <GetCustomerById />;
      case 'searchByPhone':
        return <SearchCustomerByPhone />;
      case 'getAll':
        // MODIFIED: Pass sortOrder to the list component
        return <AllCustomersList onViewVehiclesClick={onViewVehiclesClick} sortOrder={sortOrder} />;
      default:
        return (
          <motion.div
            className="welcome-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3>Chào mừng đến với Quản lý Khách hàng</h3>
            <p>Chọn một chức năng ở trên để bắt đầu.</p>
          </motion.div>
        );
    }
  };
  
  // NEW: Handler to toggle sorting (used by the header button)
  const toggleSortOrder = () => {
    setSortOrder(prevOrder => (prevOrder === 'desc' ? 'asc' : 'desc'));
  };

  return (
    <div className="customer-page-wrapper">
      <div className="customer-page-header">
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Quay lại Bảng điều khiển
        </button>
        <h2 className="page-title">Quản lý Khách hàng</h2>
        
        {/* NEW WRAPPER: Container for nav bar and sort bar */}
        <div className="customer-header-nav-group">
            <motion.div
              className="function-nav-bar"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                onClick={() => setActiveFunction('getAll')}
                className={activeFunction === 'getAll' ? 'active' : ''}
              >
                Tất cả Khách hàng
              </button>
              <button
                onClick={() => setActiveFunction('add')}
                className={activeFunction === 'add' ? 'active' : ''}
              >
                Thêm Khách hàng Mới
              </button>
              <button
                onClick={() => setActiveFunction('getById')}
                className={activeFunction === 'getById' ? 'active' : ''}
              >
                Tìm theo ID
              </button>
              <button
                onClick={() => setActiveFunction('searchByPhone')}
                className={activeFunction === 'searchByPhone' ? 'active' : ''}
              >
                Tìm kiếm theo Số điện thoại
              </button>
            </motion.div>
            
            {/* NEW: Sorting Buttons, visible only for All Customers */}
            {activeFunction === 'getAll' && (
              <motion.div
                className="customer-sort-button-group"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <span>Sắp xếp theo Ngày Tạo:</span> 
                <button
                  onClick={() => setSortOrder('desc')} // Mới nhất Trước
                  className={sortOrder === 'desc' ? 'active' : ''}
                >
                  Mới nhất Trước
                </button>
                <button
                  onClick={() => setSortOrder('asc')} // Cũ nhất Trước
                  className={sortOrder === 'asc' ? 'active' : ''}
                >
                  Cũ nhất Trước
                </button>
              </motion.div>
            )}
        </div>
      </div>

      <div className="customer-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default CustomerPage;