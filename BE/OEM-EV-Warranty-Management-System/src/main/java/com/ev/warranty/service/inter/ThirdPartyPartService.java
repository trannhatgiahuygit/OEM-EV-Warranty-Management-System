package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.thirdparty.ReserveSerialsRequestDTO;
import com.ev.warranty.model.dto.thirdparty.ReserveSerialsResponseDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO;

import java.util.List;

public interface ThirdPartyPartService {
    List<ThirdPartyPartDTO> getPartsByServiceCenter(Integer serviceCenterId);
    List<ThirdPartyPartDTO> getPartsByServiceCenterWithRegionalPrices(Integer serviceCenterId, String region);
    ThirdPartyPartDTO createPart(ThirdPartyPartDTO dto, String createdBy);
    ThirdPartyPartDTO updatePart(Integer id, ThirdPartyPartDTO dto, String updatedBy);
    void deletePart(Integer id);

    ThirdPartyPartSerialDTO addSerial(Integer partId, String serialNumber, String addedBy);
    List<ThirdPartyPartSerialDTO> getAvailableSerials(Integer partId);
    List<ThirdPartyPartSerialDTO> getAllSerials(Integer partId); // Get all serials including deactivated
    void markSerialAsUsed(Integer serialId, Integer workOrderId, String installedBy);
    
    // Install third-party part serial on vehicle (deducts quantity and tracks vehicle)
    ThirdPartyPartSerialDTO installSerialOnVehicle(Integer serialId, String vehicleVin, Integer workOrderId, String installedBy);
    
    // Deactivate a serial (sets status to DEACTIVATED and decrements quantity)
    ThirdPartyPartSerialDTO deactivateSerial(Integer serialId, String updatedBy);
    
    // Activate a deactivated serial (sets status to AVAILABLE and increments quantity)
    ThirdPartyPartSerialDTO activateSerial(Integer serialId, String updatedBy);
    
    // Delete a serial (only if AVAILABLE, decrements quantity)
    void deleteSerial(Integer serialId, String updatedBy);
    
    // Update a serial number (only if AVAILABLE or DEACTIVATED, validates uniqueness)
    ThirdPartyPartSerialDTO updateSerial(Integer serialId, String newSerialNumber, String updatedBy);
    
    // Recalculate quantity based on AVAILABLE serials count
    void recalculateQuantity(Integer partId, String updatedBy);
    
    // Reverse sync: Update third-party part when catalog prices are updated
    void syncFromCatalogPrice(Integer partId, String updatedBy);
    
    // Reserve serials for a claim (assigns and reserves available serials)
    ReserveSerialsResponseDTO reserveSerialsForClaim(ReserveSerialsRequestDTO request, String reservedBy);
    
    // Check availability of serials for third-party parts
    ReserveSerialsResponseDTO checkSerialAvailability(ReserveSerialsRequestDTO request);
    
    // Release reserved serials for a claim and part (makes them AVAILABLE again)
    void releaseReservedSerials(Integer claimId, Integer partId, String releasedBy);
}

