package org.medireach.controller;

import lombok.RequiredArgsConstructor;
import org.medireach.dto.BookingRequestDTO;
import org.medireach.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/book")
    public ResponseEntity<?> bookBed(@RequestBody BookingRequestDTO dto, Authentication authentication) {
        if (authentication == null || !authentication.getAuthorities().stream().anyMatch(a -> "ROLE_USER".equals(a.getAuthority()))) {
            return ResponseEntity.status(403).body("Please login as a user to book a bed");
        }
        dto.setPatientEmail(authentication.getName());
        try { return ResponseEntity.ok(bookingService.bookBed(dto)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || !authentication.getAuthorities().stream().anyMatch(a -> "ROLE_USER".equals(a.getAuthority()))) {
            return ResponseEntity.status(403).body("Please login as a user to cancel a booking");
        }
        try { return ResponseEntity.ok(bookingService.cancelBooking(id, authentication.getName())); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(Authentication authentication) {
        if (authentication == null || !authentication.getAuthorities().stream().anyMatch(a -> "ROLE_USER".equals(a.getAuthority()))) {
            return ResponseEntity.status(403).body("Please login as a user to view bookings");
        }
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<?> getHospitalBookings(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(bookingService.getHospitalBookings(hospitalId));
    }
}
