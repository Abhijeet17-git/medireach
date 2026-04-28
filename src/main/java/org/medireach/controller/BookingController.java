package org.medireach.controller;

import lombok.RequiredArgsConstructor;
import org.medireach.dto.BookingRequestDTO;
import org.medireach.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/book")
    public ResponseEntity<?> bookBed(@RequestBody BookingRequestDTO dto) {
        try { return ResponseEntity.ok(bookingService.bookBed(dto)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, @RequestParam String email) {
        try { return ResponseEntity.ok(bookingService.cancelBooking(id, email)); }
        catch (Exception e) { return ResponseEntity.badRequest().body(e.getMessage()); }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(@RequestParam String email) {
        return ResponseEntity.ok(bookingService.getMyBookings(email));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<?> getHospitalBookings(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(bookingService.getHospitalBookings(hospitalId));
    }
}
