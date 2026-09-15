package com.rtca.repository;

import com.rtca.model.UserPublicKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPublicKeyRepository extends JpaRepository<UserPublicKey, Long> {
    Optional<UserPublicKey> findByUserId(Long userId);
}
