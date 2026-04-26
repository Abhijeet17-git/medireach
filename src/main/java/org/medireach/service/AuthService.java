package org.medireach.service;

import lombok.RequiredArgsConstructor;
import org.medireach.config.JwtUtil;
import org.medireach.dto.*;
import org.medireach.model.Hospital;
import org.medireach.model.User;
import org.medireach.repository.HospitalRepository;
import org.medireach.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponseDTO registerHospital(RegisterHospitalDTO dto) {
        // Check if email exists
        if (userRepository.existsByEmail(dto.getAdminEmail())) {
            throw new RuntimeException("Email already registered!");
        }

        // Save hospital
        Hospital hospital = new Hospital();
        hospital.setName(dto.getHospitalName());
        hospital.setAddress(dto.getAddress());
        hospital.setCity(dto.getCity());
        hospital.setPhone(dto.getPhone());
        hospital.setLatitude(dto.getLatitude());
        hospital.setLongitude(dto.getLongitude());
        hospital.setTotalIcuBeds(dto.getTotalIcuBeds());
        hospital.setAvailableIcuBeds(dto.getTotalIcuBeds());
        hospital.setTotalGeneralBeds(dto.getTotalGeneralBeds());
        hospital.setAvailableGeneralBeds(dto.getTotalGeneralBeds());
        hospital.setTotalOpd(dto.getTotalOpd());
        hospital.setCurrentOpdWaiting(0);
        hospital.setAmbulanceAvailable(dto.getAmbulanceAvailable());
        hospital.setAmbulancePhone(dto.getAmbulancePhone());
        hospital.setSpecialities(dto.getSpecialities());
        hospital.setActive(true);
        hospital.setDriveLink(dto.getDriveLink());
        Hospital savedHospital = hospitalRepository.save(hospital);

        // Save user
        User user = new User();
        user.setEmail(dto.getAdminEmail());
        user.setPassword(passwordEncoder.encode(dto.getAdminPassword()));
        user.setRole("HOSPITAL_ADMIN");
        user.setHospitalId(savedHospital.getId());
        user.setVerified(true);
        userRepository.save(user);

        // Generate token
        String token = jwtUtil.generateToken(
            user.getEmail(),
            user.getRole(),
            savedHospital.getId()
        );

        // Return response
        LoginResponseDTO response = new LoginResponseDTO();
        response.setToken(token);
        response.setRole(user.getRole());
        response.setHospitalId(savedHospital.getId());
        response.setHospitalName(savedHospital.getName());
        response.setEmail(user.getEmail());
        return response;
    }

    public LoginResponseDTO login(LoginRequestDTO dto) {
        User user = userRepository.findByEmail(dto.getEmail())
            .orElseThrow(() -> new RuntimeException("Email not found!"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Wrong password!");
        }

        String token = jwtUtil.generateToken(
            user.getEmail(),
            user.getRole(),
            user.getHospitalId()
        );

        Hospital hospital = user.getHospitalId() != null ?
            hospitalRepository.findById(user.getHospitalId()).orElse(null) : null;

        LoginResponseDTO response = new LoginResponseDTO();
        response.setToken(token);
        response.setRole(user.getRole());
        response.setHospitalId(user.getHospitalId());
        response.setHospitalName(hospital != null ? hospital.getName() : null);
        response.setEmail(user.getEmail());
        return response;
    }
}
