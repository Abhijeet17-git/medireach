package org.medireach.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "sos_requests")
@Data
@NoArgsConstructor
public class SosRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;
    private String patientPhone;
    private String patientEmail;
    private Double patientLatitude;
    private Double patientLongitude;

    private Long assignedHospitalId;
    private String status;

    private String emergencyDetails;
    private LocalDateTime requestedAt;
    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        this.requestedAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
    }
}
