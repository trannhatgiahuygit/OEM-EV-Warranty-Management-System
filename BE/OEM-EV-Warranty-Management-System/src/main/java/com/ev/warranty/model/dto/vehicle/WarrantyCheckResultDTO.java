package com.ev.warranty.model.dto.vehicle;

public class WarrantyCheckResultDTO {
    private boolean eligible;
    private String reason;

    public WarrantyCheckResultDTO(boolean eligible, String reason) {
        this.eligible = eligible;
        this.reason = reason;
    }

    public boolean isEligible() {
        return eligible;
    }

    public String getReason() {
        return reason;
    }
}
