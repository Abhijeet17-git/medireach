package org.medireach.dto;

import lombok.Data;

@Data
public class SymptomRequestDTO {
    private String symptoms;
    private Integer age;
    private String existingConditions;
}
