package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartDTO;
import com.ev.warranty.model.dto.thirdparty.ThirdPartyPartSerialDTO;

import java.util.List;

public interface ThirdPartyPartService {
    List<ThirdPartyPartDTO> getPartsByServiceCenter(Integer serviceCenterId);
    ThirdPartyPartDTO createPart(ThirdPartyPartDTO dto, String createdBy);
    ThirdPartyPartDTO updatePart(Integer id, ThirdPartyPartDTO dto, String updatedBy);
    void deletePart(Integer id);

    ThirdPartyPartSerialDTO addSerial(Integer partId, String serialNumber, String addedBy);
    List<ThirdPartyPartSerialDTO> getAvailableSerials(Integer partId);
    void markSerialAsUsed(Integer serialId, Integer workOrderId, String installedBy);
}

