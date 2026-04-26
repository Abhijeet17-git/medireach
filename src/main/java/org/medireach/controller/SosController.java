package org.medireach.controller;

import lombok.RequiredArgsConstructor;
import org.medireach.dto.SosRequestDTO;
import org.medireach.model.SosRequest;
import org.medireach.service.SosService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SosController {

    private final SosService sosService;

    @PostMapping("/trigger")
    public ResponseEntity<SosRequest> triggerSos(@RequestBody SosRequestDTO request) {
        return ResponseEntity.ok(sosService.triggerSos(request));
    }

    @GetMapping("/status/{id}")
    public ResponseEntity<SosRequest> getSosStatus(@PathVariable Long id) {
        return ResponseEntity.ok(sosService.getSosStatus(id));
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMySos(@RequestParam String phone) {
        return ResponseEntity.ok(sosService.getSosByPhone(phone));
    }

    @GetMapping("/my-by-email")
    public ResponseEntity<?> getMySosByEmail(@RequestParam String email) {
        return ResponseEntity.ok(sosService.getSosByEmail(email));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<?> getSosByHospital(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(sosService.getActiveSosByHospital(hospitalId));
    }

    @PutMapping("/status/{id}")
    public ResponseEntity<SosRequest> updateSosStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(sosService.updateSosStatus(id, status));
    }
}
