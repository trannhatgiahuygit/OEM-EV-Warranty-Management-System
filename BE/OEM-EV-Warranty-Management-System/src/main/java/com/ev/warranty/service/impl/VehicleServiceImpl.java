package com.ev.warranty.service.impl;

import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.exception.ValidationException;
import com.ev.warranty.mapper.VehicleMapper;
import com.ev.warranty.model.dto.vehicle.VehicleRegisterRequestDTO;
import com.ev.warranty.model.dto.vehicle.VehicleResponseDTO;
import com.ev.warranty.model.dto.vehicle.WarrantyCheckResultDTO;
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
        // Ghi log bắt đầu quá trình đăng ký xe
        // Các bước chính:
        // 1) validate đầy đủ các trường của request (VIN, ngày đăng ký, dữ liệu customer, parts,...)
        // 2) lấy customer nếu tồn tại hoặc tạo mới nếu cần
        // 3) tính ngày bắt đầu/kết thúc bảo hành (sử dụng model liên kết nếu có)
        // 4) tạo entity Vehicle, lưu vào DB
        // 5) xử lý các part được cài đặt ở nhà máy (ghi PartSerial)
        // 6) build DTO phản hồi kèm metadata (ai đăng ký, có phải customer mới không, tổng part,...)
        // Nếu có lỗi validate sẽ ném ValidationException; nếu reference không tồn tại sẽ ném NotFoundException.

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
        // Tìm vehicle theo VIN và chuyển sang DTO để trả về.
        // Phương thức trả về Optional để caller biết nếu không tìm thấy sẽ không ném exception ở đây.
        return vehicleRepository.findByVin(vin)
                .map(vehicleMapper::toResponseDTO);
    }

    @Override
    public Optional<VehicleResponseDTO> findById(Integer id) {
        // Tìm vehicle theo id (primary key) và map sang DTO.
        // Trả về Optional để caller có thể xử lý trường hợp không tồn tại.
        return vehicleRepository.findById(id)
                .map(vehicleMapper::toResponseDTO);
    }

    @Override
    public List<VehicleResponseDTO> findByCustomerId(Integer customerId) {
        // Lấy danh sách vehicle của 1 customer theo customerId, sắp xếp theo createdAt giảm dần,
        // rồi map từng entity sang DTO để trả về cho client.
        List<Vehicle> vehicles = vehicleRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return vehicles.stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponseDTO> findAllVehicles() {
        // Lấy tất cả vehicles trong hệ thống và map sang DTO.
        // Thường dùng cho mục đích admin hoặc trang quản trị.
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return vehicles.stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<VehicleResponseDTO> findAllVehicles(String vehicleType) {
        // Lấy vehicles theo loại xe (vehicleType) và map sang DTO.
        // vehicleType có thể là: CAR, EBIKE, SCOOTER, MOTORBIKE, TRUCK, etc.
        if (vehicleType == null || vehicleType.trim().isEmpty()) {
            return findAllVehicles();
        }
        
        // Normalize vehicleType to uppercase for consistent matching
        String normalizedType = vehicleType.trim().toUpperCase();
        
        // Map frontend values to database values
        // ELECTRIC_CAR -> CAR (frontend có thể gửi ELECTRIC_CAR)
        String dbType = mapVehicleTypeToDatabase(normalizedType);
        log.info("Finding vehicles - Input: '{}', Mapped to DB: '{}'", normalizedType, dbType);
        
        List<Vehicle> vehicles = vehicleRepository.findByVehicleType(dbType);
        log.info("Found {} vehicles in database with type: {}", vehicles.size(), dbType);
        
        List<VehicleResponseDTO> result = vehicles.stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
        
        // Verify all returned vehicles have the correct type
        long countWithCorrectType = result.stream()
                .filter(v -> dbType.equals(v.getVehicleType()))
                .count();
        log.info("Verified {} vehicles have vehicleType = {}", countWithCorrectType, dbType);
        
        return result;
    }
    
    /**
     * Map frontend vehicle type values to database values
     * @param vehicleType Input vehicle type from frontend
     * @return Normalized vehicle type for database query
     */
    private String mapVehicleTypeToDatabase(String vehicleType) {
        if (vehicleType == null) {
            return null;
        }
        
        // Map common frontend values to database values
        switch (vehicleType.toUpperCase()) {
            case "ELECTRIC_CAR":
            case "ELECTRICCAR":
            case "Ô TÔ ĐIỆN":  // Vietnamese
            case "OTO DIEN":
                return "CAR";
            case "XE ĐẠP ĐIỆN":  // Vietnamese
            case "XE DAP DIEN":
            case "E-BIKE":
            case "EBIKE":
                return "EBIKE";
            case "XE TAY GA":  // Vietnamese
            case "XE TAYGA":
            case "SCOOTER":
                return "SCOOTER";
            case "XE MÁY":  // Vietnamese
            case "XE MAY":
            case "MOTORBIKE":
            case "MOTORCYCLE":
                return "MOTORBIKE";
            case "XE TẢI":  // Vietnamese
            case "XE TAI":
            case "TRUCK":
                return "TRUCK";
            default:
                // Return as-is if already in correct format (CAR, EBIKE, etc.)
                return vehicleType;
        }
    }

    @Override
    public boolean isVinExists(String vin) {
        // Kiểm tra VIN đã tồn tại trong DB hay chưa, trả về true nếu đã có.
        // Dùng để validate trước khi tạo vehicle mới.
        return vehicleRepository.existsByVin(vin);
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private void validateVehicleRegistration(VehicleRegisterRequestDTO request) {
        // Kiểm tra hợp lệ cho toàn bộ request trước khi tạo vehicle:
        // - VIN phải unique
        // - Chỉ cung cấp 1 trong 2: customerId hoặc customerInfo (không cả hai)
        // - Phải cung cấp ít nhất 1 trong 2: customerId hoặc customerInfo
        // - Ngày đăng ký không được lớn hơn ngày hiện tại và không quá 2 năm về trước
        // - Ngày bắt đầu bảo hành (nếu có) không được trước ngày đăng ký
        // - Kiểm tra các part serial (nếu có) bằng validatePartSerials
        // - Bắt buộc chọn vehicleModelId (một quy tắc nghiệp vụ mới)
        // Nếu bất kỳ điều kiện nào fail sẽ ném ValidationException hoặc NotFoundException phù hợp.

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

        // Enforce using predefined model id
        if (request.getVehicleModelId() == null) {
            throw new ValidationException("Xe mới phải chọn từ mẫu có sẵn (vehicleModelId)");
        }
        
        // Validate part serials uniqueness and part type compatibility
        if (request.getInstalledParts() != null && !request.getInstalledParts().isEmpty()) {
            validatePartSerials(request.getInstalledParts(), request.getVehicleModelId());
        }
    }

    // validatePartSerials with installedAt validation and part type validation
    private void validatePartSerials(List<VehicleRegisterRequestDTO.PartSerialDTO> partSerials, Integer vehicleModelId) {
        // Duyệt từng partSerial được gửi lên và thực hiện các kiểm tra sau:
        // - Part reference phải tồn tại (partId hợp lệ)
        // - Part type phải khớp với vehicle type
        // - Serial number phải là duy nhất trên toàn hệ thống
        // - Ngày sản xuất (manufactureDate) nếu có thì không được ở tương lai và không quá 3 năm trước
        // - Ngày lắp đặt (installedAt) nếu có thì: không ở tương lai, không trước manufactureDate,
        //   và không quá 3 năm trước (hạn chế dữ liệu quá cũ)
        // Mục đích: tránh lưu các serial trùng lặp hoặc dữ liệu ngày không hợp lệ gây lỗi nghiệp vụ.

        // Get vehicle model to check type
        VehicleModel vehicleModel = null;
        String vehicleType = null;
        if (vehicleModelId != null) {
            vehicleModel = vehicleModelRepository.findById(vehicleModelId)
                    .orElseThrow(() -> new NotFoundException("VehicleModel not found with ID: " + vehicleModelId));
            vehicleType = vehicleModel.getType();
        }

        for (VehicleRegisterRequestDTO.PartSerialDTO partSerial : partSerials) {
            // Check if part exists
            Part part = partRepository.findById(partSerial.getPartId())
                    .orElseThrow(() -> new NotFoundException("Part not found with ID: " + partSerial.getPartId()));
            
            // Validate part type matches vehicle type
            if (vehicleType != null && part.getType() != null) {
                if (!vehicleType.equalsIgnoreCase(part.getType())) {
                    throw new ValidationException(
                            String.format("Part type '%s' does not match vehicle type '%s'. Part ID: %d, Part: %s",
                                    part.getType(), vehicleType, part.getId(), part.getName()));
                }
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
        // Nếu request có customerId => lấy customer tồn tại từ DB, trả về không tạo mới.
        // Nếu không có customerId => tạo mới customer từ customerInfo, kiểm tra email unique nếu có,
        // và set createdBy là user thực hiện thao tác (được tìm theo username registeredBy).
        // Trả về CustomerResult chứa customer và cờ isNewCustomer để thông tin meta.

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
        // Hàm tính ngày kết thúc bảo hành dựa trên model (business rule):
        // - Một số model cao cấp có thời hạn 5 năm, các model chuẩn mặc định 3 năm.
        // - Trả về warrantyStart + số năm tương ứng.

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
        // Tạo entity Vehicle từ dữ liệu request và customer:
        // - Chuẩn hoá VIN, license plate thành uppercase
        // - Gán model, year, ngày đăng ký, ngày bảo hành, mileage (mặc định 0 nếu null)
        // - Không lưu ở đây, hàm này chỉ trả về object để caller lưu.

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
        // Nếu có danh sách part do nhà máy cài đặt thì:
        // - Lấy thông tin Part từ DB theo partId
        // - Tạo PartSerial cho mỗi part với các thông tin: serialNumber (uppercase), manufactureDate,
        //   status = "installed", liên kết với vehicle, và installedAt theo input
        // - Lưu PartSerial vào DB
        // Mục đích: ghi nhận các part đã cài sẵn lên xe khi xuất xưởng.

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
        // Thêm thông tin metadata vào DTO trả về:
        // - Đánh dấu khách hàng có phải mới tạo hay không
        // - Tạo RegistrationSummaryDTO chứa: ai đăng ký, tổng part đã lắp, chu kỳ bảo hành ở dạng text,
        //   và trạng thái đăng ký (COMPLETED)
        // - Gắn summary vào response để client hiển thị thông tin tóm tắt.

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
        // Chuyển đổi khoảng thời gian bảo hành thành chuỗi mô tả (ví dụ "3 years").
        // Nếu start hoặc end null thì trả về "Unknown".

        if (start == null || end == null) {
            return "Unknown";
        }

        long years = java.time.temporal.ChronoUnit.YEARS.between(start, end);
        return years + " year" + (years != 1 ? "s" : "");
    }

    @Override
    @Transactional
    public VehicleResponseDTO updateMileage(Integer id, Integer mileage, String updatedBy) {
        // Cập nhật odometer (mileage) cho vehicle:
        // - Tìm vehicle theo id, nếu không tồn tại thì ném NotFoundException
        // - Kiểm tra mileage không âm và không giảm so với giá trị hiện tại
        // - Cập nhật updatedAt và updatedBy rồi lưu
        // - Trả về DTO sau khi cập nhật

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
        // Lấy vehicle và build DTO để trả về thông tin trạng thái bảo hành.
        // Hiện tại hàm tính xem còn trong bảo hành hay không (isUnderWarranty) nhưng chưa gắn
        // WarrantyStatusDTO vào response (TODO) - phần này để dành mở rộng.

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

    @Override
    public WarrantyCheckResultDTO checkWarrantyCondition(Integer vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with ID: " + vehicleId));
        VehicleModel model = vehicle.getVehicleModel();
        if (model == null) {
            return new WarrantyCheckResultDTO(false, "Không tìm thấy thông tin mẫu xe.");
        }
        // Kiểm tra số km
        if (model.getWarrantyMilageLimit() != null && vehicle.getMileageKm() > model.getWarrantyMilageLimit()) {
            return new WarrantyCheckResultDTO(false, "Số km vượt quá giới hạn bảo hành của mẫu xe (" + model.getWarrantyMilageLimit() + " km).");
        }
        // Kiểm tra thời hạn bảo hành
        if (model.getWarrantyPeriodMonths() != null && vehicle.getWarrantyStart() != null) {
            LocalDate expiredDate = vehicle.getWarrantyStart().plusMonths(model.getWarrantyPeriodMonths());
            if (LocalDate.now().isAfter(expiredDate)) {
                return new WarrantyCheckResultDTO(false, "Thời hạn bảo hành đã hết (hết hạn ngày " + expiredDate + ").");
            }
        }
        return new WarrantyCheckResultDTO(true, "Xe vẫn trong điều kiện bảo hành.");
    }

    // Helper record for customer creation result
    private record CustomerResult(Customer customer, boolean isNewCustomer) {}
}
