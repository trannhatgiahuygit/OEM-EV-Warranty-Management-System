package com.ev.warranty.model.dto.claim;

import lombok.Data;
import java.util.List;

@Data
public class WorkflowInfoDto {
    private String intakeFirstDescription;
    private String collaborativeDescription;
    private List<String> requiredForSubmission;
}
