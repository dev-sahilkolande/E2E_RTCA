package com.rtca;

import com.rtca.model.*;
import com.rtca.repository.*;
import com.rtca.util.UserPairKeyUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class DatabaseFoundationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.rtca.repository.UserPublicKeyRepository publicKeyRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private ConversationParticipantRepository participantRepository;

    @Autowired
    private MessageRepository messageRepository;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        publicKeyRepository.deleteAll();
        userRepository.deleteAll();

        userA = userRepository.save(new User("alice", "alice@example.com", "hashed_pwd_1"));
        userB = userRepository.save(new User("bob", "bob@example.com", "hashed_pwd_2"));
    }

    @Test
    @DisplayName("Verify User Persistence and Password Hash protection")
    void testUserPersistence() {
        assertNotNull(userA.getId());
        assertEquals("alice", userA.getUsername());
        assertEquals("alice@example.com", userA.getEmail());

        assertTrue(userRepository.existsByEmail("alice@example.com"));
        assertTrue(userRepository.existsByUsername("bob"));
    }

    @Test
    @DisplayName("Verify Direct Conversation Creation with Pair Key")
    void testConversationCreation() {
        String pairKey = UserPairKeyUtil.generatePairKey(userA.getId(), userB.getId());
        Conversation conversation = new Conversation(pairKey);
        ConversationParticipant cp1 = new ConversationParticipant(conversation, userA);
        ConversationParticipant cp2 = new ConversationParticipant(conversation, userB);
        conversation.getParticipants().add(cp1);
        conversation.getParticipants().add(cp2);

        conversation = conversationRepository.save(conversation);

        assertEquals(pairKey, conversation.getUserPairKey());
        assertTrue(participantRepository.existsByConversationIdAndUserId(conversation.getId(), userA.getId()));
        assertTrue(participantRepository.existsByConversationIdAndUserId(conversation.getId(), userB.getId()));
    }

    @Test
    @DisplayName("Verify Duplicate User Pair Key Enforcement")
    void testDuplicateUserPairKeyEnforcement() {
        String pairKey = UserPairKeyUtil.generatePairKey(userA.getId(), userB.getId());
        Conversation c1 = new Conversation(pairKey);
        conversationRepository.saveAndFlush(c1);

        Conversation c2 = new Conversation(pairKey);
        assertThrows(DataIntegrityViolationException.class, () -> {
            conversationRepository.saveAndFlush(c2);
        });
    }

    @Test
    @DisplayName("Verify Message Persistence and Chronological Retrieval")
    void testMessagePersistenceAndRetrieval() {
        String pairKey = UserPairKeyUtil.generatePairKey(userA.getId(), userB.getId());
        Conversation conversation = conversationRepository.save(new Conversation(pairKey));

        Message m1 = messageRepository.save(new Message(conversation, userA, "Hello Bob!"));
        Message m2 = messageRepository.save(new Message(conversation, userB, "Hi Alice, how are you?"));

        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());
        assertEquals(2, history.size());
        assertEquals("Hello Bob!", history.get(0).getContent());
        assertEquals("alice", history.get(0).getSender().getUsername());
        assertEquals("Hi Alice, how are you?", history.get(1).getContent());
        assertEquals("bob", history.get(1).getSender().getUsername());
    }
}
