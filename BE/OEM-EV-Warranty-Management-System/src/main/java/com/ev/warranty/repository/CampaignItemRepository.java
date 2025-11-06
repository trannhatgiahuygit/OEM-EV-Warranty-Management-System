package com.ev.warranty.repository;

import com.ev.warranty.model.entity.CampaignItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignItemRepository extends JpaRepository<CampaignItem, Integer> {
    List<CampaignItem> findByCampaignId(Integer campaignId);
}


