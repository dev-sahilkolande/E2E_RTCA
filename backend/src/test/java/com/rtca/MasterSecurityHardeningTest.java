package com.rtca;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rtca.dto.ChatMessageRequest;
import com.rtca.dto.CreateConversationRequest;
import com.rtca.dto.RegisterRequest;
import com.rtca.repository.ConversationRepository;
import com.rtca.repository.MessageRepository;
import com.rtca.repository.UserRepository;
import com.rtca.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class MasterSecurityHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.rtca.repository.UserPublicKeyRepository publicKeyRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private String userAToken;
    private Long userAId;
    private String userBToken;
    private Long userBId;
    private String userCToken;
    private Long userCId;
    private Long conversationId;

    @BeforeEach
    void setUp() throws Exception {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        publicKeyRepository.deleteAll();
        userRepository.deleteAll();

        // Register User A
        RegisterRequest reqA = new RegisterRequest("sec_user_a", "sec_a@example.com", "password123");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqA))).andReturn();
        userAToken = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("token").asText();
        userAId = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Register User B
        RegisterRequest reqB = new RegisterRequest("sec_user_b", "sec_b@example.com", "password123");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqB))).andReturn();
        userBToken = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("token").asText();
        userBId = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Register User C
        RegisterRequest reqC = new RegisterRequest("sec_user_c", "sec_c@example.com", "password123");
        MvcResult resC = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqC))).andReturn();
        userCToken = objectMapper.readTree(resC.getResponse().getContentAsString()).path("data").path("token").asText();
        userCId = objectMapper.readTree(resC.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Create direct conversation between User A and User B
        CreateConversationRequest createReq = new CreateConversationRequest(userBId);
        MvcResult convRes = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
        conversationId = objectMapper.readTree(convRes.getResponse().getContentAsString()).path("data").path("id").asLong();
    }

    @Test
    @DisplayName("Security Audit: Password hash field is never exposed in JSON responses")
    void testPasswordPrivacyAudit() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertFalse(body.contains("password"));
        assertFalse(body.contains("password123"));
    }

    @Test
    @DisplayName("Validation: Rejection of Blank Message Submission")
    void testBlankMessageRejection() throws Exception {
        ChatMessageRequest blankReq = new ChatMessageRequest(conversationId, "   ");
        mockMvc.perform(post("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Validation: Rejection of Oversized Message Payload")
    void testOversizedMessageRejection() throws Exception {
        String oversizedContent = "a".repeat(5001);
        ChatMessageRequest bigReq = new ChatMessageRequest(conversationId, oversizedContent);

        mockMvc.perform(post("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bigReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Security: Malformed/Invalid JWT Token Rejection")
    void testInvalidJwtTokenRejection() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token.string"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("Security: Unauthorized Non-Participant History Access Blocked")
    void testUnauthorizedUserHistoryAccessBlocked() throws Exception {
        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Access Denied")));
    }
}
