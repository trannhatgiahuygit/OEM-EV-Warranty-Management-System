package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.model.dto.thirdparty.ReserveSerialsRequestDTO;
import com.ev.warranty.model.dto.thirdparty.ReserveSerialsResponseDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO;
import com.ev.warranty.model.entity.CatalogPrice;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.ThirdPartyPart;
import com.ev.warranty.model.entity.ThirdPartyPartSerial;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.model.entity.WorkOrder;
import com.ev.warranty.repository.CatalogPriceRepository;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.ThirdPartyPartRepository;
import com.ev.warranty.repository.ThirdPartyPartSerialRepository;
import com.ev.warranty.repository.WorkOrderRepository;
import com.ev.warranty.service.inter.ThirdPartyPartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThirdPartyPartServiceImpl implements ThirdPartyPartService {

    private final ThirdPartyPartRepository partRepository;
    private final ThirdPartyPartSerialRepository serialRepository;
    private final WorkOrderRepository workOrderRepository;
    private final CatalogPriceRepository catalogPriceRepository;
    private final com.ev.warranty.repository.VehicleRepository vehicleRepository;
    private final ClaimRepository claimRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ThirdPartyPartDTO> getPartsByServiceCenter(Integer serviceCenterId) {
        return partRepository.findByServiceCenterIdAndActiveTrue(serviceCenterId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ThirdPartyPartDTO> getPartsByServiceCenterWithRegionalPrices(Integer serviceCenterId, String region) {
        List<ThirdPartyPartDTO> parts = getPartsByServiceCenter(serviceCenterId);
        
        // Filter regional prices - only show price for the specified region
        if (region != null) {
            for (ThirdPartyPartDTO part : parts) {
                // Clear prices for other regions, keep only the specified region's price
                if ("NORTH".equals(region)) {
                    part.setSouthPrice(null);
                    part.setCentralPrice(null);
                } else if ("SOUTH".equals(region)) {
                    part.setNorthPrice(null);
                    part.setCentralPrice(null);
                } else if ("CENTRAL".equals(region)) {
                    part.setNorthPrice(null);
                    part.setSouthPrice(null);
                }
            }
        }
        
        return parts;
    }

    @Override
    @Transactional
    public ThirdPartyPartDTO createPart(ThirdPartyPartDTO dto, String createdBy) {
        if (dto.getPartNumber() == null || dto.getPartNumber().isBlank()) {
            throw new ValidationException("Part number is required");
        }
        ThirdPartyPart entity = ThirdPartyPart.builder()
                .partNumber(dto.getPartNumber())
                .name(dto.getName())
                .category(dto.getCategory())
                .description(dto.getDescription())
                .supplier(dto.getSupplier())
                .unitCost(dto.getUnitCost())
                .quantity(0) // Start with 0, quantity will be updated when serials are added
                .serviceCenterId(dto.getServiceCenterId())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .updatedBy(createdBy)
                .build();
        entity = partRepository.save(entity);
        
        // Sync prices to catalog pricing system if prices are provided
        if (entity.getServiceCenterId() != null && 
            (entity.getUnitCost() != null || dto.getNorthPrice() != null || 
             dto.getSouthPrice() != null || dto.getCentralPrice() != null)) {
            syncCatalogPrice(entity, dto, createdBy);
        }
        
        return toDto(entity);
    }

    @Override
    @Transactional
    public ThirdPartyPartDTO updatePart(Integer id, ThirdPartyPartDTO dto, String updatedBy) {
        ThirdPartyPart entity = partRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Third-party part not found"));
        if (dto.getName() != null) entity.setName(dto.getName());
        if (dto.getCategory() != null) entity.setCategory(dto.getCategory());
        if (dto.getDescription() != null) entity.setDescription(dto.getDescription());
        if (dto.getSupplier() != null) entity.setSupplier(dto.getSupplier());
        if (dto.getUnitCost() != null) entity.setUnitCost(dto.getUnitCost());
        // Don't allow manual quantity updates - quantity is automatically managed by serials
        // Quantity should match the number of AVAILABLE serials
        if (dto.getServiceCenterId() != null) entity.setServiceCenterId(dto.getServiceCenterId());
        if (dto.getActive() != null) entity.setActive(dto.getActive());
        entity.setUpdatedBy(updatedBy);
        entity = partRepository.save(entity);
        
        // Sync prices to catalog pricing system if prices are provided
        if (entity.getServiceCenterId() != null && 
            (entity.getUnitCost() != null || dto.getNorthPrice() != null || 
             dto.getSouthPrice() != null || dto.getCentralPrice() != null)) {
            syncCatalogPrice(entity, dto, updatedBy);
        } else if (entity.getUnitCost() == null && 
                   dto.getNorthPrice() == null && 
                   dto.getSouthPrice() == null && 
                   dto.getCentralPrice() == null) {
            // If all prices are removed, deactivate catalog prices
            deactivateCatalogPrices(entity.getId());
        }
        
        return toDto(entity);
    }

    @Override
    public void deletePart(Integer id) {
        partRepository.deleteById(id);
    }

    @Override
    @Transactional
    public ThirdPartyPartSerialDTO addSerial(Integer partId, String serialNumber, String addedBy) {
        // Check if serial number already exists
        if (serialRepository.findBySerialNumber(serialNumber).isPresent()) {
            throw new ValidationException("Serial number already exists: " + serialNumber);
        }
        
        ThirdPartyPart part = partRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Third-party part not found"));
        ThirdPartyPartSerial serial = ThirdPartyPartSerial.builder()
                .thirdPartyPart(part)
                .serialNumber(serialNumber)
                .status("AVAILABLE")
                .serviceCenterId(part.getServiceCenterId())
                .build();
        serial = serialRepository.save(serial);
        
        // Update quantity: increment by 1 when a new serial is added
        if (part.getQuantity() == null) {
            part.setQuantity(0);
        }
        part.setQuantity(part.getQuantity() + 1);
        part.setUpdatedBy(addedBy);
        partRepository.save(part);
        
        return toDto(serial);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ThirdPartyPartSerialDTO> getAvailableSerials(Integer partId) {
        return serialRepository.findByThirdPartyPartIdAndStatus(partId, "AVAILABLE").stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ThirdPartyPartSerialDTO> getAllSerials(Integer partId) {
        return serialRepository.findByThirdPartyPartId(partId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Recalculate and update quantity based on AVAILABLE serials count
     * Useful for fixing any inconsistencies
     */
    @Transactional
    public void recalculateQuantity(Integer partId, String updatedBy) {
        ThirdPartyPart part = partRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Third-party part not found"));
        
        // Count AVAILABLE serials
        long availableCount = serialRepository.countByThirdPartyPartIdAndStatus(partId, "AVAILABLE");
        
        // Update quantity to match AVAILABLE serials count
        part.setQuantity((int) availableCount);
        part.setUpdatedBy(updatedBy);
        partRepository.save(part);
    }

    @Override
    @Transactional
    public void markSerialAsUsed(Integer serialId, Integer workOrderId, String installedBy) {
        ThirdPartyPartSerial serial = serialRepository.findById(serialId)
                .orElseThrow(() -> new NotFoundException("Third-party part serial not found"));
        WorkOrder po = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new NotFoundException("Work order not found"));
        
        // Mark serial as used
        serial.setStatus("USED");
        serial.setWorkOrder(po);
        serial.setInstalledBy(installedBy);
        serial.setInstalledAt(java.time.LocalDateTime.now());
        serialRepository.save(serial);
        
        // Decrement quantity from the third-party part
        ThirdPartyPart part = serial.getThirdPartyPart();
        if (part != null && part.getQuantity() != null && part.getQuantity() > 0) {
            part.setQuantity(part.getQuantity() - 1);
            part.setUpdatedBy(installedBy);
            partRepository.save(part);
        }
    }
    
    @Override
    @Transactional
    public ThirdPartyPartSerialDTO installSerialOnVehicle(Integer serialId, String vehicleVin, Integer workOrderId, String installedBy) {
        ThirdPartyPartSerial serial = serialRepository.findById(serialId)
                .orElseThrow(() -> new NotFoundException("Third-party part serial not found"));
        
        // Allow installation when serial is AVAILABLE or RESERVED.
        // AVAILABLE: will decrement quantity. RESERVED: quantity already decremented at reservation time.
        String currentStatus = serial.getStatus();
        if (!"AVAILABLE".equals(currentStatus) && !"RESERVED".equals(currentStatus)) {
            throw new ValidationException("Serial is not installable. Current status: " + currentStatus);
        }
        
        // Vehicle must exist
        Vehicle vehicle = vehicleRepository.findByVin(vehicleVin)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + vehicleVin));
        
        WorkOrder workOrder = null;
        if (workOrderId != null) {
            workOrder = workOrderRepository.findById(workOrderId)
                    .orElseThrow(() -> new NotFoundException("Work order not found"));
        }
        
        // If RESERVED for another claim/vehicle, prevent accidental cross-install
        if ("RESERVED".equals(currentStatus)) {
            // If it was reserved for a different vehicle, disallow
            if (serial.getInstalledOnVehicle() != null && !serial.getInstalledOnVehicle().getId().equals(vehicle.getId())) {
                throw new ValidationException("Reserved serial is linked to a different vehicle and cannot be installed on this vehicle");
            }
        } else {
            // For AVAILABLE, ensure it's not already linked to any vehicle
            if (serial.getInstalledOnVehicle() != null) {
                throw new ValidationException("Serial is already linked to a vehicle");
            }
        }

        // Set installation details
        serial.setInstalledOnVehicle(vehicle);
        serial.setInstalledBy(installedBy);
        serial.setInstalledAt(java.time.LocalDateTime.now());
        if (workOrder != null) {
            serial.setWorkOrder(workOrder);
        }

        // Update status and adjust quantity if needed
        if ("AVAILABLE".equals(currentStatus)) {
            serial.setStatus("USED");
            // Decrement quantity when moving from AVAILABLE to USED
            ThirdPartyPart part = serial.getThirdPartyPart();
            if (part != null && part.getQuantity() != null && part.getQuantity() > 0) {
                part.setQuantity(part.getQuantity() - 1);
                part.setUpdatedBy(installedBy);
                partRepository.save(part);
            }
        } else { // RESERVED
            serial.setStatus("USED"); // finalize without changing part quantity
            // Clear reservation link after successful installation to avoid stale references
            serial.setReservedForClaim(null);
        }

        serial = serialRepository.save(serial);

        return toDto(serial);
    }
    
    /**
     * Deactivate a serial number (sets status to DEACTIVATED and decrements quantity)
     */
    @Transactional
    public ThirdPartyPartSerialDTO deactivateSerial(Integer serialId, String updatedBy) {
        ThirdPartyPartSerial serial = serialRepository.findById(serialId)
                .orElseThrow(() -> new NotFoundException("Third-party part serial not found"));
        
        // Only deactivate if currently AVAILABLE
        if (!"AVAILABLE".equals(serial.getStatus())) {
            throw new ValidationException("Only AVAILABLE serials can be deactivated. Current status: " + serial.getStatus());
        }
        
        // Update serial status
        serial.setStatus("DEACTIVATED");
        serialRepository.save(serial);
        
        // Decrement quantity from the third-party part
        ThirdPartyPart part = serial.getThirdPartyPart();
        if (part != null && part.getQuantity() != null && part.getQuantity() > 0) {
            part.setQuantity(part.getQuantity() - 1);
            part.setUpdatedBy(updatedBy);
            partRepository.save(part);
        }
        
        return toDto(serial);
    }
    
    /**
     * Activate a deactivated serial number (sets status to AVAILABLE and increments quantity)
     */
    @Transactional
    public ThirdPartyPartSerialDTO activateSerial(Integer serialId, String updatedBy) {
        ThirdPartyPartSerial serial = serialRepository.findById(serialId)
                .orElseThrow(() -> new NotFoundException("Third-party part serial not found"));
        
        // Only activate if currently DEACTIVATED
        if (!"DEACTIVATED".equals(serial.getStatus())) {
            throw new ValidationException("Only DEACTIVATED serials can be activated. Current status: " + serial.getStatus());
        }
        
        // Update serial status
        serial.setStatus("AVAILABLE");
        serialRepository.save(serial);
        
        // Increment quantity in the third-party part
        ThirdPartyPart part = serial.getThirdPartyPart();
        if (part != null) {
            if (part.getQuantity() == null) {
                part.setQuantity(0);
            }
            part.setQuantity(part.getQuantity() + 1);
            part.setUpdatedBy(updatedBy);
            partRepository.save(part);
        }
        
        return toDto(serial);
    }
    
    /**
     * Delete a serial number (only if AVAILABLE, decrements quantity)
     */
    @Transactional
    public void deleteSerial(Integer serialId, String updatedBy) {
        ThirdPartyPartSerial serial = serialRepository.findById(serialId)
                .orElseThrow(() -> new NotFoundException("Third-party part serial not found"));
        
        // Only delete if AVAILABLE (USED serials should not be deleted)
        if (!"AVAILABLE".equals(serial.getStatus())) {
            throw new ValidationException("Only AVAILABLE serials can be deleted. Current status: " + serial.getStatus());
        }
        
        // Decrement quantity from the third-party part before deleting
        ThirdPartyPart part = serial.getThirdPartyPart();
        if (part != null && part.getQuantity() != null && part.getQuantity() > 0) {
            part.setQuantity(part.getQuantity() - 1);
            part.setUpdatedBy(updatedBy);
            partRepository.save(part);
        }
        
        // Delete the serial
        serialRepository.delete(serial);
    }
    
    /**
     * Update a serial number (only if AVAILABLE or DEACTIVATED, validates uniqueness)
     */
    @Override
    @Transactional
    public ThirdPartyPartSerialDTO updateSerial(Integer serialId, String newSerialNumber, String updatedBy) {
        if (newSerialNumber == null || newSerialNumber.trim().isEmpty()) {
            throw new ValidationException("Serial number cannot be empty");
        }
        
        ThirdPartyPartSerial serial = serialRepository.findById(serialId)
                .orElseThrow(() -> new NotFoundException("Third-party part serial not found"));
        
        // Only update if AVAILABLE or DEACTIVATED (USED serials should not be modified)
        if ("USED".equals(serial.getStatus())) {
            throw new ValidationException("Cannot update serial number for USED serials. Current status: " + serial.getStatus());
        }
        
        // Check if the new serial number already exists (excluding the current serial)
        Optional<ThirdPartyPartSerial> existingSerial = serialRepository.findBySerialNumber(newSerialNumber.trim());
        if (existingSerial.isPresent() && !existingSerial.get().getId().equals(serialId)) {
            throw new ValidationException("Serial number already exists: " + newSerialNumber);
        }
        
        // Update serial number
        serial.setSerialNumber(newSerialNumber.trim());
        serialRepository.save(serial);
        
        return toDto(serial);
    }

    private ThirdPartyPartDTO toDto(ThirdPartyPart entity) {
        // Fetch regional prices from catalog
        List<CatalogPrice> catalogPrices = catalogPriceRepository
                .findByItemTypeAndItemId("THIRD_PARTY_PART", entity.getId());
        
        LocalDate today = LocalDate.now();
        BigDecimal northPrice = null;
        BigDecimal southPrice = null;
        BigDecimal centralPrice = null;
        
        for (CatalogPrice price : catalogPrices) {
            if (price.getEffectiveFrom() != null && !price.getEffectiveFrom().isAfter(today) &&
                (price.getEffectiveTo() == null || !price.getEffectiveTo().isBefore(today)) &&
                entity.getServiceCenterId().equals(price.getServiceCenterId())) {
                if ("NORTH".equals(price.getRegion())) {
                    northPrice = price.getPrice();
                } else if ("SOUTH".equals(price.getRegion())) {
                    southPrice = price.getPrice();
                } else if ("CENTRAL".equals(price.getRegion())) {
                    centralPrice = price.getPrice();
                }
            }
        }
        
        return ThirdPartyPartDTO.builder()
                .id(entity.getId())
                .partNumber(entity.getPartNumber())
                .name(entity.getName())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .supplier(entity.getSupplier())
                .unitCost(entity.getUnitCost())
                .quantity(entity.getQuantity())
                .serviceCenterId(entity.getServiceCenterId())
                .active(entity.getActive())
                .northPrice(northPrice)
                .southPrice(southPrice)
                .centralPrice(centralPrice)
                .build();
    }

    private ThirdPartyPartSerialDTO toDto(ThirdPartyPartSerial entity) {
        return ThirdPartyPartSerialDTO.builder()
                .id(entity.getId())
                .thirdPartyPartId(entity.getThirdPartyPart() != null ? entity.getThirdPartyPart().getId() : null)
                .serialNumber(entity.getSerialNumber())
                .status(entity.getStatus())
                .serviceCenterId(entity.getServiceCenterId())
                .installedBy(entity.getInstalledBy())
                .installedAt(entity.getInstalledAt())
                .workOrderId(entity.getWorkOrder() != null ? entity.getWorkOrder().getId() : null)
                .vehicleId(entity.getInstalledOnVehicle() != null ? entity.getInstalledOnVehicle().getId() : null)
                .vehicleVin(entity.getInstalledOnVehicle() != null ? entity.getInstalledOnVehicle().getVin() : null)
                .build();
    }

    /**
     * Sync third-party part's prices to catalog pricing system
     * Creates or updates catalog price entries for all 3 regions (NORTH, SOUTH, CENTRAL)
     * Uses regional prices from DTO if provided, otherwise uses unitCost for all regions
     * Similar to how service items have regional pricing
     */
    private void syncCatalogPrice(ThirdPartyPart part, ThirdPartyPartDTO dto, String updatedBy) {
        LocalDate today = LocalDate.now();
        
        // Determine prices for each region
        // Priority: regional price from DTO > unitCost from DTO > unitCost from entity
        BigDecimal northPrice = dto.getNorthPrice() != null ? dto.getNorthPrice() : 
                               (dto.getUnitCost() != null ? dto.getUnitCost() : part.getUnitCost());
        BigDecimal southPrice = dto.getSouthPrice() != null ? dto.getSouthPrice() : 
                                (dto.getUnitCost() != null ? dto.getUnitCost() : part.getUnitCost());
        BigDecimal centralPrice = dto.getCentralPrice() != null ? dto.getCentralPrice() : 
                                  (dto.getUnitCost() != null ? dto.getUnitCost() : part.getUnitCost());
        
        // Only sync if at least one price is available
        if (northPrice == null && southPrice == null && centralPrice == null) {
            return;
        }
        
        // Create or update catalog price for each region
        syncCatalogPriceForRegion(part, "NORTH", northPrice, today);
        syncCatalogPriceForRegion(part, "SOUTH", southPrice, today);
        syncCatalogPriceForRegion(part, "CENTRAL", centralPrice, today);
    }
    
    /**
     * Sync catalog price for a specific region
     */
    private void syncCatalogPriceForRegion(ThirdPartyPart part, String region, BigDecimal price, LocalDate today) {
        if (price == null) {
            return; // Skip if price is not provided for this region
        }
        
        // Find existing catalog price for this third-party part in this region
        Optional<CatalogPrice> existingPrice = catalogPriceRepository
                .findByItemTypeAndItemId("THIRD_PARTY_PART", part.getId())
                .stream()
                .filter(p -> region.equals(p.getRegion()))
                .filter(p -> part.getServiceCenterId().equals(p.getServiceCenterId()))
                .filter(p -> p.getEffectiveTo() == null || !p.getEffectiveTo().isBefore(today))
                .findFirst();
        
        if (existingPrice.isPresent()) {
            // Update existing price
            CatalogPrice catalogPrice = existingPrice.get();
            catalogPrice.setPrice(price);
            catalogPrice.setUpdatedAt(LocalDateTime.now());
            catalogPriceRepository.save(catalogPrice);
        } else {
            // Create new catalog price entry for this region
            CatalogPrice catalogPrice = CatalogPrice.builder()
                    .itemType("THIRD_PARTY_PART")
                    .itemId(part.getId())
                    .price(price)
                    .currency("VND")
                    .region(region) // Regional pricing: NORTH, SOUTH, or CENTRAL
                    .serviceCenterId(part.getServiceCenterId()) // Service center specific
                    .effectiveFrom(today)
                    .effectiveTo(null) // No expiry
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            catalogPriceRepository.save(catalogPrice);
        }
    }

    /**
     * Deactivate catalog prices when unitCost is removed
     */
    private void deactivateCatalogPrices(Integer partId) {
        List<CatalogPrice> prices = catalogPriceRepository
                .findByItemTypeAndItemId("THIRD_PARTY_PART", partId);
        
        LocalDate today = LocalDate.now();
        for (CatalogPrice price : prices) {
            if (price.getEffectiveTo() == null || price.getEffectiveTo().isAfter(today)) {
                price.setEffectiveTo(today.minusDays(1)); // Set to yesterday to deactivate
                price.setUpdatedAt(LocalDateTime.now());
                catalogPriceRepository.save(price);
            }
        }
    }
    
    /**
     * Reverse sync: Update third-party part when catalog prices are updated
     * This is called from ServiceCatalogServiceImpl when a THIRD_PARTY_PART price is updated
     * Updates the part's unitCost to the average of regional prices, or the first available price
     */
    @Transactional
    public void syncFromCatalogPrice(Integer partId, String updatedBy) {
        ThirdPartyPart part = partRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Third-party part not found"));
        
        // Get current effective catalog prices for this part
        List<CatalogPrice> catalogPrices = catalogPriceRepository
                .findByItemTypeAndItemId("THIRD_PARTY_PART", partId);
        
        LocalDate today = LocalDate.now();
        BigDecimal totalPrice = BigDecimal.ZERO;
        int priceCount = 0;
        
        for (CatalogPrice price : catalogPrices) {
            if (price.getEffectiveFrom() != null && !price.getEffectiveFrom().isAfter(today) &&
                (price.getEffectiveTo() == null || !price.getEffectiveTo().isBefore(today)) &&
                part.getServiceCenterId().equals(price.getServiceCenterId())) {
                totalPrice = totalPrice.add(price.getPrice());
                priceCount++;
            }
        }
        
        // Update unitCost to average of regional prices, or keep existing if no prices found
        if (priceCount > 0) {
            BigDecimal averagePrice = totalPrice.divide(BigDecimal.valueOf(priceCount), 2, 
                    java.math.RoundingMode.HALF_UP);
            part.setUnitCost(averagePrice);
            part.setUpdatedBy(updatedBy);
            partRepository.save(part);
        }
    }
    
    /**
     * Check availability of serials for third-party parts (without reserving)
     */
    @Override
    @Transactional(readOnly = true)
    public ReserveSerialsResponseDTO checkSerialAvailability(ReserveSerialsRequestDTO request) {
        List<ReserveSerialsResponseDTO.PartReservationResultDTO> results = new java.util.ArrayList<>();
        boolean allAvailable = true;
        
        for (ReserveSerialsRequestDTO.PartReservationDTO partReq : request.getParts()) {
            ThirdPartyPart part = partRepository.findById(partReq.getThirdPartyPartId())
                    .orElseThrow(() -> new NotFoundException("Third-party part not found: " + partReq.getThirdPartyPartId()));
            
            // Get available serials (status = AVAILABLE)
            List<ThirdPartyPartSerial> availableSerials = serialRepository
                    .findByThirdPartyPartIdAndStatus(partReq.getThirdPartyPartId(), "AVAILABLE");
            
            int availableCount = availableSerials.size();
            int requestedQuantity = partReq.getQuantity();
            
            String status;
            String message;
            int reservedQuantity = 0;
            
            if (availableCount >= requestedQuantity) {
                status = "ALL_RESERVED";
                message = "Tất cả phụ tùng đã được xác minh và sẵn sàng cho xe";
                reservedQuantity = requestedQuantity;
                allAvailable = allAvailable && true;
            } else if (availableCount > 0) {
                status = "PARTIAL";
                message = String.format("Chỉ có %d/%d số lượng phụ tùng này có sẵn cho xe, thay đổi chưa được lưu", 
                        availableCount, requestedQuantity);
                reservedQuantity = availableCount;
                allAvailable = false;
            } else {
                status = "NONE_AVAILABLE";
                message = "Không đủ số lượng phụ tùng bên thứ ba này để sẵn sàng cho xe";
                reservedQuantity = 0;
                allAvailable = false;
            }
            
            results.add(ReserveSerialsResponseDTO.PartReservationResultDTO.builder()
                    .thirdPartyPartId(partReq.getThirdPartyPartId())
                    .partName(part.getName())
                    .requestedQuantity(requestedQuantity)
                    .reservedQuantity(reservedQuantity)
                    .availableQuantity(availableCount)
                    .reservedSerialNumbers(new java.util.ArrayList<>())
                    .status(status)
                    .message(message)
                    .build());
        }
        
        String overallMessage = allAvailable 
                ? "Tất cả phụ tùng đã được xác minh và sẵn sàng cho xe"
                : "Một số phụ tùng không đủ số lượng";
        
        return ReserveSerialsResponseDTO.builder()
                .allReserved(allAvailable)
                .message(overallMessage)
                .results(results)
                .build();
    }
    
    /**
     * Reserve serials for a claim (assigns and reserves available serials)
     */
    @Override
    @Transactional
    public ReserveSerialsResponseDTO reserveSerialsForClaim(ReserveSerialsRequestDTO request, String reservedBy) {
        Claim claim = claimRepository.findById(request.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found: " + request.getClaimId()));
        
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new NotFoundException("Vehicle not found: " + request.getVehicleId()));
        
        List<ReserveSerialsResponseDTO.PartReservationResultDTO> results = new java.util.ArrayList<>();
        boolean allReserved = true;
        
        for (ReserveSerialsRequestDTO.PartReservationDTO partReq : request.getParts()) {
            ThirdPartyPart part = partRepository.findById(partReq.getThirdPartyPartId())
                    .orElseThrow(() -> new NotFoundException("Third-party part not found: " + partReq.getThirdPartyPartId()));
            
            // Get available serials (status = AVAILABLE)
            List<ThirdPartyPartSerial> availableSerials = serialRepository
                    .findByThirdPartyPartIdAndStatus(partReq.getThirdPartyPartId(), "AVAILABLE");
            
            int availableCount = availableSerials.size();
            int requestedQuantity = partReq.getQuantity();
            int reservedQuantity = Math.min(availableCount, requestedQuantity);
            
            List<String> reservedSerialNumbers = new java.util.ArrayList<>();
            String status;
            String message;
            
            if (availableCount >= requestedQuantity) {
                // Reserve all requested serials
                for (int i = 0; i < requestedQuantity; i++) {
                    ThirdPartyPartSerial serial = availableSerials.get(i);
                    serial.setStatus("RESERVED");
                    serial.setReservedForClaim(claim);
                    serial.setInstalledOnVehicle(vehicle);
                    serial.setInstalledBy(reservedBy);
                    serial.setInstalledAt(LocalDateTime.now());
                    serial = serialRepository.save(serial);
                    reservedSerialNumbers.add(serial.getSerialNumber());
                }
                
                // Decrement quantity from part
                if (part.getQuantity() != null && part.getQuantity() >= requestedQuantity) {
                    part.setQuantity(part.getQuantity() - requestedQuantity);
                    part.setUpdatedBy(reservedBy);
                    partRepository.save(part);
                }
                
                status = "ALL_RESERVED";
                message = "Tất cả phụ tùng đã được xác minh và sẵn sàng cho xe";
            } else if (availableCount > 0) {
                // Reserve only available serials
                for (int i = 0; i < availableCount; i++) {
                    ThirdPartyPartSerial serial = availableSerials.get(i);
                    serial.setStatus("RESERVED");
                    serial.setReservedForClaim(claim);
                    serial.setInstalledOnVehicle(vehicle);
                    serial.setInstalledBy(reservedBy);
                    serial.setInstalledAt(LocalDateTime.now());
                    serial = serialRepository.save(serial);
                    reservedSerialNumbers.add(serial.getSerialNumber());
                }
                
                // Decrement quantity from part
                if (part.getQuantity() != null && part.getQuantity() >= availableCount) {
                    part.setQuantity(part.getQuantity() - availableCount);
                    part.setUpdatedBy(reservedBy);
                    partRepository.save(part);
                }
                
                status = "PARTIAL";
                message = String.format("Chỉ có %d/%d số lượng phụ tùng này có sẵn cho xe, thay đổi chưa được lưu", 
                        availableCount, requestedQuantity);
                allReserved = false;
            } else {
                status = "NONE_AVAILABLE";
                message = "Không đủ số lượng phụ tùng bên thứ ba này để sẵn sàng cho xe";
                allReserved = false;
            }
            
            results.add(ReserveSerialsResponseDTO.PartReservationResultDTO.builder()
                    .thirdPartyPartId(partReq.getThirdPartyPartId())
                    .partName(part.getName())
                    .requestedQuantity(requestedQuantity)
                    .reservedQuantity(reservedQuantity)
                    .availableQuantity(availableCount)
                    .reservedSerialNumbers(reservedSerialNumbers)
                    .status(status)
                    .message(message)
                    .build());
        }
        
        String overallMessage = allReserved 
                ? "Tất cả phụ tùng đã được xác minh và sẵn sàng cho xe"
                : "Một số phụ tùng không đủ số lượng";
        
        return ReserveSerialsResponseDTO.builder()
                .allReserved(allReserved)
                .message(overallMessage)
                .results(results)
                .build();
    }
    
    /**
     * Release reserved serials for a claim and part (makes them AVAILABLE again)
     * This is called when a part is removed from a claim, so the serials become available for other technicians
     */
    @Override
    @Transactional
    public void releaseReservedSerials(Integer claimId, Integer partId, String releasedBy) {
        // Find all RESERVED serials for this claim and part
        List<ThirdPartyPartSerial> reservedSerials = serialRepository
                .findByReservedForClaimIdAndThirdPartyPartId(claimId, partId);
        
        if (reservedSerials.isEmpty()) {
            // No reserved serials to release
            return;
        }
        
        ThirdPartyPart part = partRepository.findById(partId)
                .orElseThrow(() -> new NotFoundException("Third-party part not found: " + partId));
        
        int releasedCount = 0;
        
        // Release each reserved serial
        for (ThirdPartyPartSerial serial : reservedSerials) {
            if ("RESERVED".equals(serial.getStatus())) {
                // Change status back to AVAILABLE
                serial.setStatus("AVAILABLE");
                // Clear claim and vehicle references
                serial.setReservedForClaim(null);
                serial.setInstalledOnVehicle(null);
                serial.setInstalledBy(null);
                serial.setInstalledAt(null);
                serialRepository.save(serial);
                releasedCount++;
            }
        }
        
        // Increment quantity back (add released serials back to available stock)
        if (releasedCount > 0 && part.getQuantity() != null) {
            part.setQuantity(part.getQuantity() + releasedCount);
            part.setUpdatedBy(releasedBy);
            partRepository.save(part);
        }
    }
}

