package org.medireach.controller;

import lombok.RequiredArgsConstructor;
import org.medireach.model.Hospital;
import org.medireach.model.User;
import org.medireach.repository.BookingRepository;
import org.medireach.repository.HospitalRepository;
import org.medireach.repository.ReviewRepository;
import org.medireach.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

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

    @GetMapping("/hospital-admins")
    public List<User> getHospitalAdmins() {
        return userRepository.findByRole("HOSPITAL_ADMIN");
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            if ("SUPER_ADMIN".equals(user.getRole())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Super admin cannot be deleted"));
            }
            userRepository.delete(user);
            return ResponseEntity.ok(Map.of("status", "deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/hospitals/{id}")
    @Transactional
    public ResponseEntity<?> deleteHospital(@PathVariable Long id) {
        return hospitalRepository.findById(id).map(hospital -> {
            bookingRepository.deleteByHospitalId(id);
            reviewRepository.deleteByHospitalId(id);
            userRepository.findByHospitalId(id).forEach(user -> {
                if (!"SUPER_ADMIN".equals(user.getRole())) {
                    userRepository.delete(user);
                }
            });
            hospitalRepository.delete(hospital);
            return ResponseEntity.ok(Map.of("status", "deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
