/**
 * Vehicle Categories for OEM EV Warranty Management System
 * Phân loại xe điện cho hệ thống quản lý bảo hành
 */

export const VEHICLE_CATEGORIES = {
    ELECTRIC_MOTORCYCLE: {
        id: 'electric_motorcycle',
        name: 'Xe máy điện (Electric Motorcycle)',
        description: 'Xe điện như của VinFast, YADEA...',
        icon: '🏍️',
        warrantyComponents: [
            'Quản lý pin',
            'Động cơ điện',
            'Bộ điều khiển',
            'Hệ thống sạc',
            'Phanh điện tử'
        ],
        brands: ['VinFast', 'YADEA', 'Pega', 'Dibao'],
        maxSpeed: '70km/h',
        batteryType: 'Li-ion removable'
    },

    ELECTRIC_CAR: {
        id: 'electric_car',
        name: 'Ô tô điện (Electric Car)',
        description: 'Tesla, VinFast VF series, BYD, Hyundai Ioniq...',
        icon: '🚗',
        warrantyComponents: [
            'Bảo hành pin',
            'Inverter',
            'BMS (Battery Management System)',
            'Drive unit',
            'Charging system',
            'HVAC system'
        ],
        brands: ['Tesla', 'VinFast', 'BYD', 'Hyundai', 'BMW', 'Audi'],
        maxSpeed: '200km/h+',
        batteryType: 'Li-ion fixed pack'
    },

    ELECTRIC_BIKE: {
        id: 'electric_bike',
        name: 'Xe đạp điện - eBike',
        description: 'Thường dùng ở trường học, thành phố.',
        icon: '🚲',
        warrantyComponents: [
            'Cũng cần quản lý bộ điều khiển',
            'Pin lithium',
            'Motor hub',
            'Display controller',
            'Pedal assist system'
        ],
        brands: ['Giant', 'Trek', 'Specialized', 'Xiaomi'],
        maxSpeed: '25km/h',
        batteryType: 'Li-ion removable'
    },

    ELECTRIC_THREE_WHEELER: {
        id: 'electric_three_wheeler',
        name: 'Xe điện ba bánh / xe điện dịch vụ',
        description: 'Xe chở hàng, xe du lịch săn golf...',
        icon: '🛺',
        warrantyComponents: [
            'Quản lý bảo hành linh kiện tương tự',
            'Heavy duty battery pack',
            'Cargo management system',
            'Commercial grade motor',
            'Fleet tracking system'
        ],
        brands: ['Club Car', 'E-Z-GO', 'Yamaha', 'Custom'],
        maxSpeed: '35km/h',
        batteryType: 'Lead-acid or Li-ion'
    },

    ELECTRIC_COMMERCIAL: {
        id: 'electric_commercial',
        name: 'Xe điện chuyên dụng',
        description: 'Xe nâng điện (Forklift), Xe vận tải nhỏ trong nhà máy, Xe tự hành AGV',
        icon: '🏭',
        warrantyComponents: [
            'Industrial battery management',
            'Heavy duty motor',
            'Hydraulic systems (for forklifts)',
            'Navigation system (for AGV)',
            'Safety sensors',
            'Load management system'
        ],
        brands: ['Toyota', 'Crown', 'Hyster', 'Yale', 'Komatsu'],
        maxSpeed: '20km/h',
        batteryType: 'Industrial grade Li-ion/Lead-acid'
    }
};

/**
 * Get all vehicle categories
 */
export const getAllCategories = () => {
    return Object.values(VEHICLE_CATEGORIES);
};

/**
 * Get category by ID
 */
export const getCategoryById = (id) => {
    return Object.values(VEHICLE_CATEGORIES).find(cat => cat.id === id);
};

/**
 * Get categories by brand
 */
export const getCategoriesByBrand = (brand) => {
    return Object.values(VEHICLE_CATEGORIES).filter(cat =>
        cat.brands.some(b => b.toLowerCase().includes(brand.toLowerCase()))
    );
};

/**
 * Common warranty components across all electric vehicles
 */
export const COMMON_EV_COMPONENTS = [
    {
        id: 'battery_pack',
        name: 'Battery Pack',
        nameVi: 'Bộ pin',
        warrantyPeriod: '8 years or 160,000km',
        criticality: 'high'
    },
    {
        id: 'electric_motor',
        name: 'Electric Motor',
        nameVi: 'Động cơ điện',
        warrantyPeriod: '5 years or 100,000km',
        criticality: 'high'
    },
    {
        id: 'bms',
        name: 'Battery Management System',
        nameVi: 'Hệ thống quản lý pin',
        warrantyPeriod: '5 years or 100,000km',
        criticality: 'high'
    },
    {
        id: 'inverter',
        name: 'Power Inverter',
        nameVi: 'Bộ nghịch lưu',
        warrantyPeriod: '3 years or 60,000km',
        criticality: 'medium'
    },
    {
        id: 'charging_port',
        name: 'Charging Port',
        nameVi: 'Cổng sạc',
        warrantyPeriod: '2 years or 40,000km',
        criticality: 'medium'
    },
    {
        id: 'display_unit',
        name: 'Display Unit',
        nameVi: 'Màn hình hiển thị',
        warrantyPeriod: '2 years or 40,000km',
        criticality: 'low'
    }
];

/**
 * Warranty severity levels
 */
export const WARRANTY_SEVERITY = {
    HIGH: {
        level: 'high',
        name: 'Cao',
        color: '#ff4757',
        description: 'Ảnh hưởng trực tiếp đến vận hành xe'
    },
    MEDIUM: {
        level: 'medium',
        name: 'Trung bình',
        color: '#ffa502',
        description: 'Ảnh hưởng đến hiệu suất'
    },
    LOW: {
        level: 'low',
        name: 'Thấp',
        color: '#26de81',
        description: 'Không ảnh hưởng vận hành'
    }
};