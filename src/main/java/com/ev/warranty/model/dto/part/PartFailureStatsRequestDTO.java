package com.ev.warranty.model.dto.part;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PartFailureStatsRequestDTO {

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    // Optional filters
    private List<String> partCategories;     // BATTERY, MOTOR, ELECTRONICS, etc.
    private List<String> partNumbers;        // Specific part numbers
    private List<String> vehicleModels;      // Filter by vehicle models
    private List<Integer> vehicleYears;      // Filter by vehicle years
    private String groupBy;                  // PART, CATEGORY, MONTH, QUARTER
    private Boolean includeRecalls;          // Include recall-related failures
    private Integer minFailureCount;         // Minimum failure count threshold
    private String sortBy;                   // FAILURE_COUNT, FAILURE_RATE, COST_IMPACT
    private String sortDirection;            // ASC, DESC
}