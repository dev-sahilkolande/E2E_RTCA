// Web Crypto API Service for Zero-Knowledge E2EE (AES-GCM-256 + ECDH P-256 + ECDSA Signatures)

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

    if (typeof raw !== 'string') {
      // Handle legacy CryptoKey object
      return raw;
    }

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

    if (typeof raw !== 'string') {
      return raw;
    }

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
      // 1. Generate ECDH key pair
      const ecdhPair = await window.crypto.subtle.generateKey(
        { name: 'ECDH', namedCurve: 'P-256' },
        true,
        ['deriveKey', 'deriveBits']
      );

      // 2. Generate ECDSA key pair
      const ecdsaPair = await window.crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
      );

      // Export Public Keys (SPKI)
      const exportedEcdhPub = await window.crypto.subtle.exportKey('spki', ecdhPair.publicKey);
      const exportedEcdsaPub = await window.crypto.subtle.exportKey('spki', ecdsaPair.publicKey);

      // Export Private Keys (PKCS8)
      const exportedEcdhPriv = await window.crypto.subtle.exportKey('pkcs8', ecdhPair.privateKey);
      const exportedEcdsaPriv = await window.crypto.subtle.exportKey('pkcs8', ecdsaPair.privateKey);

      publicEcdhBase64 = arrayBufferToBase64(exportedEcdhPub);
      publicEcdsaBase64 = arrayBufferToBase64(exportedEcdsaPub);
      ecdhPrivBase64 = arrayBufferToBase64(exportedEcdhPriv);
      ecdsaPrivBase64 = arrayBufferToBase64(exportedEcdsaPriv);

      // Store in localStorage & IndexedDB for max persistence
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

  // Encrypt plaintext with recipient's ECDH public key & sign ciphertext
  async encryptMessage(userId, plaintext, recipientEcdhPublicKeyBase64) {
    let myPrivateKey = await this.getMyEcdhPrivateKey(userId);
    let mySigningKey = await this.getMyEcdsaPrivateKey(userId);

    if (!myPrivateKey || !mySigningKey) {
      await this.initUserKeys(userId);
      myPrivateKey = await this.getMyEcdhPrivateKey(userId);
      mySigningKey = await this.getMyEcdsaPrivateKey(userId);
    }

    if (!myPrivateKey || !mySigningKey) {
      throw new Error('E2EE Keys not initialized for user.');
    }

    // Import recipient ECDH public key
    const recipientPublicKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(recipientEcdhPublicKeyBase64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Derive AES-GCM-256 shared session key
    const aesKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: recipientPublicKey },
      myPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Generate random 12-byte IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedPlaintext = encoder.encode(plaintext);

    // Encrypt content
    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encodedPlaintext
    );

    // Sign ciphertext with ECDSA private key
    const signatureBuffer = await window.crypto.subtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      mySigningKey,
      ciphertextBuffer
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv.buffer),
      signature: arrayBufferToBase64(signatureBuffer),
    };
  }

  // Decrypt ciphertext with sender's ECDH public key & verify signature
  async decryptMessage(
    userId,
    ciphertextBase64,
    ivBase64,
    signatureBase64,
    senderEcdhPublicKeyBase64,
    senderEcdsaPublicKeyBase64
  ) {
    let myPrivateKey = await this.getMyEcdhPrivateKey(userId);
    if (!myPrivateKey) {
      await this.initUserKeys(userId);
      myPrivateKey = await this.getMyEcdhPrivateKey(userId);
    }

    if (!myPrivateKey) {
      throw new Error('E2EE Private key missing.');
    }

    const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
    const ivBuffer = base64ToArrayBuffer(ivBase64);

    // Verify ECDSA signature if provided
    if (signatureBase64 && senderEcdsaPublicKeyBase64) {
      try {
        const senderSigningKey = await window.crypto.subtle.importKey(
          'spki',
          base64ToArrayBuffer(senderEcdsaPublicKeyBase64),
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['verify']
        );

        const signatureBuffer = base64ToArrayBuffer(signatureBase64);
        const isValid = await window.crypto.subtle.verify(
          { name: 'ECDSA', hash: { name: 'SHA-256' } },
          senderSigningKey,
          signatureBuffer,
          ciphertextBuffer
        );

        if (!isValid) {
          console.warn('E2EE Warning: Signature verification failed for incoming message.');
        }
      } catch (err) {
        console.warn('Signature verification error:', err);
      }
    }

    // Import sender ECDH public key
    const senderPublicKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(senderEcdhPublicKeyBase64),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Derive AES-GCM-256 shared session key
    const aesKey = await window.crypto.subtle.deriveKey(
      { name: 'ECDH', public: senderPublicKey },
      myPrivateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Decrypt content
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
      aesKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }
}

export const cryptoService = new CryptoService();
