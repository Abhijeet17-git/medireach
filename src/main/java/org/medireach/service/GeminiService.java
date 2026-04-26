package org.medireach.service;

import org.medireach.dto.SymptomRequestDTO;
import org.medireach.dto.SymptomResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String geminiUrl;

    public SymptomResponseDTO assessSymptoms(SymptomRequestDTO request) {
        String prompt = "You are an expert medical triage assistant. Analyze carefully and do NOT over-escalate. "
            + "Patient Age: " + request.getAge()
            + ". Symptoms: " + request.getSymptoms()
            + ". Existing Conditions: " + request.getExistingConditions()
            + ". Rules: Headache/mild pain = BOOK_APPOINTMENT or MONITOR_AT_HOME. Chest pain with breathlessness = URGENT_CARE. Heart attack/stroke/unconscious = ICU_IMMEDIATELY. Fever/cold/cough = MONITOR_AT_HOME. "
            + "Respond ONLY in this exact JSON format, no markdown, no extra text: "
            + "{\"urgencyLevel\":\"MONITOR_AT_HOME\",\"recommendation\":\"your text\",\"reasoning\":\"your text\",\"speciality\":\"General Medicine\"}"
            + ". urgencyLevel must be exactly one of: ICU_IMMEDIATELY, URGENT_CARE, GENERAL_OPD, BOOK_APPOINTMENT, MONITOR_AT_HOME";

        try {
            String response = callGemini(prompt);
            System.out.println("Gemini extracted text: " + response);
            return parseSymptomResponse(response);
        } catch (Exception e) {
            System.err.println("Gemini assessSymptoms error: " + e.getMessage());
            e.printStackTrace();
            SymptomResponseDTO dto = new SymptomResponseDTO();
            dto.setUrgencyLevel("GENERAL_OPD");
            dto.setRecommendation("Please visit a doctor for proper assessment.");
            dto.setReasoning("AI service temporarily unavailable: " + e.getMessage());
            return dto;
        }
    }

    public Long recommendBestHospital(java.util.List<org.medireach.model.Hospital> hospitals, String emergencyDetails) {
        if (hospitals == null || hospitals.isEmpty()) return null;
        if (hospitals.size() == 1) return hospitals.get(0).getId();

        StringBuilder hospitalList = new StringBuilder();
        for (int i = 0; i < hospitals.size(); i++) {
            org.medireach.model.Hospital h = hospitals.get(i);
            hospitalList.append("Hospital ").append(i + 1).append(": ")
                .append("ID=").append(h.getId()).append(", ")
                .append("Name=").append(h.getName()).append(", ")
                .append("ICU Beds=").append(h.getAvailableIcuBeds()).append(", ")
                .append("General Beds=").append(h.getAvailableGeneralBeds()).append(", ")
                .append("OPD Wait=").append(h.getCurrentOpdWaiting()).append(" min, ")
                .append("Ambulance=").append(h.getAmbulanceAvailable()).append(", ")
                .append("Specialities=").append(h.getSpecialities()).append("\n");
        }

        String prompt = "You are a medical dispatch AI. Emergency: " + emergencyDetails
            + ". Choose the BEST hospital for this patient from the list below. "
            + "Consider: ICU bed availability (most important), OPD wait time (lower is better), ambulance availability, relevant specialities. "
            + "Respond ONLY with this exact JSON, no markdown: {\"hospitalId\":1,\"reason\":\"brief reason\"} "
            + "Use the exact ID number from the list.\n\nHospitals:\n" + hospitalList;

        try {
            String response = callGemini(prompt);
            System.out.println("Gemini hospital response: " + response);
            // Strip markdown backticks
            String clean = response.replaceAll("```json", "").replaceAll("```", "").trim();
            String idStr = extractField(clean, "hospitalId");
            System.out.println("Gemini picked hospital ID: " + idStr);
            return Long.valueOf(idStr.trim());
        } catch (Exception e) {
            System.err.println("Gemini hospital recommendation error: " + e.getMessage());
            return hospitals.get(0).getId();
        }
    }

    public String predictWaitTime(Long hospitalId, Integer currentOccupancy, Integer admissionRate) {
        String prompt = "Hospital occupancy: " + currentOccupancy + "%, admission rate: "
            + admissionRate + " per hour. Predict OPD wait time. "
            + "Respond ONLY in this exact JSON, no markdown: "
            + "{\"estimatedWaitMinutes\":30,\"confidence\":\"HIGH\",\"suggestion\":\"advice\"}";
        try {
            return callGemini(prompt);
        } catch (Exception e) {
            System.err.println("Gemini waitTime error: " + e.getMessage());
            return "{\"estimatedWaitMinutes\":30,\"confidence\":\"LOW\",\"suggestion\":\"Check with hospital directly.\"}";
        }
    }

    private String callGemini(String prompt) throws Exception {
        // Build JSON body safely
        String body = buildRequestBody(prompt);

        System.out.println("Calling Gemini: " + geminiUrl);
        URL url = new URL(geminiUrl + "?key=" + apiKey);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(body.getBytes(StandardCharsets.UTF_8));
        }

        int code = conn.getResponseCode();
        System.out.println("Gemini response code: " + code);

        if (code != 200) {
            StringBuilder err = new StringBuilder();
            try (Scanner s = new Scanner(conn.getErrorStream())) {
                while (s.hasNextLine()) err.append(s.nextLine());
            }
            System.err.println("Gemini error body: " + err);
            throw new RuntimeException("Gemini HTTP " + code + ": " + err);
        }

        StringBuilder resp = new StringBuilder();
        try (Scanner s = new Scanner(conn.getInputStream(), StandardCharsets.UTF_8)) {
            while (s.hasNextLine()) resp.append(s.nextLine()).append("\n");
        }

        String full = resp.toString();
        System.out.println("Full Gemini response: " + full);

        // Extract the text value from: "text": "..."
        // Uses a safer extraction that handles escaped quotes inside the text
        return extractTextFromGeminiResponse(full);
    }

    private String buildRequestBody(String prompt) {
        // Safely escape the prompt for JSON
        String escaped = prompt
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");

        return "{\"contents\":[{\"role\":\"user\",\"parts\":[{\"text\":\"" + escaped + "\"}]}],"
            + "\"generationConfig\":{\"temperature\":0.4,\"maxOutputTokens\":300}}";
    }

    private String extractTextFromGeminiResponse(String fullJson) {
        // Find "text": " then extract until the closing " that's followed by \n or }
        // The Gemini response structure is: ...,"text": "...actual content..."},...
        int textKeyIdx = fullJson.indexOf("\"text\":");
        if (textKeyIdx == -1) throw new RuntimeException("No 'text' field in Gemini response");

        int quoteStart = fullJson.indexOf("\"", textKeyIdx + 7);
        if (quoteStart == -1) throw new RuntimeException("No opening quote for text value");

        // Walk forward char by char, respecting escaped quotes
        StringBuilder result = new StringBuilder();
        int i = quoteStart + 1;
        while (i < fullJson.length()) {
            char c = fullJson.charAt(i);
            if (c == '\\' && i + 1 < fullJson.length()) {
                char next = fullJson.charAt(i + 1);
                if (next == '"') { result.append('"'); i += 2; continue; }
                if (next == 'n') { result.append('\n'); i += 2; continue; }
                if (next == 't') { result.append('\t'); i += 2; continue; }
                if (next == '\\') { result.append('\\'); i += 2; continue; }
                result.append(next); i += 2; continue;
            }
            if (c == '"') break; // end of text value
            result.append(c);
            i++;
        }

        String extracted = result.toString().trim();
        System.out.println("Extracted text: " + extracted);
        return extracted;
    }

    private SymptomResponseDTO parseSymptomResponse(String json) {
        SymptomResponseDTO dto = new SymptomResponseDTO();
        try {
            // Strip markdown fences if Gemini added them anyway
            json = json.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
            dto.setUrgencyLevel(extractField(json, "urgencyLevel"));
            dto.setRecommendation(extractField(json, "recommendation"));
            dto.setReasoning(extractField(json, "reasoning"));

            // Validate urgency level
            String u = dto.getUrgencyLevel();
            if (!u.equals("ICU_IMMEDIATELY") && !u.equals("URGENT_CARE") && !u.equals("GENERAL_OPD") && !u.equals("BOOK_APPOINTMENT") && !u.equals("MONITOR_AT_HOME")) {
                dto.setUrgencyLevel("GENERAL_OPD");
            }
        } catch (Exception e) {
            System.err.println("Parse error: " + e.getMessage() + " | JSON: " + json);
            dto.setUrgencyLevel("GENERAL_OPD");
            dto.setRecommendation("Please visit a doctor.");
            dto.setReasoning("Response parsing issue.");
        }
        return dto;
    }

    private String extractField(String json, String field) {
        try {
            String key = "\"" + field + "\"";
            int keyIdx = json.indexOf(key);
            if (keyIdx == -1) return "N/A";
            int colon = json.indexOf(":", keyIdx + key.length());
            int qStart = json.indexOf("\"", colon + 1);
            // Walk forward respecting escaped quotes
            StringBuilder val = new StringBuilder();
            int i = qStart + 1;
            while (i < json.length()) {
                char c = json.charAt(i);
                if (c == '\\' && i + 1 < json.length()) {
                    val.append(json.charAt(i + 1));
                    i += 2; continue;
                }
                if (c == '"') break;
                val.append(c);
                i++;
            }
            return val.toString().trim();
        } catch (Exception e) {
            return "N/A";
        }
    }
}
