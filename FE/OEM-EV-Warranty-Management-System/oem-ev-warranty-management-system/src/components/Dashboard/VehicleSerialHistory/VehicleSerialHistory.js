import React, { useState, useEffect } from 'react';
import { serialPartsService } from '../../../services/serialPartsService';
import './VehicleSerialHistory.css';

/**
 * VehicleSerialHistory Component
 * Displays the history of serial parts assigned to a vehicle
 */
const VehicleSerialHistory = ({ vehicleId, vehicleVin }) => {
    const [serialParts, setSerialParts] = useState([]);
    const [filteredParts, setFilteredParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (vehicleId) {
            loadVehicleSerialParts();
        }
    }, [vehicleId]);

    useEffect(() => {
        filterParts();
    }, [serialParts, statusFilter, searchTerm]);

    const loadVehicleSerialParts = async () => {
        try {
            setLoading(true);
            const parts = await serialPartsService.getVehicleSerialParts(vehicleId);
            setSerialParts(parts || []);
        } catch (error) {
            console.error('Failed to load vehicle serial parts:', error);
            setSerialParts([]);
        } finally {
            setLoading(false);
        }
    };

    const filterParts = () => {
        let filtered = [...serialParts];

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(part =>
                (part.status || '').toLowerCase() === statusFilter.toLowerCase()
            );
        }

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(part =>
                (part.serialNumber || '').toLowerCase().includes(term) ||
                (part.partName || '').toLowerCase().includes(term) ||
                (part.partType || '').toLowerCase().includes(term)
            );
        }

        setFilteredParts(filtered);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'N/A';
        }
    };

    const getStatusClass = (status) => {
        if (!status) return 'in_stock';
        return status.toLowerCase().replace(/ /g, '_');
    };

    const getStatusLabel = (status) => {
        const statusMap = {
            'IN_STOCK': 'Trong kho',
            'ASSIGNED': 'Đã phân công',
            'INSTALLED': 'Đã lắp đặt',
            'REPLACED': 'Đã thay thế',
            'DEFECTIVE': 'Lỗi'
        };
        return statusMap[status] || status;
    };

    // Calculate summary statistics
    const summary = {
        total: serialParts.length,
        installed: serialParts.filter(p => p.status === 'INSTALLED').length,
        replaced: serialParts.filter(p => p.status === 'REPLACED').length,
        defective: serialParts.filter(p => p.status === 'DEFECTIVE').length
    };

    if (loading) {
        return (
            <div className="vehicle-serial-history">
                <div className="loading">Đang tải lịch sử linh kiện...</div>
            </div>
        );
    }

    return (
        <div className="vehicle-serial-history">
            <h3>Lịch Sử Serial Linh Kiện {vehicleVin && `- Xe ${vehicleVin}`}</h3>

            {serialParts.length > 0 && (
                <>
                    {/* Summary Cards */}
                    <div className="serial-summary">
                        <div className="summary-card primary">
                            <div className="summary-card__label">Tổng số linh kiện</div>
                            <div className="summary-card__value">{summary.total}</div>
                        </div>
                        <div className="summary-card success">
                            <div className="summary-card__label">Đã lắp đặt</div>
                            <div className="summary-card__value">{summary.installed}</div>
                        </div>
                        <div className="summary-card warning">
                            <div className="summary-card__label">Đã thay thế</div>
                            <div className="summary-card__value">{summary.replaced}</div>
                        </div>
                        <div className="summary-card danger">
                            <div className="summary-card__label">Lỗi</div>
                            <div className="summary-card__value">{summary.defective}</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="serial-history-filters">
                        <div className="filter-group">
                            <label>Trạng thái:</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả</option>
                                <option value="in_stock">Trong kho</option>
                                <option value="assigned">Đã phân công</option>
                                <option value="installed">Đã lắp đặt</option>
                                <option value="replaced">Đã thay thế</option>
                                <option value="defective">Lỗi</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Tìm kiếm:</label>
                            <input
                                type="text"
                                placeholder="Serial, tên linh kiện..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </>
            )}

            {filteredParts.length === 0 ? (
                <div className="no-data">
                    <div className="no-data-icon">📦</div>
                    <p>
                        {serialParts.length === 0
                            ? 'Chưa có linh kiện nào được gán cho xe này.'
                            : 'Không tìm thấy linh kiện phù hợp với bộ lọc.'}
                    </p>
                </div>
            ) : (
                <div className="serial-parts-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Serial Number</th>
                                <th>Tên Linh Kiện</th>
                                <th>Loại</th>
                                <th>Ngày Gán</th>
                                <th>Trạng Thái</th>
                                <th>Vị Trí</th>
                                <th>Work Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParts.map((part, index) => (
                                <tr key={part.id || part.serialNumber || index}>
                                    <td className="serial-number">{part.serialNumber || 'N/A'}</td>
                                    <td>{part.partName || 'N/A'}</td>
                                    <td>{part.partType || 'N/A'}</td>
                                    <td>{formatDate(part.assignedDate || part.createdAt)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(part.status)}`}>
                                            {getStatusLabel(part.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {part.location === 'EVM_WAREHOUSE' ? 'Kho EVM' :
                                            part.location === 'THIRD_PARTY_WAREHOUSE' ? 'Kho bên thứ 3' :
                                                part.location === 'CUSTOMER_VEHICLE' ? 'Xe khách hàng' :
                                                    part.location || 'N/A'}
                                    </td>
                                    <td>{part.workOrderId || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default VehicleSerialHistory;
