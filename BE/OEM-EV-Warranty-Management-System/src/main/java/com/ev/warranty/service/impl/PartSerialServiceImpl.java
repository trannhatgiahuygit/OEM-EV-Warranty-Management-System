package com.ev.warranty.service.impl;

import com.ev.warranty.exception.BadRequestException;
import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.mapper.PartSerialMapper;
import com.ev.warranty.model.dto.part.*;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.PartSerialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartSerialServiceImpl implements PartSerialService {

    private final PartSerialRepository partSerialRepository;
    private final PartRepository partRepository;
    private final VehicleRepository vehicleRepository;
    private final PartSerialHistoryRepository partSerialHistoryRepository;
    private final UserRepository userRepository;
    private final PartSerialMapper partSerialMapper;
    private final com.ev.warranty.repository.ThirdPartyPartSerialRepository thirdPartyPartSerialRepository;

    @Override
    @Transactional
    public PartSerialDTO createPartSerial(CreatePartSerialRequestDTO request) {
        log.info("Creating new part serial: {}", request.getSerialNumber());

        if (partSerialRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new BadRequestException("Serial number already exists: " + request.getSerialNumber());
        }

        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new NotFoundException("Part not found with ID: " + request.getPartId()));

        PartSerial partSerial = PartSerial.builder()
                .part(part)
                .serialNumber(request.getSerialNumber())
                .manufactureDate(request.getManufactureDate())
                .status("in_stock")
                .build();

        partSerial = partSerialRepository.save(partSerial);

        createHistoryRecord(partSerial, null, "CREATED", null, "in_stock", null, "Part serial registered in inventory");

        log.info("Part serial created successfully: {}", partSerial.getSerialNumber());
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    public List<PartSerialDTO> getAvailableSerials(Integer partId) {
        log.info("Getting available serials for part ID: {}", partId);

        List<PartSerial> serials;
        if (partId != null) {
            serials = partSerialRepository.findAvailablePartsByPartId(partId);
        } else {
            serials = partSerialRepository.findByStatus("in_stock");
        }

        return serials.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PartSerialDTO installPartSerial(InstallPartSerialRequestDTO request) {
        log.info("Installing part serial {} on vehicle {}", request.getSerialNumber(), request.getVehicleVin());

        PartSerial partSerial = partSerialRepository.findBySerialNumber(request.getSerialNumber())
                .orElseThrow(() -> new NotFoundException("Part serial not found: " + request.getSerialNumber()));

        if (!"in_stock".equals(partSerial.getStatus()) && !"allocated".equals(partSerial.getStatus())) {
            throw new BadRequestException("Part serial is not available for installation. Current status: " + partSerial.getStatus());
        }

        if (partSerial.getInstalledOnVehicle() != null) {
            throw new BadRequestException("Part serial is already installed on vehicle: " +
                    partSerial.getInstalledOnVehicle().getVin());
        }

        Vehicle vehicle = vehicleRepository.findByVin(request.getVehicleVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVehicleVin()));

        String oldStatus = partSerial.getStatus();
        partSerial.setStatus("installed");
        partSerial.setInstalledOnVehicle(vehicle);
        partSerial.setInstalledAt(LocalDateTime.now());
        partSerial = partSerialRepository.save(partSerial);

        createHistoryRecord(partSerial, vehicle, "INSTALLED", oldStatus, "installed",
                request.getWorkOrderId(), request.getNotes());

        log.info("Part serial {} installed successfully on vehicle {}",
                partSerial.getSerialNumber(), vehicle.getVin());
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    @Transactional
    public PartSerialDTO replacePartSerial(ReplacePartSerialRequestDTO request) {
        log.info("Replacing part serial {} with {} on vehicle {}",
                request.getOldSerialNumber(), request.getNewSerialNumber(), request.getVehicleVin());

        Vehicle vehicle = vehicleRepository.findByVin(request.getVehicleVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVehicleVin()));

        PartSerial oldPartSerial = partSerialRepository.findBySerialNumber(request.getOldSerialNumber())
                .orElseThrow(() -> new NotFoundException("Old part serial not found: " + request.getOldSerialNumber()));

        if (oldPartSerial.getInstalledOnVehicle() == null ||
                !oldPartSerial.getInstalledOnVehicle().getId().equals(vehicle.getId())) {
            throw new BadRequestException("Old part serial is not installed on this vehicle");
        }

        PartSerial newPartSerial = partSerialRepository.findBySerialNumber(request.getNewSerialNumber())
                .orElseThrow(() -> new NotFoundException("New part serial not found: " + request.getNewSerialNumber()));

        if (!"in_stock".equals(newPartSerial.getStatus()) && !"allocated".equals(newPartSerial.getStatus())) {
            throw new BadRequestException("New part serial is not available. Current status: " + newPartSerial.getStatus());
        }

        if (!oldPartSerial.getPart().getId().equals(newPartSerial.getPart().getId())) {
            throw new BadRequestException("Old and new part serials must be of the same part type");
        }

        String oldPartOldStatus = oldPartSerial.getStatus();
        oldPartSerial.setStatus("returned");
        oldPartSerial.setInstalledOnVehicle(null);
        oldPartSerial.setInstalledAt(null);
        partSerialRepository.save(oldPartSerial);

        createHistoryRecord(oldPartSerial, vehicle, "REPLACED_OUT", oldPartOldStatus, "returned",
                request.getWorkOrderId(), "Replaced with: " + request.getNewSerialNumber() + ". Reason: " + request.getReason());

        String newPartOldStatus = newPartSerial.getStatus();
        newPartSerial.setStatus("installed");
        newPartSerial.setInstalledOnVehicle(vehicle);
        newPartSerial.setInstalledAt(LocalDateTime.now());
        newPartSerial = partSerialRepository.save(newPartSerial);

        createHistoryRecord(newPartSerial, vehicle, "REPLACED_IN", newPartOldStatus, "installed",
                request.getWorkOrderId(), "Replaced from: " + request.getOldSerialNumber() + ". Reason: " + request.getReason());

        log.info("Part replacement completed successfully on vehicle {}", vehicle.getVin());
        return partSerialMapper.toDTO(newPartSerial);
    }

    @Override
    @Transactional
    public PartSerialDTO uninstallPartSerial(UninstallPartSerialRequestDTO request) {
        log.info("Uninstalling part serial: {}", request.getSerialNumber());

        PartSerial partSerial = partSerialRepository.findBySerialNumber(request.getSerialNumber())
                .orElseThrow(() -> new NotFoundException("Part serial not found: " + request.getSerialNumber()));

        if (!"installed".equals(partSerial.getStatus())) {
            throw new BadRequestException("Part serial is not installed. Current status: " + partSerial.getStatus());
        }

        Vehicle vehicle = partSerial.getInstalledOnVehicle();

        String oldStatus = partSerial.getStatus();
        partSerial.setStatus("returned");
        partSerial.setInstalledOnVehicle(null);
        partSerial.setInstalledAt(null);
        partSerial = partSerialRepository.save(partSerial);

        createHistoryRecord(partSerial, vehicle, "UNINSTALLED", oldStatus, "returned",
                null, "Reason: " + request.getReason() + ". " + request.getNotes());

        log.info("Part serial {} uninstalled successfully", partSerial.getSerialNumber());
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    public VehiclePartsResponseDTO getVehicleInstalledParts(String vin) {
        log.info("Getting installed parts for vehicle: {}", vin);

        Vehicle vehicle = vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + vin));

        // Get OEM parts
        List<PartSerial> installedParts = partSerialRepository.findActivePartsByVehicleId(vehicle.getId());
        List<PartSerialDTO> partSerialDTOs = installedParts.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());

        // Get third-party parts
        List<com.ev.warranty.model.entity.ThirdPartyPartSerial> thirdPartySerials = 
                thirdPartyPartSerialRepository.findByInstalledOnVehicleId(vehicle.getId());
        List<com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO> thirdPartyDTOs = 
                thirdPartySerials.stream()
                        .map(serial -> {
                            // Convert to DTO manually since we don't have access to the mapper here
                            return com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO.builder()
                                    .id(serial.getId())
                                    .thirdPartyPartId(serial.getThirdPartyPart() != null ? serial.getThirdPartyPart().getId() : null)
                                    .serialNumber(serial.getSerialNumber())
                                    .status(serial.getStatus())
                                    .serviceCenterId(serial.getServiceCenterId())
                                    .installedBy(serial.getInstalledBy())
                                    .installedAt(serial.getInstalledAt())
                                    .workOrderId(serial.getWorkOrder() != null ? serial.getWorkOrder().getId() : null)
                                    .vehicleId(vehicle.getId())
                                    .vehicleVin(vehicle.getVin())
                                    .build();
                        })
                        .collect(Collectors.toList());

        int totalParts = partSerialDTOs.size() + thirdPartyDTOs.size();

        return VehiclePartsResponseDTO.builder()
                .vin(vehicle.getVin())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .customerName(vehicle.getCustomer() != null ? vehicle.getCustomer().getName() : null)
                .installedParts(partSerialDTOs)
                .thirdPartyParts(thirdPartyDTOs)
                .totalParts(totalParts)
                .build();
    }

    @Override
    public PartSerialDTO getPartSerialBySerialNumber(String serialNumber) {
        PartSerial partSerial = partSerialRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new NotFoundException("Part serial not found: " + serialNumber));
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    public List<PartSerialDTO> getPartSerialsByStatus(String status) {
        List<PartSerial> serials = partSerialRepository.findByStatus(status);
        return serials.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PartSerialDTO> getAllPartSerials() {
        List<PartSerial> serials = partSerialRepository.findAll();
        return serials.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<PartSerialDTO> receivePartSerialsForWorkOrder(ReceivePartSerialForWorkOrderRequestDTO request) {
        log.info("Receiving part serials for work order: {}", request.getWorkOrderId());
        List<PartSerialDTO> receivedParts = request.getPartSerialIds().stream().map(partSerialId -> {
            PartSerial partSerial = partSerialRepository.findById(partSerialId)
                    .orElseThrow(() -> new NotFoundException("Part serial not found with ID: " + partSerialId));
            if (!"in_stock".equals(partSerial.getStatus())) {
                throw new BadRequestException("Part serial is not available for allocation. Current status: " + partSerial.getStatus());
            }
            String oldStatus = partSerial.getStatus();
            partSerial.setStatus("allocated");
            partSerial = partSerialRepository.save(partSerial);
            createHistoryRecord(partSerial, null, "ALLOCATED_FOR_WORKORDER", oldStatus, "allocated", request.getWorkOrderId(), "Allocated for work order");
            return partSerialMapper.toDTO(partSerial);
        }).collect(Collectors.toList());
        log.info("Received {} part serials for work order {}", receivedParts.size(), request.getWorkOrderId());
        return receivedParts;
    }

    private void createHistoryRecord(PartSerial partSerial, Vehicle vehicle, String action,
                                     String oldStatus, String newStatus, Integer workOrderId, String notes) {
        User currentUser = getCurrentUser();

        PartSerialHistory history = PartSerialHistory.builder()
                .partSerial(partSerial)
                .vehicle(vehicle)
                .action(action)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .performedBy(currentUser)
                .notes(notes)
                .build();

        partSerialHistoryRepository.save(history);
    }

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
