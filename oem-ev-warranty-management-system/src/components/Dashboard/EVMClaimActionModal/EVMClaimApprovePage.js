// EVMClaimApprovePage.js (Modified for Grid Layout and Compactness)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import ClaimContextCard from './ClaimContextCard'; 
import './EVMClaimActionForm.css'; 

const initialApprovalData = {
    approvalNotes: '',
    warrantyCost: 0,
    approvalReason: '',
    requiresPartsShipment: true,
    specialInstructions: '',
    internalNotes: '',
    companyPaidCost: 0,
};

const EVMClaimApprovePage = ({ 
    claimId, 
    claimNumber, 
    estimatedCost, 
    vin, 
    reportedFailure, 
    onActionComplete, 
    handleBack 
}) => {
    const [formData, setFormData] = useState({ 
        ...initialApprovalData, 
        warrantyCost: estimatedCost || 0 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        setFormData(prev => ({ ...prev, warrantyCost: estimatedCost || 0 }));
    }, [estimatedCost]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.warrantyCost === 0 || isNaN(formData.warrantyCost) || !formData.approvalReason) {
            toast.error('Final Warranty Cost (must be greater than 0) and Approval Reason are required.');
            return;
        }

        setIsSubmitting(true);
        const endpoint = `${process.env.REACT_APP_API_URL}/api/evm/claims/${claimId}/approve`;
        
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await axios.post(
                endpoint,
                formData,
                { headers: { 'Authorization': `Bearer ${user.token}` } }
            );

            if (response.status === 200) {
                toast.success(`Claim ${claimNumber} successfully Approved!`);
                if (onActionComplete) onActionComplete(response.data);
            }
        } catch (error) {
            let errorMessage = `Failed to approve claim.`;
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
                <h2 className="evm-action-title">Approve Claim - {claimNumber}</h2>
            </div>
            <div className="evm-action-content">
                <ClaimContextCard
                    claimNumber={claimNumber}
                    vin={vin}
                    failure={reportedFailure}
                />
                
                <form onSubmit={handleSubmit} className="evm-action-form">
                    
                    {/* --- APPROVAL REASON SECTION (Full Width) --- */}
                    <div className="form-group required full-width">
                        <label htmlFor="approvalReason">Approval Reason</label>
                        <textarea 
                            id="approvalReason"
                            name="approvalReason" 
                            value={formData.approvalReason} 
                            onChange={handleChange} 
                            required
                            rows="1" /* Reduced for compactness */
                        />
                    </div>

                    {/* --- COSTS, INSTRUCTIONS, NOTES SECTION (Grid Layout) --- */}
                    <div className="evm-form-grid">
                        
                        <div className="form-group full-width form-section-separator">
                            {/* Empty separator */}
                        </div>

                        {/* Cost Fields */}
                        <div className="form-group required">
                            <label htmlFor="warrantyCost">Final Warranty Cost (€)</label>
                            <input 
                                type="number" 
                                id="warrantyCost"
                                name="warrantyCost" 
                                value={formData.warrantyCost} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="companyPaidCost">Company Paid Cost (€) (Optional)</label>
                            <input 
                                type="number" 
                                id="companyPaidCost"
                                name="companyPaidCost" 
                                value={formData.companyPaidCost} 
                                onChange={handleChange} 
                            />
                        </div>

                        {/* Instructions (Full Width) */}
                        <div className="form-group full-width">
                            <label htmlFor="specialInstructions">Special Instructions (Optional)</label>
                            <input 
                                type="text" 
                                id="specialInstructions"
                                name="specialInstructions" 
                                value={formData.specialInstructions} 
                                onChange={handleChange} 
                            />
                        </div>
                        
                        {/* Notes and Shipments (Grid) */}
                        <div className="form-group">
                            <label htmlFor="internalNotes">Internal Notes (EVM Only)</label>
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
                                id="requiresPartsShipment" 
                                name="requiresPartsShipment" 
                                checked={formData.requiresPartsShipment}
                                onChange={handleChange}
                            />
                            <label htmlFor="requiresPartsShipment">Requires Parts Shipment</label>
                        </div>

                        {/* Approval Notes (External) (Full Width) */}
                        <div className="form-group full-width">
                            <label htmlFor="approvalNotes">EVM Approval Notes (External)</label>
                            <textarea 
                                id="approvalNotes"
                                name="approvalNotes" 
                                value={formData.approvalNotes} 
                                onChange={handleChange} 
                                rows="1" /* Reduced for compactness */
                            />
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
                            className="evm-primary-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Approving...' : 'Approve & Finalize'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EVMClaimApprovePage;