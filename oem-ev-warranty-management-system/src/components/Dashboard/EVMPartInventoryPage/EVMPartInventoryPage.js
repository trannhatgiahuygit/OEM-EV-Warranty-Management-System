import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'; // Added motion for visual consistency
import './EVMPartInventoryPage.css';

// Component to display the list of parts (All/Available)
const PartsTable = ({ parts, activeTab, loading }) => {
    if (loading) {
        return <div className="evm-part-message">Loading part inventory...</div>;
    }

    if (parts.length === 0) {
        return <div className="evm-part-message">No parts found in this category.</div>;
    }

    return (
        <motion.div
            className="evm-part-table-container" // New table container class
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="evm-part-table-wrapper"> {/* New scroll wrapper class */}
                <table className="evm-part-list-table"> {/* New table class */}
                    <thead>
                        {activeTab === 'all-parts' ? (
                            <tr>
                                <th>Serial Number</th>
                                <th>Part Name</th>
                                <th>Manufacturer</th>
                                <th>Status</th>
                                <th>Warranty Period</th>
                            </tr>
                        ) : (
                            <tr>
                                <th>Serial Number</th>
                                <th>Part Name</th>
                                <th>Manufacturer</th>
                                <th>Warranty Period</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {parts.map((p, i) => (
                            <tr key={i}>
                                <td>{p.serialNumber || 'N/A'}</td>
                                <td>{p.partName || 'N/A'}</td>
                                <td>{p.manufacturer || 'N/A'}</td>
                                {activeTab === 'all-parts' && (
                                    <td>
                                        <span className={`evm-part-status ${p.status?.toLowerCase()}`}>{p.status}</span>
                                    </td>
                                )}
                                <td>{p.warrantyPeriod} months</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

// Component for registering a new part
const RegisterPartForm = ({ newPart, setNewPart, registerNewPart, loading }) => {
    return (
        <motion.div
            className="evm-part-content-box" // Matches form-container style
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3>Register New Part Serial</h3> {/* Title matching form-container h3 */}
            <form onSubmit={registerNewPart} className="evm-part-form-grid">
                <div>
                    <label>Part Name</label>
                    <input
                        type="text"
                        value={newPart.partName}
                        onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                        required
                        className="evm-part-form-input" // New input class
                    />
                </div>
                <div>
                    <label>Serial Number</label>
                    <input
                        type="text"
                        value={newPart.serialNumber}
                        onChange={(e) => setNewPart({ ...newPart, serialNumber: e.target.value })}
                        required
                        className="evm-part-form-input"
                    />
                </div>
                <div>
                    <label>Manufacturer</label>
                    <input
                        type="text"
                        value={newPart.manufacturer}
                        onChange={(e) => setNewPart({ ...newPart, manufacturer: e.target.value })}
                        required
                        className="evm-part-form-input"
                    />
                </div>
                <div>
                    <label>Warranty Period (months)</label>
                    <input
                        type="number"
                        value={newPart.warrantyPeriod}
                        onChange={(e) => setNewPart({ ...newPart, warrantyPeriod: e.target.value })}
                        required
                        className="evm-part-form-input"
                    />
                </div>
                <div>
                    <label>Status</label>
                    <select
                        value={newPart.status}
                        onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
                        className="evm-part-form-input"
                    >
                        <option value="AVAILABLE">Available</option>
                        <option value="IN_STOCK">In Stock</option>
                        <option value="INSTALLED">Installed</option>
                        <option value="IN_USE">In Use</option>
                        <option value="DEFECTIVE">Defective</option>
                    </select>
                </div>
                <button type="submit" className="evm-part-submit-button" disabled={loading}> {/* New button class */}
                    {loading ? 'Registering...' : 'Register Part'}
                </button>
            </form>
        </motion.div>
    );
};

// Component for detail lookup
const DetailLookup = ({ searchSerial, setSearchSerial, searchPartDetail, partDetail, loading }) => {
    return (
        <motion.div
            className="evm-part-content-box" // Matches form-container style
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3>Part Detail Lookup</h3> {/* Title matching form-container h3 */}
            <div className="evm-part-search-group"> {/* New search group class */}
                <input
                    type="text"
                    placeholder="Enter Serial Number"
                    value={searchSerial}
                    onChange={(e) => setSearchSerial(e.target.value)}
                    className="evm-part-form-input"
                />
                <button onClick={searchPartDetail} className="evm-part-submit-button" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
            
            {partDetail && (
                <motion.div
                    className="evm-part-detail-card" // Matches customer-data style
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h4>Part Details</h4>
                    <div className="evm-part-form-grid detail-display"> {/* Using detail grid style */}
                        <div><strong>Serial:</strong> {partDetail.serialNumber}</div>
                        <div><strong>Name:</strong> {partDetail.partName}</div>
                        <div><strong>Manufacturer:</strong> {partDetail.manufacturer}</div>
                        <div><strong>Status:</strong> <span className={`evm-part-status ${partDetail.status?.toLowerCase()}`}>{partDetail.status}</span></div>
                        <div><strong>Warranty:</strong> {partDetail.warrantyPeriod} months</div>
                        <div><strong>Created:</strong> {new Date(partDetail.createdDate).toLocaleDateString()}</div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};


// Main Component
const EVMPartInventoryPage = ({ handleBackClick }) => {
    const [activeTab, setActiveTab] = useState('all-parts');
    const [partSerials, setPartSerials] = useState([]);
    const [availableInventory, setAvailableInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchSerial, setSearchSerial] = useState('');
    const [partDetail, setPartDetail] = useState(null);
    const [newPart, setNewPart] = useState({
        partName: '',
        serialNumber: '',
        manufacturer: '',
        warrantyPeriod: '',
        status: 'AVAILABLE'
    });

    // Helper to get auth headers
    const getAuthHeaders = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
    };

    const fetchAllPartSerials = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/part-serials`, { headers: getAuthHeaders() });
            setPartSerials(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Error fetching all parts');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableInventory = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/part-serials/available`, { headers: getAuthHeaders() });
            setAvailableInventory(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Error fetching available inventory');
        } finally {
            setLoading(false);
        }
    };

    const registerNewPart = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/part-serials`, newPart, { headers: getAuthHeaders() });
            toast.success('Part registered successfully');
            setNewPart({
                partName: '',
                serialNumber: '',
                manufacturer: '',
                warrantyPeriod: '',
                status: 'AVAILABLE'
            });
            // Re-fetch only the necessary list for immediate display update
            if (activeTab === 'all-parts') fetchAllPartSerials();
            else if (activeTab === 'available-inventory') fetchAvailableInventory();
        } catch (err) {
            console.error(err);
            toast.error('Error registering part');
        } finally {
            setLoading(false);
        }
    };

    const searchPartDetail = async () => {
        if (!searchSerial.trim()) {
            toast.warning('Please enter a serial number');
            return;
        }

        setLoading(true);
        setPartDetail(null); // Clear previous detail
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/part-serials/${searchSerial}`, { headers: getAuthHeaders() });
            toast.success('Part detail fetched successfully');
            setPartDetail(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Part not found or error fetching detail');
            setPartDetail(null);
        } finally {
            setLoading(false);
        }
    };
    
    // Function to render the active tab content
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'all-parts':
                return <PartsTable parts={partSerials} activeTab={activeTab} loading={loading} />;
            case 'available-inventory':
                return <PartsTable parts={availableInventory} activeTab={activeTab} loading={loading} />;
            case 'register-part':
                return <RegisterPartForm newPart={newPart} setNewPart={setNewPart} registerNewPart={registerNewPart} loading={loading} />;
            case 'detail-lookup':
                return <DetailLookup searchSerial={searchSerial} setSearchSerial={setSearchSerial} searchPartDetail={searchPartDetail} partDetail={partDetail} loading={loading} />;
            default:
                return (
                    <div className="evm-part-message">
                        <h3>Welcome to EVM Part Inventory</h3>
                        <p>Select a function above to manage parts.</p>
                    </div>
                );
        }
    };


    useEffect(() => {
        if (activeTab === 'all-parts') fetchAllPartSerials();
        else if (activeTab === 'available-inventory') fetchAvailableInventory();
        else {
            // Reset detail lookup or registration form data when switching away
            setPartDetail(null);
            setSearchSerial('');
        }
    }, [activeTab]);

    return (
        <div className="evm-part-page-wrapper"> {/* New wrapper class */}
            
            {/* Header Card - Matching .customer-page-header */}
            <div className="evm-part-page-header">
                <button onClick={handleBackClick} className="evm-part-back-to-dashboard-button"> {/* New button class */}
                    ← Back to Dashboard
                </button>
                <h2 className="evm-part-page-title">EVM Part Inventory Management</h2> {/* New title class */}
                
                {/* Navigation Group - Matching .customer-header-nav-group */}
                <div className="evm-part-nav-bar-group">
                    <motion.div
                        className="evm-part-tab-nav-bar" // New tab bar class
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <button
                            onClick={() => setActiveTab('all-parts')}
                            className={`evm-part-tab-button ${activeTab === 'all-parts' ? 'active' : ''}`}
                        >
                            All Part Serials
                        </button>
                        <button
                            onClick={() => setActiveTab('available-inventory')}
                            className={`evm-part-tab-button ${activeTab === 'available-inventory' ? 'active' : ''}`}
                        >
                            Available Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('register-part')}
                            className={`evm-part-tab-button ${activeTab === 'register-part' ? 'active' : ''}`}
                        >
                            Register New Part
                        </button>
                        <button
                            onClick={() => setActiveTab('detail-lookup')}
                            className={`evm-part-tab-button ${activeTab === 'detail-lookup' ? 'active' : ''}`}
                        >
                            Detail Lookup
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Area - Matching .customer-page-content-area */}
            <div className="evm-part-page-content-area">
                {renderActiveTabContent()}
            </div>
        </div>
    );
};

export default EVMPartInventoryPage;