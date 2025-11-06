package com.ev.warranty.model.dto.recall;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RecallCampaignCreateRequestDTO {

    @NotBlank(message = "Campaign code is required")
    @Size(max = 100, message = "Campaign code cannot exceed 100 characters")
    private String code;

    @NotBlank(message = "Campaign title is required")
    @Size(max = 200, message = "Campaign title cannot exceed 200 characters")
    private String title;

    @NotBlank(message = "Campaign description is required")
    private String description;

    @NotNull(message = "Release date is required")
    private LocalDateTime releasedAt;

    @Builder.Default
    private String status = "draft"; // draft, active, completed, cancelled

    // Vehicle criteria for the recall
    private List<String> affectedModels;
    private List<Integer> affectedYears;
    private String vinRangeStart;
    private String vinRangeEnd;
    private LocalDateTime manufactureDateStart;
    private LocalDateTime manufactureDateEnd;

    // Action required
    private String actionRequired; // inspection, replacement, software_update, etc.
    private String priority; // low, medium, high, critical
    private Integer estimatedDurationDays;
}
