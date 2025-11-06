package com.ev.warranty.model.dto.thirdparty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThirdPartyPartSerialDTO {
    private Integer id;
    private Integer thirdPartyPartId;
    private String serialNumber;
    private String status;
    private Integer serviceCenterId;
    private String installedBy;
    private LocalDateTime installedAt;
    private Integer workOrderId;
}

