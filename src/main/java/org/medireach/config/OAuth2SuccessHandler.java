package org.medireach.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.medireach.model.Hospital;
import org.medireach.model.User;
import org.medireach.repository.HospitalRepository;
import org.medireach.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setPassword("GOOGLE_AUTH");
            newUser.setRole("USER");
            newUser.setVerified(true);
            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), user.getHospitalId());

        String hospitalId   = user.getHospitalId() != null ? String.valueOf(user.getHospitalId()) : "";
        String hospitalName = "";
        if (user.getHospitalId() != null) {
            hospitalName = hospitalRepository.findById(user.getHospitalId())
                .map(Hospital::getName).orElse("");
        }

        String redirectUrl = "http://localhost:3000/auth/callback"
            + "?token="        + URLEncoder.encode(token, StandardCharsets.UTF_8)
            + "&email="        + URLEncoder.encode(email != null ? email : "", StandardCharsets.UTF_8)
            + "&role="         + URLEncoder.encode(user.getRole(), StandardCharsets.UTF_8)
            + "&hospitalId="   + hospitalId
            + "&hospitalName=" + URLEncoder.encode(hospitalName, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
