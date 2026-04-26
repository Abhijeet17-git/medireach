package org.medireach.service;

import lombok.RequiredArgsConstructor;
import org.medireach.model.Hospital;
import org.medireach.repository.HospitalRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class HospitalSimulatorService {

    private final HospitalRepository hospitalRepository;
    private final Random random = new Random();

    @Scheduled(fixedRate = 30000)
    public void simulateLiveData() {
        List<Hospital> hospitals = hospitalRepository.findByActiveTrue();
        for (Hospital h : hospitals) {
            if (h.getTotalIcuBeds() != null && h.getAvailableIcuBeds() != null) {
                int delta = random.nextInt(3) - 1;
                int newIcu = Math.max(0, Math.min(h.getTotalIcuBeds(), h.getAvailableIcuBeds() + delta));
                h.setAvailableIcuBeds(newIcu);
            }
            if (h.getTotalGeneralBeds() != null && h.getAvailableGeneralBeds() != null) {
                int delta = random.nextInt(3) - 1;
                int newGeneral = Math.max(0, Math.min(h.getTotalGeneralBeds(), h.getAvailableGeneralBeds() + delta));
                h.setAvailableGeneralBeds(newGeneral);
            }
            if (h.getCurrentOpdWaiting() != null) {
                int delta = random.nextInt(5) - 2;
                int newOpd = Math.max(0, Math.min(60, h.getCurrentOpdWaiting() + delta));
                h.setCurrentOpdWaiting(newOpd);
            }
            hospitalRepository.save(h);
        }
        System.out.println("Live simulation updated " + hospitals.size() + " hospitals");
    }
}
