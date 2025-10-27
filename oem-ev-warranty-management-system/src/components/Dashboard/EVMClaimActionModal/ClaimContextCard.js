// ClaimContextCard.js
import React from 'react';
import { FaCar, FaTag, FaTools } from 'react-icons/fa';
import './ClaimContextCard.css';

const ContextItem = ({ icon: Icon, label, value }) => (
    <div className="cc-context-item">
        <div className="cc-context-icon">{Icon && <Icon />}</div>
        {/* CORRECTED: Wrapper for text elements */}
        <div className="cc-context-text-wrapper"> 
            <span className="cc-context-label">{label}</span>
            <span className="cc-context-value">{value}</span>
        </div>
    </div>
);

const ClaimContextCard = ({ claimNumber, vin, failure }) => {
    return (
        <div className="cc-context-card">
            <h4 className="cc-card-title">Claim Context</h4>
            <div className="cc-card-body">
                <ContextItem 
                    icon={FaTag} 
                    label="Claim Number" 
                    value={claimNumber} 
                />
                <ContextItem 
                    icon={FaCar} 
                    label="Vehicle VIN" 
                    value={vin || 'N/A'} 
                />
                <ContextItem 
                    icon={FaTools} 
                    label="Reported Failure" 
                    value={failure || 'N/A'} 
                />
            </div>
        </div>
    );
};

export default ClaimContextCard;