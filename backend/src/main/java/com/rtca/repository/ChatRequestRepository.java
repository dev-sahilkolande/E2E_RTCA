package com.rtca.repository;

import com.rtca.model.ChatRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRequestRepository extends JpaRepository<ChatRequest, Long> {
    List<ChatRequest> findByReceiverIdAndStatusOrderByCreatedAtDesc(Long receiverId, String status);
    Optional<ChatRequest> findBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, String status);
    boolean existsBySenderIdAndReceiverIdAndStatus(Long senderId, Long receiverId, String status);
}
