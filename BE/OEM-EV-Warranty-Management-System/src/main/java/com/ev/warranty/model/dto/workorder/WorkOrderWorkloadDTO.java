package com.ev.warranty.model.dto.workorder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrderWorkloadDTO {
    
    private Integer technicianId;
    private String technicianName;
    private String technicianEmail;
    
    // Current workload
    private Integer totalActiveWorkOrders;
    private Integer totalCompletedWorkOrders;
    private Integer totalWorkOrders;
    
    // Work orders by status
    private Integer pendingWorkOrders;
    private Integer inProgressWorkOrders;
    private Integer completedWorkOrders;
    private Integer cancelledWorkOrders;
    
    // Performance metrics
    private Double averageCompletionTimeHours;
    private Integer totalPartsUsed;
    private Double averagePartsPerWorkOrder;
    
    // Recent activity
    private LocalDateTime lastWorkOrderCreated;
    private LocalDateTime lastWorkOrderCompleted;
    
    // Work orders list (optional, for detailed view)
    private List<WorkOrderSummaryDTO> activeWorkOrders;
    private List<WorkOrderSummaryDTO> recentCompletedWorkOrders;
    
    // Capacity information
    private Integer maxCapacity;
    private Integer currentLoad;
    private Double capacityUtilization;
    private Boolean canTakeNewWorkOrder;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkOrderSummaryDTO {
        private Integer id;
        private String workOrderNumber;
        private String status;
        private String priority;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime completedAt;
        private String vehicleVin;
        private String customerName;
        private String description;
        private Integer estimatedHours;
        private Integer actualHours;
    }
}
