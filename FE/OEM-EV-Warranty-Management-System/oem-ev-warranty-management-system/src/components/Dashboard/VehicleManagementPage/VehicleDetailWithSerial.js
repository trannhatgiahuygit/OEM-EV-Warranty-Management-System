import React, { useState, useEffect } from 'react';
import VehicleSerialHistory from '../VehicleSerialHistory/VehicleSerialHistory';
import axios from 'axios';
import { toast } from 'react-toastify';
import './VehicleDetailWithSerial.css';

/**
 * VehicleDetailWithSerial Component
 * Displays vehicle information with serial parts history
 */
const VehicleDetailWithSerial = ({ vehicleId, onClose }) => {
    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (vehicleId) {
            loadVehicleDetails();
        }
    }, [vehicleId]);

    const loadVehicleDetails = async () => {
        try {
            setLoading(true);
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/vehicles/${vehicleId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                }
            );

            setVehicle(response.data);
        } catch (error) {
            console.error('Failed to load vehicle details:', error);
            toast.error('Không thể tải thông tin xe.', {
                position: 'top-right'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch (e) {
            return 'N/A';
        }
    };

    if (loading) {
        return (
            <div className="vehicle-detail-modal">
                <div className="modal-overlay" onClick={onClose}></div>
                <div className="modal-content">
                    <div className="loading">Đang tải thông tin xe...</div>
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="vehicle-detail-modal">
                <div className="modal-overlay" onClick={onClose}></div>
                <div className="modal-content">
                    <div className="error">Không tìm thấy thông tin xe.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-detail-modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Chi tiết Xe - {vehicle.vin}</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="vehicle-info-section">
                    <h3>Thông tin Xe</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">VIN:</span>
                            <span className="value">{vehicle.vin}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Mẫu xe:</span>
                            <span className="value">{vehicle.vehicleModelName || vehicle.modelName || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Số km:</span>
                            <span className="value">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Ngày sản xuất:</span>
                            <span className="value">{formatDate(vehicle.manufacturingDate)}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Ngày bảo hành:</span>
                            <span className="value">{formatDate(vehicle.warrantyDate)}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Chủ xe:</span>
                            <span className="value">{vehicle.customerName || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Số điện thoại:</span>
                            <span className="value">{vehicle.customerPhone || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Email:</span>
                            <span className="value">{vehicle.customerEmail || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Serial Parts History Section */}
                <VehicleSerialHistory
                    vehicleId={vehicle.id}
                    vehicleVin={vehicle.vin}
                />
            </div>
        </div>
    );
};

export default VehicleDetailWithSerial;
