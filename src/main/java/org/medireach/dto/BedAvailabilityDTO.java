package org.medireach.dto;

import lombok.Data;

@Data
public class BedAvailabilityDTO {
    private Long hospitalId;
    private String hospitalName;
    private String address;
    private Double latitude;
    private Double longitude;
    private Integer availableIcuBeds;
    private Integer availableGeneralBeds;
    private Integer currentOpdWaiting;
    private Boolean ambulanceAvailable;
    private Double distanceKm;
    private String estimatedTravelTime;
    private String ambulancePhone;
    private String specialities;
    private Double avgRating;
    private Integer totalReviews;
}
