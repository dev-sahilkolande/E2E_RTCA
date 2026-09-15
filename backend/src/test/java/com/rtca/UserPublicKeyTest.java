package com.rtca;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rtca.dto.PublicKeyRegisterRequest;
import com.rtca.dto.RegisterRequest;
import com.rtca.repository.ConversationRepository;
import com.rtca.repository.MessageRepository;
import com.rtca.repository.UserPublicKeyRepository;
import com.rtca.repository.UserRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class UserPublicKeyTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPublicKeyRepository publicKeyRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String userToken;
    private Long userId;

    @BeforeEach
    void setUp() throws Exception {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        publicKeyRepository.deleteAll();
        userRepository.deleteAll();

        RegisterRequest regReq = new RegisterRequest("key_user", "keyuser@example.com", "password123");
        MvcResult res = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regReq))).andReturn();

        userToken = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("token").asText();
        userId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();
    }

    @Test
    @DisplayName("POST & GET /api/users/keys - Register and Retrieve E2EE Public Keys")
    void testPublicKeyRegistrationAndRetrieval() throws Exception {
        String mockEcdh = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEecdhKeyMockString123456789=";
        String mockEcdsa = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEecdsaKeyMockString987654321=";

        PublicKeyRegisterRequest req = new PublicKeyRegisterRequest(mockEcdh, mockEcdsa);

        // Register Public Keys
        mockMvc.perform(post("/api/users/keys")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.userId", is(userId.intValue())))
                .andExpect(jsonPath("$.data.publicEcdhKey", is(mockEcdh)))
                .andExpect(jsonPath("$.data.publicEcdsaKey", is(mockEcdsa)));

        // Retrieve Public Keys
        mockMvc.perform(get("/api/users/" + userId + "/keys")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.userId", is(userId.intValue())))
                .andExpect(jsonPath("$.data.publicEcdhKey", is(mockEcdh)))
                .andExpect(jsonPath("$.data.publicEcdsaKey", is(mockEcdsa)));
    }
}
