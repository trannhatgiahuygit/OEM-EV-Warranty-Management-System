package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "third_party_part_serials")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThirdPartyPartSerial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "third_party_part_id", nullable = false)
    private ThirdPartyPart thirdPartyPart;

    @Column(name = "serial_number", length = 150, nullable = false, unique = true)
    private String serialNumber;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE, RESERVED, USED, DEACTIVATED

    @Column(name = "service_center_id")
    private Integer serviceCenterId;

    @Column(name = "installed_by", length = 100)
    private String installedBy;

    @Column(name = "installed_at")
    private LocalDateTime installedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id")
    private WorkOrder workOrder; // Optional: used for which work order

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installed_on_vehicle_id")
    private Vehicle installedOnVehicle; // Track which vehicle this serial is installed on

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserved_for_claim_id")
    private Claim reservedForClaim; // Track which claim this serial is reserved for

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

