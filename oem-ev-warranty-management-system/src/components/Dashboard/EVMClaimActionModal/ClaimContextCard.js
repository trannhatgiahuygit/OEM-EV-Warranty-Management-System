// ClaimContextCard.js 
import React from 'react';
import { FaCar, FaTag, FaTools, FaMoneyBillWave } from 'react-icons/fa'; 
import './ClaimContextCard.css';

const ContextItem = ({ icon: Icon, label, value }) => (
    <div className="cc-context-item">
        <div className="cc-context-icon">{Icon && <Icon />}</div>
        <div className="cc-context-text-wrapper"> 
            <span className="cc-context-label">{label}</span>
            <span className="cc-context-value">{value}</span>
        </div>
    </div>
);

const ClaimContextCard = ({ claimNumber, vin, failure, warrantyCost }) => {
    
    // Helper to format currency
    const formatCurrency = (cost) => {
        // Check if cost is explicitly null or undefined. Allow 0 to pass through.
        if (cost === null || cost === undefined || cost === '') return 'N/A';
        
        const numericCost = typeof cost === 'string' ? parseFloat(cost) : cost;
        
        if (isNaN(numericCost) || !isFinite(numericCost)) return 'N/A';

        return `₫ ${numericCost.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    };
    
    // Debug: Log the warrantyCost value being received
    console.log('ClaimContextCard - warrantyCost received:', warrantyCost, 'Type:', typeof warrantyCost);
    
    const costToDisplay = formatCurrency(warrantyCost);

    return (
        <div className="cc-context-card">
            <h4 className="cc-card-title">Ngữ cảnh Yêu cầu</h4>
            <div className="cc-card-body">
                <ContextItem 
                    icon={FaTag} 
                    label="Số Yêu cầu" 
                    value={claimNumber} 
                />
                <ContextItem 
                    icon={FaCar} 
                    label="Số VIN Xe" 
                    value={vin || 'N/A'} 
                />
                
                {/* Always display warranty cost field */}
                <ContextItem 
                    icon={FaMoneyBillWave} 
                    label="Chi phí Bảo hành"
                    value={costToDisplay} 
                />
                
                <ContextItem 
                    icon={FaTools} 
                    label="Lỗi Đã Báo cáo" 
                    value={failure || 'N/A'} 
                />
            </div>
        </div>
    );
};

export default ClaimContextCard;