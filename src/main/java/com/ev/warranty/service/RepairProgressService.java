package com.ev.warranty.service;

import com.ev.warranty.model.dto.RepairProgressDto;
import com.ev.warranty.model.entity.RepairProgress;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.repository.RepairProgressRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RepairProgressService {

    private final RepairProgressRepository repairProgressRepository;
    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;

    @Transactional
    public RepairProgressDto createRepairProgress(RepairProgressDto progressDto) {
        User technician = userRepository.findById(progressDto.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician not found"));

        Claim claim = claimRepository.findById(progressDto.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        RepairProgress progress = RepairProgress.builder()
                .claim(claim)
                .technician(technician)
                .progressStep(progressDto.getProgressStep())
                .status("IN_PROGRESS")
                .description(progressDto.getDescription())
                .workPerformed(progressDto.getWorkPerformed())
                .issues(progressDto.getIssues())
                .notes(progressDto.getNotes())
                .hoursSpent(progressDto.getHoursSpent())
                .startTime(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        RepairProgress savedProgress = repairProgressRepository.save(progress);
        return convertToDto(savedProgress);
    }

    @Transactional
    public RepairProgressDto updateRepairProgress(Integer progressId, RepairProgressDto progressDto) {
        RepairProgress progress = repairProgressRepository.findById(progressId)
                .orElseThrow(() -> new NotFoundException("Repair progress not found"));

        progress.setProgressStep(progressDto.getProgressStep());
        progress.setStatus(progressDto.getStatus());
        progress.setDescription(progressDto.getDescription());
        progress.setWorkPerformed(progressDto.getWorkPerformed());
        progress.setIssues(progressDto.getIssues());
        progress.setNotes(progressDto.getNotes());
        progress.setHoursSpent(progressDto.getHoursSpent());
        progress.setUpdatedAt(LocalDateTime.now());

        if ("COMPLETED".equals(progressDto.getStatus()) && progress.getEndTime() == null) {
            progress.setEndTime(LocalDateTime.now());
        }

        RepairProgress updatedProgress = repairProgressRepository.save(progress);
        return convertToDto(updatedProgress);
    }

    @Transactional
    public RepairProgressDto completeProgressStep(Integer progressId, String completionNotes) {
        RepairProgress progress = repairProgressRepository.findById(progressId)
                .orElseThrow(() -> new NotFoundException("Repair progress not found"));

        progress.setStatus("COMPLETED");
        progress.setNotes(completionNotes);
        progress.setEndTime(LocalDateTime.now());
        progress.setUpdatedAt(LocalDateTime.now());

        RepairProgress updatedProgress = repairProgressRepository.save(progress);
        return convertToDto(updatedProgress);
    }

    public List<RepairProgressDto> getProgressByClaim(Integer claimId) {
        List<RepairProgress> progressList = repairProgressRepository.findByClaimIdOrderByCreatedAtAsc(claimId);
        return progressList.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<RepairProgressDto> getProgressByTechnician(Integer technicianId) {
        List<RepairProgress> progressList = repairProgressRepository.findByTechnicianId(technicianId);
        return progressList.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<RepairProgressDto> getProgressByStatus(Integer technicianId, String status) {
        List<RepairProgress> progressList = repairProgressRepository.findByTechnicianIdAndStatus(technicianId, status);
        return progressList.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public RepairProgressDto getLatestProgress(Integer claimId) {
        List<RepairProgress> progressList = repairProgressRepository.findLatestProgressByClaimId(claimId);
        if (progressList.isEmpty()) {
            throw new NotFoundException("No repair progress found for claim");
        }
        return convertToDto(progressList.get(0));
    }

    public Double getTotalHoursWorked(Integer technicianId, LocalDateTime startDate, LocalDateTime endDate) {
        Double totalHours = repairProgressRepository.getTotalHoursWorked(technicianId, startDate, endDate);
        return totalHours != null ? totalHours : 0.0;
    }

    public Long getCompletedStepsCount(Integer claimId) {
        return repairProgressRepository.countCompletedStepsByClaimId(claimId);
    }

    @Transactional
    public RepairProgressDto startProgressStep(Integer claimId, String progressStep, Integer technicianId, String description) {
        RepairProgressDto progressDto = RepairProgressDto.builder()
                .claimId(claimId)
                .technicianId(technicianId)
                .progressStep(progressStep)
                .description(description)
                .build();

        return createRepairProgress(progressDto);
    }

    private RepairProgressDto convertToDto(RepairProgress progress) {
        return RepairProgressDto.builder()
                .id(progress.getId())
                .claimId(progress.getClaim().getId())
                .claimNumber(progress.getClaim().getClaimNumber())
                .technicianId(progress.getTechnician().getId())
                .technicianName(progress.getTechnician().getFullname())
                .progressStep(progress.getProgressStep())
                .status(progress.getStatus())
                .description(progress.getDescription())
                .workPerformed(progress.getWorkPerformed())
                .issues(progress.getIssues())
                .notes(progress.getNotes())
                .hoursSpent(progress.getHoursSpent())
                .startTime(progress.getStartTime())
                .endTime(progress.getEndTime())
                .createdAt(progress.getCreatedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}
