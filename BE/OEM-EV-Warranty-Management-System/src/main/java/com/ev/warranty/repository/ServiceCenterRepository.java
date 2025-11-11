package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ServiceCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCenterRepository extends JpaRepository<ServiceCenter, Integer> {
    Optional<ServiceCenter> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<ServiceCenter> findByActiveTrue();
    
    List<ServiceCenter> findByRegion(String region);
    
    List<ServiceCenter> findByParentServiceCenterId(Integer parentId);
    
    List<ServiceCenter> findByParentServiceCenterIsNull(); // Main centers only
    
    List<ServiceCenter> findByIsMainBranchTrue();
    
    List<ServiceCenter> findByIsMainBranchFalse();
    
    @Query("SELECT sc FROM ServiceCenter sc WHERE sc.name LIKE %:search% OR sc.code LIKE %:search% OR sc.location LIKE %:search%")
    List<ServiceCenter> searchByNameOrCodeOrLocation(@Param("search") String search);
    
    List<ServiceCenter> findByNameContainingIgnoreCase(String name);
}

