package org.medireach.controller;

import lombok.RequiredArgsConstructor;
import org.medireach.model.Hospital;
import org.medireach.model.User;
import org.medireach.repository.HospitalRepository;
import org.medireach.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SuperAdminController {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    @GetMapping("/hospitals")
    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    @PutMapping("/hospitals/{id}/approve")
    public ResponseEntity<?> approveHospital(@PathVariable Long id) {
        return hospitalRepository.findById(id).map(h -> {
            h.setActive(true);
            h.setVerified(true);
            hospitalRepository.save(h);
            return ResponseEntity.ok(Map.of("status", "approved"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/hospitals/{id}/reject")
    public ResponseEntity<?> rejectHospital(@PathVariable Long id) {
        return hospitalRepository.findById(id).map(h -> {
            h.setActive(false);
            hospitalRepository.save(h);
            return ResponseEntity.ok(Map.of("status", "rejected"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
