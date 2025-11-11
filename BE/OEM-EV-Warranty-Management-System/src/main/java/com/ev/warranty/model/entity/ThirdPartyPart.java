package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "third_party_parts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThirdPartyPart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "part_number", length = 100, nullable = false, unique = true)
    private String partNumber;

    @Column(name = "name", columnDefinition = "NVARCHAR(200)", nullable = false)
    private String name;

    @Column(name = "category", columnDefinition = "NVARCHAR(100)")
    private String category;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "supplier", columnDefinition = "NVARCHAR(200)")
    private String supplier;

    @Column(name = "unit_cost", precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "quantity")
    @Builder.Default
    private Integer quantity = 0; // Available quantity in stock

    @Column(name = "service_center_id")
    private Integer serviceCenterId;

    @Column(name = "active")
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}

