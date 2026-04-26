package org.medireach.dto;

import lombok.Data;

@Data
public class RegisterHospitalDTO {
    private String hospitalName;
    private String address;
    private String city;
    private String phone;
    private Double latitude;
    private Double longitude;
    private Integer totalIcuBeds;
    private Integer totalGeneralBeds;
    private Integer totalOpd;
    private Boolean ambulanceAvailable;
    private String ambulancePhone;
    private String specialities;
    private String adminEmail;
    private String adminPassword;
    private String driveLink;
}
