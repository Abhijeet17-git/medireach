package org.medireach.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingResponseDTO {
    private Long bookingId;
    private String patientName;
    private String patientEmail;
    private String hospitalName;
    private String bedType;
    private String status;
    private String reason;
    private Integer availableBedsAfterBooking;
    private LocalDateTime bookingTime;
    private LocalDateTime scheduledTime;
    private String message;
}
