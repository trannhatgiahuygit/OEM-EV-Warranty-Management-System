import React, { useState, useEffect } from 'react';
import SerialPartsAssignment from '../SerialPartsAssignment/SerialPartsAssignment';
import { toast } from 'react-toastify';
import axios from 'axios';

/**
 * WorkOrderDetail Component - Example Integration
 * This shows how to integrate SerialPartsAssignment into work order management
 */
const WorkOrderDetailWithSerial = ({ workOrderId, onClose }) => {
    const [workOrder, setWorkOrder] = useState(null);
    const [showSerialAssignment, setShowSerialAssignment] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (workOrderId) {
            loadWorkOrder();
        }
    }, [workOrderId]);

    const loadWorkOrder = async () => {
        try {
            setLoading(true);
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/work-orders/${workOrderId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                }
            );

            setWorkOrder(response.data);

            // Auto-show serial assignment if work order is DONE and has parts
            if (response.data.status === 'DONE' && response.data.partsUsed?.length > 0) {
                setShowSerialAssignment(true);
            }

        } catch (error) {
            console.error('Failed to load work order:', error);
            toast.error('Không thể tải thông tin work order.', {
                position: 'top-right'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;

            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/work-orders/${workOrderId}/status`,
                { status: newStatus },
                {
                    headers: {
                        'Authorization': `Bearer ${user?.token}`
                    }
                }
            );

            setWorkOrder(prev => ({ ...prev, status: newStatus }));

            toast.success('Cập nhật trạng thái work order thành công!', {
                position: 'top-right'
            });

            // If status becomes DONE and has parts, show serial assignment
            if (newStatus === 'DONE' && workOrder?.partsUsed?.length > 0) {
                setShowSerialAssignment(true);
            }

        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Không thể cập nhật trạng thái work order.', {
                position: 'top-right'
            });
        }
    };

    const handleSerialAssignmentComplete = (assignments) => {
        console.log('Serial assignment completed:', assignments);
        setShowSerialAssignment(false);

        toast.success(
            `Đã gán ${assignments.length} serial linh kiện vào xe khách hàng thành công!`,
            {
                position: 'top-right',
                autoClose: 5000
            }
        );

        // Optionally reload work order to get updated data
        loadWorkOrder();
    };

    const handleCancelAssignment = () => {
        setShowSerialAssignment(false);
        toast.info('Đã hủy gán serial linh kiện.', {
            position: 'top-right'
        });
    };

    if (loading) {
        return (
            <div className="work-order-detail">
                <div className="loading">Đang tải thông tin work order...</div>
            </div>
        );
    }

    if (!workOrder) {
        return (
            <div className="work-order-detail">
                <div className="error">Không tìm thấy work order.</div>
            </div>
        );
    }

    return (
        <div className="work-order-detail">
            <div className="work-order-header">
                <h2>Work Order #{workOrder.id}</h2>
                <button className="btn-close" onClick={onClose}>✕</button>
            </div>

            <div className="work-order-info">
                <div className="info-row">
                    <span className="label">Trạng thái:</span>
                    <span className={`status-badge ${workOrder.status}`}>
                        {workOrder.status}
                    </span>
                </div>
                <div className="info-row">
                    <span className="label">Xe:</span>
                    <span>{workOrder.vehicleVin || workOrder.vehicleId}</span>
                </div>
                <div className="info-row">
                    <span className="label">Kỹ thuật viên:</span>
                    <span>{workOrder.technicianName || 'N/A'}</span>
                </div>
                <div className="info-row">
                    <span className="label">Ngày tạo:</span>
                    <span>{new Date(workOrder.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
            </div>

            {/* Parts Used Section */}
            {workOrder.partsUsed?.length > 0 && (
                <div className="work-order-parts">
                    <h3>Linh kiện sử dụng</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Tên linh kiện</th>
                                <th>Loại</th>
                                <th>Số lượng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workOrder.partsUsed.map((part, index) => (
                                <tr key={index}>
                                    <td>{part.partName || part.name}</td>
                                    <td>{part.partType}</td>
                                    <td>{part.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Serial Assignment Section - Shows when work order is DONE */}
            {showSerialAssignment && (
                <SerialPartsAssignment
                    workOrder={workOrder}
                    onAssignmentComplete={handleSerialAssignmentComplete}
                    onCancel={handleCancelAssignment}
                />
            )}

            {/* Status Update Controls */}
            <div className="work-order-actions">
                {workOrder.status !== 'DONE' && (
                    <button
                        className="btn btn--primary"
                        onClick={() => handleStatusUpdate('DONE')}
                    >
                        Hoàn thành Work Order
                    </button>
                )}

                {workOrder.status === 'DONE' && !showSerialAssignment && workOrder.partsUsed?.length > 0 && (
                    <button
                        className="btn btn--secondary"
                        onClick={() => setShowSerialAssignment(true)}
                    >
                        Gán Serial Linh Kiện
                    </button>
                )}
            </div>
        </div>
    );
};

export default WorkOrderDetailWithSerial;
