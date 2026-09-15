package com.rtca;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rtca.dto.ChatMessageRequest;
import com.rtca.dto.CreateConversationRequest;
import com.rtca.dto.RegisterRequest;
import com.rtca.repository.ConversationRepository;
import com.rtca.repository.MessageRepository;
import com.rtca.repository.UserRepository;
import com.rtca.service.MessageService;
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
public class ChatHistoryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private MessageService messageService;

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
        userRepository.deleteAll();

        // Register User A
        RegisterRequest reqA = new RegisterRequest("history_user_a", "hist_a@example.com", "password123");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqA))).andReturn();
        userAToken = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("token").asText();
        userAId = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Register User B
        RegisterRequest reqB = new RegisterRequest("history_user_b", "hist_b@example.com", "password123");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqB))).andReturn();
        userBToken = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("token").asText();
        userBId = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Register User C (unrelated)
        RegisterRequest reqC = new RegisterRequest("history_user_c", "hist_c@example.com", "password123");
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
    @DisplayName("GET /api/conversations/{id}/messages - Fetch History & Verify Chronological Order")
    void testFetchChatHistoryChronological() throws Exception {
        // User A sends 2 messages, User B sends 1 message
        messageService.processAndSaveMessage(userAId, new ChatMessageRequest(conversationId, "Message 1 from A"));
        messageService.processAndSaveMessage(userBId, new ChatMessageRequest(conversationId, "Message 2 from B"));
        messageService.processAndSaveMessage(userAId, new ChatMessageRequest(conversationId, "Message 3 from A"));

        // User B requests conversation history via REST
        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(3)))
                .andExpect(jsonPath("$.data[0].content", is("Message 1 from A")))
                .andExpect(jsonPath("$.data[0].sender.username", is("history_user_a")))
                .andExpect(jsonPath("$.data[1].content", is("Message 2 from B")))
                .andExpect(jsonPath("$.data[1].sender.username", is("history_user_b")))
                .andExpect(jsonPath("$.data[2].content", is("Message 3 from A")))
                .andExpect(jsonPath("$.data[2].sender.username", is("history_user_a")));
    }

    @Test
    @DisplayName("GET /api/conversations/{id}/messages - Reject Unauthorized User C")
    void testUnauthorizedHistoryAccessRejection() throws Exception {
        messageService.processAndSaveMessage(userAId, new ChatMessageRequest(conversationId, "Secret message"));

        // User C (not a participant) attempts history retrieval -> Rejection
        mockMvc.perform(get("/api/conversations/" + conversationId + "/messages")
                        .header("Authorization", "Bearer " + userCToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Access Denied")));
    }
}
