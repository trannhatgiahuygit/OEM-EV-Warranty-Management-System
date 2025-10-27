import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        toast.success('Customer created successfully!', { position: 'top-right' });
        setCreatedCustomer(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Error while creating customer.', { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
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
          <h3 className="success-message">Customer Created Successfully!</h3>
          <div className="customer-data">
            <h4>Customer Details:</h4>
            <p><strong>ID:</strong> {createdCustomer.id}</p>
            <p><strong>Name:</strong> {createdCustomer.name}</p>
            <p><strong>Phone:</strong> {createdCustomer.phone}</p>
            <p><strong>Email:</strong> {createdCustomer.email}</p>
            <p><strong>Address:</strong> {createdCustomer.address}</p>
          </div>
          <button onClick={handleCreateAnother} className="create-another-button">
            Create Another Customer
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
      <h3>Add New Customer</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
        <input type="text" name="phone" placeholder="Phone" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="text" name="address" placeholder="Address" onChange={handleChange} required />
        <button type="submit">Create Customer</button>
      </form>
    </motion.div>
  );
};

// Component to get a single customer by ID
const GetCustomerById = () => {
  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState(null);

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
        toast.success('Customer fetched successfully!', { position: 'top-right' });
        setCustomer(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Error fetching customer.', { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
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
      <h3>Get Customer by ID</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          name="id"
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          required
        />
        <button type="submit">Get Customer</button>
      </form>
      {customer && (
        <div className="customer-data">
          <h4>Customer Details:</h4>
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
          <p><strong>Email:</strong> {customer.email}</p>
        </div>
      )}
    </motion.div>
  );
};

// Component to search by phone number
const SearchCustomerByPhone = () => {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        toast.success('Customer fetched successfully!', { position: 'top-right' });
        setCustomer(response.data);
      }
    } catch (error) {
      if (error.response) {
        toast.error('Error while fetching customer.', { position: 'top-right' });
      } else {
        toast.error('Network error. Please try again later.', { position: 'top-right' });
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
      <h3>Search Customer by Phone</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="phone"
          placeholder="Customer Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit">Search Customer</button>
      </form>
      {customer && (
        <div className="customer-data">
          <h4>Customer Details:</h4>
          <p><strong>ID:</strong> {customer.id}</p>
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Phone:</strong> {customer.phone}</p>
          <p><strong>Email:</strong> {customer.email}</p>
        </div>
      )}
    </motion.div>
  );
};

// Component to get and display all customers (MODIFIED with sorting logic)
const AllCustomersList = ({ onViewVehiclesClick, sortOrder }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

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
          toast.success('Customer list fetched successfully!', { position: 'top-right' });
          setCustomers(response.data);
        }
      } catch (error) {
        if (isMounted) {
          if (error.response) {
            toast.error('Error fetching customer list.', { position: 'top-right' });
          } else {
            toast.error('Network error. Please try again later.', { position: 'top-right' });
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
    return <div className="loading-message">Loading customer list...</div>;
  }

  if (sortedCustomers.length === 0) {
    return <div className="loading-message">No customers found.</div>;
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
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Created At</th>
              <th>Actions</th> 
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
                <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => onViewVehiclesClick(customer.id)}
                    className="view-vehicles-button"
                  >
                    View Vehicles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
            <h3>Welcome to Customer Management</h3>
            <p>Select a function above to get started.</p>
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
          ← Back to Dashboard
        </button>
        <h2 className="page-title">Customer Management</h2>
        
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
                All Customers
              </button>
              <button
                onClick={() => setActiveFunction('add')}
                className={activeFunction === 'add' ? 'active' : ''}
              >
                Add New Customer
              </button>
              <button
                onClick={() => setActiveFunction('getById')}
                className={activeFunction === 'getById' ? 'active' : ''}
              >
                Get by ID
              </button>
              <button
                onClick={() => setActiveFunction('searchByPhone')}
                className={activeFunction === 'searchByPhone' ? 'active' : ''}
              >
                Search by Phone
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
                <span>Sort by Creation Date:</span> 
                <button
                  onClick={() => setSortOrder('desc')} // Latest First
                  className={sortOrder === 'desc' ? 'active' : ''}
                >
                  Latest First
                </button>
                <button
                  onClick={() => setSortOrder('asc')} // Oldest First
                  className={sortOrder === 'asc' ? 'active' : ''}
                >
                  Oldest First
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