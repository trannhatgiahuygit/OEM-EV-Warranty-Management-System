package com.ev.warranty.service;

import com.ev.warranty.model.dto.TechnicianTaskDto;
import com.ev.warranty.model.entity.TechnicianTask;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.repository.TechnicianTaskRepository;
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
public class TechnicianTaskService {

    private final TechnicianTaskRepository technicianTaskRepository;
    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;

    @Transactional
    public TechnicianTaskDto assignTask(TechnicianTaskDto taskDto, Integer assignedById) {
        User technician = userRepository.findById(taskDto.getTechnicianId())
                .orElseThrow(() -> new NotFoundException("Technician not found"));

        Claim claim = claimRepository.findById(taskDto.getClaimId())
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        User assignedBy = userRepository.findById(assignedById)
                .orElseThrow(() -> new NotFoundException("Assigner not found"));

        TechnicianTask task = TechnicianTask.builder()
                .technician(technician)
                .claim(claim)
                .assignedBy(assignedBy)
                .taskType(taskDto.getTaskType())
                .status("ASSIGNED")
                .priority(taskDto.getPriority())
                .description(taskDto.getDescription())
                .estimatedHours(taskDto.getEstimatedHours())
                .estimatedCompletionDate(taskDto.getEstimatedCompletionDate())
                .assignedDate(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        TechnicianTask savedTask = technicianTaskRepository.save(task);
        return convertToDto(savedTask);
    }

    @Transactional
    public TechnicianTaskDto updateTaskStatus(Integer taskId, String status, String notes) {
        TechnicianTask task = technicianTaskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        task.setStatus(status);
        task.setWorkNotes(notes);
        task.setUpdatedAt(LocalDateTime.now());

        if ("IN_PROGRESS".equals(status) && task.getStartedDate() == null) {
            task.setStartedDate(LocalDateTime.now());
        } else if ("COMPLETED".equals(status)) {
            task.setCompletedDate(LocalDateTime.now());
            task.setCompletionNotes(notes);
        }

        TechnicianTask updatedTask = technicianTaskRepository.save(task);
        return convertToDto(updatedTask);
    }

    @Transactional
    public TechnicianTaskDto updateActualHours(Integer taskId, Double actualHours) {
        TechnicianTask task = technicianTaskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        task.setActualHours(actualHours);
        task.setUpdatedAt(LocalDateTime.now());

        TechnicianTask updatedTask = technicianTaskRepository.save(task);
        return convertToDto(updatedTask);
    }

    public List<TechnicianTaskDto> getTasksByTechnician(Integer technicianId) {
        List<TechnicianTask> tasks = technicianTaskRepository.findByTechnicianId(technicianId);
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<TechnicianTaskDto> getTasksByStatus(Integer technicianId, String status) {
        List<TechnicianTask> tasks = technicianTaskRepository.findByTechnicianIdAndStatus(technicianId, status);
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<TechnicianTaskDto> getOverdueTasks(Integer technicianId) {
        List<TechnicianTask> tasks = technicianTaskRepository.findOverdueTasks(technicianId, LocalDateTime.now());
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public List<TechnicianTaskDto> getTasksByClaim(Integer claimId) {
        List<TechnicianTask> tasks = technicianTaskRepository.findByClaimId(claimId);
        return tasks.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    public Long getTaskCountByStatus(Integer technicianId, String status) {
        return technicianTaskRepository.countTasksByStatus(technicianId, status);
    }

    private TechnicianTaskDto convertToDto(TechnicianTask task) {
        return TechnicianTaskDto.builder()
                .id(task.getId())
                .technicianId(task.getTechnician().getId())
                .technicianName(task.getTechnician().getFullname())
                .claimId(task.getClaim().getId())
                .claimNumber(task.getClaim().getClaimNumber())
                .vehicleVin(task.getClaim().getVehicle().getVin())
                .customerName(task.getClaim().getCustomer().getFullname())
                .taskType(task.getTaskType())
                .status(task.getStatus())
                .priority(task.getPriority())
                .description(task.getDescription())
                .workNotes(task.getWorkNotes())
                .completionNotes(task.getCompletionNotes())
                .assignedDate(task.getAssignedDate())
                .startedDate(task.getStartedDate())
                .completedDate(task.getCompletedDate())
                .estimatedCompletionDate(task.getEstimatedCompletionDate())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
