package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "parts")
public class Part {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String partNumber;

    @Column(nullable = false)
    private String partName;

    @Column
    private String description;

    @Column(nullable = false)
    private String category; // ENGINE, BATTERY, MOTOR, BRAKE, SUSPENSION, etc.

    @Column
    private String serialNumber;

    @Column
    private Double price;

    @Column
    private String supplier;

    @Column
    private Integer warrantyPeriodMonths;

    @Column
    private String status; // AVAILABLE, OUT_OF_STOCK, DISCONTINUED, RECALLED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle installedVehicle; // Vehicle where this part is installed

    @Column
    private LocalDateTime installationDate;

    @Column
    private LocalDateTime manufacturingDate;

    @Column
    private LocalDateTime receivedDate;

    @Column
    private Integer stockQuantity;

    @Column
    private Integer minimumStock;

    @OneToMany(mappedBy = "part", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ServiceHistory> serviceHistories;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
