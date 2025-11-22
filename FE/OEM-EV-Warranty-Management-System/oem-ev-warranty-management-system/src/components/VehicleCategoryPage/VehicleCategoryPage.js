import React, { useState } from 'react';
import VehicleCategoryFilter from '../VehicleCategoryFilter/VehicleCategoryFilter';
import VehicleCategoryCard from '../VehicleCategoryCard/VehicleCategoryCard';
import VehicleListModal from '../VehicleListModal/VehicleListModal';
import { getAllCategories } from '../../constants/vehicleCategories';
import './VehicleCategoryPage.css';

const VehicleCategoryPage = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [modalCategory, setModalCategory] = useState(null);

    const allCategories = getAllCategories();
    console.log('All categories:', allCategories);
    console.log('Selected category:', selectedCategory);
    console.log('Search term:', searchTerm);

    // Mock vehicle counts for demo
    const vehicleCounts = {
        'electric_motorcycle': 45,
        'electric_car': 128,
        'electric_bike': 23,
        'electric_three_wheeler': 12,
        'electric_commercial': 8
    };

    const filteredCategories = allCategories.filter(category => {
        const matchesSearch = !searchTerm ||
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.brands.some(brand => brand.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' ||
            (selectedCategory && category.id === selectedCategory.id);

        return matchesSearch && matchesCategory;
    });

    console.log('Filtered categories:', filteredCategories);

    const handleViewVehicles = (category) => {
        console.log('Xem danh sách xe cho:', category.name);
        setModalCategory(category);
        setShowVehicleModal(true);
    };

    const handleCloseModal = () => {
        setShowVehicleModal(false);
        setModalCategory(null);
    };

    const totalVehicles = Object.values(vehicleCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div className="vehicle-category-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <span className="header-icon">🚗</span>
                        Phân Loại Xe Điện
                    </h1>
                    <p className="page-description">
                        Quản lý và theo dõi các loại xe điện khác nhau trong hệ thống bảo hành OEM
                    </p>
                </div>

                <div className="stats-summary">
                    <div className="stat-card">
                        <span className="stat-number">{allCategories.length}</span>
                        <span className="stat-label">Loại xe</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{totalVehicles}</span>
                        <span className="stat-label">Tổng xe</span>
                    </div>
                </div>
            </div>

            <div className="page-filters">
                <div className="search-section">
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, mô tả hoặc thương hiệu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                </div>

                <VehicleCategoryFilter
                    selectedCategory={selectedCategory}
                    onCategorySelect={setSelectedCategory}
                />
            </div>

            <div className="category-grid">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map(category => (
                        <VehicleCategoryCard
                            key={category.id}
                            category={category}
                            vehicleCount={vehicleCounts[category.id] || 0}
                            onViewVehicles={handleViewVehicles}
                        />
                    ))
                ) : (
                    <div className="no-results">
                        <div className="no-results-icon">😔</div>
                        <h3>Không tìm thấy kết quả</h3>
                        <p>Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc</p>
                        <button
                            className="clear-filters-btn"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCategory('all');
                            }}
                        >
                            Xóa tất cả bộ lọc
                        </button>
                    </div>
                )}
            </div>

            <div className="page-footer">
                <div className="footer-info">
                    <h3>Thông tin hệ thống phân loại</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <h4>🏍️ Xe máy điện</h4>
                            <p>Phù hợp cho di chuyển cá nhân, tốc độ trung bình</p>
                        </div>
                        <div className="info-item">
                            <h4>🚗 Ô tô điện</h4>
                            <p>Xe gia đình và thương mại, công nghệ cao</p>
                        </div>
                        <div className="info-item">
                            <h4>🚲 Xe đạp điện</h4>
                            <p>Thân thiện môi trường, sử dụng trong thành phố</p>
                        </div>
                        <div className="info-item">
                            <h4>🛺 Xe ba bánh</h4>
                            <p>Vận chuyển hàng hóa và dịch vụ du lịch</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle List Modal */}
            <VehicleListModal
                isOpen={showVehicleModal}
                onClose={handleCloseModal}
                category={modalCategory?.id}
                categoryName={modalCategory?.name}
            />
        </div>
    );
};

export default VehicleCategoryPage;