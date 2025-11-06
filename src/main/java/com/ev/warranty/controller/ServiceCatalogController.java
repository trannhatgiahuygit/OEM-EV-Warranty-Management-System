package com.ev.warranty.controller;

import com.ev.warranty.model.dto.catalog.*;
import com.ev.warranty.service.inter.ServiceCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/service-catalog")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Service Catalog", description = "APIs for managing service catalog, parts pricing, and labor rates")
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    // ==================== SERVICE ITEMS MANAGEMENT ====================

    @PostMapping("/services")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Create service item",
               description = "Create new service item in catalog (EVM Staff/Admin only)")
    public ResponseEntity<ServiceItemResponseDTO> createServiceItem(
            @Valid @RequestBody ServiceItemCreateRequestDTO request,
            Authentication authentication) {

        String createdBy = authentication.getName();
        log.info("Creating service item: {} by user: {}", request.getServiceCode(), createdBy);

        ServiceItemResponseDTO response = serviceCatalogService.createServiceItem(request, createdBy);

        log.info("Service item created successfully: {}", response.getServiceCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/services")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get all service items",
               description = "Get paginated list of service items with filtering")
    public ResponseEntity<Page<ServiceItemResponseDTO>> getAllServiceItems(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filter by category") @RequestParam(required = false) String category,
            @Parameter(description = "Search by name or code") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by active status") @RequestParam(defaultValue = "true") boolean active) {

        log.debug("Getting service items - page: {}, size: {}, category: {}, search: {}, active: {}",
                page, size, category, search, active);

        Page<ServiceItemResponseDTO> serviceItems = serviceCatalogService.getAllServiceItems(page, size, category, search, active);

        log.debug("Retrieved {} service items", serviceItems.getTotalElements());
        return ResponseEntity.ok(serviceItems);
    }

    @GetMapping("/services/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get service item by ID", description = "Get detailed service item information")
    public ResponseEntity<ServiceItemResponseDTO> getServiceItemById(@PathVariable Integer id) {
        log.debug("Getting service item with ID: {}", id);

        ServiceItemResponseDTO serviceItem = serviceCatalogService.getServiceItemById(id);
        return ResponseEntity.ok(serviceItem);
    }

    @GetMapping("/services/code/{serviceCode}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get service item by code", description = "Get service item by service code")
    public ResponseEntity<ServiceItemResponseDTO> getServiceItemByCode(@PathVariable String serviceCode) {
        log.debug("Getting service item with code: {}", serviceCode);

        ServiceItemResponseDTO serviceItem = serviceCatalogService.getServiceItemByCode(serviceCode);
        return ResponseEntity.ok(serviceItem);
    }

    @PutMapping("/services/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update service item", description = "Update existing service item")
    public ResponseEntity<ServiceItemResponseDTO> updateServiceItem(
            @PathVariable Integer id,
            @Valid @RequestBody ServiceItemUpdateRequestDTO request,
            Authentication authentication) {

        String updatedBy = authentication.getName();
        log.info("Updating service item ID: {} by user: {}", id, updatedBy);

        ServiceItemResponseDTO response = serviceCatalogService.updateServiceItem(id, request, updatedBy);

        return ResponseEntity.ok(response);
    }

    // ==================== CATALOG PRICING MANAGEMENT ====================

    @PostMapping("/prices")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Create catalog price",
               description = "Set price for part or service in catalog")
    public ResponseEntity<CatalogPriceResponseDTO> createCatalogPrice(
            @Valid @RequestBody CatalogPriceCreateRequestDTO request,
            Authentication authentication) {

        String createdBy = authentication.getName();
        log.info("Creating catalog price for {} ID: {} by user: {}",
                request.getItemType(), request.getItemId(), createdBy);

        CatalogPriceResponseDTO response = serviceCatalogService.createCatalogPrice(request, createdBy);

        log.info("Catalog price created successfully for {} ID: {}",
                response.getItemType(), response.getItemId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/prices")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get all catalog prices",
               description = "Get paginated list of catalog prices with filtering")
    public ResponseEntity<Page<CatalogPriceResponseDTO>> getAllCatalogPrices(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Filter by item type (PART/SERVICE)") @RequestParam(required = false) String itemType,
            @Parameter(description = "Filter by region") @RequestParam(required = false) String region,
            @Parameter(description = "Filter by service center ID") @RequestParam(required = false) Integer serviceCenterId) {

        log.debug("Getting catalog prices - page: {}, size: {}, itemType: {}, region: {}, serviceCenterId: {}",
                page, size, itemType, region, serviceCenterId);

        Page<CatalogPriceResponseDTO> prices = serviceCatalogService.getAllCatalogPrices(page, size, itemType, region, serviceCenterId);

        log.debug("Retrieved {} catalog prices", prices.getTotalElements());
        return ResponseEntity.ok(prices);
    }

    @GetMapping("/prices/item/{itemType}/{itemId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get prices for specific item",
               description = "Get all pricing records for a specific part or service")
    public ResponseEntity<List<CatalogPriceResponseDTO>> getPricesForItem(
            @PathVariable String itemType,
            @PathVariable Integer itemId) {

        log.debug("Getting prices for {} ID: {}", itemType, itemId);

        List<CatalogPriceResponseDTO> prices = serviceCatalogService.getPricesForItem(itemType, itemId);

        return ResponseEntity.ok(prices);
    }

    @GetMapping("/prices/current/{itemType}/{itemId}")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Get current price for item",
               description = "Get current effective price for a specific part or service")
    public ResponseEntity<CatalogPriceResponseDTO> getCurrentPriceForItem(
            @PathVariable String itemType,
            @PathVariable Integer itemId,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Integer serviceCenterId) {

        log.debug("Getting current price for {} ID: {}, region: {}, serviceCenterId: {}",
                itemType, itemId, region, serviceCenterId);

        CatalogPriceResponseDTO price = serviceCatalogService.getCurrentPriceForItem(itemType, itemId, region, serviceCenterId);

        return ResponseEntity.ok(price);
    }

    @PutMapping("/prices/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Update catalog price", description = "Update existing catalog price")
    public ResponseEntity<CatalogPriceResponseDTO> updateCatalogPrice(
            @PathVariable Integer id,
            @Valid @RequestBody CatalogPriceUpdateRequestDTO request,
            Authentication authentication) {

        String updatedBy = authentication.getName();
        log.info("Updating catalog price ID: {} by user: {}", id, updatedBy);

        CatalogPriceResponseDTO response = serviceCatalogService.updateCatalogPrice(id, request, updatedBy);

        return ResponseEntity.ok(response);
    }

    // ==================== PRICE CALCULATION ====================

    @PostMapping("/calculate-estimate")
    @PreAuthorize("hasAnyAuthority('ROLE_SC_STAFF', 'ROLE_SC_TECHNICIAN', 'ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Calculate service estimate",
               description = "Calculate total estimate for parts and services")
    public ResponseEntity<ServiceEstimateResponseDTO> calculateServiceEstimate(
            @Valid @RequestBody ServiceEstimateRequestDTO request) {

        log.info("Calculating service estimate for {} items",
                (request.getPartItems().size() + request.getServiceItems().size()));

        ServiceEstimateResponseDTO estimate = serviceCatalogService.calculateServiceEstimate(request);

        log.info("Service estimate calculated - Total: {} {}",
                estimate.getTotalAmount(), estimate.getCurrency());

        return ResponseEntity.ok(estimate);
    }

    // ==================== BULK OPERATIONS ====================

    @PostMapping("/prices/bulk-update")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Bulk update prices",
               description = "Update multiple prices at once (e.g., for price increase)")
    public ResponseEntity<BulkPriceUpdateResponseDTO> bulkUpdatePrices(
            @Valid @RequestBody BulkPriceUpdateRequestDTO request,
            Authentication authentication) {

        String updatedBy = authentication.getName();
        log.info("Bulk updating {} prices by user: {}", request.getPriceUpdates().size(), updatedBy);

        BulkPriceUpdateResponseDTO response = serviceCatalogService.bulkUpdatePrices(request, updatedBy);

        log.info("Bulk price update completed - Success: {}, Failed: {}",
                response.getSuccessCount(), response.getFailureCount());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/export-catalog")
    @PreAuthorize("hasAnyAuthority('ROLE_EVM_STAFF', 'ROLE_ADMIN')")
    @Operation(summary = "Export service catalog",
               description = "Export complete service catalog with current prices")
    public ResponseEntity<CatalogExportResponseDTO> exportServiceCatalog(
            @RequestParam(required = false) String region,
            @RequestParam(required = false) Integer serviceCenterId,
            Authentication authentication) {

        String exportedBy = authentication.getName();
        log.info("Exporting service catalog - region: {}, serviceCenterId: {}, by: {}",
                region, serviceCenterId, exportedBy);

        CatalogExportResponseDTO export = serviceCatalogService.exportServiceCatalog(region, serviceCenterId, exportedBy);

        log.info("Service catalog exported - {} items", export.getTotalItems());

        return ResponseEntity.ok(export);
    }
}
