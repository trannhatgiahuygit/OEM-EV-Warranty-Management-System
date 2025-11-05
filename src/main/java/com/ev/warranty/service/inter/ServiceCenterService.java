package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.servicecenter.ServiceCenterRequestDTO;
import com.ev.warranty.model.dto.servicecenter.ServiceCenterResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ServiceCenterService {
    /**
     * Get all service centers
     */
    List<ServiceCenterResponseDTO> getAllServiceCenters();
    
    /**
     * Get all service centers with pagination
     */
    Page<ServiceCenterResponseDTO> getAllServiceCenters(Pageable pageable);
    
    /**
     * Get service center by ID
     */
    ServiceCenterResponseDTO getServiceCenterById(Integer id);
    
    /**
     * Get service center by code
     */
    ServiceCenterResponseDTO getServiceCenterByCode(String code);
    
    /**
     * Create new service center
     */
    ServiceCenterResponseDTO createServiceCenter(ServiceCenterRequestDTO request, String createdBy);
    
    /**
     * Update service center
     */
    ServiceCenterResponseDTO updateServiceCenter(Integer id, ServiceCenterRequestDTO request, String updatedBy);
    
    /**
     * Delete service center (soft delete by setting active = false)
     */
    void deleteServiceCenter(Integer id);
    
    /**
     * Get all main service centers (not branches)
     */
    List<ServiceCenterResponseDTO> getMainServiceCenters();
    
    /**
     * Get all branches of a service center
     */
    List<ServiceCenterResponseDTO> getBranchesByServiceCenterId(Integer parentId);
    
    /**
     * Get active service centers only
     */
    List<ServiceCenterResponseDTO> getActiveServiceCenters();
    
    /**
     * Search service centers by name, code, or location
     */
    List<ServiceCenterResponseDTO> searchServiceCenters(String searchTerm);
    
    /**
     * Get service centers by region
     */
    List<ServiceCenterResponseDTO> getServiceCentersByRegion(String region);
}

