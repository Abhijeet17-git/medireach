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
        if (!"1234".equals(dto.getOtpCode()))
            throw new RuntimeException("OTP verification failed");

        String bedType = dto.getBedType().toUpperCase();
        ensureCapacityAvailable(hospital, bedType);

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
        booking.setStatus("PENDING");
        if (dto.getScheduledTime() != null && !dto.getScheduledTime().isEmpty())
            booking.setScheduledTime(LocalDateTime.parse(dto.getScheduledTime()));

        Booking saved = bookingRepository.save(booking);

        BookingResponseDTO response = new BookingResponseDTO();
        response.setBookingId(saved.getId());
        response.setPatientName(saved.getPatientName());
        response.setPatientEmail(saved.getPatientEmail());
        response.setHospitalName(hospital.getName());
        response.setBedType(bedType);
        response.setStatus("PENDING");
        response.setReason(saved.getReason());
        response.setAvailableBedsAfterBooking(currentAvailability(hospital, bedType));
        response.setBookingTime(saved.getBookingTime());
        response.setScheduledTime(saved.getScheduledTime());
        response.setMessage("Booking request sent to " + hospital.getName() + ". Waiting for hospital confirmation. Booking ID: #" + saved.getId());
        return response;
    }

    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, String patientEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getPatientEmail().equals(patientEmail))
            throw new RuntimeException("Unauthorized");

        if ("CANCELLED".equals(booking.getStatus()) || "REJECTED".equals(booking.getStatus()) || "HOSPITAL_CANCELLED".equals(booking.getStatus()))
            throw new RuntimeException("Already cancelled");

        Hospital hospital = hospitalRepository.findById(booking.getHospitalId()).orElse(null);
        if (hospital != null && "CONFIRMED".equals(booking.getStatus())) {
            restoreCapacity(hospital, booking.getBedType());
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

    @Transactional
    public BookingResponseDTO hospitalUpdateBookingStatus(Long bookingId, Long hospitalId, String nextStatus) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getHospitalId().equals(hospitalId))
            throw new RuntimeException("Unauthorized hospital access");

        Hospital hospital = hospitalRepository.findById(hospitalId)
            .orElseThrow(() -> new RuntimeException("Hospital not found"));

        String status = nextStatus.toUpperCase();
        if ("CONFIRMED".equals(status)) {
            if (!"PENDING".equals(booking.getStatus()))
                throw new RuntimeException("Only pending bookings can be accepted");
            ensureCapacityAvailable(hospital, booking.getBedType());
            consumeCapacity(hospital, booking.getBedType());
            booking.setStatus("CONFIRMED");
            hospitalRepository.save(hospital);
        } else if ("REJECTED".equals(status)) {
            if ("REJECTED".equals(booking.getStatus()) || "HOSPITAL_CANCELLED".equals(booking.getStatus()))
                throw new RuntimeException("Booking is already closed");
            if ("CONFIRMED".equals(booking.getStatus())) {
                restoreCapacity(hospital, booking.getBedType());
                hospitalRepository.save(hospital);
                booking.setStatus("HOSPITAL_CANCELLED");
            } else {
                booking.setStatus("REJECTED");
            }
            if ("CANCELLED".equals(booking.getStatus()))
                throw new RuntimeException("Cancelled bookings cannot be updated");
        } else {
            throw new RuntimeException("Invalid status");
        }

        Booking saved = bookingRepository.save(booking);
        BookingResponseDTO response = new BookingResponseDTO();
        response.setBookingId(saved.getId());
        response.setPatientName(saved.getPatientName());
        response.setPatientEmail(saved.getPatientEmail());
        response.setHospitalName(saved.getHospitalName());
        response.setBedType(saved.getBedType());
        response.setStatus(saved.getStatus());
        response.setReason(saved.getReason());
        response.setBookingTime(saved.getBookingTime());
        response.setScheduledTime(saved.getScheduledTime());
        response.setAvailableBedsAfterBooking(currentAvailability(hospital, saved.getBedType()));
        response.setMessage(
            "CONFIRMED".equals(saved.getStatus()) ? "Booking accepted successfully."
            : "HOSPITAL_CANCELLED".equals(saved.getStatus()) ? "Confirmed booking cancelled by hospital."
            : "Booking rejected by hospital."
        );
        return response;
    }

    public List<Booking> getMyBookings(String email) {
        return bookingRepository.findByPatientEmailOrderByBookingTimeDesc(email);
    }

    public List<Booking> getHospitalBookings(Long hospitalId) {
        return bookingRepository.findByHospitalIdOrderByBookingTimeDesc(hospitalId);
    }

    private void ensureCapacityAvailable(Hospital hospital, String bedType) {
        switch (bedType) {
            case "ICU" -> {
                if (hospital.getAvailableIcuBeds() == null || hospital.getAvailableIcuBeds() <= 0)
                    throw new RuntimeException("No ICU beds available");
            }
            case "GENERAL" -> {
                if (hospital.getAvailableGeneralBeds() == null || hospital.getAvailableGeneralBeds() <= 0)
                    throw new RuntimeException("No General beds available");
            }
            case "OPD" -> {
                if (hospital.getCurrentOpdWaiting() == null) hospital.setCurrentOpdWaiting(0);
            }
            default -> throw new RuntimeException("Invalid bed type. Use ICU, GENERAL, or OPD");
        }
    }

    private void consumeCapacity(Hospital hospital, String bedType) {
        switch (bedType) {
            case "ICU" -> hospital.setAvailableIcuBeds(hospital.getAvailableIcuBeds() - 1);
            case "GENERAL" -> hospital.setAvailableGeneralBeds(hospital.getAvailableGeneralBeds() - 1);
            case "OPD" -> hospital.setCurrentOpdWaiting((hospital.getCurrentOpdWaiting() != null ? hospital.getCurrentOpdWaiting() : 0) + 1);
            default -> throw new RuntimeException("Invalid bed type. Use ICU, GENERAL, or OPD");
        }
    }

    private void restoreCapacity(Hospital hospital, String bedType) {
        switch (bedType) {
            case "ICU" -> hospital.setAvailableIcuBeds((hospital.getAvailableIcuBeds() != null ? hospital.getAvailableIcuBeds() : 0) + 1);
            case "GENERAL" -> hospital.setAvailableGeneralBeds((hospital.getAvailableGeneralBeds() != null ? hospital.getAvailableGeneralBeds() : 0) + 1);
            case "OPD" -> hospital.setCurrentOpdWaiting(Math.max(0, (hospital.getCurrentOpdWaiting() != null ? hospital.getCurrentOpdWaiting() : 1) - 1));
            default -> throw new RuntimeException("Invalid bed type. Use ICU, GENERAL, or OPD");
        }
    }

    private int currentAvailability(Hospital hospital, String bedType) {
        return switch (bedType) {
            case "ICU" -> hospital.getAvailableIcuBeds() != null ? hospital.getAvailableIcuBeds() : 0;
            case "GENERAL" -> hospital.getAvailableGeneralBeds() != null ? hospital.getAvailableGeneralBeds() : 0;
            case "OPD" -> hospital.getCurrentOpdWaiting() != null ? hospital.getCurrentOpdWaiting() : 0;
            default -> 0;
        };
    }
}
