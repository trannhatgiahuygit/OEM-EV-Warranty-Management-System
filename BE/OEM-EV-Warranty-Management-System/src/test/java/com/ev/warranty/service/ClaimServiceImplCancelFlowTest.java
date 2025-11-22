package com.ev.warranty.service;

import com.ev.warranty.model.entity.Claim;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.ClaimStatus;
import com.ev.warranty.model.entity.Role;
import com.ev.warranty.model.dto.claim.ClaimResponseDto;
import com.ev.warranty.repository.ClaimRepository;
import com.ev.warranty.repository.ClaimStatusRepository;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.service.impl.ClaimServiceImpl;
import com.ev.warranty.mapper.ClaimMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringBootTest
public class ClaimServiceImplCancelFlowTest {
    @Mock
    private ClaimRepository claimRepository;
    @Mock
    private ClaimStatusRepository claimStatusRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ClaimMapper claimMapper;

    @InjectMocks
    private ClaimServiceImpl claimService;

    private Claim claim;
    private User technician;
    private User staff;
    private ClaimStatus status;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        technician = new User();
        technician.setId(1);
        technician.setUsername("tech1");
        technician.setRole(Role.builder().id(2).roleName("TECHNICIAN").build());
        staff = new User();
        staff.setId(2);
        staff.setUsername("staff1");
        staff.setRole(Role.builder().id(3).roleName("SC_STAFF").build());
        status = new ClaimStatus();
        status.setId(1);
        status.setCode("IN_PROGRESS");
        status.setLabel("In Progress");
        claim = new Claim();
        claim.setId(100);
        claim.setClaimNumber("CLM-100");
        claim.setStatus(status);
        // Set assignment through ClaimAssignment entity
        com.ev.warranty.model.entity.ClaimAssignment assignment = com.ev.warranty.model.entity.ClaimAssignment.builder()
                .claim(claim)
                .assignedTechnician(technician)
                .build();
        claim.setAssignment(assignment);
        // Set cancellation through ClaimCancellation entity
        com.ev.warranty.model.entity.ClaimCancellation cancellation = com.ev.warranty.model.entity.ClaimCancellation.builder()
                .claim(claim)
                .cancelRequestCount(0)
                .build();
        claim.setCancellation(cancellation);
    }

    @Test
    public void testTechnicianCancelRequest_HappyPath() {
        // Arrange
        when(claimRepository.findById(100)).thenReturn(Optional.of(claim));
        when(userRepository.findById(1)).thenReturn(Optional.of(technician));
        when(claimRepository.save(any(Claim.class))).thenAnswer(i -> i.getArgument(0));
        // Simulate getCurrentUser
        ReflectionTestUtils.setField(claimService, "currentUser", technician);
        // Act
        // (Assume a method: requestCancelClaim)
        // claimService.requestCancelClaim(100, "Need to cancel");
        // Assert
        // (Check claim fields updated)
        // (Check cancelRequestCount incremented, cancelRequestedBy set, etc.)
    }

    @Test
    public void testTechnicianCancelRequest_ExceedsLimit() {
        // Arrange
        claim.getCancellation().setCancelRequestCount(3); // Already at limit
        when(claimRepository.findById(100)).thenReturn(Optional.of(claim));
        when(userRepository.findById(1)).thenReturn(Optional.of(technician));
        ReflectionTestUtils.setField(claimService, "currentUser", technician);
        // Act & Assert
        // (Assume a method: requestCancelClaim)
        // assertThrows(BadRequestException.class, () ->
        // claimService.requestCancelClaim(100, "Exceed limit"));
    }

    @Test
    public void testStaffRejectCancelRequest() {
        // Arrange
        claim.getCancellation().setCancelRequestCount(1);
        claim.getCancellation().setCancelRequestedBy(technician);
        claim.getCancellation().setCancelRequestedAt(LocalDateTime.now().minusMinutes(5));
        when(claimRepository.findById(100)).thenReturn(Optional.of(claim));
        when(userRepository.findById(2)).thenReturn(Optional.of(staff));
        ReflectionTestUtils.setField(claimService, "currentUser", staff);
        // Act
        // (Assume a method: rejectCancelRequest)
        // claimService.rejectCancelRequest(100, "Not allowed");
        // Assert
        // (Check cancel fields reset, status unchanged)
    }
}
