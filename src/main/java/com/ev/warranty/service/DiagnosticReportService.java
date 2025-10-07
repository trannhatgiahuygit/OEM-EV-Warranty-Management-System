package com.ev.warranty.service;

import com.ev.warranty.model.dto.DiagnosticReportDto;
import com.ev.warranty.model.entity.DiagnosticReport;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.Vehicle;
import com.ev.warranty.repository.DiagnosticReportRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.VehicleRepository;
import com.ev.warranty.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiagnosticReportService {

    private final DiagnosticReportRepository diagnosticReportRepository;
    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final VehicleRepository vehicleRepository;

    @Transactional
    public DiagnosticReportDto createDiagnosticReport(DiagnosticReportDto reportDto) {
        User technician = userRepository.findById(reportDto.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician not found"));

        Claim claim = claimRepository.findById(reportDto.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        Vehicle vehicle = vehicleRepository.findById(reportDto.getVehicleId())
                .orElseThrow(() -> new NotFoundException("Vehicle not found"));

        String reportNumber = generateReportNumber();

        DiagnosticReport report = DiagnosticReport.builder()
                .claim(claim)
                .technician(technician)
                .vehicle(vehicle)
                .reportNumber(reportNumber)
                .symptomDescription(reportDto.getSymptomDescription())
                .visualInspection(reportDto.getVisualInspection())
                .diagnosticResults(reportDto.getDiagnosticResults())
                .troubleCodes(reportDto.getTroubleCodes())
                .rootCauseAnalysis(reportDto.getRootCauseAnalysis())
                .recommendedActions(reportDto.getRecommendedActions())
                .diagnosisStatus("IN_PROGRESS")
                .currentMileage(reportDto.getCurrentMileage())
                .batteryStatus(reportDto.getBatteryStatus())
                .motorStatus(reportDto.getMotorStatus())
                .controllerStatus(reportDto.getControllerStatus())
                .chargingSystemStatus(reportDto.getChargingSystemStatus())
                .additionalNotes(reportDto.getAdditionalNotes())
                .diagnosisDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        DiagnosticReport savedReport = diagnosticReportRepository.save(report);
        return convertToDto(savedReport);
    }

    @Transactional
    public DiagnosticReportDto updateDiagnosticReport(Integer reportId, DiagnosticReportDto reportDto) {
        DiagnosticReport report = diagnosticReportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Diagnostic report not found"));

        report.setSymptomDescription(reportDto.getSymptomDescription());
        report.setVisualInspection(reportDto.getVisualInspection());
        report.setDiagnosticResults(reportDto.getDiagnosticResults());
        report.setTroubleCodes(reportDto.getTroubleCodes());
        report.setRootCauseAnalysis(reportDto.getRootCauseAnalysis());
        report.setRecommendedActions(reportDto.getRecommendedActions());
        report.setDiagnosisStatus(reportDto.getDiagnosisStatus());
        report.setCurrentMileage(reportDto.getCurrentMileage());
        report.setBatteryStatus(reportDto.getBatteryStatus());
        report.setMotorStatus(reportDto.getMotorStatus());
        report.setControllerStatus(reportDto.getControllerStatus());
        report.setChargingSystemStatus(reportDto.getChargingSystemStatus());
        report.setAdditionalNotes(reportDto.getAdditionalNotes());
        report.setUpdatedAt(LocalDateTime.now());

        DiagnosticReport updatedReport = diagnosticReportRepository.save(report);
        return convertToDto(updatedReport);
    }

    @Transactional
    public DiagnosticReportDto completeDiagnosis(Integer reportId, String finalResults) {
        DiagnosticReport report = diagnosticReportRepository.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Diagnostic report not found"));

        report.setDiagnosticResults(finalResults);
        report.setDiagnosisStatus("COMPLETED");
        report.setUpdatedAt(LocalDateTime.now());

        DiagnosticReport updatedReport = diagnosticReportRepository.save(report);
        return convertToDto(updatedReport);
    }

    public DiagnosticReportDto getReportByClaim(Integer claimId) {
        DiagnosticReport report = diagnosticReportRepository.findByClaimId(claimId)
                .orElseThrow(() -> new NotFoundException("Diagnostic report not found for claim"));
        return convertToDto(report);
    }

    public List<DiagnosticReportDto> getReportsByTechnician(Integer technicianId) {
        List<DiagnosticReport> reports = diagnosticReportRepository.findByTechnicianId(technicianId);
        return reports.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<DiagnosticReportDto> getReportsByVehicle(Integer vehicleId) {
        List<DiagnosticReport> reports = diagnosticReportRepository.findByVehicleId(vehicleId);
        return reports.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<DiagnosticReportDto> getReportsByStatus(Integer technicianId, String status) {
        List<DiagnosticReport> reports = diagnosticReportRepository.findByTechnicianIdAndDiagnosisStatus(technicianId, status);
        return reports.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public DiagnosticReportDto getReportByNumber(String reportNumber) {
        DiagnosticReport report = diagnosticReportRepository.findByReportNumber(reportNumber)
                .orElseThrow(() -> new NotFoundException("Diagnostic report not found"));
        return convertToDto(report);
    }

    private String generateReportNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "DR-" + timestamp;
    }

    private DiagnosticReportDto convertToDto(DiagnosticReport report) {
        return DiagnosticReportDto.builder()
                .id(report.getId())
                .claimId(report.getClaim().getId())
                .claimNumber(report.getClaim().getClaimNumber())
                .technicianId(report.getTechnician().getId())
                .technicianName(report.getTechnician().getFullname())
                .vehicleId(report.getVehicle().getId())
                .vehicleVin(report.getVehicle().getVin())
                .reportNumber(report.getReportNumber())
                .symptomDescription(report.getSymptomDescription())
                .visualInspection(report.getVisualInspection())
                .diagnosticResults(report.getDiagnosticResults())
                .troubleCodes(report.getTroubleCodes())
                .rootCauseAnalysis(report.getRootCauseAnalysis())
                .recommendedActions(report.getRecommendedActions())
                .diagnosisStatus(report.getDiagnosisStatus())
                .currentMileage(report.getCurrentMileage())
                .batteryStatus(report.getBatteryStatus())
                .motorStatus(report.getMotorStatus())
                .controllerStatus(report.getControllerStatus())
                .chargingSystemStatus(report.getChargingSystemStatus())
                .additionalNotes(report.getAdditionalNotes())
                .diagnosisDate(report.getDiagnosisDate())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
