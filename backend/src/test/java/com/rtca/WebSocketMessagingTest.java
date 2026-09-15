package com.rtca;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rtca.dto.ChatMessageRequest;
import com.rtca.dto.ChatMessageResponse;
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
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.MediaType;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
public class WebSocketMessagingTest {

    @LocalServerPort
    private int port;

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

    private WebSocketStompClient stompClient;
    private String tokenA;
    private Long userAId;
    private String tokenB;
    private Long userBId;
    private Long conversationId;

    @BeforeEach
    void setUp() throws Exception {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        publicKeyRepository.deleteAll();
        userRepository.deleteAll();

        // Register User A
        RegisterRequest reqA = new RegisterRequest("alice_ws", "alicews@example.com", "password123");
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqA))).andReturn();
        tokenA = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("token").asText();
        userAId = objectMapper.readTree(resA.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Register User B
        RegisterRequest reqB = new RegisterRequest("bob_ws", "bobws@example.com", "password123");
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqB))).andReturn();
        tokenB = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("token").asText();
        userBId = objectMapper.readTree(resB.getResponse().getContentAsString()).path("data").path("user").path("id").asLong();

        // Create direct conversation
        CreateConversationRequest createReq = new CreateConversationRequest(userBId);
        MvcResult convRes = mockMvc.perform(post("/api/conversations")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andReturn();
        conversationId = objectMapper.readTree(convRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());

        ObjectMapper testMapper = new ObjectMapper();
        testMapper.registerModule(new JavaTimeModule());
        testMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(testMapper);
        stompClient.setMessageConverter(converter);
    }

    @Test
    @DisplayName("STOMP WebSocket Real-Time Message Publish & Subscription Loop")
    void testStompRealTimeMessageLoop() throws Exception {
        String wsUrl = "ws://localhost:" + port + "/ws";
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + tokenB);

        CompletableFuture<ChatMessageResponse> messageFuture = new CompletableFuture<>();

        StompSession session = stompClient.connectAsync(wsUrl, new WebSocketHttpHeaders(), connectHeaders, new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);

        assertTrue(session.isConnected());

        // User B subscribes to /topic/conversation.{id}
        session.subscribe("/topic/conversation." + conversationId, new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return ChatMessageResponse.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                messageFuture.complete((ChatMessageResponse) payload);
            }
        });

        // User A connects and publishes a message to /app/chat.sendMessage
        StompHeaders connectHeadersA = new StompHeaders();
        connectHeadersA.add("Authorization", "Bearer " + tokenA);
        StompSession sessionA = stompClient.connectAsync(wsUrl, new WebSocketHttpHeaders(), connectHeadersA, new StompSessionHandlerAdapter() {})
                .get(5, TimeUnit.SECONDS);

        ChatMessageRequest sendReq = new ChatMessageRequest(conversationId, "Hello Bob over STOMP!");
        sessionA.send("/app/chat.sendMessage", sendReq);

        // Verify User B receives real-time payload within 5s
        ChatMessageResponse received = messageFuture.get(5, TimeUnit.SECONDS);
        assertNotNull(received);
        assertEquals("Hello Bob over STOMP!", received.getContent());
        assertEquals("alice_ws", received.getSender().getUsername());
        assertEquals(conversationId, received.getConversationId());

        // Verify database persistence
        assertEquals(1, messageRepository.count());
    }
}
