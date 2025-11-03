// EVMClaimRejectPage.js (Modified for Grid Layout and Compactness)
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ClaimContextCard from './ClaimContextCard'; 
import './EVMClaimActionForm.css'; // Shared styles

const initialRejectionData = {
    rejectionReason: '',
    rejectionNotes: '',
    suggestedAction: '', // MODIFIED: Removed 'Contact service center.' default text
    requiresAdditionalInfo: false,
    additionalInfoRequired: '',
    internalNotes: '',
    notifyCustomer: true,
};

const EVMClaimRejectPage = ({ 
    claimId, 
    claimNumber, 
    vin, 
    reportedFailure, 
    onActionComplete, 
    handleBack 
}) => {
    const [formData, setFormData] = useState(initialRejectionData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.rejectionReason) {
            toast.error('Rejection Reason is required.');
            return;
        }

        setIsSubmitting(true);
        const endpoint = `${process.env.REACT_APP_API_URL}/api/evm/claims/${claimId}/reject`;
        
        const dataToSend = formData.requiresAdditionalInfo ? formData : { ...formData, additionalInfoRequired: '' };

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.post(
                endpoint,
                dataToSend,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );

            if (response.status === 200) {
                toast.success(`Claim ${claimNumber} successfully Rejected!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Failed to reject claim.`;
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
                    ← Back to Details
                </button>
                <h2 className="evm-action-title">Reject Claim - {claimNumber}</h2>
            </div>
            <div className="evm-action-content">
                <ClaimContextCard
                    claimNumber={claimNumber}
                    vin={vin}
                    failure={reportedFailure}
                />
                
                <form onSubmit={handleSubmit} className="evm-action-form">
                    
                    {/* --- REJECTION REASON SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="rejectionReason">Rejection Reason</label>
                        <textarea 
                            id="rejectionReason"
                            name="rejectionReason" 
                            value={formData.rejectionReason} 
                            onChange={handleChange} 
                            required
                            rows="1" /* Reduced for compactness */
                        />
                    </div>
                    
                    {/* --- ADDITIONAL INFO/NOTES SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                           {/* Empty separator, used for visual break */}
                        </div>

                        <div className="form-group">
                            <label htmlFor="suggestedAction">Suggested Action for Service Center</label>
                            <input 
                                type="text" 
                                id="suggestedAction"
                                name="suggestedAction" 
                                value={formData.suggestedAction} 
                                onChange={handleChange} 
                            />
                        </div>
                        
                        {/* Checkbox Group and Conditional Input (Spans full width when needed) */}
                        <div className="form-group full-width">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="requiresAdditionalInfo" 
                                    name="requiresAdditionalInfo" 
                                    checked={formData.requiresAdditionalInfo}
                                    onChange={handleChange}
                                />
                                <label htmlFor="requiresAdditionalInfo">Requires Additional Info</label>
                            </div>
                            {formData.requiresAdditionalInfo && (
                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label htmlFor="additionalInfoRequired">Specific Info Required</label>
                                    <input 
                                        type="text" 
                                        id="additionalInfoRequired"
                                        name="additionalInfoRequired" 
                                        value={formData.additionalInfoRequired} 
                                        onChange={handleChange} 
                                    />
                                </div>
                            )}
                        </div>

                        {/* External Notes (Full Width) */}
                        <div className="form-group full-width">
                            <label htmlFor="rejectionNotes">EVM Rejection Notes (External)</label>
                            <textarea 
                                id="rejectionNotes"
                                name="rejectionNotes" 
                                value={formData.rejectionNotes} 
                                onChange={handleChange} 
                                rows="1" /* Reduced for compactness */
                            />
                        </div>

                        {/* Internal Notes and Notify Customer (Grid) */}
                        <div className="form-group">
                            <label htmlFor="internalNotes">Internal Notes (EVM Only</label>
                            <textarea 
                                id="internalNotes"
                                name="internalNotes" 
                                value={formData.internalNotes} 
                                onChange={handleChange} 
                                rows="1"
                            />
                        </div>

                         <div className="form-group checkbox-group">
                            <input 
                                type="checkbox" 
                                id="notifyCustomer" 
                                name="notifyCustomer" 
                                checked={formData.notifyCustomer}
                                onChange={handleChange}
                            />
                            <label htmlFor="notifyCustomer">Notify Customer of Rejection</label>
                        </div>
                    </div>
                    
                    <div className="evm-action-actions">
                        <button 
                            type="button" 
                            className="evm-cancel-btn" 
                            onClick={handleBack}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="evm-reject-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Rejecting...' : 'Reject Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EVMClaimRejectPage;