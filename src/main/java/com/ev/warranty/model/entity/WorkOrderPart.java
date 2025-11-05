package com.ev.warranty.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "work_order_parts")
public class WorkOrderPart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id", nullable = false)
    private WorkOrder workOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_serial_id")
    private PartSerial partSerial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id")
    private Part part; // now nullable to allow third-party parts

    @Column(name = "quantity")
    @Builder.Default
    private Integer quantity = 1;

    // ===== NEW: Support third-party parts =====
    @Column(name = "part_source", length = 50)
    @Builder.Default
    private String partSource = "EVM_WAREHOUSE"; // EVM_WAREHOUSE or THIRD_PARTY

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "third_party_part_id")
    private ThirdPartyPart thirdPartyPart; // nullable when source is EVM_WAREHOUSE

    @Column(name = "third_party_serial_number", length = 150)
    private String thirdPartySerialNumber; // free-text S/N when using third-party part
}
