/**
 * Serial Parts Service
 * Handles API calls for serial parts management and assignment
 */

import { normalizeVehicleTypeForAPI as normalizeVehicleType } from '../utils/vehicleClassification';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class SerialPartsService {
    /**
     * Get authentication headers
     */
    getAuthHeaders() {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const user = JSON.parse(userString);
                return {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                    'accept': '*/*'
                };
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        return {
            'Content-Type': 'application/json',
            'accept': '*/*'
        };
    }

    /**
     * Normalize vehicleType for API compatibility
     * Uses the centralized utility function from vehicleClassification
     * @param {string} vehicleType - Vehicle type string (can be in various formats)
     * @returns {string|null} Normalized vehicle type for API or null
     */
    normalizeVehicleTypeForAPI(vehicleType) {
        return normalizeVehicleType(vehicleType);
    }

    /**
     * Get available serial parts (in stock)
     * @param {number} partId - Optional part ID to filter
     * @param {string} vehicleType - Optional vehicle type to filter (CAR, MOTORCYCLE, SCOOTER, EBIKE, etc.)
     * @returns {Promise<Array>} List of available serial parts
     */
    async getAvailableSerialParts(partId = null, vehicleType = null) {
        try {
            let url = `${API_URL}/api/part-serials/available`;
            const params = new URLSearchParams();
            
            if (partId) {
                params.append('partId', partId);
            }
            if (vehicleType) {
                // Normalize vehicleType for API compatibility
                const normalizedType = this.normalizeVehicleTypeForAPI(vehicleType);
                console.log('SerialPartsService - Normalizing vehicleType:', {
                    original: vehicleType,
                    normalized: normalizedType
                });
                params.append('vehicleType', normalizedType);
            }
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get available serial parts failed:', error);
            throw error;
        }
    }

    /**
     * Get available serial parts by part ID
     * @param {number} partId - ID of the part
     * @param {string} vehicleType - Optional vehicle type to filter
     * @returns {Promise<Array>} List of available serial parts
     */
    async getAvailableSerialPartsByPartId(partId, vehicleType = null) {
        return this.getAvailableSerialParts(partId, vehicleType);
    }

    /**
     * Install serial part on vehicle
     * @param {string} serialNumber - Serial number of part
     * @param {string} vin - Vehicle VIN
     * @param {number} workOrderId - Work order ID
     * @returns {Promise<Object>} Installation result
     */
    async installSerialPart(serialNumber, vin, workOrderId) {
        try {
            const response = await fetch(
                `${API_URL}/api/part-serials/install`,
                {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        serialNumber,
                        vin,
                        workOrderId
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Install serial part failed:', error);
            throw error;
        }
    }

    /**
     * Assign multiple serial parts to vehicle
     * @param {string} vin - Vehicle VIN
     * @param {number} workOrderId - Work order ID
     * @param {Array} serialNumbers - Array of serial numbers
     * @returns {Promise<Array>} Array of installation results
     */
    async assignSerialPartsToVehicle(vin, workOrderId, serialNumbers) {
        try {
            const results = [];
            for (const serialNumber of serialNumbers) {
                const result = await this.installSerialPart(serialNumber, vin, workOrderId);
                results.push(result);
            }
            return results;
        } catch (error) {
            console.error('Assign serial parts failed:', error);
            throw error;
        }
    }



    /**
     * Get vehicle serial parts history
     * @param {string} vin - Vehicle VIN
     * @returns {Promise<Object>} Vehicle parts information
     */
    async getVehicleSerialParts(vin) {
        try {
            const response = await fetch(
                `${API_URL}/api/part-serials/vehicle/${vin}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Backend returns {vin, installedParts: [...], totalParts: number}
            return data.installedParts || [];
        } catch (error) {
            console.error('Get vehicle serial parts failed:', error);
            throw error;
        }
    }

    /**
     * Get serial part details by serial number
     * @param {string} serialNumber - Serial number
     * @returns {Promise<Object>} Serial part details
     */
    async getSerialPartByNumber(serialNumber) {
        try {
            const response = await fetch(
                `${API_URL}/api/part-serials/${serialNumber}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get serial part by number failed:', error);
            throw error;
        }
    }


}

export const serialPartsService = new SerialPartsService();
export default serialPartsService;
