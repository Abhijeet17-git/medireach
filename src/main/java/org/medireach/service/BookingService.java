package org.medireach.service;

import lombok.RequiredArgsConstructor;
import org.medireach.dto.BookingRequestDTO;
import org.medireach.dto.BookingResponseDTO;
import org.medireach.model.Booking;
import org.medireach.model.Hospital;
import org.medireach.repository.BookingRepository;
import org.medireach.repository.HospitalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final HospitalRepository hospitalRepository;

    @Transactional
    public BookingResponseDTO bookBed(BookingRequestDTO dto) {
        Hospital hospital = hospitalRepository.findById(dto.getHospitalId())
            .orElseThrow(() -> new RuntimeException("Hospital not found"));

        if (!Boolean.TRUE.equals(hospital.getActive()))
            throw new RuntimeException("Hospital is not active");

        String bedType = dto.getBedType().toUpperCase();
        int availableAfter;

        switch (bedType) {
            case "ICU" -> {
                if (hospital.getAvailableIcuBeds() == null || hospital.getAvailableIcuBeds() <= 0)
                    throw new RuntimeException("No ICU beds available");
                hospital.setAvailableIcuBeds(hospital.getAvailableIcuBeds() - 1);
                availableAfter = hospital.getAvailableIcuBeds();
            }
            case "GENERAL" -> {
                if (hospital.getAvailableGeneralBeds() == null || hospital.getAvailableGeneralBeds() <= 0)
                    throw new RuntimeException("No General beds available");
                hospital.setAvailableGeneralBeds(hospital.getAvailableGeneralBeds() - 1);
                availableAfter = hospital.getAvailableGeneralBeds();
            }
            case "OPD" -> {
                int waiting = hospital.getCurrentOpdWaiting() != null ? hospital.getCurrentOpdWaiting() : 0;
                hospital.setCurrentOpdWaiting(waiting + 1);
                availableAfter = waiting + 1;
            }
            default -> throw new RuntimeException("Invalid bed type. Use ICU, GENERAL, or OPD");
        }

        hospitalRepository.save(hospital);

        Booking booking = new Booking();
        booking.setPatientName(dto.getPatientName());
        booking.setPatientEmail(dto.getPatientEmail());
        booking.setPatientPhone(dto.getPatientPhone());
        booking.setPatientAge(dto.getPatientAge());
        booking.setHospitalId(hospital.getId());
        booking.setHospitalName(hospital.getName());
        booking.setBedType(bedType);
        booking.setReason(dto.getReason());
        booking.setSpecialityRequested(dto.getSpecialityRequested());
        booking.setStatus("CONFIRMED");
        if (dto.getScheduledTime() != null && !dto.getScheduledTime().isEmpty())
            booking.setScheduledTime(LocalDateTime.parse(dto.getScheduledTime()));

        Booking saved = bookingRepository.save(booking);

        BookingResponseDTO response = new BookingResponseDTO();
        response.setBookingId(saved.getId());
        response.setPatientName(saved.getPatientName());
        response.setPatientEmail(saved.getPatientEmail());
        response.setHospitalName(hospital.getName());
        response.setBedType(bedType);
        response.setStatus("CONFIRMED");
        response.setReason(saved.getReason());
        response.setAvailableBedsAfterBooking(availableAfter);
        response.setBookingTime(saved.getBookingTime());
        response.setScheduledTime(saved.getScheduledTime());
        response.setMessage("Bed booked at " + hospital.getName() + ". Booking ID: #" + saved.getId());
        return response;
    }

    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, String patientEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getPatientEmail().equals(patientEmail))
            throw new RuntimeException("Unauthorized");

        if ("CANCELLED".equals(booking.getStatus()))
            throw new RuntimeException("Already cancelled");

        Hospital hospital = hospitalRepository.findById(booking.getHospitalId()).orElse(null);
        if (hospital != null) {
            switch (booking.getBedType()) {
                case "ICU" -> hospital.setAvailableIcuBeds((hospital.getAvailableIcuBeds() != null ? hospital.getAvailableIcuBeds() : 0) + 1);
                case "GENERAL" -> hospital.setAvailableGeneralBeds((hospital.getAvailableGeneralBeds() != null ? hospital.getAvailableGeneralBeds() : 0) + 1);
                case "OPD" -> hospital.setCurrentOpdWaiting(Math.max(0, (hospital.getCurrentOpdWaiting() != null ? hospital.getCurrentOpdWaiting() : 1) - 1));
            }
            hospitalRepository.save(hospital);
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        BookingResponseDTO response = new BookingResponseDTO();
        response.setBookingId(booking.getId());
        response.setStatus("CANCELLED");
        response.setMessage("Booking #" + bookingId + " cancelled successfully.");
        return response;
    }

    public List<Booking> getMyBookings(String email) {
        return bookingRepository.findByPatientEmailOrderByBookingTimeDesc(email);
    }

    public List<Booking> getHospitalBookings(Long hospitalId) {
        return bookingRepository.findByHospitalIdOrderByBookingTimeDesc(hospitalId);
    }
}
