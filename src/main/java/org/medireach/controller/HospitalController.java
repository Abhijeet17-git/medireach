package org.medireach.controller;
import lombok.RequiredArgsConstructor;
import org.medireach.dto.BedAvailabilityDTO;
import org.medireach.service.HospitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HospitalController {
    private final HospitalService hospitalService;

    @PutMapping("/{id}/drive-link")
    public ResponseEntity<?> saveDriveLink(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        hospitalService.saveDriveLink(id, body.get("driveLink"));
        return ResponseEntity.ok(java.util.Map.of("status", "saved"));
    }

    @GetMapping("/all")
    public ResponseEntity<List<BedAvailabilityDTO>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<BedAvailabilityDTO>> getNearbyHospitals(
        @RequestParam Double lat,
        @RequestParam Double lng,
        @RequestParam(defaultValue = "20.0") Double radius) {
        return ResponseEntity.ok(hospitalService.getNearbyHospitals(lat, lng, radius));
    }

    @GetMapping("/city")
    public ResponseEntity<List<BedAvailabilityDTO>> getByCity(
        @RequestParam String city) {
        return ResponseEntity.ok(hospitalService.getHospitalsByCity(city));
    }

    @PutMapping("/{id}/beds")
    public ResponseEntity<?> updateBeds(
        @PathVariable Long id,
        @RequestParam Integer icuBeds,
        @RequestParam Integer generalBeds,
        @RequestParam(defaultValue = "0") Integer opdWaiting,
        @RequestParam(required = false) String ambulancePhone,
        @RequestParam(required = false) String specialities) {
        return ResponseEntity.ok(hospitalService.updateBedCount(id, icuBeds, generalBeds, opdWaiting, ambulancePhone, specialities));
    }
}
