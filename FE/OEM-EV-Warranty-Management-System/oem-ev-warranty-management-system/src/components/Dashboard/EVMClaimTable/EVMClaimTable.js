import React, { useState, useEffect } from 'react';
import { WarrantyService } from '../../../services/warrantyService';
import './EVMClaimTable.css';

const EVMClaimTable = ({
    claims = [],
    onClaimSelect,
    onClaimUpdate,
    loading = false
}) => {
    const [warrantyChecks, setWarrantyChecks] = useState(new Map());
    const [checkingClaims, setCheckingClaims] = useState(new Set());
    const [expandedWarrantyCheck, setExpandedWarrantyCheck] = useState(null);

    const checkClaimWarranty = async (claim) => {
        if (claim.status !== 'submitted_for_approval' || !claim.vehicleId) return;

        const claimId = claim.id;
        setCheckingClaims(prev => new Set(prev).add(claimId));

        try {
            const result = await WarrantyService.checkWarrantyEligibility({
                vehicleId: claim.vehicleId
            });

            setWarrantyChecks(prev => new Map(prev).set(claimId, result));
        } catch (error) {
            console.error('Failed to check warranty for claim:', claimId, error);
            setWarrantyChecks(prev => new Map(prev).set(claimId, {
                error: true,
                message: 'Không thể kiểm tra bảo hành'
            }));
        } finally {
            setCheckingClaims(prev => {
                const newSet = new Set(prev);
                newSet.delete(claimId);
                return newSet;
            });
        }
    };

    // Auto-check warranty for submitted claims
    useEffect(() => {
        claims
            .filter(claim =>
                claim.status === 'submitted_for_approval' &&
                claim.vehicleId &&
                !warrantyChecks.has(claim.id) &&
                !checkingClaims.has(claim.id)
            )
            .forEach(claim => {
                checkClaimWarranty(claim);
            });
    }, [claims, warrantyChecks, checkingClaims]);

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'draft': 'draft',
            'submitted_for_approval': 'pending',
            'approved': 'approved',
            'rejected': 'rejected',
            'in_progress': 'in-progress',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };
        return statusMap[status] || 'default';
    };

    const getStatusText = (status) => {
        const statusMap = {
            'draft': 'Bản nháp',
            'submitted_for_approval': 'Chờ phê duyệt',
            'approved': 'Đã phê duyệt',
            'rejected': 'Bị từ chối',
            'in_progress': 'Đang xử lý',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        return statusMap[status] || status;
    };

    const renderWarrantyStatus = (claim) => {
        const claimId = claim.id;

        if (claim.status !== 'submitted_for_approval') {
            return <span className="warranty-status not-applicable">N/A</span>;
        }

        if (!claim.vehicleId) {
            return <span className="warranty-status error">Thiếu thông tin xe</span>;
        }

        const isChecking = checkingClaims.has(claimId);
        const result = warrantyChecks.get(claimId);

        if (isChecking) {
            return (
                <div className="warranty-status checking">
                    <div className="mini-spinner"></div>
                    <span>Đang kiểm tra...</span>
                </div>
            );
        }

        if (!result) {
            return (
                <button
                    className="btn btn--secondary btn--xs"
                    onClick={() => checkClaimWarranty(claim)}
                >
                    Kiểm tra
                </button>
            );
        }

        if (result.error) {
            return (
                <div className="warranty-status error">
                    <span className="status-icon">⚠️</span>
                    <span>Lỗi kiểm tra</span>
                    <button
                        className="btn btn--secondary btn--xs"
                        onClick={() => checkClaimWarranty(claim)}
                    >
                        Thử lại
                    </button>
                </div>
            );
        }

        return (
            <div className={`warranty-status ${result.isEligible ? 'eligible' : 'not-eligible'}`}>
                <span className="status-icon">
                    {result.isEligible ? '✅' : '❌'}
                </span>
                <span className="status-text">
                    {result.isEligible ? 'Đủ điều kiện' : 'Không đủ'}
                </span>
                {!result.isEligible && result.reasons && result.reasons.length > 0 && (
                    <button
                        className="btn btn--link btn--xs"
                        onClick={() => setExpandedWarrantyCheck(
                            expandedWarrantyCheck === claimId ? null : claimId
                        )}
                    >
                        Chi tiết
                    </button>
                )}
            </div>
        );
    };

    const renderWarrantyDetails = (claim) => {
        const result = warrantyChecks.get(claim.id);
        if (!result || result.error || expandedWarrantyCheck !== claim.id) {
            return null;
        }

        return (
            <tr className="warranty-details-row">
                <td colSpan="7">
                    <div className="warranty-details">
                        <h4>Chi tiết kiểm tra bảo hành</h4>
                        {!result.isEligible && result.reasons && (
                            <div className="warranty-reasons">
                                <strong>Lý do không đủ điều kiện:</strong>
                                <ul>
                                    {result.reasons.map((reason, index) => (
                                        <li key={index}>{reason}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="warranty-info">
                            <div className="info-item">
                                <span className="label">Model xe:</span>
                                <span className="value">{result.vehicleInfo?.model || 'N/A'}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Số km hiện tại:</span>
                                <span className="value">
                                    {result.vehicleInfo?.currentMileage
                                        ? `${result.vehicleInfo.currentMileage.toLocaleString()} km`
                                        : 'N/A'
                                    }
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="label">Kiểm tra lúc:</span>
                                <span className="value">
                                    {result.checkedAt
                                        ? new Date(result.checkedAt).toLocaleString('vi-VN')
                                        : 'N/A'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        );
    };

    const handleClaimAction = (claim, action) => {
        if (onClaimSelect) {
            onClaimSelect(claim, action);
        }
    };

    if (loading) {
        return (
            <div className="claim-table-loading">
                <div className="loading-spinner"></div>
                <span>Đang tải danh sách yêu cầu...</span>
            </div>
        );
    }

    if (claims.length === 0) {
        return (
            <div className="claim-table-empty">
                <p>Không có yêu cầu sửa chữa nào.</p>
            </div>
        );
    }

    return (
        <div className="claim-table-container">
            <div className="table-wrapper">
                <table className="claim-table">
                    <thead>
                        <tr>
                            <th>ID Yêu cầu</th>
                            <th>Model xe</th>
                            <th>Kỹ thuật viên</th>
                            <th>Ngày gửi</th>
                            <th>Trạng thái</th>
                            <th>Kiểm tra bảo hành</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {claims.map(claim => (
                            <React.Fragment key={claim.id}>
                                <tr className="claim-row">
                                    <td className="claim-id">#{claim.id}</td>
                                    <td className="vehicle-model">{claim.vehicleModel || claim.vehicle?.model || 'N/A'}</td>
                                    <td className="technician">{claim.technician || claim.createdBy || 'N/A'}</td>
                                    <td className="submit-date">
                                        {claim.submittedDate
                                            ? new Date(claim.submittedDate).toLocaleDateString('vi-VN')
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="status">
                                        <span className={`status-badge status--${getStatusBadgeClass(claim.status)}`}>
                                            {getStatusText(claim.status)}
                                        </span>
                                    </td>
                                    <td className="warranty-check">
                                        {renderWarrantyStatus(claim)}
                                    </td>
                                    <td className="actions">
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn--secondary btn--sm"
                                                onClick={() => handleClaimAction(claim, 'view')}
                                                title="Xem chi tiết"
                                            >
                                                Xem
                                            </button>
                                            {claim.status === 'submitted_for_approval' && (
                                                <>
                                                    <button
                                                        className="btn btn--success btn--sm"
                                                        onClick={() => handleClaimAction(claim, 'approve')}
                                                        title="Phê duyệt"
                                                    >
                                                        Duyệt
                                                    </button>
                                                    <button
                                                        className="btn btn--danger btn--sm"
                                                        onClick={() => handleClaimAction(claim, 'reject')}
                                                        title="Từ chối"
                                                    >
                                                        Từ chối
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {renderWarrantyDetails(claim)}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EVMClaimTable;