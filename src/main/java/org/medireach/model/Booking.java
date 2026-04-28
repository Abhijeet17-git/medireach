package org.medireach.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private Integer patientAge;
    private Long hospitalId;
    private String hospitalName;
    private String bedType;
    private String status;
    private String reason;
    private String specialityRequested;
    private LocalDateTime bookingTime;
    private LocalDateTime scheduledTime;

    @PrePersist
    public void prePersist() {
        this.bookingTime = LocalDateTime.now();
        if (this.status == null) this.status = "CONFIRMED";
    }
}
