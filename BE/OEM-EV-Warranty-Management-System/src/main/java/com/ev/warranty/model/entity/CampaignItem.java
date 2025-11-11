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
@Table(name = "campaign_items")
public class CampaignItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private RecallCampaign campaign;

    @Column(name = "item_type", length = 20, nullable = false)
    private String itemType; // PART/SERVICE/SOFTWARE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "part_id")
    private Part part; // nullable

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_item_id")
    private ServiceItem serviceItem; // nullable

    @Column(name = "quantity")
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "default_cost_type", length = 20)
    @Builder.Default
    private String defaultCostType = "WARRANTY";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}


