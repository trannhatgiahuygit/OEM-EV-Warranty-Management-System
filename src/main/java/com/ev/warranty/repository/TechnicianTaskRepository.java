package com.ev.warranty.repository;

import com.ev.warranty.model.entity.TechnicianTask;
import com.ev.warranty.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TechnicianTaskRepository extends JpaRepository<TechnicianTask, Integer> {

    // Tìm tất cả task của một technician
    List<TechnicianTask> findByTechnicianId(Integer technicianId);

    // Tìm task theo status
    List<TechnicianTask> findByTechnicianIdAndStatus(Integer technicianId, String status);

    // Tìm task theo priority
    List<TechnicianTask> findByTechnicianIdAndPriority(Integer technicianId, String priority);

    // Tìm task đã quá hạn
    @Query("SELECT t FROM TechnicianTask t WHERE t.technician.id = :technicianId AND t.estimatedCompletionDate < :currentDate AND t.status != 'COMPLETED'")
    List<TechnicianTask> findOverdueTasks(@Param("technicianId") Integer technicianId, @Param("currentDate") LocalDateTime currentDate);

    // Tìm task theo claim
    List<TechnicianTask> findByClaimId(Integer claimId);

    // Đếm task theo status của technician
    @Query("SELECT COUNT(t) FROM TechnicianTask t WHERE t.technician.id = :technicianId AND t.status = :status")
    Long countTasksByStatus(@Param("technicianId") Integer technicianId, @Param("status") String status);

    // Tìm task trong khoảng thời gian
    @Query("SELECT t FROM TechnicianTask t WHERE t.technician.id = :technicianId AND t.assignedDate BETWEEN :startDate AND :endDate")
    List<TechnicianTask> findTasksInDateRange(@Param("technicianId") Integer technicianId,
                                            @Param("startDate") LocalDateTime startDate,
                                            @Param("endDate") LocalDateTime endDate);
}
