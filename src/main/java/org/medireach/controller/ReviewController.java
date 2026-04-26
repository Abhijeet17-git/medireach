package org.medireach.controller;
import lombok.RequiredArgsConstructor;
import org.medireach.model.Review;
import org.medireach.repository.ReviewRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewRepository reviewRepository;

    @GetMapping("/{hospitalId}")
    public List<Review> getReviews(@PathVariable Long hospitalId) {
        return reviewRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId);
    }

    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> body) {
        Long hospitalId = Long.valueOf(body.get("hospitalId").toString());
        String userEmail = body.get("userEmail").toString();
        Integer rating = Integer.valueOf(body.get("rating").toString());
        String comment = body.getOrDefault("comment", "").toString();

        Review review = new Review();
        review.setHospitalId(hospitalId);
        review.setUserEmail(userEmail);
        review.setRating(rating);
        review.setComment(comment);
        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @GetMapping("/{hospitalId}/summary")
    public ResponseEntity<?> getSummary(@PathVariable Long hospitalId) {
        Double avg = reviewRepository.findAvgRatingByHospitalId(hospitalId);
        long count = reviewRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId).size();
        return ResponseEntity.ok(Map.of(
            "avgRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
            "totalReviews", count
        ));
    }
}
