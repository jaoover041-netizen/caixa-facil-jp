// Administrative Security & Cryptographic Hashing Service
// Provides secure digest validation without exposing raw credentials.

const LS_ADMIN_HASH_KEY = 'cfjp_v2_admin_hash';

// Default pre-computed cryptographic digests for initial administrator credential ("01234" and "1234")
const DEFAULT_DIGEST_01234 = 'c565fe03ca9b6242e01dfddefe9bba3d98b270e19cd02fd85ceaf75e2b25bf12';
const DEFAULT_DIGEST_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function computeSha256(raw: string): string {
  const ascii = String(raw ?? '');
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let composite = ascii + '\x80';
  while ((composite.length % 64) !== 56) {
    composite += '\x00';
  }

  for (let i = 0; i < composite.length; i++) {
    const j = composite.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (j << ((3 - (i % 4)) * 8));
  }
  
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength | 0);
  
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = [...hash];
    
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;
      const a = hash[0], e = hash[4];
      
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & hash[5]) ^ ((~e) & hash[6]);
      const wVal = (i < 16) ? (w[i] || 0) : (
        ((w[i - 16] || 0)
        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
        + (w[i - 7] || 0)
        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0
      );
      w[i] = wVal;
      
      const temp1 = (hash[7] + s1 + ch + k[i] + wVal) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;
      
      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }
    
    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export function getStoredAdminHash(): string | null {
  try {
    const val = localStorage.getItem(LS_ADMIN_HASH_KEY);
    if (val && typeof val === 'string' && val.length === 64) {
      return val;
    }
  } catch {
    // fallback
  }
  return null;
}

export function verifyAdminCredential(input: string | number): boolean {
  if (input === undefined || input === null) return false;
  const clean = String(input).trim();
  if (!clean) return false;
  const computed = computeSha256(clean);
  const stored = getStoredAdminHash();
  
  if (stored) {
    return computed === stored;
  }
  
  // Default out-of-the-box support for both 01234 and 1234
  return computed === DEFAULT_DIGEST_01234 || computed === DEFAULT_DIGEST_1234;
}

export function updateAdminCredential(currentInput: string | number, newInput: string | number): { success: boolean; msg: string } {
  if (!verifyAdminCredential(currentInput)) {
    return { success: false, msg: 'Senha administrativa atual incorreta.' };
  }
  const cleanNew = String(newInput ?? '').trim();
  if (!cleanNew || cleanNew.length < 4) {
    return { success: false, msg: 'A nova senha deve ter no mínimo 4 caracteres.' };
  }
  try {
    const newDigest = computeSha256(cleanNew);
    localStorage.setItem(LS_ADMIN_HASH_KEY, newDigest);
    return { success: true, msg: 'Senha administrativa alterada com sucesso!' };
  } catch {
    return { success: false, msg: 'Erro ao gravar a nova senha.' };
  }
}

export function resetAdminCredential(): void {
  try {
    localStorage.removeItem(LS_ADMIN_HASH_KEY);
  } catch {
    // ignore
  }
}
