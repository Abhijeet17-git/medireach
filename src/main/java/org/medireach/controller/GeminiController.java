package org.medireach.controller;

import lombok.RequiredArgsConstructor;
import org.medireach.dto.SymptomRequestDTO;
import org.medireach.dto.SymptomResponseDTO;
import org.medireach.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class GeminiController {

    private final GeminiService geminiService;

    // Feature 2 — Symptom checker
    @PostMapping("/symptom-check")
    public ResponseEntity<SymptomResponseDTO> checkSymptoms(
        @RequestBody SymptomRequestDTO request) {
        return ResponseEntity.ok(geminiService.assessSymptoms(request));
    }

    // Feature 4 — Wait time prediction
    @GetMapping("/wait-time")
    public ResponseEntity<String> getWaitTime(
        @RequestParam Long hospitalId,
        @RequestParam Integer occupancy,
        @RequestParam Integer admissionRate) {
        return ResponseEntity.ok(geminiService.predictWaitTime(hospitalId, occupancy, admissionRate));
    }
}
