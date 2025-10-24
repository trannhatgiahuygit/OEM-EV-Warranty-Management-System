import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import './ClaimDetailPage.css';

// Helper function to format date
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch (error) {
        return 'Invalid Date';
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

// Prop 'onProcessToIntake' is correctly named
// --- MODIFIED: Add onEditDraftClaim prop ---
const ClaimDetailPage = ({ claimId, onBackClick, onProcessToIntake, onEditDraftClaim }) => {
    const [claim, setClaim] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const effectRan = useRef(false);

    useEffect(() => {
        if (!claimId) {
            setError('No Claim ID provided.');
            setIsLoading(false);
            return;
        }

        // StrictMode guard
        if (effectRan.current === true && process.env.NODE_ENV === 'development') {
            return;
        }

        const fetchClaimDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || !user.token) {
                    throw new Error('User not authenticated.');
                }

                const response = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/claims/${claimId}`,
                    {
                        headers: { 'Authorization': `Bearer ${user.token}` },
                    }
                );

                if (response.status === 200) {
                    setClaim(response.data);
                    // toast.success('Claim details loaded successfully!'); // Removed for less noise
                }
            } catch (err) {
                let errorMessage = 'Failed to fetch claim details.';
                if (err.message === 'User not authenticated.') {
                    errorMessage = err.message;
                } else if (err.response) {
                    errorMessage = err.response.data?.message || errorMessage;
                }
                toast.error(errorMessage);
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClaimDetails();

        return () => {
            effectRan.current = true;
        };
    }, [claimId]);

    const renderContent = () => {
        if (isLoading) {
            return <div className="cd-loading">Loading claim details...</div>;
        }

        if (error) {
            return <div className="cd-error">Error: {error}</div>;
        }

        if (!claim) {
            return <div className="cd-no-claim">No claim data found.</div>;
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
                <DetailCard title="Claim Information">
                    <DetailItem label="Claim Number" value={claim.claimNumber} />
                    <DetailItem label="Status" value={<span className={`cd-status-badge ${claim.status.toLowerCase()}`}>{claim.statusLabel}</span>} />
                    <DetailItem label="Reported Failure" value={claim.reportedFailure} />
                    <DetailItem label="Initial Diagnosis" value={claim.initialDiagnosis} />
                    <DetailItem label="Created At" value={formatDateTime(claim.createdAt)} />
                    <DetailItem label="Created By" value={claim.createdBy?.fullName} />
                </DetailCard>

                <DetailCard title="Customer Details">
                    <DetailItem label="Name" value={claim.customer.name} />
                    <DetailItem label="Phone" value={claim.customer.phone} />
                    <DetailItem label="Email" value={claim.customer.email} />
                    <DetailItem label="Address" value={claim.customer.address} />
                </DetailCard>

                <DetailCard title="Assignment">
                    <DetailItem label="Assigned Technician" value={claim.assignedTechnician?.fullName} />
                    <DetailItem label="Approved By" value={claim.approvedBy?.fullName} />
                    <DetailItem label="Approval Date" value={formatDateTime(claim.approvedAt)} />
                </DetailCard>

                <DetailCard title="Vehicle Details">
                    <DetailItem label="VIN" value={claim.vehicle.vin} />
                    <DetailItem label="Model" value={claim.vehicle.model} />
                    <DetailItem label="Year" value={claim.vehicle.year} />
                    <DetailItem label="Mileage (km)" value={claim.vehicle.mileageKm} />
                </DetailCard>

                <DetailCard title="Status History">
                    <div className="cd-status-history-list">
                        {claim.statusHistory.length > 0 ? (
                            [...claim.statusHistory].reverse().map((entry) => ( // Show newest first
                                <div key={entry.id} className="cd-status-item">
                                    <div className="cd-status-item-header">
                                        <span className={`cd-status-badge ${entry.statusCode.toLowerCase()}`}>{entry.statusLabel}</span>
                                        <span className="cd-status-time">{formatDateTime(entry.changedAt)}</span>
                                    </div>
                                    <p className="cd-status-note">"{entry.note}"</p>
                                    <p className="cd-status-by">by {entry.changedBy?.fullName}</p>
                                </div>
                            ))
                        ) : (
                            <p>No status history available.</p>
                        )}
                    </div>
                </DetailCard>
            </motion.div>
        );
    };

    return (
        <div className="claim-detail-page">
            <div className="claim-detail-header">
                {/* --- Wrapper cho nội dung bên trái --- */}
                <div className="cd-header-content">
                    <button onClick={onBackClick} className="cd-back-button">
                        ← Back to Claim List
                    </button>
                    <h2 className="cd-page-title">
                        Claim Details {claim ? ` - ${claim.claimNumber}` : ''}
                    </h2>
                    <p className="cd-page-description">
                        Detailed overview of the repair claim.
                    </p>
                </div>
                
                {/* --- MODIFIED: Wrapper for action buttons --- */}
                <div className="cd-header-actions"> 
                    {claim && claim.status === 'DRAFT' && (
                        <>
                            {/* --- NEW: Edit Draft Button --- */}
                            <button 
                                className="cd-edit-draft-button" // NEW CLASS FOR EDIT
                                onClick={() => onEditDraftClaim(claim)}
                            >
                                Edit Draft Claim
                            </button>

                            <button 
                                className="cd-process-button" 
                                onClick={() => onProcessToIntake(claim)}
                            >
                                Process to Intake
                            </button>
                        </>
                    )}
                </div>
                {/* --- END MODIFICATION --- */}
            </div>
            <div className="cd-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default ClaimDetailPage;