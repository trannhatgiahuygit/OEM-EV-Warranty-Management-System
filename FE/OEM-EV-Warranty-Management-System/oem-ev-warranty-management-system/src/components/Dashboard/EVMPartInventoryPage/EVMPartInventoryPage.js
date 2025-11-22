import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion'; // Added motion for visual consistency
import { serialPartsService } from '../../../services/serialPartsService';
import { getAllVehicleTypes, VEHICLE_TYPES, normalizeVehicleTypeForAPI } from '../../../utils/vehicleClassification';
import './EVMPartInventoryPage.css';

const VEHICLE_TYPE_FILTER_OPTIONS = [
    {
        id: 'all',
        name: 'Tất cả loại xe',
        icon: '🌀'
    },
    ...getAllVehicleTypes(),
    VEHICLE_TYPES.UNKNOWN
];

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
                                <th>Số Serial</th>
                                <th>Tên Phụ tùng</th>
                                <th>Nhà sản xuất</th>
                                <th>Trạng thái</th>
                                <th>Thời hạn Bảo hành</th>
                            </tr>
                        ) : (
                            <tr>
                                <th>Số Serial</th>
                                <th>Tên Phụ tùng</th>
                                <th>Nhà sản xuất</th>
                                <th>Thời hạn Bảo hành</th>
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
                                <td>{p.warrantyPeriod} tháng</td>
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
                    <label>Tên Phụ tùng</label>
                    <input
                        type="text"
                        value={newPart.partName}
                        onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                        required
                        className="evm-part-form-input" // New input class
                    />
                </div>
                <div>
                    <label>Số Serial</label>
                    <input
                        type="text"
                        value={newPart.serialNumber}
                        onChange={(e) => setNewPart({ ...newPart, serialNumber: e.target.value })}
                        required
                        className="evm-part-form-input"
                    />
                </div>
                <div>
                    <label>Nhà sản xuất</label>
                    <input
                        type="text"
                        value={newPart.manufacturer}
                        onChange={(e) => setNewPart({ ...newPart, manufacturer: e.target.value })}
                        required
                        className="evm-part-form-input"
                    />
                </div>
                <div>
                    <label>Thời hạn Bảo hành (tháng)</label>
                    <input
                        type="number"
                        value={newPart.warrantyPeriod}
                        onChange={(e) => setNewPart({ ...newPart, warrantyPeriod: e.target.value })}
                        required
                        className="evm-part-form-input"
                    />
                </div>
                <div>
                    <label>Loại xe</label>
                    <select
                        value={newPart.vehicleType || ''}
                        onChange={(e) => setNewPart({ ...newPart, vehicleType: e.target.value || null })}
                        className="evm-part-form-input"
                    >
                        <option value="">-- Chọn loại xe (tùy chọn) --</option>
                        {VEHICLE_TYPE_FILTER_OPTIONS.filter(opt => opt.id !== 'all' && opt.id !== 'unknown').map((option) => (
                            <option key={option.id} value={option.apiType || option.id}>
                                {option.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Trạng thái</label>
                    <select
                        value={newPart.status}
                        onChange={(e) => setNewPart({ ...newPart, status: e.target.value })}
                        className="evm-part-form-input"
                    >
                        <option value="AVAILABLE">Có sẵn</option>
                        <option value="IN_STOCK">Trong kho</option>
                        <option value="INSTALLED">Đã cài đặt</option>
                        <option value="IN_USE">Đang sử dụng</option>
                        <option value="DEFECTIVE">Lỗi</option>
                    </select>
                </div>
                <button type="submit" className="evm-part-submit-button" disabled={loading}> {/* New button class */}
                    {loading ? 'Đang đăng ký...' : 'Đăng ký Phụ tùng'}
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
                    placeholder="Nhập Số Serial"
                    value={searchSerial}
                    onChange={(e) => setSearchSerial(e.target.value)}
                    className="evm-part-form-input"
                />
                <button onClick={searchPartDetail} className="evm-part-submit-button" disabled={loading}>
                    {loading ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                </button>
            </div>
            
            {partDetail && (
                <motion.div
                    className="evm-part-detail-card" // Matches customer-data style
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h4>Chi tiết Phụ tùng</h4>
                    <div className="evm-part-form-grid detail-display"> {/* Using detail grid style */}
                        <div><strong>Số Serial:</strong> {partDetail.serialNumber}</div>
                        <div><strong>Tên:</strong> {partDetail.partName}</div>
                        <div><strong>Nhà sản xuất:</strong> {partDetail.manufacturer}</div>
                        <div><strong>Trạng thái:</strong> <span className={`evm-part-status ${partDetail.status?.toLowerCase()}`}>{partDetail.status}</span></div>
                        <div><strong>Bảo hành:</strong> {partDetail.warrantyPeriod} tháng</div>
                        <div><strong>Đã tạo:</strong> {new Date(partDetail.createdDate).toLocaleDateString('vi-VN')}</div>
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
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
    const [newPart, setNewPart] = useState({
        partName: '',
        serialNumber: '',
        manufacturer: '',
        warrantyPeriod: '',
        vehicleType: null, // Add vehicleType field
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
            let fetchedParts = res.data;
            // Sort by date (newest first) - use createdDate if available, otherwise use id as fallback
            fetchedParts.sort((a, b) => {
                if (a.createdDate && b.createdDate) {
                    const dateA = new Date(a.createdDate);
                    const dateB = new Date(b.createdDate);
                    return dateB - dateA; // Newest first (descending)
                }
                // Fallback to id if no createdDate field
                return (b.id || 0) - (a.id || 0); // Higher id = newer (assuming auto-increment)
            });
            setPartSerials(fetchedParts);
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
            // Use service with vehicleType filter if selected
            // Normalize vehicleType filter ID to backend API format (e.g., 'electric_car' -> 'CAR')
            const selectedVehicleType = vehicleTypeFilter === 'all' ? null : 
                normalizeVehicleTypeForAPI(vehicleTypeFilter);
            
            console.log('EVMPartInventoryPage - Fetching available inventory:', {
                filterId: vehicleTypeFilter,
                normalizedVehicleType: selectedVehicleType
            });
            const fetchedParts = await serialPartsService.getAvailableSerialParts(null, selectedVehicleType);
            console.log('EVMPartInventoryPage - Fetched parts count:', fetchedParts?.length || 0);
            
            // Sort by date (newest first) - use createdDate if available, otherwise use id as fallback
            fetchedParts.sort((a, b) => {
                if (a.createdDate && b.createdDate) {
                    const dateA = new Date(a.createdDate);
                    const dateB = new Date(b.createdDate);
                    return dateB - dateA; // Newest first (descending)
                }
                // Fallback to id if no createdDate field
                return (b.id || 0) - (a.id || 0); // Higher id = newer (assuming auto-increment)
            });
            setAvailableInventory(fetchedParts);
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
            // Prepare payload - normalize vehicleType if needed
            const payload = { ...newPart };
            if (payload.vehicleType) {
                // Normalize vehicleType using service (ELECTRIC_CAR -> CAR, etc.)
                payload.vehicleType = serialPartsService.normalizeVehicleTypeForAPI(payload.vehicleType) || payload.vehicleType;
            }
            
            console.log('Registering part with payload:', payload);
            await axios.post(`${process.env.REACT_APP_API_URL}/api/part-serials`, payload, { headers: getAuthHeaders() });
            toast.success('Part registered successfully');
            setNewPart({
                partName: '',
                serialNumber: '',
                manufacturer: '',
                warrantyPeriod: '',
                vehicleType: null, // Reset vehicleType
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
                return (
                    <div>
                        <div className="evm-part-filter-controls">
                            <div className="evm-part-vehicle-type-filter">
                                <label htmlFor="evmPartVehicleTypeFilter">Lọc theo loại xe</label>
                                <select
                                    id="evmPartVehicleTypeFilter"
                                    value={vehicleTypeFilter}
                                    onChange={(e) => {
                                        setVehicleTypeFilter(e.target.value);
                                    }}
                                    className="evm-part-filter-select"
                                >
                                    {VEHICLE_TYPE_FILTER_OPTIONS.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <PartsTable parts={availableInventory} activeTab={activeTab} loading={loading} />
                    </div>
                );
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
    }, [activeTab, vehicleTypeFilter]);

    return (
        <div className="evm-part-page-wrapper"> {/* New wrapper class */}
            
            {/* Header Card - Matching .customer-page-header */}
            <div className="evm-part-page-header">
                <button onClick={handleBackClick} className="evm-part-back-to-dashboard-button"> {/* New button class */}
                    ← Quay lại Bảng điều khiển
                </button>
                <h2 className="evm-part-page-title">Quản lý Kho Phụ tùng EVM</h2> {/* New title class */}
                
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
                            Tất cả Số Serial Phụ tùng
                        </button>
                        <button
                            onClick={() => setActiveTab('available-inventory')}
                            className={`evm-part-tab-button ${activeTab === 'available-inventory' ? 'active' : ''}`}
                        >
                            Kho Hàng Có Sẵn
                        </button>
                        <button
                            onClick={() => setActiveTab('register-part')}
                            className={`evm-part-tab-button ${activeTab === 'register-part' ? 'active' : ''}`}
                        >
                            Đăng ký Phụ tùng Mới
                        </button>
                        <button
                            onClick={() => setActiveTab('detail-lookup')}
                            className={`evm-part-tab-button ${activeTab === 'detail-lookup' ? 'active' : ''}`}
                        >
                            Tra cứu Chi tiết
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