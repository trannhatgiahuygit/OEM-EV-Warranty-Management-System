// ClaimDetailPage.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaFileAlt } from 'react-icons/fa'; 
import './ClaimDetailPage.css';

// Helper function to format date
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } catch (error) {
        return 'Ngày không hợp lệ';
    }
};

const DetailCard = ({ title, children }) => (
    <motion.div
        className="cd-detail-card"
        variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
        }}
    >
        <h3 className="cd-card-title">{title}</h3>
        <div className="cd-card-body">{children}</div>
    </motion.div>
);

const DetailItem = ({ label, value }) => (
    <div className="cd-detail-item">
        <span className="cd-detail-label">{label}</span>
        <span className="cd-detail-value">{value || 'N/A'}</span>
    </div>
);

// --- MODIFIED: Added onNavigateToApprove and onNavigateToReject props ---
const ClaimDetailPage = ({ 
    claimId, 
    onBackClick, 
    onProcessToIntake, 
    onEditDraftClaim, 
    onUpdateDiagnostic, 
    onSubmitToEVM, 
    // NEW PROPS FOR EVM NAVIGATION
    onNavigateToApprove, 
    onNavigateToReject,  
    // NEW PROP FOR TECHNICIAN SUBMISSION FORM
    onNavigateToTechSubmitEVM,
    // NEW PROP FOR PROBLEM REPORTING
    onNavigateToReportProblem,
    // NEW PROP FOR PROBLEM RESOLUTION (EVM)
    onNavigateToResolveProblem,
    // NEW PROPS FOR CLAIM COMPLETION AND REOPEN
    onNavigateToCompleteClaim,
    onNavigateToReopenClaim,
    // NEW PROP FOR WORK DONE (TECHNICIAN)
    onNavigateToWorkDone,
    // NEW PROP FOR RESUBMIT CLAIM
    onNavigateToResubmit,
    backButtonLabel = 'Quay lại Danh sách Yêu cầu' 
}) => {
    const [claim, setClaim] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showHandoverDialog, setShowHandoverDialog] = useState(false);
    const [handoverNote, setHandoverNote] = useState('');
    const [isUpdatingToHandover, setIsUpdatingToHandover] = useState(false);
    const [technicianProfile, setTechnicianProfile] = useState(null);
    const effectRan = useRef(false);
    
    // Determine user roles
    const isSCStaff = userRole === 'SC_STAFF';
    const isSCTechnician = userRole === 'SC_TECHNICIAN';
    const isEVMStaff = userRole === 'EVM_STAFF';

    // --- MODIFIED HANDLERS TO PASS estimatedRepairCost as warrantyCost CONTEXT ---
    const handleApproveClick = () => {
        if (!claim) return; // Guard against missing claim data
        // Use warrantyCost if it's a valid number > 0, otherwise fall back to estimatedRepairCost
        // If both are missing, use 0 as fallback
        const costToPass = (claim.warrantyCost && claim.warrantyCost > 0) 
            ? claim.warrantyCost 
            : (claim.estimatedRepairCost ?? 0);
        console.log('ClaimDetailPage - handleApproveClick:', {
            warrantyCost: claim.warrantyCost,
            estimatedRepairCost: claim.estimatedRepairCost,
            costToPass,
            claimId
        });
        if (onNavigateToApprove) onNavigateToApprove(
            claimId, 
            claim.claimNumber, 
            costToPass,
            claim.vehicle.vin, 
            claim.reportedFailure
        );
    };

    const handleRejectClick = () => {
        if (!claim) return; // Guard against missing claim data
        // Use warrantyCost if it's a valid number > 0, otherwise fall back to estimatedRepairCost
        // If both are missing, use 0 as fallback
        const costToPass = (claim.warrantyCost && claim.warrantyCost > 0) 
            ? claim.warrantyCost 
            : (claim.estimatedRepairCost ?? 0);
        console.log('ClaimDetailPage - handleRejectClick:', {
            warrantyCost: claim.warrantyCost,
            estimatedRepairCost: claim.estimatedRepairCost,
            costToPass,
            claimId
        });
        if (onNavigateToReject) onNavigateToReject(
            claimId, 
            claim.claimNumber, 
            claim.vehicle.vin, 
            claim.reportedFailure,
            costToPass
        );
    };
    
    // NEW: Handler for Technician's Submit to EVM button (redirects to the form)
    const handleTechSubmitEVMClick = () => {
        if (onNavigateToTechSubmitEVM) onNavigateToTechSubmitEVM(claimId, claim.claimNumber);
    };
    // --------------------------------------------------------
    
    // NEW: Handler for EVM's Resolve Problem button (redirects to problem resolution page)
    const handleResolveProblemClick = () => {
        if (!claim || !onNavigateToResolveProblem) return;
        const costToPass = (claim.warrantyCost && claim.warrantyCost > 0) 
            ? claim.warrantyCost 
            : (claim.estimatedRepairCost ?? 0);
        onNavigateToResolveProblem(
            claimId,
            claim.claimNumber,
            claim.vehicle.vin,
            claim.reportedFailure,
            costToPass,
            claim.problemType,
            claim.problemDescription
        );
    };
    // --------------------------------------------------------


    // --- Existing: Function to handle attachment download ---
    const handleDownloadAttachment = async (attachment) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            toast.error('Người dùng chưa được xác thực.');
            return;
        }
        
        try {
            // Use downloadUrl if available, otherwise construct from filePath
            let downloadUrl;
            if (attachment.downloadUrl) {
                downloadUrl = `${process.env.REACT_APP_API_URL}${attachment.downloadUrl}`;
            } else if (attachment.id && claimId) {
                // Fallback: use API endpoint
                downloadUrl = `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/attachments/${attachment.id}/download`;
            } else {
                // Last resort: try static file serving
                const fileName = attachment.filePath?.split('/').pop() || attachment.fileName || 'attachment';
                downloadUrl = `${process.env.REACT_APP_API_URL}/uploads/attachments/${fileName}`;
            }
            
            const response = await axios.get(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                responseType: 'blob'
            });
            
            // Create blob and download
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.originalFileName || attachment.fileName || attachment.filePath?.split('/').pop() || 'attachment';
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            toast.success(`Đã tải xuống ${link.download}`);
        } catch (error) {
            toast.error(`Không thể tải xuống tệp: ${error.response?.data?.message || error.message}`);
        }
    };
    // ---------------------------------------------------


    // --- Existing: Function to re-fetch claim details ---
    const fetchClaimDetails = async (token, id) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/claims/${id}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );

            if (response.status === 200) {
                setClaim(response.data);
                // Fetch work orders for this claim
                fetchWorkOrders(token, id);
                // Fetch technician profile if technician is assigned
                if (response.data.assignedTechnician?.id) {
                    fetchTechnicianProfile(token, response.data.assignedTechnician.id);
                } else {
                    setTechnicianProfile(null);
                }
            }
        } catch (err) {
            let errorMessage = 'Không thể tải chi tiết yêu cầu.';
            if (err.message === 'Người dùng chưa được xác thực.') {
                errorMessage = 'Người dùng chưa được xác thực.';
            } else if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    // ===== NEW: Fetch work orders for claim =====
    const fetchWorkOrders = async (token, claimId) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/work-orders/claim/${claimId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            if (response.status === 200) {
                setWorkOrders(response.data || []);
            }
        } catch (err) {
            console.warn('Could not fetch work orders:', err);
            setWorkOrders([]);
        }
    };
    
    // ===== NEW: Fetch technician profile for availability status =====
    const fetchTechnicianProfile = async (token, technicianUserId) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/technicians/user/${technicianUserId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                }
            );
            if (response.status === 200) {
                setTechnicianProfile(response.data);
            }
        } catch (err) {
            console.warn('Could not fetch technician profile:', err);
            setTechnicianProfile(null);
        }
    };
    
    // ===== NEW: Create Work Order =====
    const handleCreateWorkOrder = async (workOrderType = 'EVM') => {
        if (!claim) return;
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            toast.error('Người dùng chưa được xác thực.');
            return;
        }
        
        const technicianId = isSCTechnician ? userId : (claim.assignedTechnician?.id || userId);
        
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/work-orders/create`,
                {
                    claimId: claimId,
                    technicianId: technicianId,
                    workOrderType: workOrderType,
                    startTime: new Date().toISOString(),
                },
                {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                }
            );
            
            if (response.status === 200 || response.status === 201) {
                toast.success('Work Order đã được tạo thành công!');
                fetchWorkOrders(user.token, claimId);
                fetchClaimDetails(user.token, claimId);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể tạo Work Order.');
        }
    };
    
    // ===== NEW: Update Payment Status =====
    const handleUpdatePaymentStatus = async (status) => {
        if (isUpdatingStatus) return;
        setIsUpdatingStatus(true);
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            toast.error('Người dùng chưa được xác thực.');
            setIsUpdatingStatus(false);
            return;
        }
        
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/payment-status`,
                null,
                {
                    params: { paymentStatus: status },
                    headers: { 'Authorization': `Bearer ${user.token}` },
                }
            );
            
            if (response.status === 200) {
                toast.success('Trạng thái thanh toán đã được cập nhật!');
                fetchClaimDetails(user.token, claimId);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái thanh toán.');
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    
    // ===== NEW: Navigate to Work Done Form =====
    const handleMarkWorkDone = () => {
        if (!claim || !onNavigateToWorkDone) return;
        
        const costToPass = (claim.warrantyCost && claim.warrantyCost > 0) 
            ? claim.warrantyCost 
            : (claim.estimatedRepairCost ?? 0);
        
        onNavigateToWorkDone(
            claimId,
            claim.claimNumber,
            costToPass,
            claim.vehicle?.vin || '',
            claim.reportedFailure || ''
        );
    };
    
    // ===== NEW: Navigate to Complete Claim Form =====
    const handleMarkClaimDone = () => {
        if (!claim || !onNavigateToCompleteClaim) return;
        
        const costToPass = (claim.warrantyCost && claim.warrantyCost > 0) 
            ? claim.warrantyCost 
            : (claim.estimatedRepairCost ?? 0);
        
        onNavigateToCompleteClaim(
            claimId,
            claim.claimNumber,
            costToPass,
            claim.vehicle?.vin || '',
            claim.reportedFailure || ''
        );
    };
    
    // ===== NEW: Navigate to Reopen Claim Form =====
    const handleReopenClaim = () => {
        if (!claim || !onNavigateToReopenClaim) return;
        
        const costToPass = (claim.warrantyCost && claim.warrantyCost > 0) 
            ? claim.warrantyCost 
            : (claim.estimatedRepairCost ?? 0);
        
        onNavigateToReopenClaim(
            claimId,
            claim.claimNumber,
            costToPass,
            claim.vehicle?.vin || '',
            claim.reportedFailure || ''
        );
    };
    
    // ===== NEW: Report Problem (Technician) - Navigate to Problem Report Page =====
    const handleReportProblem = () => {
        if (!onNavigateToReportProblem || !claim) return;
        
        onNavigateToReportProblem(
            claimId,
            claim.claimNumber,
            claim.warrantyCost,
            claim.vin,
            claim.reportedFailure
        );
    };

    // ===== NEW: Update Work Order Status =====
    const handleUpdateWorkOrderStatus = async (workOrderId, status, description) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            toast.error('Người dùng chưa được xác thực.');
            return;
        }
        
        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/work-orders/${workOrderId}/status`,
                null,
                {
                    params: {
                        status: status,
                        ...(description ? { description } : {})
                    },
                    headers: { 'Authorization': `Bearer ${user.token}` },
                }
            );
            
            if (response.status === 200) {
                toast.success('Trạng thái Work Order đã được cập nhật!');
                fetchWorkOrders(user.token, claimId);
                fetchClaimDetails(user.token, claimId);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái Work Order.');
        }
    };
    // --------------------------------------------------------------------------

    // ===== NEW: Handle Resubmit Claim - Navigate to Resubmit Page =====
    const handleResubmitClick = () => {
        if (!claim || !onNavigateToResubmit) return;
        
        const costToPass = (claim.warrantyCost && claim.warrantyCost > 0) 
            ? claim.warrantyCost 
            : (claim.estimatedRepairCost ?? 0);
        
        onNavigateToResubmit(
            claimId,
            claim.claimNumber,
            costToPass,
            claim.vehicle?.vin || '',
            claim.reportedFailure || ''
        );
    };
    // --------------------------------------------------------------------------

    // ===== NEW: Handle Move to Handover Pending (After Double Rejection) =====
    const handleMoveToHandoverClick = () => {
        setHandoverNote('');
        setShowHandoverDialog(true);
    };

    const handleConfirmHandover = async () => {
        if (isUpdatingToHandover) return;

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            toast.error('Người dùng chưa được xác thực.');
            return;
        }

        setIsUpdatingToHandover(true);

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/status`,
                {
                    status: 'HANDOVER_PENDING'
                },
                {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                }
            );

            if (response.status === 200) {
                toast.success('Yêu cầu đã được chuyển sang trạng thái Chờ Bàn giao.');
                setShowHandoverDialog(false);
                setHandoverNote('');
                // Refresh claim details
                fetchClaimDetails(user.token, claimId);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Không thể cập nhật trạng thái yêu cầu.';
            toast.error(errorMessage);
        } finally {
            setIsUpdatingToHandover(false);
        }
    };

    const handleCancelHandover = () => {
        setShowHandoverDialog(false);
        setHandoverNote('');
    };
    // --------------------------------------------------------------------------

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role) {
            setUserRole(user.role);
            setUserId(user.userId); 
        } else {
            setError('Người dùng chưa được xác thực.');
            setIsLoading(false);
            return;
        }

        if (!claimId) {
            setError('Không có ID Yêu cầu được cung cấp.');
            setIsLoading(false);
            return;
        }

        // StrictMode guard
        if (effectRan.current === true && process.env.NODE_ENV === 'development') {
            return;
        }
        
        const token = user.token; 
        fetchClaimDetails(token, claimId);

        return () => {
            effectRan.current = true;
        };
    }, [claimId]);

    // --- SC Staff Submit to EVM Handler (Kept for staff access point) ---
    const handleSubmitToEVM = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            toast.error('Người dùng chưa được xác thực.');
            return;
        }

        if (claim && claim.missingRequirements && claim.missingRequirements.length > 0) {
            toast.error(`Không thể gửi: Thiếu yêu cầu: ${claim.missingRequirements.join(', ')}`);
            return;
        }

        try {
            // Note: This is the old /ready-for-submission API, typically used by SC_STAFF
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/ready-for-submission`, 
                { claimId: claimId },
                {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                }
            );

            if (response.status === 200 || response.status === 201) {
                toast.success('Yêu cầu đã được gửi thành công đến EVM để phê duyệt.');
                setClaim(response.data); 
                if (onSubmitToEVM) {
                    onSubmitToEVM(response.data);
                }
            }
        } catch (err) {
            let errorMessage = 'Không thể gửi yêu cầu đến EVM.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            toast.error(errorMessage);
        }
    };
    // ------------------------------------

    const renderContent = () => {
        if (isLoading) {
            return <div className="cd-loading">Đang tải chi tiết yêu cầu...</div>;
        }

        if (error) {
            return <div className="cd-error">Lỗi: {error}</div>;
        }

        if (!claim) {
            return <div className="cd-no-claim">Không tìm thấy dữ liệu yêu cầu.</div>;
        }

        return (
            <motion.div
                className="cd-content-grid"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
                initial="hidden"
                animate="visible"
            >
                <DetailCard title="Thông tin Yêu cầu">
                    <DetailItem label="Số Yêu cầu" value={claim.claimNumber} />
                    <DetailItem label="Trạng thái" value={<span className={`cd-status-badge ${claim.status.toLowerCase()}`}>{claim.status}</span>} />
                    <DetailItem label="Lỗi Đã Báo cáo" value={claim.reportedFailure} />
                    {/* ===== NEW: Repair Type and Warranty Eligibility ===== */}
                    {claim.repairType && (
                        <DetailItem 
                            label="Loại Sửa chữa" 
                            value={claim.repairType === 'EVM_REPAIR' ? 'EVM Repair (Bảo hành)' : 'SC Repair (Khách hàng tự chi trả)'} 
                        />
                    )}
                    {claim.warrantyEligibilityAssessment && (
                        <DetailItem 
                            label="Điều kiện Bảo hành được chấp nhận" 
                            value={claim.warrantyEligibilityAssessment} 
                        />
                    )}
                    {claim.isWarrantyEligible !== null && claim.isWarrantyEligible !== undefined && (
                        <DetailItem 
                            label="Xe có đủ điều kiện bảo hành?" 
                            value={claim.isWarrantyEligible ? 'Có' : 'Không'} 
                        />
                    )}
                    {claim.customerPaymentStatus && (
                        <DetailItem 
                            label="Trạng thái Thanh toán" 
                            value={claim.customerPaymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'} 
                        />
                    )}
                    
                    {/* MODIFIED: Display diagnostic fields */}
                    <DetailItem label="Tóm tắt Chẩn đoán" value={claim.diagnosticSummary || claim.initialDiagnosis} />
                    
                    {/* NEW: Estimated Labor Hours Field */}
                    <DetailItem 
                        label="Giờ Lao động Ước tính" 
                        value={claim.laborHours !== null && claim.laborHours !== undefined 
                            ? `${claim.laborHours} giờ` 
                            : 'N/A'
                        } 
                    />
                    
                    <DetailItem label="Ngày Tạo" value={formatDateTime(claim.createdAt)} />
                    <DetailItem label="Được Tạo bởi" value={claim.createdBy?.fullName} />
                </DetailCard>

                {/* ===== NEW: Combined Cost Details Card (for SC Repair) ===== */}
                {claim.repairType === 'SC_REPAIR' && (() => {
                    // Check if there's any content to show
                    const hasServiceItems = claim.serviceCatalogItems && claim.serviceCatalogItems.length > 0;
                    const thirdPartyParts = [];
                    workOrders.forEach(wo => {
                        const parts = wo.partsUsed || wo.parts || [];
                        parts.forEach(part => {
                            if (part.partSource === 'THIRD_PARTY' || part.thirdPartyPartId) {
                                thirdPartyParts.push(part);
                            }
                        });
                    });
                    const hasThirdPartyParts = thirdPartyParts.length > 0 || (claim.totalThirdPartyPartsCost && claim.totalThirdPartyPartsCost > 0);
                    const hasTotalEstimatedCost = claim.totalEstimatedCost !== null && claim.totalEstimatedCost !== undefined;
                    
                    // Only show this card if there's actual content
                    if (!hasServiceItems && !hasThirdPartyParts && !hasTotalEstimatedCost) {
                        return null;
                    }

                    return (
                        <DetailCard title="Chi tiết Chi phí">
                            <div className="cd-cost-details-unified">
                                {/* Service Catalog Items Breakdown (for SC Repair) */}
                                {hasServiceItems && (
                                    <>
                                        <h4 className="cd-cost-unified-title">Chi tiết Dịch vụ</h4>
                                        <div className="cd-service-items-table">
                                            <div className="cd-service-items-header">
                                                <span className="cd-service-col-name">Tên Dịch vụ</span>
                                                <span className="cd-service-col-code">Mã</span>
                                                <span className="cd-service-col-qty">SL</span>
                                                <span className="cd-service-col-price">Đơn giá</span>
                                                <span className="cd-service-col-total">Thành tiền</span>
                                            </div>
                                            {claim.serviceCatalogItems.map((item, idx) => (
                                                <div key={idx} className="cd-service-items-row">
                                                    <span className="cd-service-col-name">{item.serviceItemName || item.name || 'N/A'}</span>
                                                    <span className="cd-service-col-code">{item.serviceItemCode || item.serviceCode || 'N/A'}</span>
                                                    <span className="cd-service-col-qty">{item.quantity || 1}</span>
                                                    <span className="cd-service-col-price">₫ {(item.unitPrice || 0).toLocaleString('vi-VN')}</span>
                                                    <span className="cd-service-col-total">₫ {(item.totalPrice || 0).toLocaleString('vi-VN')}</span>
                                                </div>
                                            ))}
                                            <div className="cd-service-items-footer">
                                                <span className="cd-service-footer-label">Tổng chi phí Dịch vụ:</span>
                                                <span className="cd-service-footer-value">₫ {(claim.totalServiceCost || 0).toLocaleString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Third Party Parts Table (for SC Repair) - Below Service Details */}
                                {hasThirdPartyParts && (
                                    <>
                                        {thirdPartyParts.length > 0 ? (
                                            <div className="cd-service-items-table">
                                                <div className="cd-service-items-header">
                                                    <span className="cd-service-col-name">Tên Phụ tùng</span>
                                                    <span className="cd-service-col-code">Số Serial</span>
                                                    <span className="cd-service-col-qty">SL</span>
                                                    <span className="cd-service-col-price">Đơn giá</span>
                                                    <span className="cd-service-col-total">Thành tiền</span>
                                                </div>
                                                {thirdPartyParts.map((part, idx) => (
                                                    <div key={idx} className="cd-service-items-row">
                                                        <span className="cd-service-col-name">{part.partName || 'N/A'}</span>
                                                        <span className="cd-service-col-code">{part.thirdPartySerialNumber || part.partSerialNumber || 'N/A'}</span>
                                                        <span className="cd-service-col-qty">{part.quantity || 1}</span>
                                                        <span className="cd-service-col-price">₫ {(part.unitCost || 0).toLocaleString('vi-VN')}</span>
                                                        <span className="cd-service-col-total">₫ {(part.totalCost || (part.unitCost || 0) * (part.quantity || 1)).toLocaleString('vi-VN')}</span>
                                                    </div>
                                                ))}
                                                <div className="cd-service-items-footer">
                                                    <span className="cd-service-footer-label">Tổng chi phí Phụ tùng Bên thứ 3:</span>
                                                    <span className="cd-service-footer-value">₫ {(claim.totalThirdPartyPartsCost || 0).toLocaleString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="cd-cost-unified-item">
                                                <span className="cd-cost-unified-label">Tổng chi phí Phụ tùng Bên thứ 3:</span>
                                                <span className="cd-cost-unified-value">₫ {(claim.totalThirdPartyPartsCost || 0).toLocaleString('vi-VN')}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Total Estimated Cost Summary (for SC Repair) - At the bottom */}
                                {hasTotalEstimatedCost && (
                                    <div className="cd-total-estimated-cost-summary">
                                        <h4 className="cd-cost-unified-title">Tổng chi phí Dự kiến</h4>
                                        <div className="cd-cost-summary-container">
                                            <div className="cd-cost-summary-row">
                                                <span className="cd-cost-summary-label">Chi phí dịch vụ:</span>
                                                <span className="cd-cost-summary-value">₫ {(claim.totalServiceCost || 0).toLocaleString('vi-VN')}</span>
                                            </div>
                                            {claim.totalThirdPartyPartsCost > 0 && (
                                                <div className="cd-cost-summary-row">
                                                    <span className="cd-cost-summary-label">Chi phí phụ tùng bên thứ 3:</span>
                                                    <span className="cd-cost-summary-value">₫ {(claim.totalThirdPartyPartsCost || 0).toLocaleString('vi-VN')}</span>
                                                </div>
                                            )}
                                            <div className="cd-cost-summary-divider"></div>
                                            <div className="cd-cost-summary-row cd-cost-summary-final">
                                                <span className="cd-cost-summary-label">Tổng cộng:</span>
                                                <strong className="cd-cost-summary-value">₫ {(claim.totalEstimatedCost || 0).toLocaleString('vi-VN')}</strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </DetailCard>
                    );
                })()}

                {/* ===== NEW: Separate Cost Details Card (for EVM Repair) ===== */}
                {claim.repairType === 'EVM_REPAIR' && (() => {
                    // Check if there's any content to actually display
                    const hasEstimatedCost = claim.estimatedRepairCost !== null && claim.estimatedRepairCost !== undefined;
                    const hasWarrantyCost = claim.warrantyCost !== null && claim.warrantyCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN';
                    const hasCompanyPaidCost = claim.companyPaidCost !== null && claim.companyPaidCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN';
                    
                    // Only show the card if there's at least one piece of content to display
                    if (!hasEstimatedCost && !hasWarrantyCost && !hasCompanyPaidCost) {
                        return null;
                    }
                    
                    return (
                        <DetailCard title="Chi tiết Chi phí">
                            <div className="cd-cost-details-unified">
                                {/* Estimated Repair Cost (for EVM Repair or general) */}
                                {hasEstimatedCost && (
                                    <div className="cd-cost-unified-item">
                                        <span className="cd-cost-unified-label">Chi phí Sửa chữa Ước tính:</span>
                                        <span className="cd-cost-unified-value">₫ {claim.estimatedRepairCost.toLocaleString('vi-VN')}</span>
                                    </div>
                                )}

                                {/* Warranty Cost and Company Paid Cost (Final costs) */}
                                {/* Only show for EVM_REPAIR - SC_REPAIR doesn't have company paid cost */}
                                {(hasWarrantyCost || hasCompanyPaidCost) && (
                                    <>
                                        <h4 className="cd-cost-unified-title cd-cost-unified-title-final">Chi phí Cuối cùng</h4>
                                        {hasWarrantyCost && (
                                            <div className="cd-cost-unified-item">
                                                <span className="cd-cost-unified-label">Chi phí Bảo hành:</span>
                                                <span className="cd-cost-unified-value">₫ {claim.warrantyCost.toLocaleString('vi-VN')}</span>
                                            </div>
                                        )}
                                        {hasCompanyPaidCost && (
                                            <div className="cd-cost-unified-item">
                                                <span className="cd-cost-unified-label">Chi phí Công ty Thanh toán:</span>
                                                <span className="cd-cost-unified-value">₫ {claim.companyPaidCost.toLocaleString('vi-VN')}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </DetailCard>
                    );
                })()}

                {/* ===== NEW: Separate Cost Details Card (for claims without repair type or general) ===== */}
                {!claim.repairType && (
                  (claim.estimatedRepairCost !== null && claim.estimatedRepairCost !== undefined) ||
                  (claim.warrantyCost !== null && claim.warrantyCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN') ||
                  (claim.companyPaidCost !== null && claim.companyPaidCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN')) && (
                    <DetailCard title="Chi tiết Chi phí">
                        <div className="cd-cost-details-unified">
                            {/* Estimated Repair Cost (for EVM Repair or general) */}
                            {claim.estimatedRepairCost !== null && claim.estimatedRepairCost !== undefined && (
                                <div className="cd-cost-unified-item">
                                    <span className="cd-cost-unified-label">Chi phí Sửa chữa Ước tính:</span>
                                    <span className="cd-cost-unified-value">₫ {claim.estimatedRepairCost.toLocaleString('vi-VN')}</span>
                                </div>
                            )}

                            {/* Warranty Cost and Company Paid Cost (Final costs) */}
                            {((claim.warrantyCost !== null && claim.warrantyCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN') ||
                              (claim.companyPaidCost !== null && claim.companyPaidCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN')) && (
                                <>
                                    <h4 className="cd-cost-unified-title cd-cost-unified-title-final">Chi phí Cuối cùng</h4>
                                    {claim.warrantyCost !== null && claim.warrantyCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN' && (
                                        <div className="cd-cost-unified-item">
                                            <span className="cd-cost-unified-label">Chi phí Bảo hành:</span>
                                            <span className="cd-cost-unified-value">₫ {claim.warrantyCost.toLocaleString('vi-VN')}</span>
                                        </div>
                                    )}
                                    {claim.companyPaidCost !== null && claim.companyPaidCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN' && (
                                        <div className="cd-cost-unified-item">
                                            <span className="cd-cost-unified-label">Chi phí Công ty Thanh toán:</span>
                                            <span className="cd-cost-unified-value">₫ {claim.companyPaidCost.toLocaleString('vi-VN')}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </DetailCard>
                )}

                <DetailCard title="Chi tiết Khách hàng">
                    <DetailItem label="Tên" value={claim.customer.name} />
                    <DetailItem label="Số điện thoại" value={claim.customer.phone} />
                    <DetailItem label="Email" value={claim.customer.email} />
                    <DetailItem label="Địa chỉ" value={claim.customer.address} />
                </DetailCard>

                <DetailCard title="Phân công">
                    <DetailItem label="Kỹ thuật viên Được phân công" value={claim.assignedTechnician?.fullName} />
                    {technicianProfile && (
                        <>
                            <div className="cd-detail-item">
                                <span className="cd-detail-label">Trạng thái:</span>
                                <span className={`cd-tech-status-badge ${technicianProfile.isAvailable ? 'cd-tech-available' : 'cd-tech-busy'}`}>
                                    {technicianProfile.isAvailable ? 'Sẵn sàng' : 'Bận'}
                                </span>
                            </div>
                            {technicianProfile.currentWorkload !== null && technicianProfile.maxWorkload !== null && (
                                <div className="cd-detail-item">
                                    <span className="cd-detail-label">Khối lượng công việc:</span>
                                    <span className="cd-detail-value">
                                        {technicianProfile.currentWorkload}/{technicianProfile.maxWorkload} 
                                        ({Math.round((technicianProfile.currentWorkload / technicianProfile.maxWorkload) * 100)}%)
                                    </span>
                                </div>
                            )}
                            {technicianProfile.specialization && (
                                <DetailItem label="Chuyên môn" value={technicianProfile.specialization} />
                            )}
                        </>
                    )}
                    <DetailItem label="Được Phê duyệt bởi" value={claim.approvedBy?.fullName} />
                    <DetailItem label="Ngày Phê duyệt" value={formatDateTime(claim.approvedAt)} />
                </DetailCard>

                <DetailCard title="Chi tiết Xe">
                    <DetailItem label="Số VIN" value={claim.vehicle.vin} />
                    <DetailItem label="Mẫu xe" value={claim.vehicle.model} />
                    <DetailItem label="Năm" value={claim.vehicle.year} />
                    <DetailItem label="Số km (km)" value={claim.vehicle.mileageKm} />
                </DetailCard>
                
                {/* NEW: Attachments Card */}
                {claim.attachments && (
                    <DetailCard title={`Tệp đính kèm Phương tiện (${claim.attachments.length})`}>
                        {claim.attachments.length > 0 ? (
                            <div className="cd-attachment-list">
                                {claim.attachments.map((att) => (
                                    <div 
                                        key={att.id} 
                                        className="cd-attachment-item"
                                        onClick={() => handleDownloadAttachment(att)}
                                        title={`Tải xuống: ${att.originalFileName || att.fileName || att.filePath?.split('/').pop() || 'attachment'}`}
                                    >
                                        <FaFileAlt className="cd-attachment-icon" />
                                        <span className="cd-attachment-name">
                                            {att.originalFileName || att.fileName || att.filePath?.split('/').pop() || 'Unknown'}
                                        </span>
                                        <span className="cd-attachment-uploaded-by">
                                            ({att.uploadedBy?.username || 'Hệ thống'})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="cd-no-attachments">Không tìm thấy tệp đính kèm nào cho yêu cầu này.</p>
                        )}
                    </DetailCard>
                )}
                
                {/* NEW: Display Missing Requirements if available */}
                {claim.missingRequirements && claim.missingRequirements.length > 0 && (
                    <DetailCard title="Yêu cầu Thiếu">
                        <div className="cd-missing-requirements-list">
                            {claim.missingRequirements.map((req, index) => (
                                <p key={index} className="cd-missing-item">🚨 {req}</p>
                            ))}
                        </div>
                    </DetailCard>
                )}


                {/* ===== NEW: Work Orders Card ===== */}
                <DetailCard title={`Work Orders (${workOrders.length})`}>
                    {workOrders.length > 0 ? (
                        <div className="cd-work-orders-list">
                            {workOrders.map((wo) => (
                                <div key={wo.id} className="cd-work-order-item">
                                    <div className="cd-work-order-header">
                                        <span className="cd-work-order-id">WO #{wo.id}</span>
                                        <span className={`cd-status-badge ${(wo.status || 'OPEN').toLowerCase()}`}>
                                            {wo.status || 'OPEN'}
                                        </span>
                                        <span className="cd-work-order-type">
                                            {wo.workOrderType || 'EVM'}
                                        </span>
                                    </div>
                                    <div className="cd-work-order-details">
                                        <p><strong>Kỹ thuật viên:</strong> {wo.technicianName || wo.technician?.fullName}</p>
                                        {wo.statusDescription && (
                                            <p><strong>Mô tả:</strong> {wo.statusDescription}</p>
                                        )}
                                        {wo.laborHours && (
                                            <p><strong>Giờ lao động:</strong> {wo.laborHours} giờ</p>
                                        )}
                                        {wo.startTime && (
                                            <p><strong>Bắt đầu:</strong> {formatDateTime(wo.startTime)}</p>
                                        )}
                                        {wo.endTime && (
                                            <p><strong>Kết thúc:</strong> {formatDateTime(wo.endTime)}</p>
                                        )}
                                    </div>
                                    {/* Work Order Status Update Buttons - Only for Technicians */}
                                    {/* Button only appears AFTER claim status is WORK_DONE and work order is not explicitly DONE or CLOSED */}
                                    {/* Note: COMPLETED is a fallback status when endTime is set but status is null, so we allow it */}
                                    {isSCTechnician && 
                                     claim && 
                                     claim.status === 'WORK_DONE' && 
                                     wo.status !== 'DONE' && 
                                     wo.status !== 'CLOSED' && (
                                        <div className="cd-work-order-actions">
                                            <button
                                                className="cd-work-order-action-btn"
                                                onClick={() => {
                                                    const description = window.prompt('Nhập mô tả vấn đề (nếu có):');
                                                    handleUpdateWorkOrderStatus(wo.id, 'DONE', description || null);
                                                }}
                                            >
                                                Đánh dấu DONE
                                            </button>
                                            {wo.status === 'OPEN' && (
                                                <button
                                                    className="cd-work-order-action-btn cd-close-btn"
                                                    onClick={() => {
                                                        const reason = window.prompt('Nhập lý do đóng Work Order:');
                                                        if (reason) {
                                                            handleUpdateWorkOrderStatus(wo.id, 'CLOSED', reason);
                                                        }
                                                    }}
                                                >
                                                    Đóng Work Order
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Chưa có Work Order nào cho claim này.</p>
                    )}
                </DetailCard>

                <DetailCard title="Lịch sử Trạng thái">
                    <div className="cd-status-history-list">
                        {claim.statusHistory.length > 0 ? (
                            [...claim.statusHistory].reverse().map((entry) => ( // Show newest first
                                <div key={entry.id} className="cd-status-item">
                                    <div className="cd-status-item-header">
                                        <span className={`cd-status-badge ${entry.statusCode.toLowerCase()}`}>{entry.statusCode}</span>
                                        <span className="cd-status-time">{formatDateTime(entry.changedAt)}</span>
                                    </div>
                                    <p className="cd-status-note">"{entry.note}"</p>
                                    <p className="cd-status-by">bởi {entry.changedBy?.fullName}</p>
                                </div>
                            ))
                        ) : (
                            <p>Không có lịch sử trạng thái nào.</p>
                        )}
                    </div>
                </DetailCard>
            </motion.div>
        );
    };
    
    // Check if the current user is the assigned technician AND the status is OPEN
    const isAssignedTechnicianAndOpen = 
        isSCTechnician && 
        claim && 
        claim.status === 'OPEN' && 
        claim.assignedTechnician && 
        claim.assignedTechnician.id === userId;

    // Check if the current user is SC_STAFF AND the status is IN PROGRESS
    const isSCStaffAndInProgress = 
        isSCStaff && 
        claim && 
        claim.status === 'IN_PROGRESS';

    // NEW: Check if the current user is Technician AND the status is PENDING_APPROVAL
    const isAssignedTechnicianAndPendingApproval = 
        isSCTechnician && 
        claim && 
        claim.status === 'PENDING_APPROVAL' && 
        claim.assignedTechnician && 
        claim.assignedTechnician.id === userId;


    // Check if the current user is EVM_STAFF AND the status is PENDING_EVM_APPROVAL
    const isEVMStaffAndPendingEVMApproval =
        isEVMStaff && 
        claim && 
        claim.status === 'PENDING_EVM_APPROVAL';
    
    // Check if the current user is EVM_STAFF AND the status is PROBLEM_CONFLICT
    const isEVMStaffAndProblemConflict =
        isEVMStaff && 
        claim && 
        claim.status === 'PROBLEM_CONFLICT';


    return (
        <div className="claim-detail-page">
            <div className="claim-detail-header">
                <div className="cd-header-content">
                    <button onClick={onBackClick} className="cd-back-button">
                        ← {backButtonLabel} 
                    </button>
                    <h2 className="cd-page-title">
                        Chi tiết Yêu cầu {claim ? ` - ${claim.claimNumber}` : ''}
                    </h2>
                </div>
                
                <div className="cd-header-actions"> 
                    
                    {/* TECHNICIAN ACTION: Submit to EVM (When PENDING_APPROVAL) */}
                    {isAssignedTechnicianAndPendingApproval && (
                         <button 
                            className="cd-process-button" 
                            onClick={handleTechSubmitEVMClick}
                        >
                            Gửi đến EVM
                        </button>
                    )}

                    {/* EVM Staff Action Buttons - trigger navigation */}
                    {isEVMStaffAndPendingEVMApproval && (
                         <>
                            <button 
                                className="cd-reject-button" 
                                onClick={handleRejectClick}
                            >
                                Từ chối Yêu cầu
                            </button>

                            <button 
                                className="cd-process-button" 
                                onClick={handleApproveClick}
                            >
                                Phê duyệt Yêu cầu
                            </button>
                         </>
                    )}
                    
                    {/* EVM Staff Action: Resolve Problem */}
                    {isEVMStaffAndProblemConflict && (
                        <button 
                            className="cd-process-button" 
                            onClick={handleResolveProblemClick}
                        >
                            Giải quyết Vấn đề
                        </button>
                    )}


                    {/* SC Staff Submit to EVM Button (Existing Logic for IN_PROGRESS) */}
                    {/* Note: This button is typically used by SC Staff to send the claim through if the Technician cannot, 
                       but the Tech path is now defined above for PENDING_APPROVAL */}
                    {isSCStaffAndInProgress && claim && claim.canSubmitToEvm && (
                         <button 
                            className="cd-process-button" 
                            onClick={handleSubmitToEVM}
                        >
                            Gửi đến EVM (Nhân viên)
                        </button>
                    )}

                    {/* Technician Update Diagnostic Button (Existing Logic) */}
                    {isAssignedTechnicianAndOpen && (
                         <button 
                            className="cd-process-button" 
                            onClick={() => onUpdateDiagnostic(claimId)}
                        >
                            Cập nhật Chẩn đoán
                        </button>
                    )}

                    {/* SC Staff Draft Buttons (Original Logic) */}
                    {isSCStaff && claim && claim.status === 'DRAFT' && (
                        <>
                            <button 
                                className="cd-edit-draft-button" 
                                onClick={() => onEditDraftClaim(claim)}
                            >
                                Chỉnh sửa Yêu cầu Nháp
                            </button>

                            <button 
                                className="cd-process-button" 
                                onClick={() => onProcessToIntake(claim)}
                            >
                                Xử lý thành Nhập
                            </button>
                        </>
                    )}
                    
                    {/* ===== NEW: Payment Status Update (SC Repair flow) ===== */}
                    {isSCStaff && claim && claim.status === 'CUSTOMER_PAYMENT_PENDING' && (
                        <button
                            className="cd-process-button"
                            onClick={() => handleUpdatePaymentStatus('PAID')}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? 'Đang cập nhật...' : 'Xác nhận Thanh toán'}
                        </button>
                    )}
                    
                    {/* ===== NEW: Create Work Order Buttons ===== */}
                    {(isSCTechnician || isSCStaff) && claim && (
                        <>
                            {/* Create EVM Work Order */}
                            {((claim.status === 'READY_FOR_REPAIR' || claim.status === 'EVM_APPROVED') && 
                              claim.repairType === 'EVM_REPAIR' &&
                              !workOrders.some(wo => wo.workOrderType === 'EVM' && wo.status !== 'CLOSED')) && (
                                <button
                                    className="cd-process-button"
                                    onClick={() => handleCreateWorkOrder('EVM')}
                                >
                                    Tạo EVM Work Order
                                </button>
                            )}
                            
                            {/* Create SC Work Order - Only for SC Technicians */}
                            {isSCTechnician && claim.status === 'CUSTOMER_PAID' && 
                             claim.repairType === 'SC_REPAIR' &&
                             !workOrders.some(wo => wo.workOrderType === 'SC' && wo.status !== 'CLOSED') && (
                                <button
                                    className="cd-process-button"
                                    onClick={() => handleCreateWorkOrder('SC')}
                                >
                                    Tạo SC Work Order
                                </button>
                            )}
                        </>
                    )}
                    
                    {/* ===== NEW: Report Problem (Technician) - At Ready to Repair stage ===== */}
                    {isSCTechnician && claim && 
                     (claim.status === 'READY_FOR_REPAIR' || 
                      claim.status === 'EVM_APPROVED' || 
                      claim.status === 'PROBLEM_SOLVED' || 
                      claim.status === 'WAITING_FOR_PARTS' || 
                      claim.status === 'REPAIR_IN_PROGRESS') && (
                        <button
                            className="cd-process-button cd-report-problem-btn"
                            onClick={handleReportProblem}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? 'Đang gửi...' : 'Báo cáo Vấn đề'}
                        </button>
                    )}
                    
                    {/* ===== NEW: Mark Work Done (Technician) ===== */}
                    {isSCTechnician && claim && 
                     (claim.status === 'READY_FOR_REPAIR' || claim.status === 'CUSTOMER_PAID' || claim.status === 'REPAIR_IN_PROGRESS') &&
                     workOrders.some(wo => wo.technicianId === userId && wo.status !== 'DONE' && wo.status !== 'CLOSED') && (
                        <button
                            className="cd-process-button"
                            onClick={handleMarkWorkDone}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? 'Đang cập nhật...' : 'Đánh dấu Công việc Hoàn thành'}
                        </button>
                    )}
                    
                    {/* ===== NEW: Mark Claim Done (Staff) - Shows for READY_FOR_HANDOVER, HANDOVER_PENDING or WORK_DONE ===== */}
                    {isSCStaff && claim && (claim.status === 'READY_FOR_HANDOVER' || claim.status === 'HANDOVER_PENDING' || claim.status === 'WORK_DONE') && (
                        <button
                            className="cd-process-button"
                            onClick={handleMarkClaimDone}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? 'Đang cập nhật...' : 'Hoàn tất Claim (Bàn giao Xe)'}
                        </button>
                    )}
                    
                    {/* ===== NEW: Reopen Claim (Staff) - Shows for READY_FOR_HANDOVER or HANDOVER_PENDING ===== */}
                    {isSCStaff && claim && (claim.status === 'READY_FOR_HANDOVER' || claim.status === 'HANDOVER_PENDING') && (
                        <button
                            className="cd-reject-button"
                            onClick={handleReopenClaim}
                            disabled={isUpdatingStatus}
                        >
                            {isUpdatingStatus ? 'Đang cập nhật...' : 'Mở lại Yêu cầu'}
                        </button>
                    )}
                    
                    {/* ===== NEW: Resubmit Claim (Technician/Staff) - Shows for EVM_REJECTED ===== */}
                    {(isSCTechnician || isSCStaff) && claim && 
                     claim.status === 'EVM_REJECTED' && 
                     claim.canResubmit !== false &&
                     (claim.resubmitCount === null || claim.resubmitCount === undefined || claim.resubmitCount < 1) && (
                        <button
                            className="cd-process-button"
                            onClick={handleResubmitClick}
                            disabled={isUpdatingStatus}
                        >
                            Gửi lại Yêu cầu
                        </button>
                    )}
                    
                    {/* ===== NEW: Move to Handover Pending (After Double Rejection) - SC Technician Only ===== */}
                    {isSCTechnician && claim && 
                     claim.status === 'EVM_REJECTED' && 
                     ((claim.rejectionCount !== null && claim.rejectionCount !== undefined && claim.rejectionCount >= 2) ||
                      (claim.canResubmit === false && claim.resubmitCount !== null && claim.resubmitCount !== undefined && claim.resubmitCount >= 1)) && (
                        <button
                            className="cd-process-button cd-handover-btn"
                            onClick={handleMoveToHandoverClick}
                            disabled={isUpdatingStatus || isUpdatingToHandover}
                        >
                            Chuyển sang Bàn giao Xe
                        </button>
                    )}
                </div>
            </div>
            
            {/* ===== NEW: Handover Pending Confirmation Dialog ===== */}
            {showHandoverDialog && (
                <div className="cd-modal-overlay" onClick={handleCancelHandover}>
                    <div className="cd-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="cd-modal-header">
                            <h3>Chuyển sang Bàn giao Xe</h3>
                            <button className="cd-modal-close" onClick={handleCancelHandover}>×</button>
                        </div>
                        <div className="cd-handover-dialog-content">
                            <div className="cd-handover-warning">
                                <strong>⚠️ Lưu ý:</strong> Yêu cầu bảo hành này đã bị từ chối hai lần. Bạn đang chuyển yêu cầu sang trạng thái "Chờ Bàn giao" để bàn giao xe cho khách hàng.
                            </div>
                            
                            <div className="cd-form-group">
                                <label htmlFor="handoverNote">
                                    Ghi chú (Tùy chọn)
                                </label>
                                <textarea
                                    id="handoverNote"
                                    value={handoverNote}
                                    onChange={(e) => setHandoverNote(e.target.value)}
                                    placeholder="Nhập ghi chú về việc chuyển sang bàn giao xe (ví dụ: Yêu cầu bảo hành không đủ điều kiện, khách hàng sẽ tự chi trả sửa chữa, v.v.)"
                                    rows={4}
                                    maxLength={500}
                                />
                                <small className="cd-form-hint">
                                    {handoverNote.length}/500 ký tự
                                </small>
                            </div>
                            
                            <div className="cd-modal-actions">
                                <button
                                    type="button"
                                    className="cd-modal-cancel-btn"
                                    onClick={handleCancelHandover}
                                    disabled={isUpdatingToHandover}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="cd-modal-submit-btn"
                                    onClick={handleConfirmHandover}
                                    disabled={isUpdatingToHandover}
                                >
                                    {isUpdatingToHandover ? 'Đang xử lý...' : 'Xác nhận Chuyển'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="cd-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default ClaimDetailPage;