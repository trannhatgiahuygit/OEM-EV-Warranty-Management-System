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