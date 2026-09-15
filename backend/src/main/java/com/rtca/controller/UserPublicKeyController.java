package com.rtca.controller;

import com.rtca.dto.ApiResponse;
import com.rtca.dto.PublicKeyRegisterRequest;
import com.rtca.dto.PublicKeyResponse;
import com.rtca.model.User;
import com.rtca.model.UserPublicKey;
import com.rtca.repository.UserPublicKeyRepository;
import com.rtca.repository.UserRepository;
import com.rtca.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserPublicKeyController {

    private final UserPublicKeyRepository publicKeyRepository;
    private final UserRepository userRepository;

    @Autowired
    public UserPublicKeyController(UserPublicKeyRepository publicKeyRepository, UserRepository userRepository) {
        this.publicKeyRepository = publicKeyRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/keys")
    public ResponseEntity<ApiResponse<PublicKeyResponse>> registerPublicKeys(
            @Valid @RequestBody PublicKeyRegisterRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User identity not found."));

        Optional<UserPublicKey> existingOpt = publicKeyRepository.findByUserId(currentUser.getId());
        UserPublicKey publicKey;

        if (existingOpt.isPresent()) {
            publicKey = existingOpt.get();
            publicKey.setPublicEcdhKey(request.getPublicEcdhKey());
            publicKey.setPublicEcdsaKey(request.getPublicEcdsaKey());
        } else {
            publicKey = new UserPublicKey(user, request.getPublicEcdhKey(), request.getPublicEcdsaKey());
        }

        UserPublicKey saved = publicKeyRepository.save(publicKey);
        return ResponseEntity.ok(ApiResponse.success("Public keys registered successfully.", PublicKeyResponse.fromEntity(saved)));
    }

    @GetMapping("/{id}/keys")
    public ResponseEntity<ApiResponse<PublicKeyResponse>> getPublicKeysByUserId(@PathVariable("id") Long targetUserId) {
        UserPublicKey publicKey = publicKeyRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Public keys not found for user ID: " + targetUserId));

        return ResponseEntity.ok(ApiResponse.success("Public keys retrieved.", PublicKeyResponse.fromEntity(publicKey)));
    }
}
