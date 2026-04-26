package org.medireach.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "hospitals")
@Data
@NoArgsConstructor
public class Hospital {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String address;
    private String city;
    private String phone;
    private Double latitude;
    private Double longitude;
    private Integer totalIcuBeds;
    private Integer availableIcuBeds;
    private Integer totalGeneralBeds;
    private Integer availableGeneralBeds;
    private Integer totalOpd;
    private Integer currentOpdWaiting;
    private Boolean ambulanceAvailable;
    @Column(name = "is_active")
    private Boolean active = true;
    private String ambulancePhone;
    private String specialities;
    private String registrationNumber;
    private String driveLink;
    @Column(name = "is_verified")
    private Boolean verified = false;
}
