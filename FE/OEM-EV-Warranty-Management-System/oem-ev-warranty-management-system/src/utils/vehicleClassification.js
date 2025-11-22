/**
 * Utility functions for vehicle classification
 * Phân loại xe dựa trên model, brand, và thông tin xe
 */

import { getAllCategories, getCategoryByType } from '../constants/vehicleCategories';

const buildVehicleTypeMetadata = () => {
    const categories = getAllCategories();
    const byId = {};
    const byApiKey = {};

    categories.forEach((category) => {
        const meta = {
            id: category.id,
            apiType: category.apiType || category.id.toUpperCase(),
            name: category.displayName || category.name,
            icon: category.icon,
            color: category.color || '#26de81'
        };

        byId[category.id] = meta;
        byApiKey[meta.apiType] = meta;
    });

    const unknown = {
        id: 'unknown',
        apiType: 'UNKNOWN',
        name: 'Chưa phân loại',
        icon: '❓',
        color: '#95a5a6'
    };

    return {
        byId,
        byApiKey,
        unknown
    };
};

const VEHICLE_TYPE_METADATA = buildVehicleTypeMetadata();

// Export for use in components
export { VEHICLE_TYPE_METADATA };

export const VEHICLE_TYPES = {
    ...VEHICLE_TYPE_METADATA.byApiKey,
    UNKNOWN: VEHICLE_TYPE_METADATA.unknown
};

const normalize = (value) => value?.toString().trim().toLowerCase() || '';

const HEURISTIC_RULES = [
    {
        categoryKey: 'electric_motorcycle',
        predicate: ({ model, brand }) =>
            model.includes('xe máy') ||
            model.includes('motorcycle') ||
            model.includes('scooter') ||
            model.includes('klara') ||
            model.includes('ludo') ||
            brand.includes('yadea') ||
            brand.includes('pega') ||
            brand.includes('dibao') ||
            (brand.includes('vinfast') && (model.includes('klara') || model.includes('ludo')))
    },
    {
        categoryKey: 'electric_car',
        predicate: ({ model, brand }) =>
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
    },
    {
        categoryKey: 'electric_bike',
        predicate: ({ model, brand }) =>
            model.includes('bike') ||
            model.includes('xe đạp') ||
            model.includes('bicycle') ||
            model.includes('ebike') ||
            brand.includes('giant') ||
            brand.includes('trek') ||
            brand.includes('bosch') ||
            brand.includes('shimano')
    },
    {
        categoryKey: 'electric_three_wheeler',
        predicate: ({ model, brand }) =>
            model.includes('three') ||
            model.includes('3 bánh') ||
            model.includes('ba bánh') ||
            model.includes('rickshaw') ||
            brand.includes('mahindra') ||
            brand.includes('bajaj') ||
            brand.includes('piaggio')
    },
    {
        categoryKey: 'electric_commercial',
        predicate: ({ model, brand }) =>
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
    }
];

const getCategoryFromBackendType = (vehicle = {}) => {
    const candidateKeys = [
        vehicle.vehicleType,
        vehicle.type,
        vehicle.vehicleCategory,
        vehicle.category,
        vehicle?.vehicleModel?.vehicleType,
        vehicle?.vehicleModel?.type
    ];

    for (const key of candidateKeys) {
        if (!key) continue;
        const category = getCategoryByType(key);
        if (category) {
            return VEHICLE_TYPE_METADATA.byId[category.id];
        }
    }
    return undefined;
};

const getCategoryFromHeuristics = (vehicle = {}) => {
    const model = normalize(vehicle.model);
    const brand = normalize(vehicle.brand);

    const context = { model, brand };

    for (const rule of HEURISTIC_RULES) {
        if (rule.predicate(context)) {
            const categoryMeta = VEHICLE_TYPE_METADATA.byId[rule.categoryKey];
            if (categoryMeta) {
                return categoryMeta;
            }
        }
    }

    return undefined;
};

/**
 * Classify vehicle based on API-provided type first, then heuristics
 */
export const classifyVehicle = (vehicle) => {
    const explicitType = getCategoryFromBackendType(vehicle);
    if (explicitType) {
        return explicitType;
    }

    const heuristicType = getCategoryFromHeuristics(vehicle);
    if (heuristicType) {
        return heuristicType;
    }

    return VEHICLE_TYPES.UNKNOWN;
};

/**
 * Get vehicle type by ID
 */
export const getVehicleTypeById = (id) => {
    return VEHICLE_TYPE_METADATA.byId[id] || VEHICLE_TYPES.UNKNOWN;
};

/**
 * Get all vehicle types
 */
export const getAllVehicleTypes = () => {
    return Object.values(VEHICLE_TYPE_METADATA.byId);
};

/**
 * Extract vehicle type string from vehicle object for API calls
 * Returns the API-compatible vehicle type string (e.g., 'CAR', 'MOTORCYCLE', 'SCOOTER', 'EBIKE')
 * @param {Object} vehicle - Vehicle object (can be from claim.vehicle, workOrder.vehicle, etc.)
 * @returns {string|null} Vehicle type string or null if not found
 */
export const extractVehicleTypeForAPI = (vehicle) => {
    if (!vehicle) return null;
    
    // Try direct vehicleType first
    if (vehicle.vehicleType) {
        // If it's already in API format (uppercase), return as is
        const upperType = vehicle.vehicleType.toUpperCase();
        if (VEHICLE_TYPE_METADATA.byApiKey[upperType]) {
            return upperType;
        }
        // Otherwise, try to find matching category
        const category = getCategoryByType(vehicle.vehicleType);
        if (category) {
            const meta = VEHICLE_TYPE_METADATA.byId[category.id];
            return meta?.apiType || null;
        }
    }
    
    // Try vehicleModel.vehicleType
    if (vehicle.vehicleModel?.vehicleType) {
        const upperType = vehicle.vehicleModel.vehicleType.toUpperCase();
        if (VEHICLE_TYPE_METADATA.byApiKey[upperType]) {
            return upperType;
        }
        const category = getCategoryByType(vehicle.vehicleModel.vehicleType);
        if (category) {
            const meta = VEHICLE_TYPE_METADATA.byId[category.id];
            return meta?.apiType || null;
        }
    }
    
    // Try other possible fields
    const candidateKeys = [
        vehicle.type,
        vehicle.vehicleCategory,
        vehicle.category,
        vehicle.vehicleModel?.type
    ];
    
    for (const key of candidateKeys) {
        if (!key) continue;
        const upperType = key.toUpperCase();
        if (VEHICLE_TYPE_METADATA.byApiKey[upperType]) {
            return upperType;
        }
        const category = getCategoryByType(key);
        if (category) {
            const meta = VEHICLE_TYPE_METADATA.byId[category.id];
            return meta?.apiType || null;
        }
    }
    
    // If nothing found, use classifyVehicle to get metadata and extract apiType
    const classified = classifyVehicle(vehicle);
    if (classified && classified !== VEHICLE_TYPES.UNKNOWN) {
        return classified.apiType || null;
    }
    
    return null;
};

/**
 * Normalize vehicle type for backend API compatibility
 * Maps frontend vehicle types to backend API values dynamically
 * Backend API expects: CAR, EBIKE, SCOOTER, MOTORBIKE, TRUCK
 * @param {string} vehicleType - Vehicle type in any format (id, apiType, backend value, etc.)
 * @returns {string|null} Backend API compatible vehicle type or null
 */
export const normalizeVehicleTypeForAPI = (vehicleType) => {
    if (!vehicleType) return null;
    
    // Normalize input
    const normalized = vehicleType.toString().trim().toUpperCase().replace(/[\s-]+/g, '_');
    
    // If already in backend API format, return as is
    const backendApiTypes = ['CAR', 'EBIKE', 'SCOOTER', 'MOTORBIKE', 'TRUCK'];
    if (backendApiTypes.includes(normalized)) {
        return normalized;
    }
    
    // Build mapping from categories dynamically
    const categories = getAllCategories();
    const mapping = {};
    
    categories.forEach((category) => {
        // Map from category id (e.g., 'electric_car')
        mapping[category.id.toUpperCase().replace(/[\s-]+/g, '_')] = getBackendApiType(category);
        
        // Map from apiType (e.g., 'ELECTRIC_CAR')
        if (category.apiType) {
            mapping[category.apiType.toUpperCase().replace(/[\s-]+/g, '_')] = getBackendApiType(category);
        }
        
        // Map from aliases if any
        if (category.aliases) {
            category.aliases.forEach(alias => {
                mapping[alias.toUpperCase().replace(/[\s-]+/g, '_')] = getBackendApiType(category);
            });
        }
    });
    
    // Legacy mappings for backward compatibility
    const legacyMapping = {
        'MOTORCYCLE': 'MOTORBIKE',
        'THREE_WHEELER': 'SCOOTER',
        'COMMERCIAL': 'TRUCK'
    };
    
    // Check mapping
    if (mapping[normalized]) {
        return mapping[normalized];
    }
    
    // Check legacy mapping
    if (legacyMapping[normalized]) {
        return legacyMapping[normalized];
    }
    
    return null;
};

/**
 * Get backend API type from category
 * Maps frontend categories to backend API values
 */
const getBackendApiType = (category) => {
    // Dynamic mapping based on category id
    const id = category.id.toLowerCase();
    
    if (id === 'electric_car') return 'CAR';
    if (id === 'electric_motorcycle') return 'MOTORBIKE';
    if (id === 'electric_bike') return 'EBIKE';
    if (id === 'electric_three_wheeler') return 'SCOOTER';
    if (id === 'electric_commercial') return 'TRUCK';
    
    // Fallback: if category has backendApiType field, use it
    if (category.backendApiType) {
        return category.backendApiType;
    }
    
    return null;
};

/**
 * Get frontend category from backend API vehicle type
 * Maps backend API values (CAR, EBIKE, SCOOTER, MOTORBIKE, TRUCK) to frontend category metadata
 * @param {string} backendApiType - Backend API vehicle type (CAR, EBIKE, etc.)
 * @returns {Object|null} Vehicle type metadata or null
 */
export const getCategoryFromBackendApiType = (backendApiType) => {
    if (!backendApiType) return null;
    
    // Map backend API values to frontend category IDs
    const backendToCategoryMap = {
        'CAR': 'electric_car',
        'MOTORBIKE': 'electric_motorcycle',
        'EBIKE': 'electric_bike',
        'SCOOTER': 'electric_three_wheeler',
        'TRUCK': 'electric_commercial'
    };
    
    const normalized = backendApiType.toString().trim().toUpperCase();
    const categoryId = backendToCategoryMap[normalized];
    
    if (categoryId && VEHICLE_TYPE_METADATA.byId[categoryId]) {
        return VEHICLE_TYPE_METADATA.byId[categoryId];
    }
    
    return null;
};