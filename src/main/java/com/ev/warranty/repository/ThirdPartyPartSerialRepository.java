package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ThirdPartyPartSerial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThirdPartyPartSerialRepository extends JpaRepository<ThirdPartyPartSerial, Integer> {
    List<ThirdPartyPartSerial> findByThirdPartyPartIdAndStatus(Integer partId, String status);
    Optional<ThirdPartyPartSerial> findBySerialNumber(String serialNumber);
}

