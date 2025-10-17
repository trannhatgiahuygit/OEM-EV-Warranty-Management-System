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

// Component to get and display all customers
const GetAllCustomers = ({ onViewVehiclesClick }) => { // Accepts new prop
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

  if (loading) {
    return <div className="loading-message">Loading customer list...</div>;
  }

  if (customers.length === 0) {
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
              <th>Actions</th> {/* Add a new header for the action button */}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>{customer.address}</td>
                <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => onViewVehiclesClick(customer.id)} // Pass the customer ID
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

// Main CustomerPage component
const CustomerPage = ({ handleBackClick, onViewVehiclesClick }) => { // Accepts new prop
  const [activeFunction, setActiveFunction] = useState('getAll');

  const renderActiveFunction = () => {
    switch (activeFunction) {
      case 'add':
        return <AddNewCustomer />;
      case 'getById':
        return <GetCustomerById />;
      case 'searchByPhone':
        return <SearchCustomerByPhone />;
      case 'getAll':
        return <GetAllCustomers onViewVehiclesClick={onViewVehiclesClick} />; // Pass the prop down
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

  return (
    <div className="customer-page-wrapper">
      <div className="customer-page-header">
        <button onClick={handleBackClick} className="back-to-dashboard-button">
          ← Back to Dashboard
        </button>
        <h2 className="page-title">Customer Management</h2>
        <p className="page-description">Manage all customer-related functions here.</p>
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
      </div>

      <div className="customer-page-content-area">
        {renderActiveFunction()}
      </div>
    </div>
  );
};

export default CustomerPage;