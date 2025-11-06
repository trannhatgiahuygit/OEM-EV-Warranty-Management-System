package com.ev.warranty.mapper;

import com.ev.warranty.model.dto.catalog.*;
import com.ev.warranty.model.entity.CatalogPrice;
import com.ev.warranty.model.entity.ServiceItem;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ServiceCatalogMapper {

    public ServiceItemResponseDTO toServiceItemResponseDTO(ServiceItem serviceItem) {
        return ServiceItemResponseDTO.builder()
                .id(serviceItem.getId())
                .serviceCode(serviceItem.getServiceCode())
                .name(serviceItem.getName())
                .description(serviceItem.getDescription())
                .standardLaborHours(serviceItem.getStandardLaborHours())
                .category(serviceItem.getCategory())
                .active(serviceItem.getActive())
                .createdAt(serviceItem.getCreatedAt())
                .updatedAt(serviceItem.getUpdatedAt())
                .build();
    }

    public CatalogPriceResponseDTO toCatalogPriceResponseDTO(CatalogPrice catalogPrice) {
        LocalDate today = LocalDate.now();
        boolean isCurrentlyEffective = !catalogPrice.getEffectiveFrom().isAfter(today) &&
                (catalogPrice.getEffectiveTo() == null || !catalogPrice.getEffectiveTo().isBefore(today));

        Integer daysUntilExpiry = null;
        if (catalogPrice.getEffectiveTo() != null) {
            daysUntilExpiry = (int) java.time.temporal.ChronoUnit.DAYS.between(today, catalogPrice.getEffectiveTo());
        }

        return CatalogPriceResponseDTO.builder()
                .id(catalogPrice.getId())
                .itemType(catalogPrice.getItemType())
                .itemId(catalogPrice.getItemId())
                .price(catalogPrice.getPrice())
                .currency(catalogPrice.getCurrency())
                .region(catalogPrice.getRegion())
                .serviceCenterId(catalogPrice.getServiceCenterId())
                .effectiveFrom(catalogPrice.getEffectiveFrom())
                .effectiveTo(catalogPrice.getEffectiveTo())
                .createdAt(catalogPrice.getCreatedAt())
                .updatedAt(catalogPrice.getUpdatedAt())
                .isCurrentlyEffective(isCurrentlyEffective)
                .daysUntilExpiry(daysUntilExpiry)
                .isRegionalPrice(catalogPrice.getRegion() != null)
                .isServiceCenterSpecific(catalogPrice.getServiceCenterId() != null)
                .build();
    }

    public List<ServiceItemResponseDTO> toServiceItemResponseDTOList(List<ServiceItem> serviceItems) {
        return serviceItems.stream()
                .map(this::toServiceItemResponseDTO)
                .collect(Collectors.toList());
    }

    public List<CatalogPriceResponseDTO> toCatalogPriceResponseDTOList(List<CatalogPrice> catalogPrices) {
        return catalogPrices.stream()
                .map(this::toCatalogPriceResponseDTO)
                .collect(Collectors.toList());
    }
}
