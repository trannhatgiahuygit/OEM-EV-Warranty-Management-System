package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_models")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", length = 50, unique = true, nullable = false)
    private String code; // e.g., EV-X-PRO-2024

    @Column(name = "name", columnDefinition = "NVARCHAR(150)", nullable = false)
    private String name; // Marketing name

    @Column(name = "brand", columnDefinition = "NVARCHAR(100)")
    private String brand; // OEM brand

    @Column(name = "type", columnDefinition = "NVARCHAR(50)")
    private String type; // Loại xe: SCOOTER, MOTORBIKE, CAR, TRUCK, etc.

    @Column(name = "description", columnDefinition = "NVARCHAR(1000)")
    private String description;

    @Column(name = "warranty_milage_limit")
    private Integer warrantyMilageLimit; // Số km tối đa được bảo hành

    @Column(name = "warranty_period_months")
    private Integer warrantyPeriodMonths; // Thời hạn bảo hành (tháng)

    @Column(name = "active", nullable = false)
    private Boolean active;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
