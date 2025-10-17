package com.ev.warranty.model.dto.appointment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppointmentCreateRequestDTO {

    @NotNull(message = "Vehicle ID is required")
    private Integer vehicleId;

    private Integer claimId; // Optional - có thể null nếu không liên quan đến claim (ví dụ: bảo dưỡng định kỳ)

    @NotNull(message = "Scheduled time is required")
    @Future(message = "Appointment must be scheduled in the future")
    private LocalDateTime scheduledAt;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    @Builder.Default
    private Boolean notifyCustomer = true; // user muốn thông báo cho khách hàng không
}