package com.ev.warranty.service.inter;

import com.ev.warranty.model.dto.technician.TechnicianPerformanceDto;

public interface TechnicianService {
    TechnicianPerformanceDto getTechnicianPerformance(Integer technicianId, String startDate, String endDate);
}
