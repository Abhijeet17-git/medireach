package org.medireach.repository;

import org.medireach.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findBySosId(Long sosId);
    List<Payment> findByPatientEmail(String email);
    Optional<Payment> findByRazorpayOrderId(String orderId);
}
