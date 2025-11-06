package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.VehicleMapper;
import com.ev.warranty.model.dto.vehicle.VehicleRegisterRequestDTO;
import com.ev.warranty.model.dto.vehicle.VehicleResponseDTO;
import com.ev.warranty.model.entity.*;
import com.ev.warranty.repository.*;
import com.ev.warranty.service.inter.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PartRepository partRepository;
    private final PartSerialRepository partSerialRepository;
    private final VehicleMapper vehicleMapper;
    private final VehicleModelRepository vehicleModelRepository;

    @Override
    @Transactional
    public VehicleResponseDTO registerVehicle(VehicleRegisterRequestDTO request, String registeredBy) {
        log.info("Starting vehicle registration for VIN: {} by user: {}", request.getVin(), registeredBy);

        // 1. Comprehensive validations
        validateVehicleRegistration(request);

        // 2. Get or create customer
        CustomerResult customerResult = getOrCreateCustomer(request, registeredBy);
        Customer customer = customerResult.customer();
        boolean isNewCustomer = customerResult.isNewCustomer();

        // 3. Calculate warranty period
        LocalDate warrantyStart = Optional.ofNullable(request.getWarrantyStart())
                .orElse(request.getRegistrationDate());

        // 3b. Enforce predefined vehicle model selection
        if (request.getVehicleModelId() == null) {
            throw new ValidationException("Vui lòng chọn mẫu xe (vehicleModelId) có sẵn");
        }
        VehicleModel linkedModel = vehicleModelRepository.findById(request.getVehicleModelId())
                .orElseThrow(() -> new NotFoundException("VehicleModel not found with ID: " + request.getVehicleModelId()));

        // Calculate end date based on model default (fallback to previous logic if needed)
        int warrantyYears = switch ((linkedModel.getName() != null ? linkedModel.getName() : "").toLowerCase()) {
            case "ev model x pro" -> 5;
            case "ev model z luxury" -> 5;
            case "ev model y standard" -> 3;
            default -> 3;
        };
        LocalDate warrantyEnd = warrantyStart.plusYears(warrantyYears);

        // 4. Create and save vehicle
        Vehicle vehicle = createVehicle(request, customer, warrantyStart, warrantyEnd);
        vehicle.setVehicleModel(linkedModel);
        // Normalize model display from linked model
        vehicle.setModel(linkedModel.getName());
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        log.info("Vehicle saved with ID: {} for VIN: {}", savedVehicle.getId(), savedVehicle.getVin());

        // 5. Process factory installed parts
        processFactoryInstalledParts(request.getInstalledParts(), savedVehicle);

        // 6. Create response with additional metadata
        int totalParts = Optional.ofNullable(request.getInstalledParts()).map(List::size).orElse(0);
        VehicleResponseDTO response = vehicleMapper.toResponseDTO(savedVehicle);
        enhanceResponseWithMetadata(response, registeredBy, isNewCustomer, totalParts);

        log.info("Vehicle registration completed successfully for VIN: {}", request.getVin());
        return response;
    }

    @Override
    public Optional<VehicleResponseDTO> findByVin(String vin) {
        return vehicleRepository.findByVin(vin)
                .map(vehicleMapper::toResponseDTO);
    }

    @Override
    public Optional<VehicleResponseDTO> findById(Integer id) {
        return vehicleRepository.findById(id)
                .map(vehicleMapper::toResponseDTO);
    }

    @Override
    public List<VehicleResponseDTO> findByCustomerId(Integer customerId) {
        List<Vehicle> vehicles = vehicleRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return vehicles.stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponseDTO> findAllVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return vehicles.stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isVinExists(String vin) {
        return vehicleRepository.existsByVin(vin);
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private void validateVehicleRegistration(VehicleRegisterRequestDTO request) {
        // Check VIN uniqueness
        if (vehicleRepository.existsByVin(request.getVin())) {
            throw new ValidationException("Vehicle with VIN '" + request.getVin() + "' already exists");
        }

        // Validate customer selection logic
        if (request.getCustomerId() != null && request.getCustomerInfo() != null) {
            throw new ValidationException("Provide either customerId OR customerInfo, not both");
        }

        if (request.getCustomerId() == null && request.getCustomerInfo() == null) {
            throw new ValidationException("Either customerId or customerInfo must be provided");
        }

        // Validate registration date
        LocalDate today = LocalDate.now();
        if (request.getRegistrationDate().isAfter(today)) {
            throw new ValidationException("Registration date cannot be in the future");
        }

        if (request.getRegistrationDate().isBefore(today.minusYears(2))) {
            throw new ValidationException("Registration date cannot be more than 2 years ago");
        }

        // Validate warranty start date
        if (request.getWarrantyStart() != null &&
                request.getWarrantyStart().isBefore(request.getRegistrationDate())) {
            throw new ValidationException("Warranty start date cannot be before registration date");
        }

        // Validate part serials uniqueness
        if (request.getInstalledParts() != null && !request.getInstalledParts().isEmpty()) {
            validatePartSerials(request.getInstalledParts());
        }
        // Enforce using predefined model id
        if (request.getVehicleModelId() == null) {
            throw new ValidationException("Xe mới phải chọn từ mẫu có sẵn (vehicleModelId)");
        }
    }

    // validatePartSerials with installedAt validation
    private void validatePartSerials(List<VehicleRegisterRequestDTO.PartSerialDTO> partSerials) {
        for (VehicleRegisterRequestDTO.PartSerialDTO partSerial : partSerials) {
            // Check if part exists
            if (!partRepository.existsById(partSerial.getPartId())) {
                throw new NotFoundException("Part not found with ID: " + partSerial.getPartId());
            }

            // Check serial number uniqueness
            if (partSerialRepository.existsBySerialNumber(partSerial.getSerialNumber())) {
                throw new ValidationException("Serial number '" + partSerial.getSerialNumber() + "' already exists");
            }

            // Validate manufacture date
            if (partSerial.getManufactureDate() != null) {
                if (partSerial.getManufactureDate().isAfter(LocalDate.now())) {
                    throw new ValidationException("Part manufacture date cannot be in the future");
                }

                if (partSerial.getManufactureDate().isBefore(LocalDate.now().minusYears(3))) {
                    throw new ValidationException("Part manufacture date cannot be more than 3 years ago");
                }
            }

            // Validate installedAt date
            if (partSerial.getInstalledAt() != null) {
                LocalDateTime installedAt = partSerial.getInstalledAt();

                // Installation date cannot be in the future
                if (installedAt.isAfter(LocalDateTime.now())) {
                    throw new ValidationException("Part installation date cannot be in the future");
                }

                // Installation date should be after manufacture date
                if (partSerial.getManufactureDate() != null &&
                        installedAt.toLocalDate().isBefore(partSerial.getManufactureDate())) {
                    throw new ValidationException("Part installation date cannot be before manufacture date");
                }

                // Installation date should be reasonable (not too old)
                if (installedAt.isBefore(LocalDateTime.now().minusYears(3))) {
                    throw new ValidationException("Part installation date cannot be more than 3 years ago");
                }
            }
        }
    }

    private CustomerResult getOrCreateCustomer(VehicleRegisterRequestDTO request, String registeredBy) {
        if (request.getCustomerId() != null) {
            // Use existing customer
            Customer existingCustomer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new NotFoundException("Customer not found with ID: " + request.getCustomerId()));
            return new CustomerResult(existingCustomer, false);
        } else {
            // Create new customer
            User registeredByUser = userRepository.findByUsername(registeredBy)
                    .orElseThrow(() -> new NotFoundException("User not found: " + registeredBy));

            VehicleRegisterRequestDTO.CustomerInfoDTO customerInfo = request.getCustomerInfo();

            // Check email uniqueness for new customer
            if (customerInfo.getEmail() != null && customerRepository.existsByEmail(customerInfo.getEmail())) {
                throw new ValidationException("Customer with email '" + customerInfo.getEmail() + "' already exists");
            }

            Customer newCustomer = Customer.builder()
                    .name(customerInfo.getName())
                    .email(customerInfo.getEmail())
                    .phone(customerInfo.getPhone())
                    .address(customerInfo.getAddress())
                    .createdBy(registeredByUser)
                    .build();

            Customer savedCustomer = customerRepository.save(newCustomer);
            log.info("New customer created with ID: {} for vehicle registration", savedCustomer.getId());

            return new CustomerResult(savedCustomer, true);
        }
    }

    private LocalDate calculateWarrantyEndDate(LocalDate warrantyStart, String model) {
        // Business logic for warranty period based on model
        int warrantyYears = switch (model.toLowerCase()) {
            case "ev model x pro" -> 5;     // Premium model = 5 years
            case "ev model z luxury" -> 5;  // Luxury model = 5 years
            case "ev model y standard" -> 3; // Standard model = 3 years
            default -> 3; // Default warranty period
        };

        return warrantyStart.plusYears(warrantyYears);
    }

    private Vehicle createVehicle(VehicleRegisterRequestDTO request, Customer customer,
                                  LocalDate warrantyStart, LocalDate warrantyEnd) {
        return Vehicle.builder()
                .vin(request.getVin().toUpperCase()) // Normalize to uppercase
                .licensePlate(request.getLicensePlate() != null ? request.getLicensePlate().toUpperCase() : null)
                .model(request.getModel())
                .year(request.getYear())
                .customer(customer)
                .registrationDate(request.getRegistrationDate())
                .warrantyStart(warrantyStart)
                .warrantyEnd(warrantyEnd)
                .mileageKm(request.getMileageKm() != null ? request.getMileageKm() : 0)
                .build();
    }

    // processFactoryInstalledParts - use user provided installedAt
    private void processFactoryInstalledParts(List<VehicleRegisterRequestDTO.PartSerialDTO> partDTOs, Vehicle vehicle) {
        if (partDTOs == null || partDTOs.isEmpty()) {
            return; // Không có part nào để xử lý
        }
        for (VehicleRegisterRequestDTO.PartSerialDTO partDTO : partDTOs) {
            Part part = partRepository.findById(partDTO.getPartId())
                    .orElseThrow(() -> new NotFoundException("Part not found with ID: " + partDTO.getPartId()));

            PartSerial partSerial = PartSerial.builder()
                    .part(part)
                    .serialNumber(partDTO.getSerialNumber().toUpperCase()) // Normalize to uppercase
                    .manufactureDate(partDTO.getManufactureDate())
                    .status("installed")
                    .installedOnVehicle(vehicle)
                    .installedAt(partDTO.getInstalledAt())
                    .build();

            partSerialRepository.save(partSerial);

            log.debug("Recorded factory-installed part {} with serial {} on vehicle {} (installation date: {})",
                    part.getPartNumber(), partSerial.getSerialNumber(), vehicle.getVin(), partDTO.getInstalledAt());
        }
    }

    private void enhanceResponseWithMetadata(VehicleResponseDTO response, String registeredBy,
                                             boolean isNewCustomer, int totalParts) {
        if (response.getCustomer() != null) {
            response.getCustomer().setIsNewCustomer(isNewCustomer);
        }

        VehicleResponseDTO.RegistrationSummaryDTO summary = VehicleResponseDTO.RegistrationSummaryDTO.builder()
                .registeredBy(registeredBy)
                .totalPartsInstalled(totalParts)
                .warrantyPeriod(calculateWarrantyPeriodText(response.getWarrantyStart(), response.getWarrantyEnd()))
                .registrationStatus("COMPLETED")
                .build();

        response.setRegistrationSummary(summary);
    }

    private String calculateWarrantyPeriodText(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return "Unknown";
        }

        long years = java.time.temporal.ChronoUnit.YEARS.between(start, end);
        return years + " year" + (years != 1 ? "s" : "");
    }

    @Override
    @Transactional
    public VehicleResponseDTO updateMileage(Integer id, Integer mileage, String updatedBy) {
        log.info("Updating mileage for vehicle ID: {} to {} km by user: {}", id, mileage, updatedBy);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with ID: " + id));
        if (mileage < 0) {
            throw new ValidationException("Mileage cannot be negative");
        }
        if (vehicle.getMileageKm() != null && mileage < vehicle.getMileageKm()) {
            throw new ValidationException("New mileage cannot be less than current mileage");
        }
        vehicle.setMileageKm(mileage);
        vehicle.setUpdatedAt(LocalDateTime.now());
        vehicle.setUpdatedBy(updatedBy);
        vehicleRepository.save(vehicle);
        return vehicleMapper.toResponseDTO(vehicle);
    }

    @Override
    public VehicleResponseDTO getWarrantyStatus(Integer id) {
        log.debug("Getting warranty status for vehicle ID: {}", id);
        
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with ID: " + id));
        
        VehicleResponseDTO response = vehicleMapper.toResponseDTO(vehicle);
        
        // Add warranty status information
        LocalDate today = LocalDate.now();
        boolean isUnderWarranty = vehicle.getWarrantyEnd() != null && 
                                 vehicle.getWarrantyEnd().isAfter(today);
        
        // TODO: Add WarrantyStatusDTO to VehicleResponseDTO
        // VehicleResponseDTO.WarrantyStatusDTO warrantyStatus = VehicleResponseDTO.WarrantyStatusDTO.builder()
        //         .isUnderWarranty(isUnderWarranty)
        //         .warrantyStart(vehicle.getWarrantyStart())
        //         .warrantyEnd(vehicle.getWarrantyEnd())
        //         .daysRemaining(isUnderWarranty ? 
        //             java.time.temporal.ChronoUnit.DAYS.between(today, vehicle.getWarrantyEnd()) : 0)
        //         .warrantyStatus(isUnderWarranty ? "ACTIVE" : "EXPIRED")
        //         .build();
        
        // response.setWarrantyStatus(warrantyStatus);
        
        log.debug("Retrieved warranty status for vehicle ID: {} - Under warranty: {}", id, isUnderWarranty);
        return response;
    }

    // Helper record for customer creation result
    private record CustomerResult(Customer customer, boolean isNewCustomer) {}
}