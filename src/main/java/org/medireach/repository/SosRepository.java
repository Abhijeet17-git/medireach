package org.medireach.repository;

import org.medireach.model.SosRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SosRepository extends JpaRepository<SosRequest, Long> {
    List<SosRequest> findByStatus(String status);
    List<SosRequest> findByPatientPhone(String phone);
    List<SosRequest> findByPatientEmailOrderByRequestedAtDesc(String email);
    List<SosRequest> findByAssignedHospitalIdAndStatusNotOrderByRequestedAtDesc(Long hospitalId, String status);
}
