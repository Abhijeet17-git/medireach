package org.medireach.repository;
import org.medireach.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
    boolean existsByHospitalIdAndUserEmail(Long hospitalId, String userEmail);
    void deleteByHospitalId(Long hospitalId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.hospitalId = :hospitalId")
    Double findAvgRatingByHospitalId(Long hospitalId);
}
