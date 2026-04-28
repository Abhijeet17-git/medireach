package org.medireach.repository;

import org.medireach.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByPatientEmailOrderByBookingTimeDesc(String email);
    List<Booking> findByHospitalIdOrderByBookingTimeDesc(Long hospitalId);
}
