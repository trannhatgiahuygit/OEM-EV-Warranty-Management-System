// TechnicianSubmitEVMForm.js

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaSave } from 'react-icons/fa';
// --- MODIFIED IMPORT ---
import './TechnicianSubmitEVMForm.css'; 

const TechnicianSubmitEVMForm = ({ claimId, claimNumber, onSubmissionSuccess, handleBackClick }) => {
    const [submissionNotes, setSubmissionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!submissionNotes) {
            toast.warn('Submission Notes are required before submitting to EVM.');
            return;
        }

        setIsSubmitting(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user.token;
            
            const payload = {
                claimId: claimId,
                submissionNotes: submissionNotes,
            };

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/claims/submit`,
                payload,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            if (response.status === 200) {
                // Success case
                toast.success('Claim has been submitted for EVM Approval successfully! The claim status is now PENDING EVM APPROVAL.');
                // Trigger the success handler to return to the detail page and refresh the data
                onSubmissionSuccess(response.data); 
            } else {
                // Handle unexpected 2xx status codes if necessary
                 toast.info(`Submission successful with status code: ${response.status}.`);
                 onSubmissionSuccess(response.data);
            }

        } catch (error) {
            let errorMessage = `An error occurred during submission of Claim ${claimNumber}.`;
            if (error.response) {
                errorMessage = error.response.data?.message || `Error: ${error.response.status} - ${error.response.statusText}`;
            } else if (error.request) {
                errorMessage = 'No response from server. Check network connection.';
            } else {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            // --- MODIFIED CLASSES ---
            className="tsef-page-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="tsef-page-header">
                <button onClick={handleBackClick} className="tsef-back-button">
                    ← Back to Claim Details
                </button>
                <h2 className="tsef-page-title">
                    Submit Diagnostic for EVM Approval - Claim {claimNumber}
                </h2>
                <p className="tsef-page-description">
                    Finalize the diagnostic report and send it to EVM Staff for final cost approval.
                </p>
            </div>

            <div className="tsef-content-area">
                <motion.form 
                    onSubmit={handleSubmit}
                    className="tsef-form-grid"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                    <motion.div className="tsef-form-section tsef-full-width" variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}>
                        <h3 className="tsef-section-title">Submission Notes</h3>
                        
                        <div className="tsef-form-group">
                            <label htmlFor="submissionNotes">Submission Notes *</label>
                            <textarea
                                id="submissionNotes"
                                value={submissionNotes}
                                onChange={(e) => setSubmissionNotes(e.target.value)}
                                placeholder="Enter any final notes or recommendations for the EVM approval team (Required)."
                                required
                                rows="8"
                            />
                        </div>

                    </motion.div>

                    <motion.div 
                        className="tsef-submit-area tsef-full-width"
                        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                    >
                        <button
                            type="submit"
                            className="tsef-submit-button"
                            disabled={isSubmitting || !submissionNotes} 
                        >
                            <FaSave /> {isSubmitting ? 'Submitting...' : 'Submit to EVM for Approval'}
                        </button>
                    </motion.div>
                </motion.form>
            </div>
        </motion.div>
    );
};

export default TechnicianSubmitEVMForm;