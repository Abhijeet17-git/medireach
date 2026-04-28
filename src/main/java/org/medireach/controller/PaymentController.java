package org.medireach.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.medireach.model.Payment;
import org.medireach.repository.BookingRepository;
import org.medireach.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            Integer amount = Integer.valueOf(body.get("amount").toString());
            String patientEmail = body.getOrDefault("patientEmail", "").toString();
            String purpose = body.getOrDefault("purpose", "SOS").toString().toUpperCase();
            Object referenceId = body.get("sosId");

            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject options = new JSONObject();
            options.put("amount", amount * 100); // paise
            options.put("currency", "INR");
            options.put("receipt", purpose.toLowerCase() + "_" + System.currentTimeMillis());

            Order order = client.orders.create(options);

            Payment payment = new Payment();
            if (referenceId != null) {
                Long parsedReferenceId = Long.valueOf(referenceId.toString());
                if ("BOOKING".equals(purpose)) payment.setBookingId(parsedReferenceId);
                else payment.setSosId(parsedReferenceId);
            }
            payment.setPurpose(purpose);
            payment.setRazorpayOrderId(order.get("id"));
            payment.setAmount(amount);
            payment.setStatus("CREATED");
            payment.setPatientEmail(patientEmail);
            paymentRepository.save(payment);

            return ResponseEntity.ok(Map.of(
                "orderId", order.get("id").toString(),
                "amount", amount * 100,
                "currency", "INR",
                "keyId", keyId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Payment creation failed: " + e.getMessage());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        try {
            String orderId = body.get("razorpay_order_id");
            String paymentId = body.get("razorpay_payment_id");
            String signature = body.get("razorpay_signature");

            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);

            boolean valid = Utils.verifyPaymentSignature(attributes, keySecret);
            if (!valid) return ResponseEntity.badRequest().body("Invalid payment signature");

            Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(orderId);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                payment.setRazorpayPaymentId(paymentId);
                payment.setRazorpaySignature(signature);
                payment.setStatus("PAID");
                paymentRepository.save(payment);
            }

            return ResponseEntity.ok(Map.of("status", "PAID", "paymentId", paymentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Verification failed: " + e.getMessage());
        }
    }

    @PostMapping("/attach-booking")
    public ResponseEntity<?> attachBookingPayment(@RequestBody Map<String, String> body, Authentication authentication) {
        try {
            if (authentication == null || !authentication.getAuthorities().stream().anyMatch(a -> "ROLE_USER".equals(a.getAuthority()))) {
                return ResponseEntity.status(403).body("Please login as a user to attach booking payment");
            }

            Long bookingId = Long.valueOf(body.get("bookingId"));
            String orderId = body.get("orderId");

            if (bookingRepository.findById(bookingId).filter(b -> authentication.getName().equals(b.getPatientEmail())).isEmpty()) {
                return ResponseEntity.status(403).body("You can only attach payment to your own booking");
            }

            Optional<Payment> paymentOpt = paymentRepository.findByRazorpayOrderId(orderId);
            if (paymentOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Payment order not found");
            }

            Payment payment = paymentOpt.get();
            if (!authentication.getName().equals(payment.getPatientEmail())) {
                return ResponseEntity.status(403).body("Payment does not belong to this user");
            }

            payment.setPurpose("BOOKING");
            payment.setBookingId(bookingId);
            paymentRepository.save(payment);
            return ResponseEntity.ok(Map.of("status", payment.getStatus(), "bookingId", bookingId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Could not attach booking payment: " + e.getMessage());
        }
    }

    @GetMapping("/status/{sosId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Long sosId) {
        return paymentRepository.findBySosId(sosId)
            .map(p -> ResponseEntity.ok(Map.of("status", p.getStatus(), "paymentId", p.getRazorpayPaymentId() != null ? p.getRazorpayPaymentId() : "")))
            .orElse(ResponseEntity.ok(Map.of("status", "NOT_PAID")));
    }
}
