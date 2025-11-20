/**
 * Utility functions for vehicle classification
 * Phân loại xe dựa trên model, brand, và thông tin xe
 */

export const VEHICLE_TYPES = {
    ELECTRIC_MOTORCYCLE: {
        id: 'electric_motorcycle',
        name: 'Xe máy điện',
        icon: '🏍️',
        color: '#ff6b6b'
    },
    ELECTRIC_CAR: {
        id: 'electric_car',
        name: 'Ô tô điện',
        icon: '🚗',
        color: '#4ecdc4'
    },
    ELECTRIC_BIKE: {
        id: 'electric_bike',
        name: 'Xe đạp điện',
        icon: '🚲',
        color: '#45b7d1'
    },
    THREE_WHEELER: {
        id: 'three_wheeler',
        name: 'Xe ba bánh điện',
        icon: '🛺',
        color: '#f9ca24'
    },
    COMMERCIAL_VEHICLE: {
        id: 'commercial_vehicle',
        name: 'Xe thương mại điện',
        icon: '🚛',
        color: '#6c5ce7'
    },
    UNKNOWN: {
        id: 'unknown',
        name: 'Chưa phân loại',
        icon: '❓',
        color: '#95a5a6'
    }
};

/**
 * Classify vehicle based on model, brand, and other properties
 */
export const classifyVehicle = (vehicle) => {
    const model = vehicle.model?.toLowerCase() || '';
    const brand = vehicle.brand?.toLowerCase() || '';

    // Electric Motorcycle patterns
    if (
        model.includes('xe máy') ||
        model.includes('motorcycle') ||
        model.includes('scooter') ||
        model.includes('klara') ||
        model.includes('ludo') ||
        brand.includes('yadea') ||
        brand.includes('pega') ||
        brand.includes('dibao') ||
        (brand.includes('vinfast') && (model.includes('klara') || model.includes('ludo')))
    ) {
        return VEHICLE_TYPES.ELECTRIC_MOTORCYCLE;
    }

    // Electric Car patterns
    if (
        model.includes('car') ||
        model.includes('ô tô') ||
        model.includes('vf') ||
        model.includes('model s') ||
        model.includes('model 3') ||
        model.includes('model x') ||
        model.includes('model y') ||
        model.includes('ioniq') ||
        brand.includes('tesla') ||
        brand.includes('byd') ||
        (brand.includes('hyundai') && model.includes('ioniq')) ||
        (brand.includes('bmw') && model.includes('i')) ||
        (brand.includes('audi') && model.includes('e-tron')) ||
        (brand.includes('vinfast') && model.includes('vf'))
    ) {
        return VEHICLE_TYPES.ELECTRIC_CAR;
    }

    // Electric Bike patterns
    if (
        model.includes('bike') ||
        model.includes('xe đạp') ||
        model.includes('bicycle') ||
        model.includes('ebike') ||
        brand.includes('giant') ||
        brand.includes('trek') ||
        brand.includes('bosch') ||
        brand.includes('shimano')
    ) {
        return VEHICLE_TYPES.ELECTRIC_BIKE;
    }

    // Three Wheeler patterns
    if (
        model.includes('three') ||
        model.includes('3 bánh') ||
        model.includes('ba bánh') ||
        model.includes('rickshaw') ||
        brand.includes('mahindra') ||
        brand.includes('bajaj') ||
        brand.includes('piaggio')
    ) {
        return VEHICLE_TYPES.THREE_WHEELER;
    }

    // Commercial Vehicle patterns
    if (
        model.includes('truck') ||
        model.includes('van') ||
        model.includes('bus') ||
        model.includes('commercial') ||
        model.includes('xe tải') ||
        model.includes('xe buýt') ||
        model.includes('sprinter') ||
        model.includes('actros') ||
        brand.includes('volvo') ||
        brand.includes('scania') ||
        (brand.includes('mercedes') && (model.includes('sprinter') || model.includes('actros'))) ||
        (brand.includes('byd') && model.includes('bus'))
    ) {
        return VEHICLE_TYPES.COMMERCIAL_VEHICLE;
    }

    // Default to unknown if no patterns match
    return VEHICLE_TYPES.UNKNOWN;
};

/**
 * Get vehicle type by ID
 */
export const getVehicleTypeById = (id) => {
    return Object.values(VEHICLE_TYPES).find(type => type.id === id) || VEHICLE_TYPES.UNKNOWN;
};

/**
 * Get all vehicle types
 */
export const getAllVehicleTypes = () => {
    return Object.values(VEHICLE_TYPES).filter(type => type.id !== 'unknown');
};