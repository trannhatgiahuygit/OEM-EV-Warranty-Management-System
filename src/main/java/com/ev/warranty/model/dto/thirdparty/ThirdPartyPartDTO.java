package com.ev.warranty.model.dto.thirdparty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThirdPartyPartDTO {
    private Integer id;
    private String partNumber;
    private String name;
    private String category;
    private String description;
    private String supplier;
    private BigDecimal unitCost;
    private Integer serviceCenterId;
    private Boolean active;
}

