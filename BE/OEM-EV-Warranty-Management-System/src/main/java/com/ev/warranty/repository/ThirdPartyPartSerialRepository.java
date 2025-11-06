package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ThirdPartyPartSerial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThirdPartyPartSerialRepository extends JpaRepository<ThirdPartyPartSerial, Integer> {
    List<ThirdPartyPartSerial> findByThirdPartyPartIdAndStatus(Integer partId, String status);
    List<ThirdPartyPartSerial> findByThirdPartyPartId(Integer partId); // Get all serials for a part
    Optional<ThirdPartyPartSerial> findBySerialNumber(String serialNumber);
    List<ThirdPartyPartSerial> findByInstalledOnVehicleId(Integer vehicleId);
    long countByThirdPartyPartIdAndStatus(Integer partId, String status); // Count serials by status
    List<ThirdPartyPartSerial> findByReservedForClaimIdAndThirdPartyPartId(Integer claimId, Integer partId); // Find RESERVED serials for a claim and part
    List<ThirdPartyPartSerial> findByReservedForClaimIdAndStatus(Integer claimId, String status); // Find serials by claim and status
}

