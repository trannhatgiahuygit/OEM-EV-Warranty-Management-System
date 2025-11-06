package com.ev.warranty.repository;

import com.ev.warranty.model.entity.PolicyRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PolicyRuleRepository extends JpaRepository<PolicyRule, Integer> {

    // ==================== BASIC QUERIES ====================

    /**
     * Find all rules for a specific policy
     * @param policyId Policy ID
     * @return List of policy rules ordered by priority
     */
    @Query("SELECT pr FROM PolicyRule pr " +
           "WHERE pr.policy.id = :policyId " +
           "ORDER BY pr.priority DESC, pr.createdAt ASC")
    List<PolicyRule> findByPolicyId(@Param("policyId") Integer policyId);

    /**
     * Find rules by component category
     * @param componentCategory Component category
     * @return List of matching rules
     */
    List<PolicyRule> findByComponentCategory(String componentCategory);

    /**
     * Find rules by coverage type
     * @param coverageType Coverage type
     * @return List of matching rules
     */
    List<PolicyRule> findByCoverageType(String coverageType);

    // ==================== POLICY APPLICATION QUERIES ====================

    /**
     * Find applicable rules for a specific policy and component category
     * @param policyId Policy ID
     * @param componentCategory Component category
     * @return List of applicable rules ordered by priority
     */
    @Query("SELECT pr FROM PolicyRule pr " +
           "WHERE pr.policy.id = :policyId " +
           "AND (pr.componentCategory = :componentCategory OR pr.componentCategory IS NULL) " +
           "ORDER BY pr.priority DESC, pr.createdAt ASC")
    List<PolicyRule> findApplicableRules(@Param("policyId") Integer policyId,
                                        @Param("componentCategory") String componentCategory);

    /**
     * Find the most specific rule for a policy and component category
     * @param policyId Policy ID
     * @param componentCategory Component category
     * @return Most specific applicable rule
     */
    @Query("SELECT pr FROM PolicyRule pr " +
           "WHERE pr.policy.id = :policyId " +
           "AND (pr.componentCategory = :componentCategory OR pr.componentCategory IS NULL) " +
           "ORDER BY pr.priority DESC, pr.componentCategory DESC NULLS LAST, pr.createdAt ASC " +
           "LIMIT 1")
    PolicyRule findMostSpecificRule(@Param("policyId") Integer policyId,
                                   @Param("componentCategory") String componentCategory);

    /**
     * Find all rules for active policies that apply to a component category
     * @param componentCategory Component category
     * @return List of applicable rules from active policies
     */
    @Query("SELECT pr FROM PolicyRule pr " +
           "JOIN pr.policy wp " +
           "WHERE wp.status = 'active' " +
           "AND (pr.componentCategory = :componentCategory OR pr.componentCategory IS NULL) " +
           "ORDER BY wp.createdAt DESC, pr.priority DESC, pr.createdAt ASC")
    List<PolicyRule> findActiveRulesByComponent(@Param("componentCategory") String componentCategory);

    // ==================== STATISTICS QUERIES ====================

    /**
     * Count rules by policy
     * @param policyId Policy ID
     * @return Number of rules for the policy
     */
    @Query("SELECT COUNT(pr) FROM PolicyRule pr WHERE pr.policy.id = :policyId")
    Long countByPolicyId(@Param("policyId") Integer policyId);

    /**
     * Count rules by component category
     * @param componentCategory Component category
     * @return Number of rules for the component category
     */
    Long countByComponentCategory(String componentCategory);
}
