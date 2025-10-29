package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.technician.TechnicianProfileDTO;
import com.ev.warranty.model.entity.TechnicianProfile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class TechnicianProfileMapper {

    /**
     * Convert TechnicianProfile Entity to DTO
     * @param entity TechnicianProfile entity
     * @return TechnicianProfileDTO
     */
    public TechnicianProfileDTO toDTO(TechnicianProfile entity) {
        if (entity == null) {
            return null;
        }

        TechnicianProfileDTO dto = new TechnicianProfileDTO();

        // Profile info
        dto.setId(entity.getId());

        // User information
        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
            dto.setUsername(entity.getUser().getUsername());
            dto.setFullName(entity.getUser().getFullName());
            dto.setEmail(entity.getUser().getEmail());
            dto.setPhone(entity.getUser().getPhone());
        }

        // Assignment info
        dto.setAssignmentStatus(entity.getAssignmentStatus());
        dto.setCurrentWorkload(entity.getCurrentWorkload());
        dto.setMaxWorkload(entity.getMaxWorkload());
        dto.setRemainingCapacity(entity.getRemainingCapacity());
        dto.setWorkloadPercentage(entity.getWorkloadPercentage());

        // Specialization info
        dto.setSpecialization(entity.getSpecialization());
        dto.setCertificationLevel(entity.getCertificationLevel());

        // Performance stats
        dto.setTotalCompletedWorkOrders(entity.getTotalCompletedWorkOrders());
        dto.setAverageCompletionHours(entity.getAverageCompletionHours());

        // Availability
        dto.setAvailableFrom(entity.getAvailableFrom());
        dto.setCanTakeMoreWork(entity.canTakeMoreWork());
        dto.setIsAvailable(entity.isAvailable());

        // Timestamps
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        return dto;
    }

    /**
     * Convert DTO to TechnicianProfile Entity (for creation)
     * Note: User must be set separately
     * @param dto TechnicianProfileDTO
     * @return TechnicianProfile entity
     */
    public TechnicianProfile toEntity(TechnicianProfileDTO dto) {
        if (dto == null) {
            return null;
        }

        TechnicianProfile entity = new TechnicianProfile();

        // Assignment info (with defaults)
        entity.setAssignmentStatus(dto.getAssignmentStatus() != null ? dto.getAssignmentStatus() : "AVAILABLE");
        entity.setCurrentWorkload(dto.getCurrentWorkload() != null ? dto.getCurrentWorkload() : 0);
        entity.setMaxWorkload(dto.getMaxWorkload() != null ? dto.getMaxWorkload() : 5);

        // Specialization info
        entity.setSpecialization(dto.getSpecialization());
        entity.setCertificationLevel(dto.getCertificationLevel());

        // Performance stats (with defaults)
        entity.setTotalCompletedWorkOrders(dto.getTotalCompletedWorkOrders() != null ? dto.getTotalCompletedWorkOrders() : 0);
        entity.setAverageCompletionHours(dto.getAverageCompletionHours() != null ? dto.getAverageCompletionHours() : 0.0);

        // Availability
        entity.setAvailableFrom(dto.getAvailableFrom());

        return entity;
    }

    /**
     * Update existing entity from DTO (for updates)
     * Only updates non-null fields from DTO
     * @param entity Existing TechnicianProfile entity
     * @param dto TechnicianProfileDTO with updated values
     */
    public void updateEntityFromDTO(TechnicianProfile entity, TechnicianProfileDTO dto) {
        if (entity == null || dto == null) {
            return;
        }

        // Assignment info
        if (dto.getAssignmentStatus() != null) {
            entity.setAssignmentStatus(dto.getAssignmentStatus());
        }
        if (dto.getCurrentWorkload() != null) {
            entity.setCurrentWorkload(dto.getCurrentWorkload());
        }
        if (dto.getMaxWorkload() != null) {
            entity.setMaxWorkload(dto.getMaxWorkload());
        }

        // Specialization info
        if (dto.getSpecialization() != null) {
            entity.setSpecialization(dto.getSpecialization());
        }
        if (dto.getCertificationLevel() != null) {
            entity.setCertificationLevel(dto.getCertificationLevel());
        }

        // Performance stats
        if (dto.getTotalCompletedWorkOrders() != null) {
            entity.setTotalCompletedWorkOrders(dto.getTotalCompletedWorkOrders());
        }
        if (dto.getAverageCompletionHours() != null) {
            entity.setAverageCompletionHours(dto.getAverageCompletionHours());
        }

        // Availability
        if (dto.getAvailableFrom() != null) {
            entity.setAvailableFrom(dto.getAvailableFrom());
        }
    }

    /**
     * Convert list of entities to list of DTOs
     * @param entities List of TechnicianProfile entities
     * @return List of TechnicianProfileDTOs
     */
    public List<TechnicianProfileDTO> toDTOList(List<TechnicianProfile> entities) {
        if (entities == null) {
            return null;
        }
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
