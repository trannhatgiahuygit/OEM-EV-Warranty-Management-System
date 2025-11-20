// VehicleListModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { classifyVehicle } from '../../utils/vehicleClassification';
import './VehicleListModal.css';

const VehicleListModal = ({ isOpen, onClose, category, categoryName }) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && category) {
            fetchVehiclesByCategory();
        }
    }, [isOpen, category]);

    const fetchVehiclesByCategory = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user?.token;

            if (!token) {
                toast.error('Vui lòng đăng nhập lại!');
                return;
            }

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/vehicles`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.status === 200) {
                // Filter vehicles by category based on vehicle model or type
                const filteredVehicles = filterVehiclesByCategory(response.data, category);
                setVehicles(filteredVehicles);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error('Lỗi khi tải danh sách xe!', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const filterVehiclesByCategory = (allVehicles, categoryId) => {
        if (!categoryId) {
            return allVehicles;
        }

        return allVehicles.filter((vehicle) => classifyVehicle(vehicle).id === categoryId);
    };

    const filteredVehicles = vehicles.filter(vehicle =>
        searchTerm === '' ||
        vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getVehicleStatusBadge = (status) => {
        const statusClasses = {
            'active': 'status-active',
            'maintenance': 'status-maintenance',
            'warranty': 'status-warranty',
            'inactive': 'status-inactive'
        };

        const normalizedStatus = status?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
        const className = statusClasses[normalizedStatus] || 'status-unknown';

        return <span className={`vehicle-status ${className}`}>{status || 'Không xác định'}</span>;
    };

    if (!isOpen) return null;

    return (
        <div className="vehicle-list-overlay" onClick={onClose}>
            <div className="vehicle-list-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <h2>📋 Danh sách xe - {categoryName}</h2>
                        <p>Tổng cộng: <strong>{filteredVehicles.length}</strong> xe</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="modal-search">
                    <div className="search-box">
                        <i className="search-icon">🔍</i>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo VIN, Model, Brand, Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <div className="modal-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Đang tải danh sách xe...</p>
                        </div>
                    ) : filteredVehicles.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🚗</div>
                            <h3>Không tìm thấy xe nào</h3>
                            <p>Hiện tại không có xe {categoryName.toLowerCase()} trong hệ thống</p>
                        </div>
                    ) : (
                        <div className="vehicle-grid">
                            {filteredVehicles.map((vehicle, index) => {
                                const vehicleTypeMeta = classifyVehicle(vehicle);
                                return (
                                    <div key={vehicle.id || index} className="vehicle-card">
                                        <div className="vehicle-header">
                                            <div className="vehicle-info">
                                                <h3 className="vehicle-model">{vehicle.model || 'Không có model'}</h3>
                                                <p className="vehicle-brand">{vehicle.brand || 'Không có brand'}</p>
                                            </div>
                                            <div className="vehicle-header-meta">
                                                <span
                                                    className="vehicle-type-pill"
                                                    style={{ backgroundColor: vehicleTypeMeta.color }}
                                                >
                                                    {vehicleTypeMeta.icon} {vehicleTypeMeta.name}
                                                </span>
                                                {getVehicleStatusBadge(vehicle.status)}
                                            </div>
                                        </div>

                                        <div className="vehicle-details">
                                            <div className="detail-row">
                                                <span className="label">VIN:</span>
                                                <span className="value">{vehicle.vin || 'N/A'}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">Năm sản xuất:</span>
                                                <span className="value">{vehicle.manufacturingYear || 'N/A'}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">Khách hàng:</span>
                                                <span className="value">{vehicle.customerName || 'N/A'}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">Loại xe:</span>
                                                <span className="value value-pill">
                                                    <span
                                                        className="vehicle-type-pill"
                                                        style={{ backgroundColor: vehicleTypeMeta.color }}
                                                    >
                                                        {vehicleTypeMeta.icon} {vehicleTypeMeta.name}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="label">Ngày đăng ký:</span>
                                                <span className="value">
                                                    {vehicle.registrationDate ? new Date(vehicle.registrationDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="vehicle-actions">
                                            <button
                                                className="action-btn primary"
                                                onClick={() => {
                                                    toast.info(`Xem chi tiết xe ${vehicle.vin}`);
                                                }}
                                            >
                                                📋 Chi tiết
                                            </button>
                                            <button
                                                className="action-btn secondary"
                                                onClick={() => {
                                                    toast.info(`Quản lý bảo hành xe ${vehicle.vin}`);
                                                }}
                                            >
                                                🔧 Bảo hành
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleListModal;