package com.ev.warranty.model.dto.part;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ReceivePartSerialForWorkOrderRequestDTO {
    @NotNull
    private Integer workOrderId;
    @NotNull
    private List<Integer> partSerialIds;

    public Integer getWorkOrderId() {
        return workOrderId;
    }
    public void setWorkOrderId(Integer workOrderId) {
        this.workOrderId = workOrderId;
    }
    public List<Integer> getPartSerialIds() {
        return partSerialIds;
    }
    public void setPartSerialIds(List<Integer> partSerialIds) {
        this.partSerialIds = partSerialIds;
    }
}

