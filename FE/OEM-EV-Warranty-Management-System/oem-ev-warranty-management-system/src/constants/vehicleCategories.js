/**
 * Vehicle Categories for OEM EV Warranty Management System
 * Phân loại xe điện cho hệ thống quản lý bảo hành
 */

export const VEHICLE_CATEGORIES = {
    ELECTRIC_MOTORCYCLE: {
        id: 'electric_motorcycle',
        apiType: 'ELECTRIC_MOTORCYCLE',
        displayName: 'Xe máy điện',
        name: 'Xe máy điện (Electric Motorcycle)',
        description: 'Xe điện như của VinFast, YADEA...',
        icon: '🏍️',
        color: '#ff6b6b',
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
        apiType: 'ELECTRIC_CAR',
        displayName: 'Ô tô điện',
        name: 'Ô tô điện (Electric Car)',
        description: 'Tesla, VinFast VF series, BYD, Hyundai Ioniq...',
        icon: '🚗',
        color: '#4ecdc4',
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
        apiType: 'ELECTRIC_BIKE',
        displayName: 'Xe đạp điện',
        name: 'Xe đạp điện - eBike',
        description: 'Thường dùng ở trường học, thành phố.',
        icon: '🚲',
        color: '#45b7d1',
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
        apiType: 'ELECTRIC_THREE_WHEELER',
        displayName: 'Xe điện ba bánh',
        name: 'Xe điện ba bánh / xe điện dịch vụ',
        description: 'Xe chở hàng, xe du lịch săn golf...',
        icon: '🛺',
        color: '#f9ca24',
        aliases: ['THREE_WHEELER'],
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
        apiType: 'ELECTRIC_COMMERCIAL',
        displayName: 'Xe điện chuyên dụng',
        name: 'Xe điện chuyên dụng',
        description: 'Xe nâng điện (Forklift), Xe vận tải nhỏ trong nhà máy, Xe tự hành AGV',
        icon: '🏭',
        color: '#6c5ce7',
        aliases: ['COMMERCIAL_VEHICLE'],
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

const normalizeVehicleTypeKey = (value) => {
    if (!value && value !== 0) return '';
    return value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
};

const buildCategoryTypeIndex = () => {
    const index = {};
    Object.values(VEHICLE_CATEGORIES).forEach((category) => {
        const aliases = [
            category.id,
            category.apiType,
            ...(category.aliases || [])
        ];

        aliases.forEach((alias) => {
            const normalized = normalizeVehicleTypeKey(alias);
            if (normalized && !index[normalized]) {
                index[normalized] = category;
            }
        });
    });
    return index;
};

const CATEGORY_TYPE_INDEX = buildCategoryTypeIndex();

export const getCategoryByType = (type) => {
    const normalized = normalizeVehicleTypeKey(type);
    return normalized ? CATEGORY_TYPE_INDEX[normalized] : undefined;
};

export const getVehicleTypeOptions = () => {
    return Object.values(VEHICLE_CATEGORIES).map((category) => ({
        id: category.id,
        apiType: category.apiType || category.id.toUpperCase(),
        name: category.displayName || category.name,
        icon: category.icon,
        color: category.color
    }));
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