import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './EVMPartInventoryPage.css';

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

    const fetchAllPartSerials = async () => {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const headers = {};

        if (user?.token) headers.Authorization = `Bearer ${user.token}`;

        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/part-serials`, { headers });
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
        const user = JSON.parse(localStorage.getItem('user'));
        const headers = {};
        if (user?.token) headers.Authorization = `Bearer ${user.token}`;

        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/part-serials/available`, { headers });
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

        const user = JSON.parse(localStorage.getItem('user'));
        const headers = {};
        if (user?.token) headers.Authorization = `Bearer ${user.token}`;

        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/part-serials`, newPart, { headers });
            toast.success('Part registered successfully');
            setNewPart({
                partName: '',
                serialNumber: '',
                manufacturer: '',
                warrantyPeriod: '',
                status: 'AVAILABLE'
            });
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
        const user = JSON.parse(localStorage.getItem('user'));
        const headers = {};
        if (user?.token) headers.Authorization = `Bearer ${user.token}`;

        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/part-serials/${searchSerial}`, { headers });
            setPartDetail(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Part not found or error fetching detail');
            setPartDetail(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'all-parts') fetchAllPartSerials();
        else if (activeTab === 'available-inventory') fetchAvailableInventory();
    }, [activeTab]);

    return (
        <div className="evm-part-page">
            {/* Header Card */}
            <div className="evm-part-header-card">
                <div className="evm-part-header">
                    <h2 className="evm-part-title">EVM Part Inventory Management</h2>
                    <button onClick={handleBackClick} className="evm-part-back-btn">← Back to Dashboard</button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="evm-part-main-card">
                {/* Tabs */}
                <div className="evm-part-tabs">
                    <button
                        onClick={() => setActiveTab('all-parts')}
                        className={`evm-part-tab ${activeTab === 'all-parts' ? 'active' : ''}`}
                    >
                        All Part Serials
                    </button>
                    <button
                        onClick={() => setActiveTab('available-inventory')}
                        className={`evm-part-tab ${activeTab === 'available-inventory' ? 'active' : ''}`}
                    >
                        Available Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('register-part')}
                        className={`evm-part-tab ${activeTab === 'register-part' ? 'active' : ''}`}
                    >
                        Register New Part
                    </button>
                    <button
                        onClick={() => setActiveTab('detail-lookup')}
                        className={`evm-part-tab ${activeTab === 'detail-lookup' ? 'active' : ''}`}
                    >
                        Detail Lookup
                    </button>
                </div>

                {/* Content */}
                <div className="evm-part-content">
                    {loading && <p>Loading...</p>}

                    {!loading && activeTab === 'all-parts' && (
                        <table className="evm-part-table">
                            <thead>
                                <tr>
                                    <th>Serial Number</th>
                                    <th>Part Name</th>
                                    <th>Manufacturer</th>
                                    <th>Status</th>
                                    <th>Warranty Period</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partSerials.map((p, i) => (
                                    <tr key={i}>
                                        <td>{p.serialNumber || 'N/A'}</td>
                                        <td>{p.partName || 'N/A'}</td>
                                        <td>{p.manufacturer || 'N/A'}</td>
                                        <td>
                                            <span className={`evm-status ${p.status?.toLowerCase()}`}>{p.status}</span>
                                        </td>
                                        <td>{p.warrantyPeriod} months</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && activeTab === 'available-inventory' && (
                        <table className="evm-part-table">
                            <thead>
                                <tr>
                                    <th>Serial Number</th>
                                    <th>Part Name</th>
                                    <th>Manufacturer</th>
                                    <th>Warranty Period</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availableInventory.map((p, i) => (
                                    <tr key={i}>
                                        <td>{p.serialNumber}</td>
                                        <td>{p.partName}</td>
                                        <td>{p.manufacturer}</td>
                                        <td>{p.warrantyPeriod} months</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {activeTab === 'register-part' && (
                        <form onSubmit={registerNewPart} className="evm-part-detail-grid">
                            <div>
                                <label>Part Name</label>
                                <input
                                    type="text"
                                    value={newPart.partName}
                                    onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                                    required
                                    className="evm-part-input"
                                />
                            </div>
                            <div>
                                <label>Serial Number</label>
                                <input
                                    type="text"
                                    value={newPart.serialNumber}
                                    onChange={(e) => setNewPart({ ...newPart, serialNumber: e.target.value })}
                                    required
                                    className="evm-part-input"
                                />
                            </div>
                            <div>
                                <label>Manufacturer</label>
                                <input
                                    type="text"
                                    value={newPart.manufacturer}
                                    onChange={(e) => setNewPart({ ...newPart, manufacturer: e.target.value })}
                                    required
                                    className="evm-part-input"
                                />
                            </div>
                            <div>
                                <label>Warranty Period (months)</label>
                                <input
                                    type="number"
                                    value={newPart.warrantyPeriod}
                                    onChange={(e) => setNewPart({ ...newPart, warrantyPeriod: e.target.value })}
                                    required
                                    className="evm-part-input"
                                />
                            </div>
                            <div>
                                <label>Status</label>
                                <select
                                    value={newPart.status}
                                    onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
                                    className="evm-part-input"
                                >
                                    <option value="AVAILABLE">Available</option>
                                    <option value="IN_STOCK">In Stock</option>
                                    <option value="INSTALLED">Installed</option>
                                    <option value="IN_USE">In Use</option>
                                    <option value="DEFECTIVE">Defective</option>
                                </select>
                            </div>
                            <button type="submit" className="evm-part-btn">
                                {loading ? 'Registering...' : 'Register Part'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'detail-lookup' && (
                        <>
                            <div className="evm-part-search">
                                <input
                                    type="text"
                                    placeholder="Enter Serial Number"
                                    value={searchSerial}
                                    onChange={(e) => setSearchSerial(e.target.value)}
                                    className="evm-part-input"
                                />
                                <button onClick={searchPartDetail} className="evm-part-btn">
                                    {loading ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                            {partDetail && (
                                <div className="evm-part-detail">
                                    <h4>Part Details</h4>
                                    <div className="evm-part-detail-grid">
                                        <div><strong>Serial:</strong> {partDetail.serialNumber}</div>
                                        <div><strong>Name:</strong> {partDetail.partName}</div>
                                        <div><strong>Manufacturer:</strong> {partDetail.manufacturer}</div>
                                        <div><strong>Status:</strong> {partDetail.status}</div>
                                        <div><strong>Warranty:</strong> {partDetail.warrantyPeriod} months</div>
                                        <div><strong>Created:</strong> {new Date(partDetail.createdDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EVMPartInventoryPage;
