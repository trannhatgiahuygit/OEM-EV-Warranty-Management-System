package com.ev.warranty.repository;

import com.ev.warranty.model.entity.WarrantyPolicy;
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
public interface WarrantyPolicyRepository extends JpaRepository<WarrantyPolicy, Integer> {

    // ==================== BASIC QUERIES ====================

    /**
     * Find warranty policy by code
     * @param code Policy code
     * @return Optional warranty policy
     */
    Optional<WarrantyPolicy> findByCode(String code);

    /**
     * Check if policy code exists
     * @param code Policy code
     * @return true if exists
     */
    boolean existsByCode(String code);

    // ==================== FILTERED QUERIES ====================

    /**
     * Find policies by status
     * @param status Policy status
     * @param pageable Pagination
     * @return Page of policies
     */
    Page<WarrantyPolicy> findByStatus(String status, Pageable pageable);

    /**
     * Find policies by applicable model
     * @param model Vehicle model
     * @param pageable Pagination
     * @return Page of policies
     */
    Page<WarrantyPolicy> findByApplicableModel(String model, Pageable pageable);

    /**
     * Find policies by status and model
     * @param status Policy status
     * @param model Vehicle model
     * @param pageable Pagination
     * @return Page of policies
     */
    Page<WarrantyPolicy> findByStatusAndApplicableModel(String status, String model, Pageable pageable);

    // ==================== ACTIVE POLICIES ====================

    /**
     * Find all active policies (effective today)
     * @return List of active policies
     */
    @Query("SELECT wp FROM WarrantyPolicy wp " +
           "WHERE wp.status = 'active' " +
           "AND wp.effectiveFrom <= :today " +
           "AND (wp.effectiveTo IS NULL OR wp.effectiveTo >= :today) " +
           "ORDER BY wp.createdAt DESC")
    List<WarrantyPolicy> findActivePolicies(@Param("today") LocalDate today);

    /**
     * Find active policies by vehicle model
     * @param model Vehicle model
     * @param today Current date
     * @return List of applicable policies
     */
    @Query("SELECT wp FROM WarrantyPolicy wp " +
           "WHERE wp.status = 'active' " +
           "AND wp.effectiveFrom <= :today " +
           "AND (wp.effectiveTo IS NULL OR wp.effectiveTo >= :today) " +
           "AND (wp.applicableModel = :model OR wp.applicableModel IS NULL) " +
           "ORDER BY wp.createdAt DESC")
    List<WarrantyPolicy> findActivePoliciesByModel(@Param("model") String model, @Param("today") LocalDate today);

    /**
     * Find active policies by vehicle model and year
     * @param model Vehicle model
     * @param year Vehicle year
     * @param today Current date
     * @return List of applicable policies
     */
    @Query("SELECT wp FROM WarrantyPolicy wp " +
           "WHERE wp.status = 'active' " +
           "AND wp.effectiveFrom <= :today " +
           "AND (wp.effectiveTo IS NULL OR wp.effectiveTo >= :today) " +
           "AND (wp.applicableModel = :model OR wp.applicableModel IS NULL) " +
           "AND (wp.applicableYearFrom IS NULL OR wp.applicableYearFrom <= :year) " +
           "AND (wp.applicableYearTo IS NULL OR wp.applicableYearTo >= :year) " +
           "ORDER BY wp.createdAt DESC")
    List<WarrantyPolicy> findActivePoliciesByModelAndYear(@Param("model") String model,
                                                          @Param("year") Integer year,
                                                          @Param("today") LocalDate today);

    // ==================== SEARCH QUERIES ====================

    /**
     * Search policies by name or code
     * @param searchTerm Search term
     * @param pageable Pagination
     * @return Page of matching policies
     */
    @Query("SELECT wp FROM WarrantyPolicy wp " +
           "WHERE LOWER(wp.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(wp.code) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "ORDER BY wp.createdAt DESC")
    Page<WarrantyPolicy> searchPolicies(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Search active policies by name or code
     * @param searchTerm Search term
     * @param today Current date
     * @return List of matching active policies
     */
    @Query("SELECT wp FROM WarrantyPolicy wp " +
           "WHERE wp.status = 'active' " +
           "AND wp.effectiveFrom <= :today " +
           "AND (wp.effectiveTo IS NULL OR wp.effectiveTo >= :today) " +
           "AND (LOWER(wp.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(wp.code) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY wp.createdAt DESC")
    List<WarrantyPolicy> searchActivePolicies(@Param("searchTerm") String searchTerm, @Param("today") LocalDate today);
}
