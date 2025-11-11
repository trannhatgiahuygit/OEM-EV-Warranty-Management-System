package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "service_centers")
public class ServiceCenter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", length = 50, unique = true, nullable = false)
    private String code; // e.g., SC-HCM-001

    @Column(name = "name", columnDefinition = "NVARCHAR(200)", nullable = false)
    private String name;

    @Column(name = "location", columnDefinition = "NVARCHAR(500)")
    private String location;

    @Column(name = "address", columnDefinition = "NVARCHAR(MAX)")
    private String address;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "manager_name", columnDefinition = "NVARCHAR(150)")
    private String managerName;

    @Column(name = "region", length = 100)
    private String region; // NORTH, SOUTH, CENTRAL, etc.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_service_center_id")
    private ServiceCenter parentServiceCenter; // For branch relationships

    @Column(name = "is_main_branch", nullable = false)
    @Builder.Default
    private Boolean isMainBranch = false; // true if this is a main center, false if branch

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "capacity", columnDefinition = "INT DEFAULT 0")
    private Integer capacity; // Number of vehicles it can service per day

    @Column(name = "notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    // Self-referencing relationship for branches
    @OneToMany(mappedBy = "parentServiceCenter", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<ServiceCenter> branches;
}

