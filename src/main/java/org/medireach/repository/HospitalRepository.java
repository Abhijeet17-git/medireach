package org.medireach.repository;

import org.medireach.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    List<Hospital> findByActiveTrue();

    List<Hospital> findByCityAndActiveTrue(String city);

    List<Hospital> findByAvailableIcuBedsGreaterThanAndActiveTrue(Integer beds);

    @Query(value = """
        SELECT * FROM hospitals h
        WHERE h.is_active = 1
        AND (6371 * acos(
            cos(radians(:lat)) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(h.latitude))
        )) < :radiusKm
        ORDER BY (6371 * acos(
            cos(radians(:lat)) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(h.latitude))
        )) ASC
        """, nativeQuery = true)
    List<Hospital> findNearbyHospitals(
        @Param("lat") Double latitude,
        @Param("lng") Double longitude,
        @Param("radiusKm") Double radiusKm
    );

    @Query(value = """
        SELECT * FROM hospitals h
        WHERE h.is_active = 1
        AND h.available_icu_beds > 0
        AND (6371 * acos(
            cos(radians(:lat)) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(h.latitude))
        )) < :radiusKm
        ORDER BY (6371 * acos(
            cos(radians(:lat)) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(h.latitude))
        )) ASC
        LIMIT 1
        """, nativeQuery = true)
    Hospital findNearestHospitalWithIcuBed(
        @Param("lat") Double latitude,
        @Param("lng") Double longitude,
        @Param("radiusKm") Double radiusKm
    );

    @Query(value = """
        SELECT * FROM hospitals h
        WHERE h.is_active = 1
        AND h.available_icu_beds > 0
        AND (6371 * acos(
            cos(radians(:lat)) * cos(radians(h.latitude)) *
            cos(radians(h.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(h.latitude))
        )) < :radiusKm
        ORDER BY h.available_icu_beds DESC
        LIMIT 5
        """, nativeQuery = true)
    List<Hospital> findAllNearbyWithIcuBeds(
        @Param("lat") Double latitude,
        @Param("lng") Double longitude,
        @Param("radiusKm") Double radiusKm
    );
}
