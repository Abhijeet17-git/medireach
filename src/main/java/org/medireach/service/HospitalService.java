package org.medireach.service;
import lombok.RequiredArgsConstructor;
import org.medireach.dto.BedAvailabilityDTO;
import org.medireach.model.Hospital;
import org.medireach.repository.HospitalRepository;
import org.medireach.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HospitalService {
    private final HospitalRepository hospitalRepository;
    private final ReviewRepository reviewRepository;

    public void saveDriveLink(Long id, String driveLink) {
        hospitalRepository.findById(id).ifPresent(h -> {
            h.setDriveLink(driveLink);
            hospitalRepository.save(h);
        });
    }

    public List<BedAvailabilityDTO> getAllHospitals() {
        return hospitalRepository.findAll().stream()
            .map(this::toDTO)
            .collect(java.util.stream.Collectors.toList());
    }

    public List<BedAvailabilityDTO> getNearbyHospitals(Double lat, Double lng, Double radiusKm) {
        List<Hospital> hospitals = hospitalRepository.findNearbyHospitals(lat, lng, radiusKm);
        return hospitals.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<BedAvailabilityDTO> getHospitalsByCity(String city) {
        List<Hospital> hospitals = hospitalRepository.findByCityAndActiveTrue(city);
        return hospitals.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Hospital updateBedCount(Long hospitalId, Integer icuBeds, Integer generalBeds, Integer opdWaiting, String ambulancePhone, String specialities) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
            .orElseThrow(() -> new RuntimeException("Hospital not found"));
        hospital.setAvailableIcuBeds(icuBeds);
        hospital.setAvailableGeneralBeds(generalBeds);
        hospital.setCurrentOpdWaiting(opdWaiting);
        if (ambulancePhone != null) hospital.setAmbulancePhone(ambulancePhone);
        if (specialities != null) hospital.setSpecialities(specialities);
        return hospitalRepository.save(hospital);
    }

    public Hospital getNearestWithIcuBed(Double lat, Double lng) {
        return hospitalRepository.findNearestHospitalWithIcuBed(lat, lng, 50.0);
    }

    private BedAvailabilityDTO toDTO(Hospital h) {
        BedAvailabilityDTO dto = new BedAvailabilityDTO();
        dto.setHospitalId(h.getId());
        dto.setHospitalName(h.getName());
        dto.setAddress(h.getAddress());
        dto.setLatitude(h.getLatitude());
        dto.setLongitude(h.getLongitude());
        dto.setAvailableIcuBeds(h.getAvailableIcuBeds());
        dto.setAvailableGeneralBeds(h.getAvailableGeneralBeds());
        dto.setCurrentOpdWaiting(h.getCurrentOpdWaiting());
        dto.setAmbulanceAvailable(h.getAmbulanceAvailable());
        dto.setAmbulancePhone(h.getAmbulancePhone());
        dto.setSpecialities(h.getSpecialities());
        Double avg = reviewRepository.findAvgRatingByHospitalId(h.getId());
        dto.setAvgRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        dto.setTotalReviews((int) reviewRepository.findByHospitalIdOrderByCreatedAtDesc(h.getId()).size());
        return dto;
    }
}
