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
    private BigDecimal unitCost; // Base price, used if regional prices not provided
    private Integer quantity; // Available quantity in stock
    private Integer serviceCenterId;
    private Boolean active;
    
    // Regional pricing (optional - if not provided, unitCost will be used for all regions)
    private BigDecimal northPrice;   // Price for NORTH region
    private BigDecimal southPrice;    // Price for SOUTH region
    private BigDecimal centralPrice;  // Price for CENTRAL region
}

