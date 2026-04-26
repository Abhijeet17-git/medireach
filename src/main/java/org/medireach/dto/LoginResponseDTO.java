package org.medireach.dto;

import lombok.Data;

@Data
public class LoginResponseDTO {
    private String token;
    private String role;
    private Long hospitalId;
    private String hospitalName;
    private String email;
}
