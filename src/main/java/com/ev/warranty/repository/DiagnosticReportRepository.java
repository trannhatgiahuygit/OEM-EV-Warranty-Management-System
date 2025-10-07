package com.ev.warranty.repository;

import com.ev.warranty.model.entity.DiagnosticReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiagnosticReportRepository extends JpaRepository<DiagnosticReport, Integer> {

    // Tìm báo cáo theo claim
    Optional<DiagnosticReport> findByClaimId(Integer claimId);

    // Tìm tất cả báo cáo của một technician
    List<DiagnosticReport> findByTechnicianId(Integer technicianId);

    // Tìm báo cáo theo vehicle
    List<DiagnosticReport> findByVehicleId(Integer vehicleId);

    // Tìm báo cáo theo status
    List<DiagnosticReport> findByTechnicianIdAndDiagnosisStatus(Integer technicianId, String diagnosisStatus);

    // Tìm báo cáo theo report number
    Optional<DiagnosticReport> findByReportNumber(String reportNumber);

    // Tìm báo cáo trong khoảng thời gian
    @Query("SELECT d FROM DiagnosticReport d WHERE d.technician.id = :technicianId AND d.diagnosisDate BETWEEN :startDate AND :endDate")
    List<DiagnosticReport> findReportsInDateRange(@Param("technicianId") Integer technicianId,
                                                @Param("startDate") LocalDateTime startDate,
                                                @Param("endDate") LocalDateTime endDate);

    // Đếm báo cáo theo status
    @Query("SELECT COUNT(d) FROM DiagnosticReport d WHERE d.technician.id = :technicianId AND d.diagnosisStatus = :status")
    Long countReportsByStatus(@Param("technicianId") Integer technicianId, @Param("status") String status);
}
