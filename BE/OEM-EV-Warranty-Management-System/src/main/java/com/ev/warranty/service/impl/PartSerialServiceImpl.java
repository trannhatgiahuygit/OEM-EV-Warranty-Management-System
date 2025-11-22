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

    // Repository và mapper được inject qua constructor (Lombok @RequiredArgsConstructor)
    // Mục đích: truy xuất, cập nhật thông tin part serial, vehicle, part, và ghi lịch sử thay đổi
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
        // Tạo mới một PartSerial (bản ghi số serial của phụ tùng)
        // - Kiểm tra xem serial number đã tồn tại chưa
        // - Liên kết với Part (kiểm tra tồn tại Part theo partId)
        // - Khởi tạo trạng thái ban đầu là 'in_stock'
        log.info("Creating new part serial: {}", request.getSerialNumber());

        // Nếu serial đã tồn tại -> báo lỗi BadRequest
        if (partSerialRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new BadRequestException("Serial number already exists: " + request.getSerialNumber());
        }

        // Lấy Part (bắt buộc phải tồn tại)
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new NotFoundException("Part not found with ID: " + request.getPartId()));

        // Tạo thực thể PartSerial mới và lưu
        PartSerial partSerial = PartSerial.builder()
                .part(part)
                .serialNumber(request.getSerialNumber())
                .manufactureDate(request.getManufactureDate())
                .status("in_stock") // trạng thái ban đầu khi tạo
                .build();

        partSerial = partSerialRepository.save(partSerial);

        // Tạo bản ghi lịch sử cho hành động 'CREATED' (audit trail)
        createHistoryRecord(partSerial, null, "CREATED", null, "in_stock", null, "Part serial registered in inventory");

        log.info("Part serial created successfully: {}", partSerial.getSerialNumber());
        // Chuyển entity sang DTO để trả về cho client
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    public List<PartSerialDTO> getAvailableSerials(Integer partId) {
        // Trả về danh sách serial có trạng thái 'in_stock' hoặc các serial theo partId
        log.info("Getting available serials for part ID: {}", partId);

        List<PartSerial> serials;
        if (partId != null) {
            // Nếu có param partId -> lọc theo partId
            serials = partSerialRepository.findAvailablePartsByPartId(partId);
        } else {
            // Nếu không có partId -> lấy tất cả serial có status 'in_stock'
            serials = partSerialRepository.findByStatus("in_stock");
        }

        // Map entity sang DTO
        return serials.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PartSerialDTO> getAvailableSerialsByVehicleType(Integer partId, String vehicleType) {
        // Trả về danh sách serial có trạng thái 'in_stock' và part type khớp với vehicle type
        log.info("Getting available serials for part ID: {}, vehicle type: {}", partId, vehicleType);

        List<PartSerial> serials;
        if (partId != null) {
            // Nếu có param partId -> lọc theo partId và part type
            serials = partSerialRepository.findAvailablePartsByPartIdAndType(partId, vehicleType);
        } else {
            // Nếu không có partId -> lấy tất cả serial có status 'in_stock' và part type khớp
            serials = partSerialRepository.findAvailablePartsByPartType(vehicleType);
        }

        // Map entity sang DTO
        return serials.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PartSerialDTO installPartSerial(InstallPartSerialRequestDTO request) {
        // Cài đặt một part serial lên vehicle (installation)
        // - Kiểm tra serial tồn tại
        // - Kiểm tra serial có trạng thái hợp lệ để cài (in_stock hoặc allocated)
        // - Kiểm tra serial chưa được cài trên xe khác
        // - Thay đổi trạng thái thành 'installed', set thông tin vehicle và thời gian
        log.info("Installing part serial {} on vehicle {}", request.getSerialNumber(), request.getVehicleVin());

        PartSerial partSerial = partSerialRepository.findBySerialNumber(request.getSerialNumber())
                .orElseThrow(() -> new NotFoundException("Part serial not found: " + request.getSerialNumber()));

        // Trạng thái chỉ chấp nhận cài nếu đang 'in_stock' hoặc 'allocated'
        if (!"in_stock".equals(partSerial.getStatus()) && !"allocated".equals(partSerial.getStatus())) {
            throw new BadRequestException("Part serial is not available for installation. Current status: " + partSerial.getStatus());
        }

        // Kiểm tra xem serial đã được cài trên xe khác chưa
        // Cho phép nếu đã link với cùng vehicle (từ allocation) và status là allocated
        if (partSerial.getInstalledOnVehicle() != null) {
            boolean isLinkedToSameVehicle = partSerial.getInstalledOnVehicle().getVin().equals(request.getVehicleVin());
            if (!isLinkedToSameVehicle) {
                throw new BadRequestException("Part serial is already installed on vehicle: " +
                        partSerial.getInstalledOnVehicle().getVin());
            }
            // If linked to same vehicle but status is still allocated, allow installation to proceed
            if (isLinkedToSameVehicle && !"allocated".equals(partSerial.getStatus())) {
                throw new BadRequestException("Part serial is already installed on this vehicle with status: " + partSerial.getStatus());
            }
        }

        // Tìm vehicle theo VIN, nếu không tồn tại -> ném NotFoundException
        Vehicle vehicle = vehicleRepository.findByVin(request.getVehicleVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVehicleVin()));

        // Validate part type với vehicle type
        String vehicleType = null;
        if (vehicle.getVehicleModel() != null && vehicle.getVehicleModel().getType() != null) {
            vehicleType = vehicle.getVehicleModel().getType();
        }
        
        if (vehicleType != null && partSerial.getPart() != null && partSerial.getPart().getType() != null) {
            if (!vehicleType.equalsIgnoreCase(partSerial.getPart().getType())) {
                log.warn("Part type {} does not match vehicle type {} for VIN {}", 
                        partSerial.getPart().getType(), vehicleType, vehicle.getVin());
                // Warning only, not blocking - allow installation but log warning
            }
        }

        // Lưu trạng thái cũ để ghi lịch sử
        String oldStatus = partSerial.getStatus();
        // Cập nhật trạng thái và thông tin cài đặt
        partSerial.setStatus("installed");
        partSerial.setInstalledOnVehicle(vehicle);
        partSerial.setInstalledAt(LocalDateTime.now());
        partSerial = partSerialRepository.save(partSerial);

        // Ghi lịch sử thay đổi trạng thái (audit trail) với thông tin workOrder và ghi chú
        createHistoryRecord(partSerial, vehicle, "INSTALLED", oldStatus, "installed",
                request.getWorkOrderId(), request.getNotes());

        log.info("Part serial {} installed successfully on vehicle {}",
                partSerial.getSerialNumber(), vehicle.getVin());
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    @Transactional
    public PartSerialDTO replacePartSerial(ReplacePartSerialRequestDTO request) {
        // Thay thế một part serial đã cài trên xe bằng một serial mới
        // - Kiểm tra vehicle tồn tại
        // - Kiểm tra old serial thực sự đang cài trên vehicle
        // - Kiểm tra new serial tồn tại và có thể dùng (in_stock/allocated)
        // - Kiểm tra cùng loại part giữa old và new
        // - Đặt old serial về trạng thái 'returned' và gỡ cài đặt
        // - Đặt new serial thành 'installed' và gắn lên vehicle
        log.info("Replacing part serial {} with {} on vehicle {}",
                request.getOldSerialNumber(), request.getNewSerialNumber(), request.getVehicleVin());

        Vehicle vehicle = vehicleRepository.findByVin(request.getVehicleVin())
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + request.getVehicleVin()));

        PartSerial oldPartSerial = partSerialRepository.findBySerialNumber(request.getOldSerialNumber())
                .orElseThrow(() -> new NotFoundException("Old part serial not found: " + request.getOldSerialNumber()));

        // Kiểm tra oldPartSerial thực sự cài trên vehicle này
        if (oldPartSerial.getInstalledOnVehicle() == null ||
                !oldPartSerial.getInstalledOnVehicle().getId().equals(vehicle.getId())) {
            throw new BadRequestException("Old part serial is not installed on this vehicle");
        }

        PartSerial newPartSerial = partSerialRepository.findBySerialNumber(request.getNewSerialNumber())
                .orElseThrow(() -> new NotFoundException("New part serial not found: " + request.getNewSerialNumber()));

        // Kiểm tra trạng thái new part có thể cài
        if (!"in_stock".equals(newPartSerial.getStatus()) && !"allocated".equals(newPartSerial.getStatus())) {
            throw new BadRequestException("New part serial is not available. Current status: " + newPartSerial.getStatus());
        }

        // Kiểm tra cùng loại part (cùng Part id)
        if (!oldPartSerial.getPart().getId().equals(newPartSerial.getPart().getId())) {
            throw new BadRequestException("Old and new part serials must be of the same part type");
        }

        // Gỡ cài đặt old serial: lưu trạng thái cũ, đặt trạng thái 'returned', remove vehicle link
        String oldPartOldStatus = oldPartSerial.getStatus();
        oldPartSerial.setStatus("returned");
        oldPartSerial.setInstalledOnVehicle(null);
        oldPartSerial.setInstalledAt(null);
        partSerialRepository.save(oldPartSerial);

        // Ghi lịch sử cho oldPartSerial: hành động REPLACED_OUT
        createHistoryRecord(oldPartSerial, vehicle, "REPLACED_OUT", oldPartOldStatus, "returned",
                request.getWorkOrderId(), "Replaced with: " + request.getNewSerialNumber() + ". Reason: " + request.getReason());

        // Cài đặt new serial: cập nhật trạng thái, set vehicle và thời gian
        String newPartOldStatus = newPartSerial.getStatus();
        newPartSerial.setStatus("installed");
        newPartSerial.setInstalledOnVehicle(vehicle);
        newPartSerial.setInstalledAt(LocalDateTime.now());
        newPartSerial = partSerialRepository.save(newPartSerial);

        // Ghi lịch sử cho newPartSerial: hành động REPLACED_IN
        createHistoryRecord(newPartSerial, vehicle, "REPLACED_IN", newPartOldStatus, "installed",
                request.getWorkOrderId(), "Replaced from: " + request.getOldSerialNumber() + ". Reason: " + request.getReason());

        log.info("Part replacement completed successfully on vehicle {}", vehicle.getVin());
        return partSerialMapper.toDTO(newPartSerial);
    }

    @Override
    @Transactional
    public PartSerialDTO uninstallPartSerial(UninstallPartSerialRequestDTO request) {
        // Gỡ cài đặt một part serial khỏi vehicle
        // - Kiểm tra serial tồn tại
        // - Kiểm tra serial đang ở trạng thái 'installed'
        // - Thay đổi trạng thái thành 'returned' và remove liên kết vehicle
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

        // Ghi lịch sử hành động UNINSTALLED
        createHistoryRecord(partSerial, vehicle, "UNINSTALLED", oldStatus, "returned",
                null, "Reason: " + request.getReason() + ". " + request.getNotes());

        log.info("Part serial {} uninstalled successfully", partSerial.getSerialNumber());
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    public VehiclePartsResponseDTO getVehicleInstalledParts(String vin) {
        // Trả về danh sách các part đã cài lên 1 xe theo VIN, bao gồm cả OEM parts và third-party parts
        log.info("Getting installed parts for vehicle: {}", vin);

        Vehicle vehicle = vehicleRepository.findByVin(vin)
                .orElseThrow(() -> new NotFoundException("Vehicle not found with VIN: " + vin));

        // Lấy danh sách OEM parts hiện đang active (installed) trên vehicle
        List<PartSerial> installedParts = partSerialRepository.findActivePartsByVehicleId(vehicle.getId());
        List<PartSerialDTO> partSerialDTOs = installedParts.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());

        // Lấy danh sách third-party part serials đã cài trên vehicle
        List<com.ev.warranty.model.entity.ThirdPartyPartSerial> thirdPartySerials =
                thirdPartyPartSerialRepository.findByInstalledOnVehicleId(vehicle.getId());
        List<com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO> thirdPartyDTOs = 
                thirdPartySerials.stream()
                        .map(serial -> {
                            // Convert to DTO manually since we don't have access to the mapper here
                            com.ev.warranty.model.entity.ThirdPartyPart part = serial.getThirdPartyPart();
                            return com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO.builder()
                                    .id(serial.getId())
                                    .thirdPartyPartId(part != null ? part.getId() : null)
                                    .serialNumber(serial.getSerialNumber())
                                    .status(serial.getStatus())
                                    .serviceCenterId(serial.getServiceCenterId())
                                    .installedBy(serial.getInstalledBy())
                                    .installedAt(serial.getInstalledAt())
                                    .workOrderId(serial.getWorkOrder() != null ? serial.getWorkOrder().getId() : null)
                                    .vehicleId(vehicle.getId())
                                    .vehicleVin(vehicle.getVin())
                                    // Include part information for display
                                    .partNumber(part != null ? part.getPartNumber() : null)
                                    .partName(part != null ? part.getName() : null)
                                    .category(part != null ? part.getCategory() : null)
                                    .build();
                        })
                        .collect(Collectors.toList());

        int totalParts = partSerialDTOs.size() + thirdPartyDTOs.size();

        // Build response DTO chứa thông tin vehicle và các part đã cài
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
        // Lấy thông tin PartSerial theo serialNumber, nếu không tồn tại -> NotFoundException
        PartSerial partSerial = partSerialRepository.findBySerialNumber(serialNumber)
                .orElseThrow(() -> new NotFoundException("Part serial not found: " + serialNumber));
        return partSerialMapper.toDTO(partSerial);
    }

    @Override
    public List<PartSerialDTO> getPartSerialsByStatus(String status) {
        // Tra cứu danh sách part serial theo trạng thái
        List<PartSerial> serials = partSerialRepository.findByStatus(status);
        return serials.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<PartSerialDTO> getAllPartSerials() {
        // Trả về toàn bộ danh sách part serial (không phân trang)
        List<PartSerial> serials = partSerialRepository.findAll();
        return serials.stream()
                .map(partSerialMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<PartSerialDTO> receivePartSerialsForWorkOrder(ReceivePartSerialForWorkOrderRequestDTO request) {
        // Nhận các part serial về cho một work order: set status -> 'allocated'
        // - Duyệt danh sách partSerialIds trong request
        // - Với mỗi serial: kiểm tra tồn tại và trạng thái phải là 'in_stock'
        // - Cập nhật trạng thái thành 'allocated' và ghi lịch sử
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
        // Tạo một bản ghi lịch sử (PartSerialHistory) để lưu audit trail cho mọi thay đổi trạng thái
        // - Lấy user hiện tại (nếu có) để lưu performedBy
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
        // Lấy thông tin user hiện tại từ SecurityContext
        // Nếu không thể lấy (ví dụ trong test hoặc khi chạy background job), trả về null
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
