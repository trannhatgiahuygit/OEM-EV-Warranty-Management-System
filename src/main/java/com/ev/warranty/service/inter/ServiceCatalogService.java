package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.catalog.*;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ServiceCatalogService {

    // ==================== SERVICE ITEMS MANAGEMENT ====================

    /**
     * Create new service item in catalog
     * @param request Service item creation request
     * @param createdBy Username of creator
     * @return Created service item response
     */
    ServiceItemResponseDTO createServiceItem(ServiceItemCreateRequestDTO request, String createdBy);

    /**
     * Get all service items with pagination and filtering
     * @param page Page number (0-based)
     * @param size Page size
     * @param category Filter by category (optional)
     * @param search Search by name or code (optional)
     * @param active Filter by active status
     * @return Paginated service items list
     */
    Page<ServiceItemResponseDTO> getAllServiceItems(int page, int size, String category, String search, boolean active);

    /**
     * Get service item by ID
     * @param id Service item ID
     * @return Service item details
     */
    ServiceItemResponseDTO getServiceItemById(Integer id);

    /**
     * Get service item by service code
     * @param serviceCode Service code
     * @return Service item details
     */
    ServiceItemResponseDTO getServiceItemByCode(String serviceCode);

    /**
     * Update existing service item
     * @param id Service item ID
     * @param request Update request
     * @param updatedBy Username of updater
     * @return Updated service item response
     */
    ServiceItemResponseDTO updateServiceItem(Integer id, ServiceItemUpdateRequestDTO request, String updatedBy);

    // ==================== CATALOG PRICING MANAGEMENT ====================

    /**
     * Create new catalog price entry
     * @param request Price creation request
     * @param createdBy Username of creator
     * @return Created price response
     */
    CatalogPriceResponseDTO createCatalogPrice(CatalogPriceCreateRequestDTO request, String createdBy);

    /**
     * Get all catalog prices with pagination and filtering
     * @param page Page number (0-based)
     * @param size Page size
     * @param itemType Filter by item type (PART/SERVICE) (optional)
     * @param region Filter by region (optional)
     * @param serviceCenterId Filter by service center ID (optional)
     * @return Paginated catalog prices list
     */
    Page<CatalogPriceResponseDTO> getAllCatalogPrices(int page, int size, String itemType, String region, Integer serviceCenterId);

    /**
     * Get all pricing records for a specific item
     * @param itemType Item type (PART or SERVICE)
     * @param itemId Item ID
     * @return List of pricing records
     */
    List<CatalogPriceResponseDTO> getPricesForItem(String itemType, Integer itemId);

    /**
     * Get current effective price for an item
     * @param itemType Item type (PART or SERVICE)
     * @param itemId Item ID
     * @param region Region (optional)
     * @param serviceCenterId Service center ID (optional)
     * @return Current effective price
     */
    CatalogPriceResponseDTO getCurrentPriceForItem(String itemType, Integer itemId, String region, Integer serviceCenterId);

    /**
     * Update existing catalog price
     * @param id Price ID
     * @param request Update request
     * @param updatedBy Username of updater
     * @return Updated price response
     */
    CatalogPriceResponseDTO updateCatalogPrice(Integer id, CatalogPriceUpdateRequestDTO request, String updatedBy);

    // ==================== PRICE CALCULATION ====================

    /**
     * Calculate total estimate for parts and services
     * @param request Estimate request with parts and services list
     * @return Calculated estimate with breakdown
     */
    ServiceEstimateResponseDTO calculateServiceEstimate(ServiceEstimateRequestDTO request);

    /**
     * Calculate labor cost for service items
     * @param serviceItems List of service items with quantities
     * @param region Region for pricing
     * @param serviceCenterId Service center ID for pricing
     * @return Total labor cost
     */
    ServiceEstimateResponseDTO calculateLaborCost(List<ServiceEstimateItemDTO> serviceItems, String region, Integer serviceCenterId);

    /**
     * Calculate parts cost
     * @param partItems List of part items with quantities
     * @param region Region for pricing
     * @param serviceCenterId Service center ID for pricing
     * @return Total parts cost
     */
    ServiceEstimateResponseDTO calculatePartsCost(List<ServiceEstimateItemDTO> partItems, String region, Integer serviceCenterId);

    // ==================== BULK OPERATIONS ====================

    /**
     * Update multiple prices at once
     * @param request Bulk update request
     * @param updatedBy Username of updater
     * @return Bulk update response with success/failure counts
     */
    BulkPriceUpdateResponseDTO bulkUpdatePrices(BulkPriceUpdateRequestDTO request, String updatedBy);

    /**
     * Export complete service catalog with current prices
     * @param region Region filter (optional)
     * @param serviceCenterId Service center filter (optional)
     * @param exportedBy Username of exporter
     * @return Export response with data
     */
    CatalogExportResponseDTO exportServiceCatalog(String region, Integer serviceCenterId, String exportedBy);

    /**
     * Import service catalog from external data
     * @param request Import request with catalog data
     * @param importedBy Username of importer
     * @return Import response with success/failure counts
     */
    CatalogImportResponseDTO importServiceCatalog(CatalogImportRequestDTO request, String importedBy);
}
