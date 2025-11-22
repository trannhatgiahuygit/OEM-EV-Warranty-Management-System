import React, { useState, useEffect } from 'react';
import { WarrantyService } from '../../services/warrantyService';
import './WarrantyCheckComponent.css';

const WarrantyCheckComponent = ({
    vehicleId,
    onCheckComplete,
    className = '',
    autoCheck = true
}) => {
    const [isChecking, setIsChecking] = useState(false);
    const [checkResult, setCheckResult] = useState(null);
    const [error, setError] = useState(null);

    const performWarrantyCheck = async () => {
        if (!vehicleId) return;

        setIsChecking(true);
        setError(null);

        try {
            const result = await WarrantyService.checkWarrantyEligibility({
                vehicleId,
                claimDate: new Date().toISOString()
            });

            setCheckResult(result);
            if (onCheckComplete) {
                onCheckComplete(result);
            }
        } catch (err) {
            const errorMessage = 'Không thể kiểm tra điều kiện bảo hành. Vui lòng thử lại.';
            setError(errorMessage);
            console.error('Warranty check failed:', err);

            if (onCheckComplete) {
                onCheckComplete({
                    error: true,
                    message: errorMessage
                });
            }
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        if (vehicleId && autoCheck) {
            performWarrantyCheck();
        }
    }, [vehicleId, autoCheck]);

    if (isChecking) {
        return (
            <div className={`warranty-check ${className}`}>
                <div className="warranty-check__loading">
                    <div className="loading-spinner"></div>
                    <span className="loading-text">Đang kiểm tra điều kiện bảo hành...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`warranty-check ${className}`}>
                <div className="warranty-check__error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{error}</span>
                    <button
                        className="btn btn--secondary btn--sm"
                        onClick={performWarrantyCheck}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    if (!checkResult) {
        return (
            <div className={`warranty-check ${className}`}>
                <button
                    className="btn btn--primary"
                    onClick={performWarrantyCheck}
                >
                    Kiểm tra điều kiện bảo hành
                </button>
            </div>
        );
    }

    return (
        <div className={`warranty-check ${className}`}>
            <div className={`warranty-check__result ${checkResult.isEligible ? 'eligible' : 'not-eligible'}`}>
                <div className="warranty-check__status">
                    <span className="status-icon">
                        {checkResult.isEligible ? '✅' : '❌'}
                    </span>
                    <span className="status-text">
                        {checkResult.isEligible
                            ? 'Xe đủ điều kiện bảo hành'
                            : 'Xe không đủ điều kiện bảo hành'
                        }
                    </span>
                </div>

                {!checkResult.isEligible && checkResult.reasons && checkResult.reasons.length > 0 && (
                    <div className="warranty-check__reasons">
                        <h4>Lý do:</h4>
                        <ul>
                            {checkResult.reasons.map((reason, index) => (
                                <li key={index}>{reason}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="warranty-check__details">
                    <div className="detail-row">
                        <span className="label">Model xe:</span>
                        <span className="value">{checkResult.vehicleInfo?.model || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Số km hiện tại:</span>
                        <span className="value">
                            {checkResult.vehicleInfo?.currentMileage
                                ? `${checkResult.vehicleInfo.currentMileage.toLocaleString()} km`
                                : 'N/A'
                            }
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Thời gian kiểm tra:</span>
                        <span className="value">
                            {checkResult.checkedAt
                                ? new Date(checkResult.checkedAt).toLocaleString('vi-VN')
                                : 'N/A'
                            }
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarrantyCheckComponent;