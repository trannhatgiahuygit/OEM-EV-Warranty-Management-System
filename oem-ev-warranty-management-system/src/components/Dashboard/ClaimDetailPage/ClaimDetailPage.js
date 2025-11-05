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
    backButtonLabel = 'Quay lại Danh sách Yêu cầu' 
}) => {
    const [claim, setClaim] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null); 
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


    // --- Existing: Function to handle attachment download ---
    const handleDownloadAttachment = (filePath) => {
        const downloadUrl = `${process.env.REACT_APP_API_URL}${filePath}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank'; 
        link.rel = 'noopener noreferrer';
        link.download = filePath.split('/').pop() || 'attachment'; 
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.info(`Đang tải xuống ${link.download}...`);
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
            }
        } catch (err) {
            let errorMessage = 'Không thể tải chi tiết yêu cầu.';
            if (err.message === 'User not authenticated.') {
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
                    <DetailItem label="Trạng thái" value={<span className={`cd-status-badge ${claim.status.toLowerCase()}`}>{claim.statusLabel}</span>} />
                    <DetailItem label="Lỗi Đã Báo cáo" value={claim.reportedFailure} />
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
                    
                    {/* REMOVED: Estimated Cost and Estimated Time fields - Display Estimated Repair Cost (Original field) as context */}
                     {claim.estimatedRepairCost !== null && claim.estimatedRepairCost !== undefined && (
                        <DetailItem 
                            label="Chi phí Sửa chữa Ước tính" 
                            value={`₫ ${claim.estimatedRepairCost.toFixed(2)}`} 
                        />
                    )}
                    
                    <DetailItem label="Ngày Tạo" value={formatDateTime(claim.createdAt)} />
                    <DetailItem label="Được Tạo bởi" value={claim.createdBy?.fullName} />
                    
                    {/* RETAINED/ADJUSTED: Warranty Cost and Company Paid Cost (at the bottom) */}
                    {claim.warrantyCost !== null && claim.warrantyCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN' && (
                        <DetailItem 
                            label="Chi phí Bảo hành (Cuối cùng)" 
                            value={`₫ ${claim.warrantyCost.toFixed(2)}`} 
                        />
                    )}
                    {claim.companyPaidCost !== null && claim.companyPaidCost !== undefined && claim.status !== 'DRAFT' && claim.status !== 'OPEN' && (
                        <DetailItem 
                            label="Chi phí Công ty Thanh toán (Cuối cùng)" 
                            value={`₫ ${claim.companyPaidCost.toFixed(2)}`} 
                        />
                    )}
                </DetailCard>

                <DetailCard title="Chi tiết Khách hàng">
                    <DetailItem label="Tên" value={claim.customer.name} />
                    <DetailItem label="Số điện thoại" value={claim.customer.phone} />
                    <DetailItem label="Email" value={claim.customer.email} />
                    <DetailItem label="Địa chỉ" value={claim.customer.address} />
                </DetailCard>

                <DetailCard title="Phân công">
                    <DetailItem label="Kỹ thuật viên Được phân công" value={claim.assignedTechnician?.fullName} />
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
                                        onClick={() => handleDownloadAttachment(att.filePath)}
                                        title={`Tải xuống: ${att.filePath.split('/').pop()}`}
                                    >
                                        <FaFileAlt className="cd-attachment-icon" />
                                        <span className="cd-attachment-name">{att.filePath.split('/').pop()}</span>
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


                <DetailCard title="Lịch sử Trạng thái">
                    <div className="cd-status-history-list">
                        {claim.statusHistory.length > 0 ? (
                            [...claim.statusHistory].reverse().map((entry) => ( // Show newest first
                                <div key={entry.id} className="cd-status-item">
                                    <div className="cd-status-item-header">
                                        <span className={`cd-status-badge ${entry.statusCode.toLowerCase()}`}>{entry.statusLabel}</span>
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
                </div>
            </div>
            <div className="cd-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default ClaimDetailPage;