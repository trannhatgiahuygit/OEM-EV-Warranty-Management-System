package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "part_serials")
public class PartSerial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id", nullable = false)
    private Part part;

    @Column(name = "serial_number", length = 150, nullable = false, unique = true)
    private String serialNumber;

    @Column(name = "manufacture_date")
    private LocalDate manufactureDate;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "in_stock"; // in_stock / allocated / installed / returned

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installed_on_vehicle_id")
    private Vehicle installedOnVehicle;

    @Column(name = "installed_at")
    private LocalDateTime installedAt;
}
