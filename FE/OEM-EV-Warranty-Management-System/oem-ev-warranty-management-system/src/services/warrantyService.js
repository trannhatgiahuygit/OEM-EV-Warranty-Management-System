export const WarrantyService = {
    // Check warranty eligibility for a vehicle
    async checkWarrantyEligibility(request) {
        try {
            const response = await fetch('/api/warranty/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error('Failed to check warranty eligibility');
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking warranty eligibility:', error);
            throw error;
        }
    },

    // Get vehicle models
    async getVehicleModels() {
        try {
            const response = await fetch('/api/vehicle-models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vehicle models');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching vehicle models:', error);
            throw error;
        }
    },

    // Get vehicle details
    async getVehicleDetails(vehicleId) {
        try {
            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vehicle details');
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching vehicle details:', error);
            throw error;
        }
    },

    // Validate warranty conditions manually
    validateWarrantyConditions(vehicleInfo, warrantyConditions, currentDate = new Date()) {
        const reasons = [];
        let isEligible = true;

        // Check warranty period (time-based)
        if (warrantyConditions.warrantyPeriodMonths) {
            const warrantyStartDate = new Date(vehicleInfo.warrantyStartDate);
            const warrantyEndDate = new Date(warrantyStartDate);
            warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyConditions.warrantyPeriodMonths);

            if (currentDate > warrantyEndDate) {
                isEligible = false;
                reasons.push(`Bảo hành đã hết hạn từ ngày ${warrantyEndDate.toLocaleDateString('vi-VN')}`);
            }
        }

        // Check mileage limit
        if (warrantyConditions.maxMileage && vehicleInfo.currentMileage > warrantyConditions.maxMileage) {
            isEligible = false;
            reasons.push(`Số km vượt quá giới hạn bảo hành (${vehicleInfo.currentMileage.toLocaleString()} km > ${warrantyConditions.maxMileage.toLocaleString()} km)`);
        }

        return {
            isEligible,
            reasons,
            checkedAt: currentDate.toISOString(),
            vehicleInfo,
            warrantyConditions
        };
    }
};