package com.ev.warranty.repository;

import com.ev.warranty.model.entity.RepairProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RepairProgressRepository extends JpaRepository<RepairProgress, Integer> {

    // Tìm tất cả tiến độ sửa chữa theo claim
    List<RepairProgress> findByClaimIdOrderByCreatedAtAsc(Integer claimId);

    // Tìm tiến độ sửa chữa theo technician
    List<RepairProgress> findByTechnicianId(Integer technicianId);

    // Tìm tiến độ theo status
    List<RepairProgress> findByTechnicianIdAndStatus(Integer technicianId, String status);

    // Tìm tiến độ theo progress step
    List<RepairProgress> findByClaimIdAndProgressStep(Integer claimId, String progressStep);

    // Tìm tiến độ hiện tại của claim (step cuối cùng)
    @Query("SELECT r FROM RepairProgress r WHERE r.claim.id = :claimId ORDER BY r.createdAt DESC")
    List<RepairProgress> findLatestProgressByClaimId(@Param("claimId") Integer claimId);

    // Tính tổng giờ làm việc của technician trong khoảng thời gian
    @Query("SELECT SUM(r.hoursSpent) FROM RepairProgress r WHERE r.technician.id = :technicianId AND r.startTime BETWEEN :startDate AND :endDate")
    Double getTotalHoursWorked(@Param("technicianId") Integer technicianId,
                              @Param("startDate") LocalDateTime startDate,
                              @Param("endDate") LocalDateTime endDate);

    // Đếm số bước hoàn thành của claim
    @Query("SELECT COUNT(r) FROM RepairProgress r WHERE r.claim.id = :claimId AND r.status = 'COMPLETED'")
    Long countCompletedStepsByClaimId(@Param("claimId") Integer claimId);
}
