package com.ev.warranty.repository;

import com.ev.warranty.model.entity.CatalogPrice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CatalogPriceRepository extends JpaRepository<CatalogPrice, Integer> {

    // ==================== BASIC QUERIES ====================

    /**
     * Find all prices for a specific item
     * @param itemType Item type (PART or SERVICE)
     * @param itemId Item ID
     * @return List of all pricing records for the item
     */
    List<CatalogPrice> findByItemTypeAndItemId(String itemType, Integer itemId);

    /**
     * Find prices by item type
     * @param itemType Item type (PART or SERVICE)
     * @param pageable Pagination
     * @return Page of catalog prices
     */
    Page<CatalogPrice> findByItemType(String itemType, Pageable pageable);

    /**
     * Find prices by region
     * @param region Region
     * @param pageable Pagination
     * @return Page of catalog prices
     */
    Page<CatalogPrice> findByRegion(String region, Pageable pageable);

    /**
     * Find prices by service center
     * @param serviceCenterId Service center ID
     * @param pageable Pagination
     * @return Page of catalog prices
     */
    Page<CatalogPrice> findByServiceCenterId(Integer serviceCenterId, Pageable pageable);

    // ==================== CURRENT EFFECTIVE PRICING ====================

    /**
     * Find current effective price for an item (most specific match)
     * Priority: Service Center > Region > General
     * @param itemType Item type
     * @param itemId Item ID
     * @param region Region (optional)
     * @param serviceCenterId Service center ID (optional)
     * @param today Current date
     * @return Current effective price
     */
    @Query("SELECT cp FROM CatalogPrice cp " +
           "WHERE cp.itemType = :itemType " +
           "AND cp.itemId = :itemId " +
           "AND cp.effectiveFrom <= :today " +
           "AND (cp.effectiveTo IS NULL OR cp.effectiveTo >= :today) " +
           "AND (" +
           "    (cp.serviceCenterId = :serviceCenterId) OR " +
           "    (cp.serviceCenterId IS NULL AND cp.region = :region) OR " +
           "    (cp.serviceCenterId IS NULL AND cp.region IS NULL)" +
           ") " +
           "ORDER BY " +
           "    CASE WHEN cp.serviceCenterId = :serviceCenterId THEN 1 " +
           "         WHEN cp.region = :region THEN 2 " +
           "         ELSE 3 END, " +
           "    cp.effectiveFrom DESC " +
           "LIMIT 1")
    Optional<CatalogPrice> findCurrentEffectivePrice(@Param("itemType") String itemType,
                                                     @Param("itemId") Integer itemId,
                                                     @Param("region") String region,
                                                     @Param("serviceCenterId") Integer serviceCenterId,
                                                     @Param("today") LocalDate today);

    /**
     * Find all current effective prices for multiple items
     * @param itemType Item type
     * @param itemIds List of item IDs
     * @param region Region (optional)
     * @param serviceCenterId Service center ID (optional)
     * @param today Current date
     * @return List of current effective prices
     */
    @Query("SELECT cp FROM CatalogPrice cp " +
           "WHERE cp.itemType = :itemType " +
           "AND cp.itemId IN :itemIds " +
           "AND cp.effectiveFrom <= :today " +
           "AND (cp.effectiveTo IS NULL OR cp.effectiveTo >= :today) " +
           "ORDER BY cp.itemId, " +
           "    CASE WHEN cp.serviceCenterId = :serviceCenterId THEN 1 " +
           "         WHEN cp.region = :region THEN 2 " +
           "         ELSE 3 END, " +
           "    cp.effectiveFrom DESC")
    List<CatalogPrice> findCurrentEffectivePricesForItems(@Param("itemType") String itemType,
                                                          @Param("itemIds") List<Integer> itemIds,
                                                          @Param("region") String region,
                                                          @Param("serviceCenterId") Integer serviceCenterId,
                                                          @Param("today") LocalDate today);

    // ==================== FILTERED QUERIES ====================

    /**
     * Find prices with multiple filters
     * @param itemType Item type (optional)
     * @param region Region (optional)
     * @param serviceCenterId Service center ID (optional)
     * @param pageable Pagination
     * @return Page of filtered catalog prices
     */
    @Query("SELECT cp FROM CatalogPrice cp " +
           "WHERE (:itemType IS NULL OR cp.itemType = :itemType) " +
           "AND (:region IS NULL OR cp.region = :region) " +
           "AND (:serviceCenterId IS NULL OR cp.serviceCenterId = :serviceCenterId) " +
           "ORDER BY cp.createdAt DESC")
    Page<CatalogPrice> findWithFilters(@Param("itemType") String itemType,
                                      @Param("region") String region,
                                      @Param("serviceCenterId") Integer serviceCenterId,
                                      Pageable pageable);

    // ==================== EXPORT QUERIES ====================

    /**
     * Find all current effective prices for export
     * @param region Region filter (optional)
     * @param serviceCenterId Service center filter (optional)
     * @param today Current date
     * @return List of current effective prices
     */
    @Query("SELECT cp FROM CatalogPrice cp " +
           "WHERE cp.effectiveFrom <= :today " +
           "AND (cp.effectiveTo IS NULL OR cp.effectiveTo >= :today) " +
           "AND (:region IS NULL OR cp.region = :region OR cp.region IS NULL) " +
           "AND (:serviceCenterId IS NULL OR cp.serviceCenterId = :serviceCenterId OR cp.serviceCenterId IS NULL) " +
           "ORDER BY cp.itemType, cp.itemId, " +
           "    CASE WHEN cp.serviceCenterId = :serviceCenterId THEN 1 " +
           "         WHEN cp.region = :region THEN 2 " +
           "         ELSE 3 END")
    List<CatalogPrice> findCurrentPricesForExport(@Param("region") String region,
                                                  @Param("serviceCenterId") Integer serviceCenterId,
                                                  @Param("today") LocalDate today);

    // ==================== VALIDATION QUERIES ====================

    /**
     * Check if a price already exists for the same item, region, service center, and effective date
     * @param itemType Item type
     * @param itemId Item ID
     * @param region Region
     * @param serviceCenterId Service center ID
     * @param effectiveFrom Effective from date
     * @return true if duplicate exists
     */
    boolean existsByItemTypeAndItemIdAndRegionAndServiceCenterIdAndEffectiveFrom(
            String itemType, Integer itemId, String region, Integer serviceCenterId, LocalDate effectiveFrom);
}
