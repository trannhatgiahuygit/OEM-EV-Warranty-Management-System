// ClaimDetailPage.js

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaFileAlt } from 'react-icons/fa'; // ADDED: Import File Icon
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

// --- MODIFIED: Added onSubmitToEVM prop ---
const ClaimDetailPage = ({ claimId, onBackClick, onProcessToIntake, onEditDraftClaim, onUpdateDiagnostic, onSubmitToEVM, backButtonLabel = 'Back to Claim List' }) => {
    const [claim, setClaim] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null); // ADDED: To check technician assignment
    const effectRan = useRef(false);
    
    // Determine if the current user is SC_STAFF
    const isSCStaff = userRole === 'SC_STAFF';
    // ADDED: Determine if the current user is SC_TECHNICIAN
    const isSCTechnician = userRole === 'SC_TECHNICIAN';

    // --- NEW: Function to handle attachment download ---
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
        
        toast.info(`Attempting to download ${link.download}...`);
    };
    // ---------------------------------------------------


    // --- NEW: Function to re-fetch claim details (for use after action buttons) ---
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
    // --------------------------------------------------------------------------

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role) {
            setUserRole(user.role);
            setUserId(user.userId); // Save userId
        } else {
            setError('User not authenticated.');
            setIsLoading(false);
            return;
        }

        if (!claimId) {
            setError('No Claim ID provided.');
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

    // --- NEW: Submit to EVM Handler ---
    const handleSubmitToEVM = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            toast.error('User not authenticated.');
            return;
        }

        if (claim && claim.missingRequirements && claim.missingRequirements.length > 0) {
            toast.error(`Cannot submit: Missing requirements: ${claim.missingRequirements.join(', ')}`);
            return;
        }

        try {
            const response = await axios.post(
                // Corrected API endpoint back to /ready-for-submission as requested in the previous step's context
                `${process.env.REACT_APP_API_URL}/api/claims/${claimId}/ready-for-submission`, // Reverting to 'ready-for-submission' as it was used previously
                { claimId: claimId },
                {
                    headers: { 'Authorization': `Bearer ${user.token}` },
                }
            );

            if (response.status === 200 || response.status === 201) {
                toast.success('Claim successfully submitted to EVM for approval.');
                // Update the claim state with the new data from the response
                setClaim(response.data); 
                // Call the prop function if it exists
                if (onSubmitToEVM) {
                    onSubmitToEVM(response.data);
                }
            }
        } catch (err) {
            let errorMessage = 'Failed to submit claim to EVM.';
            if (err.response) {
                errorMessage = err.response.data?.message || errorMessage;
            }
            toast.error(errorMessage);
        }
    };
    // ------------------------------------

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
                    {/* MODIFIED: Display diagnostic fields */}
                    <DetailItem label="Diagnostic Summary" value={claim.diagnosticSummary || claim.initialDiagnosis} />
                    <DetailItem label="Estimated Cost" value={claim.estimatedRepairCost ? `€ ${claim.estimatedRepairCost.toFixed(2)}` : 'N/A'} />
                    <DetailItem label="Estimated Time" value={claim.estimatedRepairTime || 'N/A'} />
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
                
                {/* NEW: Attachments Card */}
                {claim.attachments && (
                    <DetailCard title={`Media Attachments (${claim.attachments.length})`}>
                        {claim.attachments.length > 0 ? (
                            <div className="cd-attachment-list">
                                {claim.attachments.map((att) => (
                                    <div 
                                        key={att.id} 
                                        className="cd-attachment-item"
                                        onClick={() => handleDownloadAttachment(att.filePath)}
                                        title={`Download: ${att.filePath.split('/').pop()}`}
                                    >
                                        <FaFileAlt className="cd-attachment-icon" />
                                        <span className="cd-attachment-name">{att.filePath.split('/').pop()}</span>
                                        <span className="cd-attachment-uploaded-by">
                                            ({att.uploadedBy?.username || 'System'})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="cd-no-attachments">No attachments found for this claim.</p>
                        )}
                    </DetailCard>
                )}
                
                {/* NEW: Display Missing Requirements if available */}
                {claim.missingRequirements && claim.missingRequirements.length > 0 && (
                    <DetailCard title="Missing Requirements">
                        <div className="cd-missing-requirements-list">
                            {claim.missingRequirements.map((req, index) => (
                                <p key={index} className="cd-missing-item">🚨 {req}</p>
                            ))}
                        </div>
                    </DetailCard>
                )}


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
    
    // ADDED: Check if the current user is the assigned technician AND the status is OPEN
    const isAssignedTechnicianAndOpen = 
        isSCTechnician && 
        claim && 
        claim.status === 'OPEN' && 
        claim.assignedTechnician && 
        claim.assignedTechnician.id === userId;

    // --- MODIFIED: Check if the current user is SC_STAFF AND the status is IN PROGRESS ---
    const isSCStaffAndInProgress = 
        isSCStaff && 
        claim && 
        claim.status === 'IN_PROGRESS';

    return (
        <div className="claim-detail-page">
            <div className="claim-detail-header">
                <div className="cd-header-content">
                    <button onClick={onBackClick} className="cd-back-button">
                        ← {backButtonLabel} {/* MODIFIED: Use the passed label */}
                    </button>
                    <h2 className="cd-page-title">
                        Claim Details {claim ? ` - ${claim.claimNumber}` : ''}
                    </h2>
                    {/* REMOVED: <p className="cd-page-description">Detailed overview of the repair claim.</p> */}
                </div>
                
                <div className="cd-header-actions"> 
                    {/* MODIFIED: SC Staff Submit to EVM Button */}
                    {isSCStaffAndInProgress && claim && claim.canSubmitToEvm && (
                         <button 
                            className="cd-process-button" 
                            onClick={handleSubmitToEVM}
                        >
                            Submit to EVM
                        </button>
                    )}

                    {/* Technician Update Diagnostic Button */}
                    {isAssignedTechnicianAndOpen && (
                         <button 
                            className="cd-process-button" 
                            onClick={() => onUpdateDiagnostic(claimId)}
                        >
                            Update Diagnostic
                        </button>
                    )}

                    {/* SC Staff Draft Buttons (Original) */}
                    {isSCStaff && claim && claim.status === 'DRAFT' && (
                        <>
                            <button 
                                className="cd-edit-draft-button" 
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
            </div>
            <div className="cd-content-wrapper">
                {renderContent()}
            </div>
        </div>
    );
};

export default ClaimDetailPage;
