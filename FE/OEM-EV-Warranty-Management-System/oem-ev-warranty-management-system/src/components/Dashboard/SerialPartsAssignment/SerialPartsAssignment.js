import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { serialPartsService } from '../../../services/serialPartsService';
import { extractVehicleTypeForAPI } from '../../../utils/vehicleClassification';
import { toast } from 'react-toastify';
import './SerialPartsAssignment.css';

/**
 * SerialPartsAssignment Component
 * Automatically assigns serial parts to vehicle when work order is completed
 */
const SerialPartsAssignment = ({ workOrder, onAssignmentComplete, onCancel }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [availableParts, setAvailableParts] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [vehicleType, setVehicleType] = useState(null);

    useEffect(() => {
        if (workOrder?.partsUsed?.length > 0) {
            loadVehicleAndParts();
        }
    }, [workOrder]);

    // Fetch vehicle information to get vehicleType
    const fetchVehicleType = async () => {
        // First, try to get vehicleType from workOrder.vehicle if available
        if (workOrder.vehicle) {
            const type = extractVehicleTypeForAPI(workOrder.vehicle);
            if (type) {
                return type;
            }
        }

        // If not available, fetch vehicle by vehicleId
        if (workOrder.vehicleId) {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || !user.token) {
                    console.warn('No user token available for fetching vehicle');
                    return null;
                }

                const vehicleResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/vehicles/${workOrder.vehicleId}`,
                    { headers: { 'Authorization': `Bearer ${user.token}` } }
                );

                if (vehicleResponse.status === 200 && vehicleResponse.data) {
                    const type = extractVehicleTypeForAPI(vehicleResponse.data);
                    if (type) {
                        console.log('SerialPartsAssignment - Vehicle type extracted:', type);
                        return type;
                    }
                }
            } catch (err) {
                console.warn('Could not fetch vehicle for vehicleType:', err);
                // Don't throw error, just continue without vehicleType filter
            }
        }

        return null;
    };

    const loadVehicleAndParts = async () => {
        try {
            setIsProcessing(true);
            setError(null);

            // Fetch vehicleType first
            const extractedVehicleType = await fetchVehicleType();
            setVehicleType(extractedVehicleType);

            // Load available serial parts for each part used in work order
            const partsPromises = workOrder.partsUsed.map(async (part) => {
                try {
                    // Use service with vehicleType filter
                    const availableSerials = await serialPartsService.getAvailableSerialPartsByPartId(
                        part.id,
                        extractedVehicleType
                    );
                    return {
                        ...part,
                        availableSerials: availableSerials || []
                    };
                } catch (err) {
                    console.error(`Failed to load serials for part ${part.id}:`, err);
                    toast.warning(
                        `Không thể tải serials cho phụ tùng ${part.name || part.partName || part.id}.`,
                        { autoClose: 3000 }
                    );
                    return {
                        ...part,
                        availableSerials: []
                    };
                }
            });

            const partsResults = await Promise.all(partsPromises);
            setAvailableParts(partsResults);

            // Initialize assignments
            const initialAssignments = partsResults.map(part => ({
                partId: part.id,
                partType: part.partType || 'EVM',
                partName: part.name || part.partName,
                quantity: part.quantity || 1,
                selectedSerials: []
            }));

            setAssignments(initialAssignments);

        } catch (err) {
            setError('Không thể tải danh sách linh kiện serial. Vui lòng thử lại.');
            console.error('Load available parts failed:', err);
            toast.error('Không thể tải danh sách linh kiện serial. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSerialSelection = (partIndex, serialNumbers) => {
        setAssignments(prev => prev.map((assignment, index) =>
            index === partIndex
                ? { ...assignment, selectedSerials: serialNumbers }
                : assignment
        ));
    };

    const processAutoAssignment = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Validate all parts have required selections
            const missingSelections = assignments.filter(a => a.selectedSerials.length !== a.quantity);
            if (missingSelections.length > 0) {
                setError('Vui lòng chọn đủ số lượng serial cho tất cả các linh kiện.');
                setIsProcessing(false);
                return;
            }

            // Prepare assignment data
            const assignmentData = assignments.flatMap(assignment =>
                assignment.selectedSerials.map(serialNumber => ({
                    partId: assignment.partId,
                    partType: assignment.partType,
                    serialNumber: serialNumber,
                    vehicleId: workOrder.vehicleId
                }))
            );

            // Execute assignment
            await serialPartsService.assignSerialPartsToVehicle(
                workOrder.id,
                assignmentData
            );

            // Update serial parts status in batch
            const statusUpdates = assignmentData.map(assignment => ({
                serialNumber: assignment.serialNumber,
                status: 'INSTALLED',
                location: 'CUSTOMER_VEHICLE'
            }));

            await serialPartsService.batchUpdateSerialPartsStatus(statusUpdates);

            setSuccess(true);
            toast.success('Gán serial linh kiện thành công!', {
                position: 'top-right'
            });

            // Notify parent component
            if (onAssignmentComplete) {
                onAssignmentComplete(assignmentData);
            }

        } catch (err) {
            const errorMsg = err.message || 'Không thể gán serial linh kiện. Vui lòng thử lại.';
            setError(errorMsg);
            toast.error(errorMsg, {
                position: 'top-right'
            });
            console.error('Assignment failed:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    // Loading state
    if (isProcessing && availableParts.length === 0) {
        return (
            <div className="serial-assignment">
                <div className="serial-assignment__loading">
                    <div className="loading-spinner"></div>
                    <span>Đang tải danh sách linh kiện serial...</span>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="serial-assignment">
                <div className="serial-assignment__success">
                    <div className="success-icon">✅</div>
                    <h3>Gán Serial Linh Kiện Thành Công!</h3>
                    <p>Tất cả linh kiện đã được gán vào xe khách hàng và cập nhật trạng thái trong kho.</p>
                </div>
            </div>
        );
    }

    // Check if no parts need serial assignment
    if (availableParts.length === 0 && !isProcessing) {
        return (
            <div className="serial-assignment">
                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <h4>Không có linh kiện cần gán serial</h4>
                    <p>Work order này không có linh kiện cần theo dõi serial.</p>
                </div>
            </div>
        );
    }

    // Check if all selected
    const allSelected = assignments.every(a => a.selectedSerials.length === a.quantity);
    const totalRequired = assignments.reduce((sum, a) => sum + a.quantity, 0);
    const totalSelected = assignments.reduce((sum, a) => sum + a.selectedSerials.length, 0);

    return (
        <div className="serial-assignment">
            <div className="serial-assignment__header">
                <h3>Gán Serial Linh Kiện</h3>
                <p>
                    Work Order: <strong>{workOrder?.id}</strong> |
                    Xe: <strong>{workOrder?.vehicleVin || workOrder?.vehicleId}</strong> |
                    Tổng cần chọn: <strong>{totalSelected}/{totalRequired}</strong>
                </p>
            </div>

            {error && (
                <div className="serial-assignment__error">
                    <span className="error-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="serial-assignment__parts">
                {availableParts.map((part, partIndex) => (
                    <SerialPartSelector
                        key={part.id || partIndex}
                        part={part}
                        assignment={assignments[partIndex]}
                        onSelectionChange={(serials) => handleSerialSelection(partIndex, serials)}
                        disabled={isProcessing}
                    />
                ))}
            </div>

            <div className="serial-assignment__actions">
                {onCancel && (
                    <button
                        className="btn btn--secondary"
                        onClick={onCancel}
                        disabled={isProcessing}
                    >
                        Hủy
                    </button>
                )}
                <button
                    className="btn btn--primary"
                    onClick={processAutoAssignment}
                    disabled={isProcessing || !allSelected}
                >
                    {isProcessing ? (
                        <>
                            <div className="loading-spinner"></div>
                            <span>Đang xử lý...</span>
                        </>
                    ) : (
                        'Gán Serial Tự Động'
                    )}
                </button>
            </div>
        </div>
    );
};

/**
 * SerialPartSelector Component
 * Individual part selector for serial numbers
 */
const SerialPartSelector = ({ part, assignment, onSelectionChange, disabled }) => {
    const [selectedSerials, setSelectedSerials] = useState([]);

    useEffect(() => {
        if (assignment?.selectedSerials) {
            setSelectedSerials(assignment.selectedSerials);
        }
    }, [assignment]);

    const handleSerialToggle = (serialNumber) => {
        if (disabled) return;

        let newSelection;
        if (selectedSerials.includes(serialNumber)) {
            // Deselect
            newSelection = selectedSerials.filter(s => s !== serialNumber);
        } else if (selectedSerials.length < part.quantity) {
            // Select if not at max
            newSelection = [...selectedSerials, serialNumber];
        } else {
            // Max reached, show warning
            toast.warning(`Chỉ cần chọn ${part.quantity} serial cho linh kiện này.`, {
                position: 'top-right'
            });
            return;
        }

        setSelectedSerials(newSelection);
        onSelectionChange(newSelection);
    };

    const autoSelectSerials = () => {
        if (disabled) return;

        if (part.availableSerials.length < part.quantity) {
            toast.error('Không đủ serial khả dụng cho linh kiện này.', {
                position: 'top-right'
            });
            return;
        }

        const autoSelected = part.availableSerials
            .slice(0, part.quantity)
            .map(serial => serial.serialNumber);

        setSelectedSerials(autoSelected);
        onSelectionChange(autoSelected);
    };

    const isComplete = selectedSerials.length === part.quantity;

    return (
        <div className="serial-part-selector">
            <div className="part-info">
                <h4>{part.partName || part.name}</h4>
                <p>
                    <strong>Loại:</strong> {part.partType || 'N/A'} |
                    <strong> Số lượng cần:</strong> {part.quantity}
                </p>
            </div>

            <div className="part-actions">
                <div className={`selection-counter ${isComplete ? 'complete' : ''}`}>
                    <span>Đã chọn:</span>
                    <span className="count">{selectedSerials.length}/{part.quantity}</span>
                </div>
                <button
                    className="btn btn--secondary btn--sm"
                    onClick={autoSelectSerials}
                    disabled={disabled || part.availableSerials.length < part.quantity || isComplete}
                >
                    {isComplete ? '✓ Đã đủ' : 'Chọn tự động'}
                </button>
            </div>

            <div className="serial-list">
                {part.availableSerials.length === 0 ? (
                    <div className="no-serials">
                        ⚠️ Không có serial linh kiện khả dụng trong kho
                    </div>
                ) : (
                    part.availableSerials.map((serial, index) => (
                        <div
                            key={serial.serialNumber || index}
                            className={`serial-item ${selectedSerials.includes(serial.serialNumber) ? 'selected' : ''
                                } ${disabled ? 'disabled' : ''}`}
                            onClick={() => handleSerialToggle(serial.serialNumber)}
                        >
                            <span className="serial-number">{serial.serialNumber}</span>
                            <span className={`serial-status ${(serial.status || '').toLowerCase()}`}>
                                {serial.status || 'IN_STOCK'}
                            </span>
                            <span className="serial-location">
                                {serial.location === 'EVM_WAREHOUSE' ? 'Kho EVM' :
                                    serial.location === 'THIRD_PARTY_WAREHOUSE' ? 'Kho bên thứ 3' :
                                        serial.location || 'N/A'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SerialPartsAssignment;
