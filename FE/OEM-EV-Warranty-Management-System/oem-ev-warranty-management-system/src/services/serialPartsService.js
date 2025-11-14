/**
 * Serial Parts Service
 * Handles API calls for serial parts management and assignment
 */

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
                    'Content-Type': 'application/json'
                };
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        return {
            'Content-Type': 'application/json'
        };
    }

    /**
     * Get available serial parts by type
     * @param {string} partType - Type of part (EVM or THIRD_PARTY)
     * @returns {Promise<Array>} List of available serial parts
     */
    async getAvailableSerialParts(partType) {
        try {
            const response = await fetch(
                `${API_URL}/api/serial-parts/available?type=${partType}`,
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
            console.error('Get available serial parts failed:', error);
            throw error;
        }
    }

    /**
     * Get available serial parts by part ID
     * @param {number} partId - ID of the part
     * @returns {Promise<Array>} List of available serial parts
     */
    async getAvailableSerialPartsByPartId(partId) {
        try {
            const response = await fetch(
                `${API_URL}/api/serial-parts/available/part/${partId}`,
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
            console.error('Get available serial parts by part ID failed:', error);
            throw error;
        }
    }

    /**
     * Assign serial parts to vehicle
     * @param {number} workOrderId - Work order ID
     * @param {Array} assignments - Array of {partId, serialNumber, partType, vehicleId}
     * @returns {Promise<Object>} Assignment result
     */
    async assignSerialPartsToVehicle(workOrderId, assignments) {
        try {
            const response = await fetch(
                `${API_URL}/api/serial-parts/assign`,
                {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        workOrderId,
                        assignments
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Assign serial parts failed:', error);
            throw error;
        }
    }

    /**
     * Update serial part status
     * @param {string} serialNumber - Serial number of the part
     * @param {string} newStatus - New status (IN_STOCK, ASSIGNED, INSTALLED, REPLACED, DEFECTIVE)
     * @param {string} location - Location (EVM_WAREHOUSE, THIRD_PARTY_WAREHOUSE, CUSTOMER_VEHICLE)
     * @returns {Promise<Object>} Update result
     */
    async updateSerialPartStatus(serialNumber, newStatus, location) {
        try {
            const response = await fetch(
                `${API_URL}/api/serial-parts/status`,
                {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        serialNumber,
                        status: newStatus,
                        location
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Update serial part status failed:', error);
            throw error;
        }
    }

    /**
     * Get vehicle serial parts history
     * @param {number} vehicleId - Vehicle ID
     * @returns {Promise<Array>} List of serial parts assigned to vehicle
     */
    async getVehicleSerialParts(vehicleId) {
        try {
            const response = await fetch(
                `${API_URL}/api/vehicles/${vehicleId}/serial-parts`,
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
                `${API_URL}/api/serial-parts/${serialNumber}`,
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

    /**
     * Get work order details with parts
     * @param {number} workOrderId - Work order ID
     * @returns {Promise<Object>} Work order with parts information
     */
    async getWorkOrderWithParts(workOrderId) {
        try {
            const response = await fetch(
                `${API_URL}/api/work-orders/${workOrderId}/parts`,
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
            console.error('Get work order with parts failed:', error);
            throw error;
        }
    }

    /**
     * Batch update serial parts status
     * @param {Array} updates - Array of {serialNumber, status, location}
     * @returns {Promise<Object>} Batch update result
     */
    async batchUpdateSerialPartsStatus(updates) {
        try {
            const response = await fetch(
                `${API_URL}/api/serial-parts/batch-update-status`,
                {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ updates })
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Batch update serial parts status failed:', error);
            throw error;
        }
    }
}

export const serialPartsService = new SerialPartsService();
export default serialPartsService;
