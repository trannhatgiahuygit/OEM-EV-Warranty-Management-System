package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "vin", length = 50, nullable = false, unique = true)
    private String vin;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "year")
    private Integer year;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "registration_date")
    private LocalDate registrationDate;

    @Column(name = "warranty_start")
    private LocalDate warrantyStart;

    @Column(name = "warranty_end")
    private LocalDate warrantyEnd;

    @Column(name = "mileage_km", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer mileageKm;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
