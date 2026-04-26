package org.medireach.service;

import lombok.RequiredArgsConstructor;
import org.medireach.dto.SosRequestDTO;
import org.medireach.model.Hospital;
import org.medireach.model.SosRequest;
import org.medireach.repository.HospitalRepository;
import org.medireach.repository.SosRepository;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
public class SosService {

    private final SosRepository sosRepository;
    private final HospitalRepository hospitalRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeminiService geminiService;

    public SosRequest triggerSos(SosRequestDTO dto) {
        // Get ALL nearby hospitals with ICU beds
        java.util.List<Hospital> nearbyHospitals = hospitalRepository
            .findAllNearbyWithIcuBeds(dto.getLatitude(), dto.getLongitude(), 50.0);

        // Use Gemini to pick the best hospital
        Hospital nearest = null;
        if (!nearbyHospitals.isEmpty()) {
            Long bestId = geminiService.recommendBestHospital(nearbyHospitals, dto.getEmergencyDetails());
            nearest = nearbyHospitals.stream()
                .filter(h -> h.getId().equals(bestId))
                .findFirst()
                .orElse(nearbyHospitals.stream().min(java.util.Comparator.comparingInt(h -> h.getCurrentOpdWaiting() != null ? h.getCurrentOpdWaiting() : 999)).orElse(nearbyHospitals.get(0)));
        }

        SosRequest sos = new SosRequest();
        sos.setPatientName(dto.getPatientName());
        sos.setPatientPhone(dto.getPatientPhone());
        sos.setPatientLatitude(dto.getLatitude());
        sos.setPatientLongitude(dto.getLongitude());
        sos.setEmergencyDetails(dto.getEmergencyDetails());
        sos.setPatientEmail(dto.getPatientEmail());

        if (nearest != null) {
            sos.setAssignedHospitalId(nearest.getId());
            sos.setStatus("HOSPITAL_NOTIFIED");

            // Reserve the ICU bed
            nearest.setAvailableIcuBeds(nearest.getAvailableIcuBeds() - 1);
            hospitalRepository.save(nearest);
        } else {
            sos.setStatus("NO_BED_AVAILABLE");
        }

        SosRequest saved = sosRepository.save(sos);
        messagingTemplate.convertAndSend("/topic/sos/" + saved.getId(), saved);
        if (saved.getAssignedHospitalId() != null) {
            messagingTemplate.convertAndSend("/topic/hospital/" + saved.getAssignedHospitalId(), saved);
        }
        return saved;
    }

    public SosRequest getSosStatus(Long sosId) {
        return sosRepository.findById(sosId)
            .orElseThrow(() -> new RuntimeException("SOS request not found"));
    }

    public java.util.List<SosRequest> getSosByPhone(String phone) {
        return sosRepository.findByPatientPhone(phone);
    }

    public java.util.List<SosRequest> getSosByEmail(String email) {
        return sosRepository.findByPatientEmailOrderByRequestedAtDesc(email);
    }

    public java.util.List<SosRequest> getActiveSosByHospital(Long hospitalId) {
        return sosRepository.findByAssignedHospitalIdAndStatusNotOrderByRequestedAtDesc(hospitalId, "ARRIVED");
    }

    public SosRequest updateSosStatus(Long sosId, String status) {
        SosRequest sos = sosRepository.findById(sosId)
            .orElseThrow(() -> new RuntimeException("SOS request not found"));
        sos.setStatus(status);
        SosRequest saved = sosRepository.save(sos);
        messagingTemplate.convertAndSend("/topic/sos/" + saved.getId(), saved);
        if (saved.getAssignedHospitalId() != null) {
            messagingTemplate.convertAndSend("/topic/hospital/" + saved.getAssignedHospitalId(), saved);
        }
        return saved;
    }
}
