package com.ev.warranty.service.impl;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.model.dto.catalog.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.ev.warranty.service.inter.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceCatalogServiceImpl implements ServiceCatalogService {

    private final ServiceItemRepository serviceItemRepository;
    private final CatalogPriceRepository catalogPriceRepository;
    private final PartRepository partRepository;
    private final ThirdPartyPartRepository thirdPartyPartRepository;
    private final UserRepository userRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final com.ev.warranty.service.inter.ThirdPartyPartService thirdPartyPartService;

    // ==================== SERVICE ITEMS MANAGEMENT ====================

    @Override
    @Transactional
    public ServiceItemResponseDTO createServiceItem(ServiceItemCreateRequestDTO request, String createdBy) {
        log.info("Creating service item: {} by user: {}", request.getServiceCode(), createdBy);

        // Validate service code uniqueness
        if (serviceItemRepository.existsByServiceCode(request.getServiceCode())) {
            throw new BadRequestException("Service code already exists: " + request.getServiceCode());
        }

        // Create service item
        ServiceItem serviceItem = ServiceItem.builder()
                .serviceCode(request.getServiceCode())
                .name(request.getName())
                .description(request.getDescription())
                .standardLaborHours(request.getStandardLaborHours())
                .category(request.getCategory())
                .active(request.getActive())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ServiceItem savedServiceItem = serviceItemRepository.save(serviceItem);

        log.info("Service item created successfully: {}", savedServiceItem.getServiceCode());
        return mapToServiceItemResponseDTO(savedServiceItem);
    }

    @Override
    public Page<ServiceItemResponseDTO> getAllServiceItems(int page, int size, String category, String search, boolean active) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ServiceItem> serviceItems;

        if (search != null && category != null) {
            serviceItems = serviceItemRepository.findWithFilters(search, category, active, pageable);
        } else if (search != null) {
            serviceItems = active ?
                serviceItemRepository.searchActiveServiceItems(search, pageable) :
                serviceItemRepository.searchServiceItems(search, pageable);
        } else if (category != null) {
            serviceItems = serviceItemRepository.findByCategoryAndActive(category, active, pageable);
        } else {
            serviceItems = serviceItemRepository.findByActive(active, pageable);
        }

        return serviceItems.map(this::mapToServiceItemResponseDTO);
    }

    @Override
    public ServiceItemResponseDTO getServiceItemById(Integer id) {
        ServiceItem serviceItem = serviceItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service item not found with ID: " + id));

        return mapToServiceItemResponseDTO(serviceItem);
    }

    @Override
    public ServiceItemResponseDTO getServiceItemByCode(String serviceCode) {
        ServiceItem serviceItem = serviceItemRepository.findByServiceCode(serviceCode)
                .orElseThrow(() -> new NotFoundException("Service item not found with code: " + serviceCode));

        return mapToServiceItemResponseDTO(serviceItem);
    }

    @Override
    @Transactional
    public ServiceItemResponseDTO updateServiceItem(Integer id, ServiceItemUpdateRequestDTO request, String updatedBy) {
        ServiceItem serviceItem = serviceItemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service item not found with ID: " + id));

        // Update fields
        if (request.getName() != null) serviceItem.setName(request.getName());
        if (request.getDescription() != null) serviceItem.setDescription(request.getDescription());
        if (request.getStandardLaborHours() != null) serviceItem.setStandardLaborHours(request.getStandardLaborHours());
        if (request.getCategory() != null) serviceItem.setCategory(request.getCategory());
        if (request.getActive() != null) serviceItem.setActive(request.getActive());

        serviceItem.setUpdatedAt(LocalDateTime.now());

        ServiceItem savedServiceItem = serviceItemRepository.save(serviceItem);
        return mapToServiceItemResponseDTO(savedServiceItem);
    }

    // ==================== CATALOG PRICING MANAGEMENT ====================

    @Override
    @Transactional
    public CatalogPriceResponseDTO createCatalogPrice(CatalogPriceCreateRequestDTO request, String createdBy) {
        log.info("Creating catalog price for {} ID: {} by user: {}",
                request.getItemType(), request.getItemId(), createdBy);

        // Validate item exists
        validateItemExists(request.getItemType(), request.getItemId());

        // Check for duplicate pricing
        if (catalogPriceRepository.existsByItemTypeAndItemIdAndRegionAndServiceCenterIdAndEffectiveFrom(
                request.getItemType(), request.getItemId(), request.getRegion(),
                request.getServiceCenterId(), request.getEffectiveFrom())) {
            throw new BadRequestException("Price already exists for this item, region, service center, and effective date");
        }

        // Create catalog price
        CatalogPrice catalogPrice = CatalogPrice.builder()
                .itemType(request.getItemType())
                .itemId(request.getItemId())
                .price(request.getPrice())
                .currency(request.getCurrency())
                .region(request.getRegion())
                .serviceCenterId(request.getServiceCenterId())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        CatalogPrice savedPrice = catalogPriceRepository.save(catalogPrice);

        // Reverse sync: If this is a THIRD_PARTY_PART price, update the third-party part
        if ("THIRD_PARTY_PART".equals(savedPrice.getItemType())) {
            try {
                thirdPartyPartService.syncFromCatalogPrice(savedPrice.getItemId(), createdBy);
                log.debug("Synced third-party part ID {} from catalog price creation", savedPrice.getItemId());
            } catch (Exception e) {
                log.warn("Failed to sync third-party part from catalog price creation: {}", e.getMessage());
            }
        }

        log.info("Catalog price created successfully for {} ID: {}",
                savedPrice.getItemType(), savedPrice.getItemId());
        return mapToCatalogPriceResponseDTO(savedPrice);
    }

    @Override
    public Page<CatalogPriceResponseDTO> getAllCatalogPrices(int page, int size, String itemType, String region, Integer serviceCenterId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CatalogPrice> prices = catalogPriceRepository.findWithFilters(itemType, region, serviceCenterId, pageable);

        return prices.map(this::mapToCatalogPriceResponseDTO);
    }

    @Override
    public List<CatalogPriceResponseDTO> getPricesForItem(String itemType, Integer itemId) {
        List<CatalogPrice> prices = catalogPriceRepository.findByItemTypeAndItemId(itemType, itemId);
        return prices.stream()
                .map(this::mapToCatalogPriceResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CatalogPriceResponseDTO getCurrentPriceForItem(String itemType, Integer itemId, String region, Integer serviceCenterId) {
        // If region is not provided but serviceCenterId is, try to get region from service center
        String effectiveRegion = region;
        Integer effectiveServiceCenterId = serviceCenterId;
        
        if (effectiveRegion == null && effectiveServiceCenterId == null) {
            // Try to get from authenticated user's service center
            User currentUser = getCurrentUser();
            if (currentUser != null && currentUser.getServiceCenterId() != null) {
                effectiveServiceCenterId = currentUser.getServiceCenterId();
                effectiveRegion = getRegionFromServiceCenter(effectiveServiceCenterId);
            }
        } else if (effectiveRegion == null && effectiveServiceCenterId != null) {
            // Get region from service center ID
            effectiveRegion = getRegionFromServiceCenter(effectiveServiceCenterId);
        }
        
        Optional<CatalogPrice> price = catalogPriceRepository.findCurrentEffectivePrice(
                itemType, itemId, effectiveRegion, effectiveServiceCenterId, LocalDate.now());

        if (price.isEmpty()) {
            throw new NotFoundException(String.format("No current price found for %s ID: %d", itemType, itemId));
        }

        return mapToCatalogPriceResponseDTO(price.get());
    }

    @Override
    @Transactional
    public CatalogPriceResponseDTO updateCatalogPrice(Integer id, CatalogPriceUpdateRequestDTO request, String updatedBy) {
        CatalogPrice catalogPrice = catalogPriceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Catalog price not found with ID: " + id));

        // Update fields
        if (request.getPrice() != null) catalogPrice.setPrice(request.getPrice());
        if (request.getCurrency() != null) catalogPrice.setCurrency(request.getCurrency());
        if (request.getRegion() != null) catalogPrice.setRegion(request.getRegion());
        if (request.getServiceCenterId() != null) catalogPrice.setServiceCenterId(request.getServiceCenterId());
        if (request.getEffectiveFrom() != null) catalogPrice.setEffectiveFrom(request.getEffectiveFrom());
        if (request.getEffectiveTo() != null) catalogPrice.setEffectiveTo(request.getEffectiveTo());

        catalogPrice.setUpdatedAt(LocalDateTime.now());

        CatalogPrice savedPrice = catalogPriceRepository.save(catalogPrice);
        
        // Reverse sync: If this is a THIRD_PARTY_PART price, update the third-party part
        if ("THIRD_PARTY_PART".equals(savedPrice.getItemType())) {
            try {
                thirdPartyPartService.syncFromCatalogPrice(savedPrice.getItemId(), updatedBy);
                log.debug("Synced third-party part ID {} from catalog price update", savedPrice.getItemId());
            } catch (Exception e) {
                log.warn("Failed to sync third-party part from catalog price update: {}", e.getMessage());
            }
        }
        
        return mapToCatalogPriceResponseDTO(savedPrice);
    }

    // ==================== PRICE CALCULATION ====================

    @Override
    public ServiceEstimateResponseDTO calculateServiceEstimate(ServiceEstimateRequestDTO request) {
        log.info("Calculating service estimate for {} items",
                (request.getPartItems().size() + request.getServiceItems().size()));

        // Auto-detect region and service center from authenticated user if not provided
        String effectiveRegion = request.getRegion();
        Integer effectiveServiceCenterId = request.getServiceCenterId();
        
        if (effectiveRegion == null && effectiveServiceCenterId == null) {
            User currentUser = getCurrentUser();
            if (currentUser != null && currentUser.getServiceCenterId() != null) {
                effectiveServiceCenterId = currentUser.getServiceCenterId();
                effectiveRegion = getRegionFromServiceCenter(effectiveServiceCenterId);
                log.info("Auto-detected region: {} and service center: {} from authenticated user", 
                        effectiveRegion, effectiveServiceCenterId);
            }
        } else if (effectiveRegion == null && effectiveServiceCenterId != null) {
            effectiveRegion = getRegionFromServiceCenter(effectiveServiceCenterId);
            log.info("Auto-detected region: {} from service center: {}", effectiveRegion, effectiveServiceCenterId);
        }

        BigDecimal totalPartsAmount = BigDecimal.ZERO;
        BigDecimal totalLaborAmount = BigDecimal.ZERO;
        BigDecimal totalLaborHours = BigDecimal.ZERO;

        List<ServiceEstimateItemDTO> partItemsWithPrices = new ArrayList<>();
        List<ServiceEstimateItemDTO> serviceItemsWithPrices = new ArrayList<>();

        // Calculate parts cost
        for (ServiceEstimateItemDTO item : request.getPartItems()) {
            Optional<CatalogPrice> price = catalogPriceRepository.findCurrentEffectivePrice(
                    "PART", item.getItemId(), effectiveRegion, effectiveServiceCenterId, LocalDate.now());

            if (price.isPresent()) {
                BigDecimal unitPrice = price.get().getPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

                // Get part name
                Part part = partRepository.findById(item.getItemId())
                        .orElseThrow(() -> new NotFoundException("Part not found with ID: " + item.getItemId()));

                ServiceEstimateItemDTO itemWithPrice = ServiceEstimateItemDTO.builder()
                        .itemId(item.getItemId())
                        .quantity(item.getQuantity())
                        .itemName(part.getName())
                        .itemCode(part.getPartNumber())
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .itemType("PART")
                        .build();

                partItemsWithPrices.add(itemWithPrice);
                totalPartsAmount = totalPartsAmount.add(totalPrice);
            }
        }

        // Calculate services cost
        for (ServiceEstimateItemDTO item : request.getServiceItems()) {
            Optional<CatalogPrice> price = catalogPriceRepository.findCurrentEffectivePrice(
                    "SERVICE", item.getItemId(), effectiveRegion, effectiveServiceCenterId, LocalDate.now());

            if (price.isPresent()) {
                BigDecimal unitPrice = price.get().getPrice();
                BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));

                // Get service item name and labor hours
                ServiceItem serviceItem = serviceItemRepository.findById(item.getItemId())
                        .orElseThrow(() -> new NotFoundException("Service item not found with ID: " + item.getItemId()));

                ServiceEstimateItemDTO itemWithPrice = ServiceEstimateItemDTO.builder()
                        .itemId(item.getItemId())
                        .quantity(item.getQuantity())
                        .itemName(serviceItem.getName())
                        .itemCode(serviceItem.getServiceCode())
                        .unitPrice(unitPrice)
                        .totalPrice(totalPrice)
                        .itemType("SERVICE")
                        .build();

                serviceItemsWithPrices.add(itemWithPrice);
                totalLaborAmount = totalLaborAmount.add(totalPrice);
                totalLaborHours = totalLaborHours.add(
                        serviceItem.getStandardLaborHours().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        BigDecimal totalAmount = totalPartsAmount.add(totalLaborAmount);

        return ServiceEstimateResponseDTO.builder()
                .partItems(partItemsWithPrices)
                .serviceItems(serviceItemsWithPrices)
                .totalPartsAmount(totalPartsAmount)
                .totalLaborAmount(totalLaborAmount)
                .totalAmount(totalAmount)
                .currency(request.getCurrency() != null ? request.getCurrency() : "VND")
                .region(effectiveRegion)
                .serviceCenterId(effectiveServiceCenterId)
                .estimatedAt(LocalDateTime.now().toString())
                .totalItems(partItemsWithPrices.size() + serviceItemsWithPrices.size())
                .estimatedLaborHours(totalLaborHours)
                .validUntil(LocalDate.now().plusDays(30).toString()) // 30 days validity
                .build();
    }

    @Override
    public ServiceEstimateResponseDTO calculateLaborCost(List<ServiceEstimateItemDTO> serviceItems, String region, Integer serviceCenterId) {
        ServiceEstimateRequestDTO request = ServiceEstimateRequestDTO.builder()
                .partItems(new ArrayList<>())
                .serviceItems(serviceItems)
                .region(region)
                .serviceCenterId(serviceCenterId)
                .build();

        return calculateServiceEstimate(request);
    }

    @Override
    public ServiceEstimateResponseDTO calculatePartsCost(List<ServiceEstimateItemDTO> partItems, String region, Integer serviceCenterId) {
        ServiceEstimateRequestDTO request = ServiceEstimateRequestDTO.builder()
                .partItems(partItems)
                .serviceItems(new ArrayList<>())
                .region(region)
                .serviceCenterId(serviceCenterId)
                .build();

        return calculateServiceEstimate(request);
    }

    // ==================== BULK OPERATIONS ====================

    @Override
    @Transactional
    public BulkPriceUpdateResponseDTO bulkUpdatePrices(BulkPriceUpdateRequestDTO request, String updatedBy) {
        log.info("Bulk updating {} prices by user: {}", request.getPriceUpdates().size(), updatedBy);

        int successCount = 0;
        int failureCount = 0;
        List<PriceUpdateResultDTO> results = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (PriceUpdateItemDTO updateItem : request.getPriceUpdates()) {
            try {
                CatalogPrice catalogPrice = catalogPriceRepository.findById(updateItem.getPriceId())
                        .orElseThrow(() -> new NotFoundException("Price not found with ID: " + updateItem.getPriceId()));

                BigDecimal oldPrice = catalogPrice.getPrice();
                catalogPrice.setPrice(updateItem.getNewPrice());
                catalogPrice.setUpdatedAt(LocalDateTime.now());

                CatalogPrice savedPrice = catalogPriceRepository.save(catalogPrice);

                // Get item name
                String itemName = getItemName(savedPrice.getItemType(), savedPrice.getItemId());

                PriceUpdateResultDTO result = PriceUpdateResultDTO.builder()
                        .priceId(savedPrice.getId())
                        .itemType(savedPrice.getItemType())
                        .itemId(savedPrice.getItemId())
                        .itemName(itemName)
                        .oldPrice(oldPrice)
                        .newPrice(savedPrice.getPrice())
                        .success(true)
                        .build();

                results.add(result);
                successCount++;

            } catch (Exception e) {
                PriceUpdateResultDTO result = PriceUpdateResultDTO.builder()
                        .priceId(updateItem.getPriceId())
                        .success(false)
                        .errorMessage(e.getMessage())
                        .build();

                results.add(result);
                errors.add("Price ID " + updateItem.getPriceId() + ": " + e.getMessage());
                failureCount++;
            }
        }

        log.info("Bulk price update completed - Success: {}, Failed: {}", successCount, failureCount);

        return BulkPriceUpdateResponseDTO.builder()
                .totalRequested(request.getPriceUpdates().size())
                .successCount(successCount)
                .failureCount(failureCount)
                .results(results)
                .errors(errors)
                .updatedBy(updatedBy)
                .updatedAt(LocalDateTime.now().toString())
                .reason(request.getReason())
                .build();
    }

    @Override
    public CatalogExportResponseDTO exportServiceCatalog(String region, Integer serviceCenterId, String exportedBy) {
        log.info("Exporting service catalog - region: {}, serviceCenterId: {}, by: {}",
                region, serviceCenterId, exportedBy);

        // Get all active service items
        List<ServiceItem> serviceItems = serviceItemRepository.findByActiveTrue(Pageable.unpaged()).getContent();
        List<ServiceItemResponseDTO> serviceItemDTOs = serviceItems.stream()
                .map(this::mapToServiceItemResponseDTO)
                .collect(Collectors.toList());

        // Get current effective prices
        List<CatalogPrice> prices = catalogPriceRepository.findCurrentPricesForExport(region, serviceCenterId, LocalDate.now());
        List<CatalogPriceResponseDTO> priceDTOs = prices.stream()
                .map(this::mapToCatalogPriceResponseDTO)
                .collect(Collectors.toList());

        int totalParts = (int) priceDTOs.stream().filter(p -> "PART".equals(p.getItemType())).count();
        int totalServices = (int) priceDTOs.stream().filter(p -> "SERVICE".equals(p.getItemType())).count();

        log.info("Service catalog exported - {} items", serviceItemDTOs.size() + priceDTOs.size());

        return CatalogExportResponseDTO.builder()
                .totalItems(serviceItemDTOs.size() + priceDTOs.size())
                .totalParts(totalParts)
                .totalServices(totalServices)
                .serviceItems(serviceItemDTOs)
                .prices(priceDTOs)
                .region(region)
                .serviceCenterId(serviceCenterId)
                .exportedBy(exportedBy)
                .exportedAt(LocalDateTime.now().toString())
                .fileFormat("JSON")
                .downloadUrl("/api/service-catalog/download-export/" + exportedBy + "-" + System.currentTimeMillis())
                .build();
    }

    @Override
    @Transactional
    public CatalogImportResponseDTO importServiceCatalog(CatalogImportRequestDTO request, String importedBy) {
        log.info("Importing service catalog - {} service items, {} prices by: {}",
                request.getServiceItems().size(),
                request.getCatalogPrices() != null ? request.getCatalogPrices().size() : 0,
                importedBy);

        int successCount = 0;
        int failureCount = 0;
        int skippedCount = 0;
        List<String> successItems = new ArrayList<>();
        List<String> failedItems = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // Import service items
        for (ServiceItemCreateRequestDTO serviceItemRequest : request.getServiceItems()) {
            try {
                if (serviceItemRepository.existsByServiceCode(serviceItemRequest.getServiceCode())) {
                    if (Boolean.TRUE.equals(request.getOverwriteExisting())) {
                        // Update existing
                        ServiceItem existing = serviceItemRepository.findByServiceCode(serviceItemRequest.getServiceCode())
                                .orElseThrow();
                        existing.setName(serviceItemRequest.getName());
                        existing.setDescription(serviceItemRequest.getDescription());
                        existing.setStandardLaborHours(serviceItemRequest.getStandardLaborHours());
                        existing.setCategory(serviceItemRequest.getCategory());
                        existing.setUpdatedAt(LocalDateTime.now());
                        serviceItemRepository.save(existing);
                        successItems.add("Updated: " + serviceItemRequest.getServiceCode());
                        successCount++;
                    } else {
                        successItems.add("Skipped: " + serviceItemRequest.getServiceCode() + " (already exists)");
                        skippedCount++;
                    }
                } else {
                    // Create new
                    createServiceItem(serviceItemRequest, importedBy);
                    successItems.add("Created: " + serviceItemRequest.getServiceCode());
                    successCount++;
                }
            } catch (Exception e) {
                failedItems.add("Failed: " + serviceItemRequest.getServiceCode());
                errors.add("Service item " + serviceItemRequest.getServiceCode() + ": " + e.getMessage());
                failureCount++;
            }
        }

        // Import catalog prices if provided
        if (request.getCatalogPrices() != null) {
            for (CatalogPriceCreateRequestDTO priceRequest : request.getCatalogPrices()) {
                try {
                    createCatalogPrice(priceRequest, importedBy);
                    successItems.add("Price created for " + priceRequest.getItemType() + " ID: " + priceRequest.getItemId());
                    successCount++;
                } catch (Exception e) {
                    failedItems.add("Price failed for " + priceRequest.getItemType() + " ID: " + priceRequest.getItemId());
                    errors.add("Price for " + priceRequest.getItemType() + " ID " + priceRequest.getItemId() + ": " + e.getMessage());
                    failureCount++;
                }
            }
        }

        int totalRequested = request.getServiceItems().size() +
                            (request.getCatalogPrices() != null ? request.getCatalogPrices().size() : 0);

        log.info("Service catalog import completed - Success: {}, Failed: {}, Skipped: {}",
                successCount, failureCount, skippedCount);

        return CatalogImportResponseDTO.builder()
                .totalRequested(totalRequested)
                .successCount(successCount)
                .failureCount(failureCount)
                .skippedCount(skippedCount)
                .successItems(successItems)
                .failedItems(failedItems)
                .errors(errors)
                .importedBy(importedBy)
                .importedAt(LocalDateTime.now().toString())
                .region(request.getRegion())
                .serviceCenterId(request.getServiceCenterId())
                .build();
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private void validateItemExists(String itemType, Integer itemId) {
        if ("PART".equals(itemType)) {
            if (!partRepository.existsById(itemId)) {
                throw new NotFoundException("Part not found with ID: " + itemId);
            }
        } else if ("SERVICE".equals(itemType)) {
            if (!serviceItemRepository.existsById(itemId)) {
                throw new NotFoundException("Service item not found with ID: " + itemId);
            }
        } else if ("THIRD_PARTY_PART".equals(itemType)) {
            if (!thirdPartyPartRepository.existsById(itemId)) {
                throw new NotFoundException("Third-party part not found with ID: " + itemId);
            }
        } else {
            throw new BadRequestException("Invalid item type: " + itemType + ". Must be PART, SERVICE, or THIRD_PARTY_PART");
        }
    }

    private String getItemName(String itemType, Integer itemId) {
        if ("PART".equals(itemType)) {
            return partRepository.findById(itemId)
                    .map(Part::getName)
                    .orElse("Unknown Part");
        } else if ("SERVICE".equals(itemType)) {
            return serviceItemRepository.findById(itemId)
                    .map(ServiceItem::getName)
                    .orElse("Unknown Service");
        } else if ("THIRD_PARTY_PART".equals(itemType)) {
            return thirdPartyPartRepository.findById(itemId)
                    .map(ThirdPartyPart::getName)
                    .orElse("Unknown Third-Party Part");
        }
        return "Unknown Item";
    }

    private ServiceItemResponseDTO mapToServiceItemResponseDTO(ServiceItem serviceItem) {
        // Get current price if available - try to find any available price (general or regional)
        // First try to find a general price (no region, no service center)
        Optional<CatalogPrice> currentPrice = catalogPriceRepository.findCurrentEffectivePrice(
                "SERVICE", serviceItem.getId(), null, null, LocalDate.now());
        
        // If no general price found, try to find any regional price
        if (currentPrice.isEmpty()) {
            List<CatalogPrice> allPrices = catalogPriceRepository.findByItemTypeAndItemId("SERVICE", serviceItem.getId());
            LocalDate today = LocalDate.now();
            currentPrice = allPrices.stream()
                    .filter(price -> !price.getEffectiveFrom().isAfter(today) && 
                            (price.getEffectiveTo() == null || !price.getEffectiveTo().isBefore(today)))
                    .sorted((p1, p2) -> {
                        // Prioritize: general > regional > service center specific
                        int p1Priority = p1.getServiceCenterId() != null ? 3 : (p1.getRegion() != null ? 2 : 1);
                        int p2Priority = p2.getServiceCenterId() != null ? 3 : (p2.getRegion() != null ? 2 : 1);
                        if (p1Priority != p2Priority) return Integer.compare(p1Priority, p2Priority);
                        return p2.getEffectiveFrom().compareTo(p1.getEffectiveFrom()); // Most recent first
                    })
                    .findFirst();
        }

        return ServiceItemResponseDTO.builder()
                .id(serviceItem.getId())
                .serviceCode(serviceItem.getServiceCode())
                .name(serviceItem.getName())
                .description(serviceItem.getDescription())
                .standardLaborHours(serviceItem.getStandardLaborHours())
                .category(serviceItem.getCategory())
                .active(serviceItem.getActive())
                .createdAt(serviceItem.getCreatedAt())
                .updatedAt(serviceItem.getUpdatedAt())
                .currentPrice(currentPrice.map(CatalogPrice::getPrice).orElse(null))
                .priceRegion(currentPrice.map(CatalogPrice::getRegion).orElse(null))
                .hasPricing(currentPrice.isPresent())
                .build();
    }

    private CatalogPriceResponseDTO mapToCatalogPriceResponseDTO(CatalogPrice catalogPrice) {
        String itemName = getItemName(catalogPrice.getItemType(), catalogPrice.getItemId());
        String itemCode = getItemCode(catalogPrice.getItemType(), catalogPrice.getItemId());

        LocalDate today = LocalDate.now();
        boolean isCurrentlyEffective = !catalogPrice.getEffectiveFrom().isAfter(today) &&
                (catalogPrice.getEffectiveTo() == null || !catalogPrice.getEffectiveTo().isBefore(today));

        Integer daysUntilExpiry = null;
        if (catalogPrice.getEffectiveTo() != null) {
            daysUntilExpiry = (int) java.time.temporal.ChronoUnit.DAYS.between(today, catalogPrice.getEffectiveTo());
        }

        return CatalogPriceResponseDTO.builder()
                .id(catalogPrice.getId())
                .itemType(catalogPrice.getItemType())
                .itemId(catalogPrice.getItemId())
                .itemName(itemName)
                .itemCode(itemCode)
                .price(catalogPrice.getPrice())
                .currency(catalogPrice.getCurrency())
                .region(catalogPrice.getRegion())
                .serviceCenterId(catalogPrice.getServiceCenterId())
                .serviceCenterName(null) // TODO: Get service center name if needed
                .effectiveFrom(catalogPrice.getEffectiveFrom())
                .effectiveTo(catalogPrice.getEffectiveTo())
                .createdAt(catalogPrice.getCreatedAt())
                .updatedAt(catalogPrice.getUpdatedAt())
                .isCurrentlyEffective(isCurrentlyEffective)
                .daysUntilExpiry(daysUntilExpiry)
                .isRegionalPrice(catalogPrice.getRegion() != null)
                .isServiceCenterSpecific(catalogPrice.getServiceCenterId() != null)
                .build();
    }

    private String getItemCode(String itemType, Integer itemId) {
        if ("PART".equals(itemType)) {
            return partRepository.findById(itemId)
                    .map(Part::getPartNumber)
                    .orElse("Unknown");
        } else if ("SERVICE".equals(itemType)) {
            return serviceItemRepository.findById(itemId)
                    .map(ServiceItem::getServiceCode)
                    .orElse("Unknown");
        } else if ("THIRD_PARTY_PART".equals(itemType)) {
            return thirdPartyPartRepository.findById(itemId)
                    .map(ThirdPartyPart::getPartNumber)
                    .orElse("Unknown");
        }
        return "Unknown";
    }

    /**
     * Get region from service center ID
     */
    private String getRegionFromServiceCenter(Integer serviceCenterId) {
        if (serviceCenterId == null) {
            return null;
        }
        return serviceCenterRepository.findById(serviceCenterId)
                .map(ServiceCenter::getRegion)
                .orElse(null);
    }

    /**
     * Get current authenticated user
     */
    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                String username = authentication.getName();
                return userRepository.findByUsername(username).orElse(null);
            }
        } catch (Exception e) {
            log.warn("Could not get current user: {}", e.getMessage());
        }
        return null;
    }
}
