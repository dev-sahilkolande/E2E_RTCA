package com.rtca;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rtca.dto.CreateConversationRequest;
import com.rtca.dto.RegisterRequest;
import com.rtca.repository.ConversationRepository;
import com.rtca.repository.MessageRepository;
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
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class UserDiscoveryConversationTest {

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
    private ObjectMapper objectMapper;

    private String userAToken;
    private Long userAId;
    private String userBToken;
    private Long userBId;
    private String userCToken;
    private Long userCId;

    @BeforeEach
    void setUp() throws Exception {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        publicKeyRepository.deleteAll();
        userRepository.deleteAll();

        // Register User A
        RegisterRequest reqA = new RegisterRequest("user_a", "usera@example.com", "password123");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqA))).andReturn();
        userAToken = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("token").asText();
        userAId = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Register User B
        RegisterRequest reqB = new RegisterRequest("user_b", "userb@example.com", "password123");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqB))).andReturn();
        userBToken = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("token").asText();
        userBId = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Register User C
        RegisterRequest reqC = new RegisterRequest("user_c", "userc@example.com", "password123");
        MvcResult resC = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqC))).andReturn();
        userCToken = objectMapper.readTree(resC.getResponse().getContentAsString()).path("data").path("token").asText();
        userCId = objectMapper.readTree(resC.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();
    }

    @Test
    @DisplayName("GET /api/users/search - Search Users excluding self")
    void testUserSearchExcludesSelf() throws Exception {
        mockMvc.perform(get("/api/users/search?query=user")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].username", containsInAnyOrder("user_b", "user_c")))
                .andExpect(jsonPath("$.data[*].username", not(hasItem("user_a"))));
    }

    @Test
    @DisplayName("POST /api/conversations - Create & Pair Uniqueness Verification")
    void testCreateAndPairUniqueness() throws Exception {
        CreateConversationRequest request = new CreateConversationRequest(userBId);

        // First call creates conversation
        MvcResult res1 = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.participants", hasSize(2)))
                .andReturn();

        Long convId1 = objectMapper.readTree(res1.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Second call with User B to User A returns same conversation ID
        CreateConversationRequest requestReverse = new CreateConversationRequest(userAId);
        MvcResult res2 = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestReverse)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andReturn();

        Long convId2 = objectMapper.readTree(res2.getResponse().getContentAsString()).path("data").path("id").asLong();

        assertEquals(convId1, convId2);
        assertEquals(1, conversationRepository.count());
    }

    @Test
    @DisplayName("GET /api/conversations/{id} - Unauthorized Access Rejection")
    void testUnauthorizedConversationAccess() throws Exception {
        // User A creates chat with User B
        CreateConversationRequest request = new CreateConversationRequest(userBId);
        MvcResult res = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        Long convId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("id").asLong();

        // User C (unrelated participant) tries to access chat metadata -> Bad Request / Access Denied
        mockMvc.perform(get("/api/conversations/" + convId)
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Access Denied")));
    }
}
