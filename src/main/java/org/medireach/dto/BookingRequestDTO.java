package org.medireach.dto;

import lombok.Data;

@Data
public class BookingRequestDTO {
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private Integer patientAge;
    private Long hospitalId;
    private String bedType;
    private String reason;
    private String specialityRequested;
    private String scheduledTime;
}
