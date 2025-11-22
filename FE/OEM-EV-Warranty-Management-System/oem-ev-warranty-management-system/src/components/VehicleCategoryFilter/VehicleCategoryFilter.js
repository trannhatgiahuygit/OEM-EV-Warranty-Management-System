import React, { useState } from 'react';
import { VEHICLE_CATEGORIES, getAllCategories, getCategoryById } from '../../constants/vehicleCategories';
import './VehicleCategoryFilter.css';

const VehicleCategoryFilter = ({ onCategorySelect, selectedCategory = null }) => {
    const [isOpen, setIsOpen] = useState(false);
    const categories = getAllCategories();

    const handleCategoryClick = (category) => {
        onCategorySelect(category);
        setIsOpen(false);
    };

    const handleClearFilter = () => {
        onCategorySelect(null);
        setIsOpen(false);
    };

    return (
        <div className="vehicle-category-filter">
            <button
                className="category-filter-toggle"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="filter-icon">🔍</span>
                <span className="filter-text">
                    {selectedCategory ? selectedCategory.name : 'Phân loại xe'}
                </span>
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <div className="category-dropdown">
                    <div className="dropdown-header">
                        <h3>Chọn loại xe điện</h3>
                        {selectedCategory && (
                            <button
                                className="clear-filter-btn"
                                onClick={handleClearFilter}
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    <div className="category-list">
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className={`category-item ${selectedCategory?.id === category.id ? 'selected' : ''}`}
                                onClick={() => handleCategoryClick(category)}
                            >
                                <div className="category-icon">{category.icon}</div>
                                <div className="category-info">
                                    <h4>{category.name}</h4>
                                    <p>{category.description}</p>
                                    <div className="category-details">
                                        <span className="max-speed">Tốc độ: {category.maxSpeed}</span>
                                        <span className="battery-type">Pin: {category.batteryType}</span>
                                    </div>
                                    <div className="category-brands">
                                        <strong>Thương hiệu:</strong> {category.brands.join(', ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="dropdown-footer">
                        <small>Chọn phân loại để lọc xe theo từng loại</small>
                    </div>
                </div>
            )}

            {isOpen && (
                <div
                    className="category-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default VehicleCategoryFilter;