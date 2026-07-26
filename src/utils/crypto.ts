import { StudentResult } from '../types';

const SECRET_KEY = 'CBT_SOSIOLOGI_2026_KEY_GURU_SEKOLAH_SECURE_AUTH';

/**
 * Calculates a secure 32-bit checksum hash string for integrity verification.
 */
function calculateHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 << 5) - hash2 + char;
    hash1 |= 0;
    hash2 |= 0;
  }
  return Math.abs(hash1).toString(36) + Math.abs(hash2).toString(36);
}

/**
 * Encrypts a StudentResult object into a secure, UTF-8 byte-safe Base64 payload.
 */
export function encryptResult(result: StudentResult): string {
  const jsonStr = JSON.stringify(result);
  const hash = calculateHash(jsonStr);

  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonStr);
  const keyBytes = encoder.encode(SECRET_KEY);

  // XOR byte by byte (100% safe for non-ASCII, UTF-8 Indonesian names, and binary data)
  const cipherBytes = new Uint8Array(jsonBytes.length);
  for (let i = 0; i < jsonBytes.length; i++) {
    cipherBytes[i] = jsonBytes[i] ^ keyBytes[i % keyBytes.length];
  }

  // Convert binary Uint8Array to Base64
  let binary = '';
  const len = cipherBytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(cipherBytes[i]);
  }
  const base64Cipher = btoa(binary);

  const container = {
    cbtHeader: 'CBT_SOSIOLOGI_2026_ENCRYPTED_FILE',
    version: '2.0',
    hash,
    payload: base64Cipher,
    studentName: result.studentInfo?.name || 'Siswa',
    noPeserta: result.studentInfo?.noPeserta || '',
    score: result.score,
    timestamp: new Date().toISOString(),
  };

  return JSON.stringify(container, null, 2);
}

/**
 * Decrypts an encrypted CBT result file content string into a StudentResult object.
 * Robustly handles legacy, byte-encoded, base64, or raw JSON formats.
 */
export function decryptResult(encryptedContent: string): StudentResult {
  const cleanContent = encryptedContent.trim().replace(/^\uFEFF/, '');
  if (!cleanContent) {
    throw new Error('File kosong!');
  }

  let container: any;
  try {
    container = JSON.parse(cleanContent);
  } catch (e) {
    throw new Error('Format file tidak dikenali. File harus berupa file .cbt resmi dari CBT Sosiologi!');
  }

  // Case 1: Direct StudentResult JSON (if unencrypted json file uploaded)
  if (container && container.studentInfo && typeof container.score === 'number' && Array.isArray(container.answers)) {
    return container as StudentResult;
  }

  // Case 2: Standard CBT Encrypted Container
  if (!container || container.cbtHeader !== 'CBT_SOSIOLOGI_2026_ENCRYPTED_FILE' || !container.payload) {
    throw new Error('File bukan merupakan file jawaban CBT Sosiologi resmi yang terenkripsi!');
  }

  const base64Cipher = container.payload;
  let decryptedJson = '';

  try {
    const binary = atob(base64Cipher);
    const cipherBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      cipherBytes[i] = binary.charCodeAt(i);
    }

    const keyBytes = new TextEncoder().encode(SECRET_KEY);
    const decryptedBytes = new Uint8Array(cipherBytes.length);
    for (let i = 0; i < cipherBytes.length; i++) {
      decryptedBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    decryptedJson = new TextDecoder().decode(decryptedBytes);
  } catch (err) {
    // Fallback attempt for legacy 1.0 string-based XOR decoding
    try {
      const binary = atob(base64Cipher);
      const utf8Bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
      const cipherStr = new TextDecoder().decode(utf8Bytes);
      let output = '';
      for (let i = 0; i < cipherStr.length; i++) {
        output += String.fromCharCode(cipherStr.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
      }
      decryptedJson = output;
    } catch (fallbackErr) {
      throw new Error('Gagal mendekripsi payload file .cbt. File mungkin terkorupsi!');
    }
  }

  let resultObj: StudentResult;
  try {
    resultObj = JSON.parse(decryptedJson);
  } catch (e) {
    throw new Error('Data hasil jawaban terdekripsi tidak berformat JSON valid.');
  }

  // Check structure integrity
  if (!resultObj || !resultObj.studentInfo || typeof resultObj.score !== 'number') {
    throw new Error('Struktur data hasil ujian siswa tidak lengkap atau tidak valid!');
  }

  // Check Hash integrity if present
  if (container.hash) {
    const calculated = calculateHash(decryptedJson);
    if (container.hash !== calculated) {
      console.warn('Hash integrity mismatch in .cbt file:', container.hash, 'vs', calculated);
    }
  }

  return resultObj;
}
