package org.medireach.dto;

import lombok.Data;

@Data
public class SymptomResponseDTO {
    private String urgencyLevel;   // ICU / GENERAL_OPD / BOOK_APPOINTMENT
    private String recommendation;
    private String reasoning;
    private String speciality;
}
