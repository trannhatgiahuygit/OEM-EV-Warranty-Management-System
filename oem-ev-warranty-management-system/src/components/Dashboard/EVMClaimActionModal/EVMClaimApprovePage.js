// EVMClaimApprovePage.js 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import ClaimContextCard from './ClaimContextCard'; 
import './EVMClaimActionForm.css'; 

const initialApprovalData = {
    approvalNotes: '',
    warrantyCost: 0, 
    approvalReason: '',
    requiresPartsShipment: true,
    specialInstructions: '',
    internalNotes: '',
    companyPaidCost: '', 
};

const EVMClaimApprovePage = ({ 
    claimId, 
    claimNumber, 
    warrantyCost, // RENAMED PROP from estimatedCost
    vin, 
    reportedFailure, 
    onActionComplete, 
    handleBack 
}) => {
    // Debug: Log the warrantyCost prop received
    console.log('EVMClaimApprovePage - warrantyCost received:', warrantyCost, 'Type:', typeof warrantyCost);
    
    const [formData, setFormData] = useState({ 
        ...initialApprovalData, 
        warrantyCost: (warrantyCost === 0 || warrantyCost === undefined) ? '' : warrantyCost
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feesPaidConfirmation, setFeesPaidConfirmation] = useState(false); // Confirmation checkbox (not in payload)
    
    // ===== NEW: Part Assignment States =====
    const [claimParts, setClaimParts] = useState([]); // Parts required for this claim
    const [partAssignments, setPartAssignments] = useState([]); // Selected serials for each part
    const [availableSerials, setAvailableSerials] = useState({}); // Available serials per part
    const [loadingParts, setLoadingParts] = useState(false);
    
    useEffect(() => {
        console.log('EVMClaimApprovePage - useEffect warrantyCost:', warrantyCost);
        setFormData(prev => ({ 
            ...prev, 
            warrantyCost: (warrantyCost === 0 || warrantyCost === undefined) ? '' : warrantyCost
        }));
    }, [warrantyCost]);
    
    // ===== NEW: Fetch claim details and required parts =====
    useEffect(() => {
        const fetchClaimAndParts = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.token || !claimId) return;
            
            setLoadingParts(true);
            try {
                // Fetch claim details
                const claimResponse = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/claims/${claimId}`,
                    { headers: { 'Authorization': `Bearer ${user.token}` } }
                );
                
                if (claimResponse.status === 200) {
                    const claimData = claimResponse.data;
                    // Extract parts from claim (could be from partsUsed or requiredParts)
                    const parts = claimData.partsUsed || claimData.requiredParts || [];
                    setClaimParts(parts);
                    
                    // Initialize part assignments
                    const initialAssignments = parts.map(part => ({
                        partId: part.partId,
                        partName: part.partName || part.part?.name,
                        quantity: part.quantity || 1,
                        serialNumbers: [] // Array of serial numbers for this part
                    }));
                    setPartAssignments(initialAssignments);
                    
                    // Fetch available serials for each part
                    for (const part of parts) {
                        if (part.partId) {
                            try {
                                const serialsResponse = await axios.get(
                                    `${process.env.REACT_APP_API_URL}/api/part-serials/available`,
                                    {
                                        params: { partId: part.partId },
                                        headers: { 'Authorization': `Bearer ${user.token}` }
                                    }
                                );
                                if (serialsResponse.status === 200) {
                                    setAvailableSerials(prev => ({
                                        ...prev,
                                        [part.partId]: serialsResponse.data || []
                                    }));
                                }
                            } catch (err) {
                                console.warn(`Could not fetch serials for part ${part.partId}:`, err);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Could not fetch claim parts:', err);
            } finally {
                setLoadingParts(false);
            }
        };
        
        fetchClaimAndParts();
    }, [claimId]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' 
                ? checked 
                : (type === 'number' 
                    ? (value === '' ? '' : parseFloat(value)) 
                    : value),
        }));
    };
    
    // ===== NEW: Handle part serial assignment =====
    const handleAddSerialToPart = (partId, serialNumber) => {
        setPartAssignments(prev => prev.map(pa => {
            if (pa.partId === partId) {
                const updated = [...(pa.serialNumbers || [])];
                if (!updated.includes(serialNumber)) {
                    updated.push(serialNumber);
                }
                return { ...pa, serialNumbers: updated };
            }
            return pa;
        }));
    };
    
    const handleRemoveSerialFromPart = (partId, serialNumber) => {
        setPartAssignments(prev => prev.map(pa => {
            if (pa.partId === partId) {
                return {
                    ...pa,
                    serialNumbers: (pa.serialNumbers || []).filter(sn => sn !== serialNumber)
                };
            }
            return pa;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.approvalReason || formData.approvalReason.trim() === '') {
            toast.error('Lý do phê duyệt là bắt buộc.');
            return;
        }

        if (!formData.warrantyCost || isNaN(formData.warrantyCost) || parseFloat(formData.warrantyCost) <= 0) {
            toast.error('Chi phí Bảo hành là bắt buộc và phải lớn hơn 0.');
            return;
        }

        if (!formData.companyPaidCost || isNaN(formData.companyPaidCost) || parseFloat(formData.companyPaidCost) <= 0) {
            toast.error('Chi phí Công ty Thanh toán là bắt buộc và phải lớn hơn 0.');
            return;
        }

        const warrantyCostNum = parseFloat(formData.warrantyCost);
        const companyPaidCostNum = parseFloat(formData.companyPaidCost);

        if (companyPaidCostNum < warrantyCostNum) {
            toast.error('Chi phí Công ty Thanh toán phải bằng hoặc cao hơn Chi phí Bảo hành.');
            return;
        }

        if (!formData.specialInstructions || formData.specialInstructions.trim() === '') {
            toast.error('Hướng dẫn Đặc biệt là bắt buộc.');
            return;
        }

        if (!formData.internalNotes || formData.internalNotes.trim() === '') {
            toast.error('Ghi chú Nội bộ là bắt buộc.');
            return;
        }

        if (!formData.approvalNotes || formData.approvalNotes.trim() === '') {
            toast.error('Ghi chú Phê duyệt EVM (Bên ngoài) là bắt buộc.');
            return;
        }

        if (!feesPaidConfirmation) {
            toast.error('Vui lòng xác nhận rằng tất cả phí đã được thanh toán cho Trung tâm Dịch vụ bởi EVM.');
            return;
        }

        // If Company Paid Cost is higher than Warranty Cost, ask for confirmation
        if (companyPaidCostNum > warrantyCostNum) {
            const confirmMessage = `Chi phí Công ty Thanh toán (₫${companyPaidCostNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) cao hơn Chi phí Bảo hành (₫${warrantyCostNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).\n\nĐiều này có đúng không?`;
            if (!window.confirm(confirmMessage)) {
                return; // User cancelled, don't submit
            }
        }

        // ===== NEW: Build part assignments payload =====
        const assignments = partAssignments
            .filter(pa => pa.serialNumbers && pa.serialNumbers.length > 0)
            .flatMap(pa => 
                pa.serialNumbers.map(serialNumber => ({
                    partId: pa.partId,
                    serialNumber: serialNumber,
                    notes: `Assigned during EVM approval for claim ${claimNumber}`
                }))
            );
        
        const payload = {
            ...formData,
            partAssignments: assignments
        };
        
        setIsSubmitting(true);
        const endpoint = `${process.env.REACT_APP_API_URL}/api/evm/claims/${claimId}/approve`;
        
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            // Note: feesPaidConfirmation is NOT included in the payload
            const response = await axios.post(
                endpoint,
                payload,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );

            if (response.status === 200) {
                toast.success(`Yêu cầu ${claimNumber} đã được phê duyệt thành công! ${assignments.length > 0 ? `Đã gán ${assignments.length} phụ tùng.` : ''}`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Không thể phê duyệt yêu cầu.`;
            if (error.response) {
                errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="evm-action-page-wrapper">
            <div className="evm-action-header">
                 <button onClick={handleBack} className="evm-back-button">
                    ← Quay lại Chi tiết
                </button>
                <h2 className="evm-action-title">Phê duyệt Yêu cầu - {claimNumber}</h2>
            </div>
            <motion.div 
                className="evm-action-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <ClaimContextCard
                    claimNumber={claimNumber}
                    vin={vin}
                    failure={reportedFailure}
                    warrantyCost={warrantyCost} 
                />
                
                <form 
                    onSubmit={handleSubmit} 
                    className="evm-action-form"
                >
                    
                    {/* --- APPROVAL REASON SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="approvalReason">Lý do Phê duyệt</label>
                        <textarea 
                            id="approvalReason"
                            name="approvalReason" 
                            value={formData.approvalReason} 
                            onChange={handleChange} 
                            required
                            rows="3"
                            placeholder="Cung cấp lý do rõ ràng để phê duyệt yêu cầu này..."
                        />
                    </div>

                    {/* --- COSTS, INSTRUCTIONS, NOTES SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                            {/* Empty separator */}
                        </div>

                        {/* Cost Fields */}
                        <div className="form-group required">
                            <label htmlFor="warrantyCost">Chi phí Bảo hành (₫)</label>
                            <input 
                                type="number" 
                                id="warrantyCost"
                                name="warrantyCost" 
                                value={formData.warrantyCost} 
                                onChange={handleChange} 
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group required">
                            <label htmlFor="companyPaidCost">Chi phí Công ty Thanh toán (₫)</label>
                            <input 
                                type="number" 
                                id="companyPaidCost"
                                name="companyPaidCost" 
                                value={formData.companyPaidCost} 
                                onChange={handleChange} 
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>

                        {/* Instructions (Full Width) */}
                        <div className="form-group full-width required">
                            <label htmlFor="specialInstructions">Hướng dẫn Đặc biệt</label>
                            <input 
                                type="text" 
                                id="specialInstructions"
                                name="specialInstructions" 
                                value={formData.specialInstructions} 
                                onChange={handleChange} 
                                required
                                placeholder="Bất kỳ hướng dẫn đặc biệt nào cho trung tâm dịch vụ..."
                            />
                        </div>
                        
                        {/* Internal Notes (Full Width) */}
                        <div className="form-group full-width required">
                            <label htmlFor="internalNotes">Ghi chú Nội bộ (Chỉ EVM)</label>
                            <textarea 
                                id="internalNotes"
                                name="internalNotes" 
                                value={formData.internalNotes} 
                                onChange={handleChange} 
                                required
                                rows="3"
                                placeholder="Ghi chú nội bộ chỉ hiển thị cho nhân viên EVM..."
                            />
                        </div>

                        {/* Approval Notes (External) (Full Width) */}
                        <div className="form-group full-width required">
                            <label htmlFor="approvalNotes">Ghi chú Phê duyệt EVM (Bên ngoài)</label>
                            <textarea 
                                id="approvalNotes"
                                name="approvalNotes" 
                                value={formData.approvalNotes} 
                                onChange={handleChange} 
                                required
                                rows="3"
                                placeholder="Ghi chú sẽ hiển thị cho trung tâm dịch vụ..."
                            />
                        </div>

                        {/* Checkbox Section (Full Width) */}
                        <div className="form-group full-width">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="requiresPartsShipment" 
                                    name="requiresPartsShipment" 
                                    checked={formData.requiresPartsShipment}
                                    onChange={handleChange}
                                />
                                <label htmlFor="requiresPartsShipment">Yêu cầu Vận chuyển Phụ tùng</label>
                            </div>
                        </div>

                        {/* Confirmation Checkbox (Full Width) - NOT in payload */}
                        <div className="form-group full-width required">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="feesPaidConfirmation" 
                                    checked={feesPaidConfirmation}
                                    onChange={(e) => setFeesPaidConfirmation(e.target.checked)}
                                    required
                                />
                                <label htmlFor="feesPaidConfirmation">Tất cả phí đã được thanh toán cho Trung tâm Dịch vụ bởi EVM</label>
                            </div>
                        </div>
                    </div>
                    
                    {/* ===== NEW: Part Assignment Section ===== */}
                    {claimParts.length > 0 && (
                        <div className="evm-form-section">
                            <h3 className="evm-section-title">Gán Phụ tùng cho Xe</h3>
                            <p className="evm-section-description">
                                Chọn serial số cho từng phụ tùng cần gán vào xe trong quá trình phê duyệt.
                            </p>
                            
                            {loadingParts ? (
                                <p>Đang tải danh sách phụ tùng...</p>
                            ) : (
                                <div className="evm-part-assignments">
                                    {partAssignments.map((pa, idx) => (
                                        <div key={pa.partId || idx} className="evm-part-assignment-item">
                                            <div className="evm-part-assignment-header">
                                                <h4>{pa.partName || `Phụ tùng #${pa.partId}`}</h4>
                                                <span className="evm-part-quantity">Số lượng: {pa.quantity}</span>
                                            </div>
                                            
                                            {/* Selected Serials */}
                                            {pa.serialNumbers && pa.serialNumbers.length > 0 && (
                                                <div className="evm-selected-serials">
                                                    <label>Đã chọn ({pa.serialNumbers.length}):</label>
                                                    <div className="evm-serial-tags">
                                                        {pa.serialNumbers.map((sn, snIdx) => (
                                                            <span key={snIdx} className="evm-serial-tag">
                                                                {sn}
                                                                <button
                                                                    type="button"
                                                                    className="evm-remove-serial-btn"
                                                                    onClick={() => handleRemoveSerialFromPart(pa.partId, sn)}
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Available Serials List */}
                                            {availableSerials[pa.partId] && availableSerials[pa.partId].length > 0 && (
                                                <div className="evm-available-serials">
                                                    <label>Serial số khả dụng:</label>
                                                    <div className="evm-serial-list">
                                                        {availableSerials[pa.partId]
                                                            .filter(serial => 
                                                                !pa.serialNumbers || 
                                                                !pa.serialNumbers.includes(serial.serialNumber)
                                                            )
                                                            .slice(0, 10)
                                                            .map((serial) => (
                                                                <button
                                                                    key={serial.id}
                                                                    type="button"
                                                                    className="evm-serial-btn"
                                                                    onClick={() => handleAddSerialToPart(pa.partId, serial.serialNumber)}
                                                                    disabled={
                                                                        pa.serialNumbers && 
                                                                        pa.serialNumbers.length >= pa.quantity
                                                                    }
                                                                >
                                                                    {serial.serialNumber}
                                                                    {serial.status && (
                                                                        <span className="evm-serial-status">({serial.status})</span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                    </div>
                                                    {pa.serialNumbers && pa.serialNumbers.length >= pa.quantity && (
                                                        <p className="evm-quantity-warning">
                                                            Đã đủ số lượng ({pa.quantity})
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {(!availableSerials[pa.partId] || availableSerials[pa.partId].length === 0) && (
                                                <p className="evm-no-serials">Không có serial số khả dụng cho phụ tùng này.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="evm-action-actions">
                        <button 
                            type="button" 
                            className="evm-cancel-btn" 
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            className="evm-primary-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang phê duyệt...' : 'Phê duyệt & Hoàn tất'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EVMClaimApprovePage;