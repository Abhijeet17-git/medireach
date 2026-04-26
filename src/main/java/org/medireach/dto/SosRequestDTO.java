package org.medireach.dto;

import lombok.Data;

@Data
public class SosRequestDTO {
    private String patientName;
    private String patientPhone;
    private String patientEmail;
    private Double latitude;
    private Double longitude;
    private String emergencyDetails;
}
