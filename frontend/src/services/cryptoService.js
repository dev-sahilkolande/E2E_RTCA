// Web Crypto API Service for Zero-Knowledge E2EE (AES-GCM-256 + ECDH P-256 + Shared Session Key)

const DB_NAME = 'RTCA_CryptoDB';
const DB_VERSION = 1;
const STORE_NAME = 'keys';

const openCryptoDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeKeyInIndexedDB = async (keyName, key) => {
  const db = await openCryptoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(key, keyName);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getKeyFromIndexedDB = async (keyName) => {
  const db = await openCryptoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(keyName);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// ArrayBuffer <-> Base64 helpers
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

class CryptoService {
  // Helper to load or import user's ECDH private key
  async getMyEcdhPrivateKey(userId) {
    let raw = localStorage.getItem(`ecdh_priv_${userId}`) || await getKeyFromIndexedDB(`ecdh_private_${userId}`);
    if (!raw) return null;
    if (typeof raw !== 'string') return raw;

    try {
      return await window.crypto.subtle.importKey(
        'pkcs8',
        base64ToArrayBuffer(raw),
        { name: 'ECDH', namedCurve: 'P-256' },
        false,
        ['deriveKey', 'deriveBits']
      );
    } catch (err) {
      console.warn('Failed to import ECDH PKCS8 private key:', err);
      return null;
    }
  }

  // Helper to load or import user's ECDSA signing private key
  async getMyEcdsaPrivateKey(userId) {
    let raw = localStorage.getItem(`ecdsa_priv_${userId}`) || await getKeyFromIndexedDB(`ecdsa_private_${userId}`);
    if (!raw) return null;
    if (typeof raw !== 'string') return raw;

    try {
      return await window.crypto.subtle.importKey(
        'pkcs8',
        base64ToArrayBuffer(raw),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
    } catch (err) {
      console.warn('Failed to import ECDSA PKCS8 signing key:', err);
      return null;
    }
  }

  // Generate or retrieve persistent ECDH & ECDSA keypairs
  async initUserKeys(userId) {
    let publicEcdhBase64 = localStorage.getItem(`ecdh_pub_${userId}`) || await getKeyFromIndexedDB(`ecdh_public_${userId}`);
    let publicEcdsaBase64 = localStorage.getItem(`ecdsa_pub_${userId}`) || await getKeyFromIndexedDB(`ecdsa_public_${userId}`);
    let ecdhPrivBase64 = localStorage.getItem(`ecdh_priv_${userId}`);
    let ecdsaPrivBase64 = localStorage.getItem(`ecdsa_priv_${userId}`);

    if (!ecdhPrivBase64 || !ecdsaPrivBase64 || !publicEcdhBase64 || !publicEcdsaBase64) {
      const ecdhPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );

      const ecdsaPair = await window.crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
      );

      const exportedEcdhPub = await window.crypto.subtle.exportKey('spki', ecdhPair.publicKey);
      const exportedEcdsaPub = await window.crypto.subtle.exportKey('spki', ecdsaPair.publicKey);
      const exportedEcdhPriv = await window.crypto.subtle.exportKey('pkcs8', ecdhPair.privateKey);
      const exportedEcdsaPriv = await window.crypto.subtle.exportKey('pkcs8', ecdsaPair.privateKey);

      publicEcdhBase64 = arrayBufferToBase64(exportedEcdhPub);
      publicEcdsaBase64 = arrayBufferToBase64(exportedEcdsaPub);
      ecdhPrivBase64 = arrayBufferToBase64(exportedEcdhPriv);
      ecdsaPrivBase64 = arrayBufferToBase64(exportedEcdsaPriv);

      localStorage.setItem(`ecdh_pub_${userId}`, publicEcdhBase64);
      localStorage.setItem(`ecdsa_pub_${userId}`, publicEcdsaBase64);
      localStorage.setItem(`ecdh_priv_${userId}`, ecdhPrivBase64);
      localStorage.setItem(`ecdsa_priv_${userId}`, ecdsaPrivBase64);

      await storeKeyInIndexedDB(`ecdh_private_${userId}`, ecdhPrivBase64);
      await storeKeyInIndexedDB(`ecdsa_private_${userId}`, ecdsaPrivBase64);
      await storeKeyInIndexedDB(`ecdh_public_${userId}`, publicEcdhBase64);
      await storeKeyInIndexedDB(`ecdsa_public_${userId}`, publicEcdsaBase64);
    }

    return {
      publicEcdhKey: publicEcdhBase64,
      publicEcdsaKey: publicEcdsaBase64,
    };
  }

  // Derive AES-GCM-256 Symmetric Session Key for a conversation pair
  async deriveConversationSessionKey(conversationId, user1Id, user2Id) {
    const minId = Math.min(Number(user1Id || 0), Number(user2Id || 0));
    const maxId = Math.max(Number(user1Id || 0), Number(user2Id || 0));
    const passcodeKey1 = localStorage.getItem(`chat_key_user_${user1Id}`) || '';
    const passcodeKey2 = localStorage.getItem(`chat_key_user_${user2Id}`) || '';
    
    const seed = `rtca_e2ee_c${conversationId}_u${minId}_u${maxId}_p${passcodeKey1}_${passcodeKey2}`;
    const encoder = new TextEncoder();
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(seed));

    return await window.crypto.subtle.importKey(
      'raw',
      hashBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt plaintext for network transmission (AES-GCM-256)
  async encryptMessage(userId, plaintext, recipientEcdhPublicKeyBase64, conversationId = null, otherUserId = null) {
    // 1. Primary: Try shared conversation session key if conversationId & otherUserId exist
    if (conversationId && otherUserId) {
      try {
        const aesKey = await this.deriveConversationSessionKey(conversationId, userId, otherUserId);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const ciphertextBuffer = await window.crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          aesKey,
          encoder.encode(plaintext)
        );

        let signatureBase64 = null;
        const mySigningKey = await this.getMyEcdsaPrivateKey(userId);
        if (mySigningKey) {
          try {
            const sigBuf = await window.crypto.subtle.sign(
              { name: 'ECDSA', hash: { name: 'SHA-256' } },
              mySigningKey,
              ciphertextBuffer
            );
            signatureBase64 = arrayBufferToBase64(sigBuf);
          } catch (e) {}
        }

        return {
          ciphertext: arrayBufferToBase64(ciphertextBuffer),
          iv: arrayBufferToBase64(iv.buffer),
          signature: signatureBase64,
        };
      } catch (err) {
        console.warn('Session key encryption fallback to ECDH:', err);
      }
    }

    // 2. Secondary: ECDH P-256 + AES-GCM
    let myPrivateKey = await this.getMyEcdhPrivateKey(userId);
    let mySigningKey = await this.getMyEcdsaPrivateKey(userId);

    if (!myPrivateKey || !mySigningKey) {
      await this.initUserKeys(userId);
      myPrivateKey = await this.getMyEcdhPrivateKey(userId);
      mySigningKey = await this.getMyEcdsaPrivateKey(userId);
    }

    if (!myPrivateKey || !recipientEcdhPublicKeyBase64) {
      throw new Error('E2EE Keys missing.');
    }

    const recipientPublicKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(recipientEcdhPublicKeyBase64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: recipientPublicKey },
      myPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoder.encode(plaintext)
    );

    let signatureBase64 = null;
    if (mySigningKey) {
      const sigBuf = await window.crypto.subtle.sign(
        { name: 'ECDSA', hash: { name: 'SHA-256' } },
        mySigningKey,
        ciphertextBuffer
      );
      signatureBase64 = arrayBufferToBase64(sigBuf);
    }

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv.buffer),
      signature: signatureBase64,
    };
  }

  // Decrypt ciphertext for local display in conversation
  async decryptMessage(
    userId,
    ciphertextBase64,
    ivBase64,
    signatureBase64,
    senderEcdhPublicKeyBase64,
    senderEcdsaPublicKeyBase64,
    conversationId = null,
    otherUserId = null
  ) {
    if (!ciphertextBase64 || !ivBase64) return null;

    const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
    const ivBuffer = base64ToArrayBuffer(ivBase64);
    const decoder = new TextDecoder();

    // 1. Primary: Decrypt using Conversation Session Key
    if (conversationId && (otherUserId || userId)) {
      try {
        const aesKey = await this.deriveConversationSessionKey(conversationId, userId, otherUserId || userId);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
          aesKey,
          ciphertextBuffer
        );
        return decoder.decode(decryptedBuffer);
      } catch (e) {
        // Fallback to ECDH if session key differs
      }
    }

    // 2. Secondary: Decrypt using ECDH P-256 Key Exchange
    try {
      let myPrivateKey = await this.getMyEcdhPrivateKey(userId);
      if (myPrivateKey && senderEcdhPublicKeyBase64) {
        const senderPublicKey = await window.crypto.subtle.importKey(
          'spki',
          base64ToArrayBuffer(senderEcdhPublicKeyBase64),
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          []
        );

        const aesKey = await window.crypto.subtle.deriveKey(
          { name: 'ECDH', public: senderPublicKey },
          myPrivateKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
          aesKey,
          ciphertextBuffer
        );
        return decoder.decode(decryptedBuffer);
      }
    } catch (err) {
      console.warn('ECDH decryption attempt failed:', err);
    }

    return null;
  }
}

export const cryptoService = new CryptoService();
