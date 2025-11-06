package com.ev.warranty.repository;

import com.ev.warranty.model.entity.ServiceItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceItemRepository extends JpaRepository<ServiceItem, Integer> {

    // ==================== BASIC QUERIES ====================

    /**
     * Find service item by service code
     * @param serviceCode Service code
     * @return Optional service item
     */
    Optional<ServiceItem> findByServiceCode(String serviceCode);

    /**
     * Check if service code exists
     * @param serviceCode Service code
     * @return true if exists
     */
    boolean existsByServiceCode(String serviceCode);

    /**
     * Find active service items
     * @param pageable Pagination
     * @return Page of active service items
     */
    Page<ServiceItem> findByActiveTrue(Pageable pageable);

    /**
     * Find service items by active status
     * @param active Active status
     * @param pageable Pagination
     * @return Page of service items
     */
    Page<ServiceItem> findByActive(boolean active, Pageable pageable);

    // ==================== CATEGORY QUERIES ====================

    /**
     * Find service items by category
     * @param category Service category
     * @param pageable Pagination
     * @return Page of service items in category
     */
    Page<ServiceItem> findByCategory(String category, Pageable pageable);

    /**
     * Find active service items by category
     * @param category Service category
     * @param active Active status
     * @param pageable Pagination
     * @return Page of service items
     */
    Page<ServiceItem> findByCategoryAndActive(String category, boolean active, Pageable pageable);

    /**
     * Get all distinct categories
     * @return List of unique categories
     */
    @Query("SELECT DISTINCT si.category FROM ServiceItem si WHERE si.category IS NOT NULL ORDER BY si.category")
    List<String> findDistinctCategories();

    // ==================== SEARCH QUERIES ====================

    /**
     * Search service items by name or service code
     * @param searchTerm Search term
     * @param pageable Pagination
     * @return Page of matching service items
     */
    @Query("SELECT si FROM ServiceItem si " +
           "WHERE LOWER(si.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(si.serviceCode) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY si.name")
    Page<ServiceItem> searchServiceItems(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Search active service items by name or service code
     * @param searchTerm Search term
     * @param pageable Pagination
     * @return Page of matching active service items
     */
    @Query("SELECT si FROM ServiceItem si " +
           "WHERE si.active = true " +
           "AND (LOWER(si.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(si.serviceCode) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY si.name")
    Page<ServiceItem> searchActiveServiceItems(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Search service items with filters
     * @param searchTerm Search term (optional)
     * @param category Category filter (optional)
     * @param active Active status filter
     * @param pageable Pagination
     * @return Page of filtered service items
     */
    @Query("SELECT si FROM ServiceItem si " +
           "WHERE (:searchTerm IS NULL OR " +
           "       LOWER(si.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "       LOWER(si.serviceCode) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:category IS NULL OR si.category = :category) " +
           "AND si.active = :active " +
           "ORDER BY si.name")
    Page<ServiceItem> findWithFilters(@Param("searchTerm") String searchTerm,
                                     @Param("category") String category,
                                     @Param("active") boolean active,
                                     Pageable pageable);

    // ==================== STATISTICS QUERIES ====================

    /**
     * Count service items by category
     * @param category Service category
     * @return Number of service items in category
     */
    Long countByCategory(String category);

    /**
     * Count active service items
     * @return Number of active service items
     */
    Long countByActiveTrue();

    /**
     * Get service item statistics by category
     * @return List of category statistics
     */
    @Query("SELECT si.category, COUNT(si) FROM ServiceItem si " +
           "WHERE si.category IS NOT NULL " +
           "GROUP BY si.category " +
           "ORDER BY COUNT(si) DESC")
    List<Object[]> getServiceItemStatsByCategory();
}
