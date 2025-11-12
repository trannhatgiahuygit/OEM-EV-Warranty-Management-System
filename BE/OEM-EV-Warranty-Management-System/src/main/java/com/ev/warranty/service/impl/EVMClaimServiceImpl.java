package com.ev.warranty.service.impl;


import com.ev.warranty.exception.NotFoundException;
import com.ev.warranty.mapper.ClaimMapper;
import com.ev.warranty.mapper.EVMClaimMapper;
import com.ev.warranty.model.dto.claim.*;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.ClaimStatus;
import com.ev.warranty.model.entity.ClaimStatusHistory;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.ClaimStatusRepository;
import com.ev.warranty.repository.ClaimStatusHistoryRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.inter.EVMClaimService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EVMClaimServiceImpl implements EVMClaimService {

    private final ClaimRepository claimRepository;
    private final EVMClaimMapper evmClaimMapper;
    private final ClaimMapper claimMapper;
    private final ClaimStatusRepository claimStatusRepository;
    private final ClaimStatusHistoryRepository claimStatusHistoryRepository;
    private final UserRepository userRepository;
    private final com.ev.warranty.repository.ClaimItemRepository claimItemRepository;
    private final com.ev.warranty.repository.InventoryRepository inventoryRepository;
    private final com.ev.warranty.service.inter.PartSerialService partSerialService;

    @Override
    public ClaimResponseDto approveClaim(Integer claimId, EVMApprovalRequestDTO request, String evmStaffUsername) {
        // Ghi log thông tin thao tác bắt đầu
        log.info("EVM Staff {} approving claim ID: {}", evmStaffUsername, claimId);

        // Tải claim từ DB, nếu không tồn tại thì ném NotFoundException
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));

        // Xử lý idempotent: nếu claim không đang ở trạng thái chờ EVM duyệt thì trả về trạng thái hiện tại
        String currentStatus = claim.getStatus().getCode();
        if (!"PENDING_EVM_APPROVAL".equals(currentStatus)) {
            // Nếu đã được duyệt trước đó thì trả về claim hiện tại
            if ("EVM_APPROVED".equals(currentStatus)) {
                log.info("Claim {} already EVM_APPROVED – returning existing state", claimId);
                return claimMapper.toResponseDto(claim);
            }
            // Nếu đang ở trạng thái khác (ví dụ đã bị từ chối), không thực hiện thay đổi, trả về hiện tại
            log.info("Claim {} not pending approval (status: {}), returning existing state without changes", claimId, currentStatus);
            return claimMapper.toResponseDto(claim);
        }

        // Tìm user (EVM staff) thực hiện hành động
        User evmStaff = userRepository.findByUsername(evmStaffUsername)
                .orElseThrow(() -> new NotFoundException("EVM Staff not found: " + evmStaffUsername));

        // Lấy đối tượng ClaimStatus tương ứng với mã EVM_APPROVED
        ClaimStatus approvedStatus = claimStatusRepository.findByCode("EVM_APPROVED")
                .orElseThrow(() -> new NotFoundException("EVM Approved status not found"));

        // Cập nhật các trường liên quan tới việc duyệt
        claim.setStatus(approvedStatus);
        claim.setApprovedAt(LocalDateTime.now());
        claim.setApprovedBy(evmStaff);
        claim.setWarrantyCost(request.getWarrantyCost());
        claim.setCompanyPaidCost(request.getCompanyPaidCost()); // Lưu chi phí hãng thanh toán

        // Lấy các phụ tùng cần cho claim (nếu có) để kiểm tra tồn kho
        List<com.ev.warranty.model.entity.ClaimItem> warrantyParts = claimItemRepository.findWarrantyPartsByClaimId(claimId);

        boolean allAvailable = true;
        if (warrantyParts == null || warrantyParts.isEmpty()) {
            // Nếu không có phụ tùng cần thay thế thì coi là đủ phụ tùng
            // (không cần gán lại allAvailable vì đã khởi tạo true ở trên)
        } else {
            // Duyệt từng item để kiểm tra tổng tồn - tổng đặt trước
            for (var item : warrantyParts) {
                Integer partId = item.getPart() != null ? item.getPart().getId() : null;
                if (partId == null) continue; // bỏ qua item không hợp lệ
                long totalStock = inventoryRepository.getTotalStockByPartId(partId) != null ? inventoryRepository.getTotalStockByPartId(partId) : 0L;
                long totalReserved = inventoryRepository.getTotalReservedStockByPartId(partId) != null ? inventoryRepository.getTotalReservedStockByPartId(partId) : 0L;
                long available = totalStock - totalReserved;
                if (available < item.getQuantity()) {
                    // Nếu bất kỳ part nào không đủ số lượng thì đánh dấu không đủ và dừng
                    allAvailable = false;
                    break;
                }
            }
        }

        // Nếu đủ phụ tùng, thực hiện 'soft reservation' trên kho mặc định (warehouse id = 1)
        if (allAvailable && warrantyParts != null && !warrantyParts.isEmpty()) {
            for (var item : warrantyParts) {
                Integer partId = item.getPart() != null ? item.getPart().getId() : null;
                if (partId == null) continue;
                var optInv = inventoryRepository.findByPartIdAndWarehouseId(partId, 1);
                if (optInv.isEmpty()) { allAvailable = false; break; }
                var inv = optInv.get();
                int free = inv.getCurrentStock() - inv.getReservedStock();
                if (free < item.getQuantity()) { allAvailable = false; break; }
                // Tăng reservedStock để giữ số lượng cho việc sửa chữa sau này
                inv.setReservedStock(inv.getReservedStock() + item.getQuantity());
                inventoryRepository.save(inv);
            }
        }

        // Xác định trạng thái tiếp theo dựa trên việc có đủ phụ tùng hay không
        String nextStatusCode = allAvailable ? "READY_FOR_REPAIR" : "WAITING_FOR_PARTS";
        ClaimStatus nextStatus = claimStatusRepository.findByCode(nextStatusCode)
                .orElseThrow(() -> new NotFoundException(nextStatusCode + " status not found"));

        // Cập nhật trạng thái claim tới trạng thái tiếp theo
        claim.setStatus(nextStatus);

        // Lưu claim đã được cập nhật vào CSDL
        Claim savedClaim = claimRepository.save(claim);

        // Ghi lịch sử thay đổi trạng thái: lần duyệt (EVM_APPROVED) và trạng thái tiếp theo
        logStatusChange(savedClaim, approvedStatus, evmStaff.getId().longValue(), request.getApprovalNotes());
        logStatusChange(savedClaim, nextStatus, evmStaff.getId().longValue(), allAvailable ? "Approved - parts available" : "Approved - waiting for parts");

        // Nếu client gửi kèm thông tin gán serial của parts lên xe, gọi service tương ứng để gắn serial
        if (request.getPartAssignments() != null && !request.getPartAssignments().isEmpty()) {
            String vehicleVin = claim.getVehicle().getVin();
            log.info("Assigning {} parts to vehicle {}", request.getPartAssignments().size(), vehicleVin);

            for (var assignment : request.getPartAssignments()) {
                try {
                    if (assignment.getSerialNumber() != null && !assignment.getSerialNumber().isEmpty()) {
                        // Chuẩn bị DTO và gọi service gắn serial lên xe
                        com.ev.warranty.model.dto.part.InstallPartSerialRequestDTO installRequest =
                                com.ev.warranty.model.dto.part.InstallPartSerialRequestDTO.builder()
                                        .serialNumber(assignment.getSerialNumber())
                                        .vehicleVin(vehicleVin)
                                        .notes(assignment.getNotes() != null ? assignment.getNotes() :
                                                "Assigned during EVM approval for claim " + claim.getClaimNumber())
                                        .build();

                        partSerialService.installPartSerial(installRequest);
                        log.info("Part serial {} assigned to vehicle {}", assignment.getSerialNumber(), vehicleVin);
                    }
                } catch (Exception e) {
                    // Nếu việc gán một serial thất bại, chỉ log lỗi và tiếp tục với phần còn lại
                    log.error("Failed to assign part serial {} to vehicle {}: {}",
                            assignment.getSerialNumber(), vehicleVin, e.getMessage());
                }
            }
        }

        log.info("Claim {} approved and set to {} by EVM Staff {}", claimId, nextStatusCode, evmStaffUsername);
        return claimMapper.toResponseDto(savedClaim);
    }

    @Override
    public ClaimResponseDto rejectClaim(Integer claimId, EVMRejectionRequestDTO request, String evmStaffUsername) {
        // Ghi log thao tác từ chối
        log.info("EVM Staff {} rejecting claim ID: {}", evmStaffUsername, claimId);

        // Tải claim, nếu không có thì ném NotFound
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));

        // Xử lý idempotent: nếu claim không đang ở trạng thái chờ duyệt thì trả về hiện tại
        String currentStatus = claim.getStatus().getCode();
        if (!"PENDING_EVM_APPROVAL".equals(currentStatus)) {
            // Nếu đã bị từ chối rồi thì trả về như cũ
            if ("EVM_REJECTED".equals(currentStatus)) {
                log.info("Claim {} already EVM_REJECTED – returning existing state", claimId);
                return claimMapper.toResponseDto(claim);
            }
            // Nếu ở trạng thái khác (đã duyệt hoặc khác), trả về hiện tại mà không thay đổi
            log.info("Claim {} not pending approval (status: {}), returning existing state without changes", claimId, currentStatus);
            return claimMapper.toResponseDto(claim);
        }

        // Tìm EVM staff thực hiện hành động
        User evmStaff = userRepository.findByUsername(evmStaffUsername)
                .orElseThrow(() -> new NotFoundException("EVM Staff not found: " + evmStaffUsername));

        // Lấy status EVM_REJECTED
        ClaimStatus rejectedStatus = claimStatusRepository.findByCode("EVM_REJECTED")
                .orElseThrow(() -> new NotFoundException("EVM Rejected status not found"));

        // Cập nhật thông tin từ chối lên claim
        claim.setStatus(rejectedStatus);
        claim.setRejectedBy(evmStaff);
        claim.setRejectedAt(LocalDateTime.now());
        // Ghi chi tiết lý do từ chối nếu có
        claim.setRejectionReason(request.getRejectionReason());
        claim.setRejectionNotes(request.getRejectionNotes());
        Integer rejCount = claim.getRejectionCount() == null ? 0 : claim.getRejectionCount();
        claim.setRejectionCount(rejCount + 1);
        // Nếu là từ chối cuối cùng thì khóa không cho nộp lại
        if (Boolean.TRUE.equals(request.getIsFinalRejection())) {
            claim.setCanResubmit(false);
        }

        // Lưu claim sau khi cập nhật
        Claim savedClaim = claimRepository.save(claim);

        // Ghi lịch sử trạng thái từ chối
        logStatusChange(savedClaim, rejectedStatus, evmStaff.getId().longValue(), request.getRejectionNotes());

        log.info("Claim {} rejected successfully by EVM Staff {}", claimId, evmStaffUsername);
        return claimMapper.toResponseDto(savedClaim);
    }

    @Override
    public ClaimResponseDto getClaimForReview(Integer claimId) {
        // Lấy claim để hiển thị review, ném NotFound nếu không tồn tại
        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found with ID: " + claimId));

        return claimMapper.toResponseDto(claim);
    }

    @Override
    public Page<EVMClaimSummaryDTO> getPendingClaims() {
        // Tạo filter mặc định để lấy các claim đang chờ EVM duyệt
        EVMClaimFilterRequestDTO filter = new EVMClaimFilterRequestDTO();
        filter.setStatusCodes(List.of("PENDING_EVM_APPROVAL"));
        filter.setPage(0);
        filter.setSize(20); // Kích thước trang mặc định
        return getAllClaims(filter);
    }

    @Override
    public Page<EVMClaimSummaryDTO> getPendingClaims(EVMClaimFilterRequestDTO filter) {
        log.info("Getting pending claims awaiting EVM approval");
        // Ép filter chỉ lấy các claim đang chờ duyệt
        filter.setStatusCodes(List.of("PENDING_EVM_APPROVAL"));
        return getAllClaims(filter);
    }

    @Override
    public Page<EVMClaimSummaryDTO> getAllClaims(EVMClaimFilterRequestDTO filter) {
        log.info("EVM: Getting all warranty claims with filters - statusCodes: {}, cost range: {}-{}, search: {}",
                filter.getStatusCodes(), filter.getMinWarrantyCost(), filter.getMaxWarrantyCost(), filter.getSearchKeyword());

        // Xây dựng Specification động dựa trên filter
        Specification<Claim> specification = buildClaimSpecification(filter);

        // Xây dựng sort và pagination
        Sort sort = buildSort(filter.getSortBy(), filter.getSortDirection());
        PageRequest pageable = PageRequest.of(filter.getPage(), filter.getSize(), sort);

        // Thực thi truy vấn với specification
        Page<Claim> claimsPage = claimRepository.findAll(specification, pageable);

        // Chuyển đổi sang DTO tóm tắt cho EVM
        List<EVMClaimSummaryDTO> evmClaims = evmClaimMapper.toEVMSummaryDTOList(claimsPage.getContent());

        log.info("EVM: Retrieved {} claims out of {} total", evmClaims.size(), claimsPage.getTotalElements());

        return new PageImpl<>(evmClaims, pageable, claimsPage.getTotalElements());
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * Xây dựng JPA Specification động dựa trên các tiêu chí trong filter
     * Giúp tránh nổ tung số lượng phương thức query khi có nhiều điều kiện.
     */
    private Specification<Claim> buildClaimSpecification(EVMClaimFilterRequestDTO filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo trạng thái (sử dụng code trong bảng claim_status)
            if (filter.getStatusCodes() != null && !filter.getStatusCodes().isEmpty()) {
                predicates.add(root.get("status").get("code").in(filter.getStatusCodes()));
                log.debug("Added status filter: {}", filter.getStatusCodes());
            }

            // 2. Lọc theo khoảng ngày tạo
            if (filter.getCreatedFrom() != null) {
                LocalDateTime startOfDay = filter.getCreatedFrom().atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startOfDay));
                log.debug("Added createdFrom filter: {}", startOfDay);
            }

            if (filter.getCreatedTo() != null) {
                LocalDateTime endOfDay = filter.getCreatedTo().atTime(23, 59, 59);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endOfDay));
                log.debug("Added createdTo filter: {}", endOfDay);
            }

            // 3. Lọc theo khoảng ngày duyệt
            if (filter.getApprovedFrom() != null) {
                LocalDateTime startOfDay = filter.getApprovedFrom().atStartOfDay();
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("approvedAt"), startOfDay));
            }

            if (filter.getApprovedTo() != null) {
                LocalDateTime endOfDay = filter.getApprovedTo().atTime(23, 59, 59);
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("approvedAt"), endOfDay));
            }

            // 4. Lọc theo khoảng chi phí bảo hành (hữu ích cho EVM kiểm soát ngân sách)
            if (filter.getMinWarrantyCost() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(
                        root.get("warrantyCost"), filter.getMinWarrantyCost()));
                log.debug("Added minCost filter: {}", filter.getMinWarrantyCost());
            }

            if (filter.getMaxWarrantyCost() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(
                        root.get("warrantyCost"), filter.getMaxWarrantyCost()));
                log.debug("Added maxCost filter: {}", filter.getMaxWarrantyCost());
            }

            // 5. Lọc theo mẫu xe (phục vụ phân tích chất lượng)
            if (filter.getVehicleModels() != null && !filter.getVehicleModels().isEmpty()) {
                predicates.add(root.get("vehicle").get("model").in(filter.getVehicleModels()));
                log.debug("Added vehicle model filter: {}", filter.getVehicleModels());
            }

            // 6. Lọc theo năm xe
            if (filter.getVehicleYears() != null && !filter.getVehicleYears().isEmpty()) {
                predicates.add(root.get("vehicle").get("year").in(filter.getVehicleYears()));
            }

            // 7. Lọc theo service center / người tạo / kỹ thuật viên được giao
            if (filter.getCreatedByUserIds() != null && !filter.getCreatedByUserIds().isEmpty()) {
                predicates.add(root.get("createdBy").get("id").in(filter.getCreatedByUserIds()));
            }

            if (filter.getAssignedTechnicianIds() != null && !filter.getAssignedTechnicianIds().isEmpty()) {
                predicates.add(root.get("assignedTechnician").get("id").in(filter.getAssignedTechnicianIds()));
            }

            // 8. Tìm kiếm theo từ khóa trên nhiều trường (số claim, VIN, tên khách hàng, mô tả lỗi)
            if (filter.getSearchKeyword() != null && !filter.getSearchKeyword().trim().isEmpty()) {
                String keyword = "%" + filter.getSearchKeyword().toLowerCase() + "%";

                Predicate claimNumberPredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("claimNumber")), keyword);
                Predicate vinPredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("vehicle").get("vin")), keyword);
                Predicate customerNamePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("customer").get("name")), keyword);
                Predicate reportedFailurePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("reportedFailure")), keyword);

                predicates.add(criteriaBuilder.or(
                        claimNumberPredicate, vinPredicate, customerNamePredicate, reportedFailurePredicate));

                log.debug("Added search keyword filter: {}", filter.getSearchKeyword());
            }

            // Kết hợp tất cả predicate bằng AND
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    // Xây dựng đối tượng Sort dựa trên tham số từ client
    private Sort buildSort(String sortBy, String sortDirection) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ?
                Sort.Direction.ASC : Sort.Direction.DESC;

        // Map tên trường được yêu cầu sang thuộc tính entity tương ứng
        String entityProperty = switch (sortBy) {
            case "warrantyCost" -> "warrantyCost";
            case "status" -> "status.code";
            case "createdAt" -> "createdAt";
            case "approvedAt" -> "approvedAt";
            default -> "createdAt"; // Sắp xếp mặc định
        };

        log.debug("Sorting by: {} {}", entityProperty, direction);
        return Sort.by(direction, entityProperty);
    }

    // Ghi lịch sử thay đổi trạng thái của claim
    private void logStatusChange(Claim claim, ClaimStatus newStatus, Long userId, String notes) {
        // Tìm user theo id (nếu không tìm thấy thì để null)
        User user = userRepository.findById(userId.intValue())
                .orElse(null);

        ClaimStatusHistory history = new ClaimStatusHistory();
        history.setClaim(claim);
        history.setStatus(newStatus);
        history.setChangedAt(LocalDateTime.now());
        history.setChangedBy(user);
        history.setNote(notes);

        // Lưu lịch sử thay đổi trạng thái
        claimStatusHistoryRepository.save(history);
    }
}
