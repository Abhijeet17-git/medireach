package org.medireach.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class TestController {

    @Value("${gemini.api.key}")
    private String geminiKey;

    @GetMapping("/key")
    public String checkKey() {
        return "Key starts with: " + geminiKey.substring(0, 10) + "...";
    }
}
