package com.ev.warranty.service.impl;

import com.ev.warranty.model.dto.technician.TechnicianPerformanceDto;
import com.ev.warranty.model.entity.User;
import com.ev.warranty.model.entity.WorkOrder;
import com.ev.warranty.repository.UserRepository;
import com.ev.warranty.repository.WorkOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TechnicianServiceImpl implements com.ev.warranty.service.inter.TechnicianService {
    private final UserRepository userRepository;
    private final WorkOrderRepository workOrderRepository;

    public TechnicianPerformanceDto getTechnicianPerformance(Integer technicianId, String startDate, String endDate) {
        User technician = userRepository.findById(technicianId)
                .filter(u -> u.getRole() != null && "SC_TECHNICIAN".equals(u.getRole().getRoleName()) && Boolean.TRUE.equals(u.getActive()))
                .orElse(null);
        if (technician == null) return null;
        List<WorkOrder> workOrders = workOrderRepository.findByTechnicianId(technicianId);
        // Lọc theo thời gian nếu có
        if (startDate != null && !startDate.isBlank()) {
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            workOrders = workOrders.stream().filter(wo -> wo.getStartTime() != null && !wo.getStartTime().isBefore(start)).collect(Collectors.toList());
        }
        if (endDate != null && !endDate.isBlank()) {
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            workOrders = workOrders.stream().filter(wo -> wo.getStartTime() != null && !wo.getStartTime().isAfter(end)).collect(Collectors.toList());
        }
        int total = workOrders.size();
        int completed = (int) workOrders.stream().filter(wo -> wo.getEndTime() != null).count();
        int pending = total - completed;
        // Thời gian hoàn thành trung bình
        double avgDays = workOrders.stream()
                .filter(wo -> wo.getStartTime() != null && wo.getEndTime() != null)
                .mapToLong(wo -> Duration.between(wo.getStartTime(), wo.getEndTime()).toDays())
                .average().orElse(0);
        // Tổng chi phí sửa chữa (nếu có trường này, ở đây giả sử là laborHours * 100)
        BigDecimal totalRepairCost = workOrders.stream()
                .filter(wo -> wo.getEndTime() != null && wo.getLaborHours() != null)
                .map(wo -> wo.getLaborHours().multiply(BigDecimal.valueOf(100)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        // Số lần hoàn thành đúng hạn (giả sử đúng hạn là endTime <= startTime + 3 ngày)
        int onTimeCompletions = (int) workOrders.stream()
                .filter(wo -> wo.getStartTime() != null && wo.getEndTime() != null &&
                        !wo.getEndTime().isAfter(wo.getStartTime().plusDays(3)))
                .count();
        double onTimeCompletionRate = completed > 0 ? (double) onTimeCompletions / completed : 0;
        // Chưa có customerSatisfactionScore, để null
        TechnicianPerformanceDto dto = new TechnicianPerformanceDto();
        dto.setTechnicianId(technicianId);
        dto.setTechnicianName(technician.getFullName());
        dto.setTotalClaims(total);
        dto.setCompletedClaims(completed);
        dto.setPendingClaims(pending);
        dto.setAverageCompletionDays(avgDays);
        dto.setTotalRepairCost(totalRepairCost);
        dto.setOnTimeCompletions(onTimeCompletions);
        dto.setOnTimeCompletionRate(onTimeCompletionRate);
        dto.setCustomerSatisfactionScore(null);
        return dto;
    }
}
