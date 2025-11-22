package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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

    @Column(name = "part_number", length = 100, nullable = false, unique = true)
    private String partNumber;

    @Column(name = "name", length = 200, nullable = false)
    private String name;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "type", length = 50)
    @Builder.Default
    private String type = "CAR"; // CAR, MOTORCYCLE, SCOOTER, EBIKE, etc.

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit_cost", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;
}
