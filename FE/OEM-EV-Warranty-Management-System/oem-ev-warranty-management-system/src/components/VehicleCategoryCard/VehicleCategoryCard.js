import React from 'react';
import { COMMON_EV_COMPONENTS, WARRANTY_SEVERITY } from '../../constants/vehicleCategories';
import './VehicleCategoryCard.css';

const VehicleCategoryCard = ({ category, vehicleCount = 0, onViewVehicles }) => {
    const getSeverityColor = (criticality) => {
        const severity = Object.values(WARRANTY_SEVERITY).find(s => s.level === criticality);
        return severity ? severity.color : '#6c757d';
    };

    return (
        <div className="vehicle-category-card">
            <div className="category-header">
                <div className="category-icon-large">{category.icon}</div>
                <div className="category-title">
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                </div>
                <div className="vehicle-count">
                    <span className="count">{vehicleCount}</span>
                    <span className="label">xe</span>
                </div>
            </div>

            <div className="category-specs">
                <div className="spec-item">
                    <span className="spec-label">Tốc độ tối đa:</span>
                    <span className="spec-value speed">{category.maxSpeed}</span>
                </div>
                <div className="spec-item">
                    <span className="spec-label">Loại pin:</span>
                    <span className="spec-value battery">{category.batteryType}</span>
                </div>
            </div>

            <div className="category-brands">
                <h4>Thương hiệu phổ biến:</h4>
                <div className="brand-tags">
                    {category.brands.map((brand, index) => (
                        <span key={index} className="brand-tag">{brand}</span>
                    ))}
                </div>
            </div>

            <div className="warranty-components">
                <h4>Linh kiện bảo hành chính:</h4>
                <div className="component-list">
                    {category.warrantyComponents.slice(0, 3).map((component, index) => {
                        // Find matching common component for criticality
                        const commonComp = COMMON_EV_COMPONENTS.find(c =>
                            component.toLowerCase().includes(c.name.toLowerCase()) ||
                            component.toLowerCase().includes(c.nameVi.toLowerCase())
                        );
                        const criticality = commonComp ? commonComp.criticality : 'low';

                        return (
                            <div key={index} className="component-item">
                                <span
                                    className="component-indicator"
                                    style={{ backgroundColor: getSeverityColor(criticality) }}
                                ></span>
                                <span className="component-name">{component}</span>
                            </div>
                        );
                    })}
                    {category.warrantyComponents.length > 3 && (
                        <div className="more-components">
                            +{category.warrantyComponents.length - 3} linh kiện khác
                        </div>
                    )}
                </div>
            </div>

            <div className="category-actions">
                <button
                    className="view-vehicles-btn"
                    onClick={() => onViewVehicles && onViewVehicles(category)}
                >
                    <span className="btn-icon">👁️</span>
                    Xem danh sách xe
                </button>
                <button className="manage-warranty-btn">
                    <span className="btn-icon">⚙️</span>
                    Quản lý bảo hành
                </button>
            </div>
        </div>
    );
};

export default VehicleCategoryCard;