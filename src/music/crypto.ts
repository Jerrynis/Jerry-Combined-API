// Pure-JS crypto for NetEase Cloud Music API. Works in Cloudflare Workers,
// where node:crypto's createCipheriv/createDecipheriv are NOT implemented by unenv.

// ---------- byte / string encoding helpers ----------
const te = new TextEncoder()
const td = new TextDecoder()

function utf8Bytes(str: string): Uint8Array {
  return te.encode(str)
}

function bytesToHex(bytes: Uint8Array): string {
  let o = ''
  for (let i = 0; i < bytes.length; i++) o += bytes[i].toString(16).padStart(2, '0')
  return o
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16)
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  const chunks: string[] = []
  for (let i = 0; i < bytes.length; i += CHUNK) {
    let bin = ''
    const end = Math.min(i + CHUNK, bytes.length)
    for (let j = i; j < end; j++) bin += String.fromCharCode(bytes[j])
    chunks.push(btoa(bin))
  }
  return chunks.join('')
}

function bytesToString(bytes: Uint8Array): string {
  return td.decode(bytes)
}

// ---------- PKCS#7 padding (default used by createCipheriv) ----------
function pkcs7Pad(data: Uint8Array): Uint8Array {
  const padLen = 16 - (data.length % 16)
  const out = new Uint8Array(data.length + padLen)
  out.set(data)
  out.fill(padLen, data.length)
  return out
}

function pkcs7Unpad(data: Uint8Array): Uint8Array {
  const padLen = data.length > 0 ? data[data.length - 1] : 0
  if (padLen < 1 || padLen > 16 || padLen > data.length) throw new Error('bad padding')
  return data.subarray(0, data.length - padLen)
}

// ---------- AES-128 core (pure JS) ----------
const SBOX: number[] = [
  0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
  0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
  0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
  0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
  0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
  0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
  0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
  0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
  0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
  0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
  0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
  0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
  0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
  0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
  0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
  0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16,
]

const INV_SBOX: number[] = [
  0x52,0x09,0x6a,0xd5,0x30,0x36,0xa5,0x38,0xbf,0x40,0xa3,0x9e,0x81,0xf3,0xd7,0xfb,
  0x7c,0xe3,0x39,0x82,0x9b,0x2f,0xff,0x87,0x34,0x8e,0x43,0x44,0xc4,0xde,0xe9,0xcb,
  0x54,0x7b,0x94,0x32,0xa6,0xc2,0x23,0x3d,0xee,0x4c,0x95,0x0b,0x42,0xfa,0xc3,0x4e,
  0x08,0x2e,0xa1,0x66,0x28,0xd9,0x24,0xb2,0x76,0x5b,0xa2,0x49,0x6d,0x8b,0xd1,0x25,
  0x72,0xf8,0xf6,0x64,0x86,0x68,0x98,0x16,0xd4,0xa4,0x5c,0xcc,0x5d,0x65,0xb6,0x92,
  0x6c,0x70,0x48,0x50,0xfd,0xed,0xb9,0xda,0x5e,0x15,0x46,0x57,0xa7,0x8d,0x9d,0x84,
  0x90,0xd8,0xab,0x00,0x8c,0xbc,0xd3,0x0a,0xf7,0xe4,0x58,0x05,0xb8,0xb3,0x45,0x06,
  0xd0,0x2c,0x1e,0x8f,0xca,0x3f,0x0f,0x02,0xc1,0xaf,0xbd,0x03,0x01,0x13,0x8a,0x6b,
  0x3a,0x91,0x11,0x41,0x4f,0x67,0xdc,0xea,0x97,0xf2,0xcf,0xce,0xf0,0xb4,0xe6,0x73,
  0x96,0xac,0x74,0x22,0xe7,0xad,0x35,0x85,0xe2,0xf9,0x37,0xe8,0x1c,0x75,0xdf,0x6e,
  0x47,0xf1,0x1a,0x71,0x1d,0x29,0xc5,0x89,0x6f,0xb7,0x62,0x0e,0xaa,0x18,0xbe,0x1b,
  0xfc,0x56,0x3e,0x4b,0xc6,0xd2,0x79,0x20,0x9a,0xdb,0xc0,0xfe,0x78,0xcd,0x5a,0xf4,
  0x1f,0xdd,0xa8,0x33,0x88,0x07,0xc7,0x31,0xb1,0x12,0x10,0x59,0x27,0x80,0xec,0x5f,
  0x60,0x51,0x7f,0xa9,0x19,0xb5,0x4a,0x0d,0x2d,0xe5,0x7a,0x9f,0x93,0xc9,0x9c,0xef,
  0xa0,0xe0,0x3b,0x4d,0xae,0x2a,0xf5,0xb0,0xc8,0xeb,0xbb,0x3c,0x83,0x53,0x99,0x61,
  0x17,0x2b,0x04,0x7e,0xba,0x77,0xd6,0x26,0xe1,0x69,0x14,0x63,0x55,0x21,0x0c,0x7d,
]

// Galois field (GF(2^8)) multiplication by constant
function gm(a: number, b: number): number {
  let p = 0
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a
    const hi = a & 0x80
    a = (a << 1) & 0xff
    if (hi) a ^= 0x1b
    b >>= 1
  }
  return p
}

// Expand a 16-byte key to 176 bytes (word-major, w[i*4+j])
function keyExpansion(key: Uint8Array): Uint8Array {
  const Nk = 4
  const Nr = 10
  const w = new Uint8Array(4 * Nk * (Nr + 1))
  for (let i = 0; i < Nk; i++) {
    w[i * 4 + 0] = key[i * 4 + 0]
    w[i * 4 + 1] = key[i * 4 + 1]
    w[i * 4 + 2] = key[i * 4 + 2]
    w[i * 4 + 3] = key[i * 4 + 3]
  }
  let rcon = 1
  for (let i = Nk; i < 4 * (Nr + 1); i++) {
    let tmp = [w[(i - 1) * 4 + 0], w[(i - 1) * 4 + 1], w[(i - 1) * 4 + 2], w[(i - 1) * 4 + 3]]
    if (i % Nk === 0) {
      tmp = [tmp[1], tmp[2], tmp[3], tmp[0]]
      tmp[0] = SBOX[tmp[0]]
      tmp[1] = SBOX[tmp[1]]
      tmp[2] = SBOX[tmp[2]]
      tmp[3] = SBOX[tmp[3]]
      tmp[0] ^= rcon
      rcon = gm(rcon, 2)
    }
    w[i * 4 + 0] = w[(i - Nk) * 4 + 0] ^ tmp[0]
    w[i * 4 + 1] = w[(i - Nk) * 4 + 1] ^ tmp[1]
    w[i * 4 + 2] = w[(i - Nk) * 4 + 2] ^ tmp[2]
    w[i * 4 + 3] = w[(i - Nk) * 4 + 3] ^ tmp[3]
  }
  return w
}

// state is column-major: state[c*4 + r] (c = column 0..3, r = row 0..3)
function cipherBlock(state: Uint8Array, w: Uint8Array): void {
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) state[c * 4 + r] ^= w[c * 4 + r]
  for (let round = 1; round <= 10; round++) {
    for (let i = 0; i < 16; i++) state[i] = SBOX[state[i]]
    const t = new Uint8Array(16)
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) t[c * 4 + r] = state[((c + r) % 4) * 4 + r]
    state.set(t)
    if (round < 10) {
      for (let c = 0; c < 4; c++) {
        const a = state[c * 4 + 0], b = state[c * 4 + 1], cc = state[c * 4 + 2], d = state[c * 4 + 3]
        state[c * 4 + 0] = gm(a, 2) ^ gm(b, 3) ^ cc ^ d
        state[c * 4 + 1] = a ^ gm(b, 2) ^ gm(cc, 3) ^ d
        state[c * 4 + 2] = a ^ b ^ gm(cc, 2) ^ gm(d, 3)
        state[c * 4 + 3] = gm(a, 3) ^ b ^ cc ^ gm(d, 2)
      }
    }
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) state[c * 4 + r] ^= w[round * 16 + c * 4 + r]
  }
}

function decipherBlock(state: Uint8Array, w: Uint8Array): void {
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) state[c * 4 + r] ^= w[10 * 16 + c * 4 + r]
  for (let round = 9; round >= 0; round--) {
    const t = new Uint8Array(16)
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) t[c * 4 + r] = state[((c + 4 - r) % 4) * 4 + r]
    state.set(t)
    for (let i = 0; i < 16; i++) state[i] = INV_SBOX[state[i]]
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) state[c * 4 + r] ^= w[round * 16 + c * 4 + r]
    if (round > 0) {
      for (let c = 0; c < 4; c++) {
        const a = state[c * 4 + 0], b = state[c * 4 + 1], cc = state[c * 4 + 2], d = state[c * 4 + 3]
        state[c * 4 + 0] = gm(a, 14) ^ gm(b, 11) ^ gm(cc, 13) ^ gm(d, 9)
        state[c * 4 + 1] = gm(a, 9) ^ gm(b, 14) ^ gm(cc, 11) ^ gm(d, 13)
        state[c * 4 + 2] = gm(a, 13) ^ gm(b, 9) ^ gm(cc, 14) ^ gm(d, 11)
        state[c * 4 + 3] = gm(a, 11) ^ gm(b, 13) ^ gm(cc, 9) ^ gm(d, 14)
      }
    }
  }
}

function aesCbcEncrypt(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const expanded = keyExpansion(key)
  const padded = pkcs7Pad(data)
  const out = new Uint8Array(padded.length)
  let prev = new Uint8Array(iv)
  for (let b = 0; b < padded.length / 16; b++) {
    const block = new Uint8Array(16)
    for (let i = 0; i < 16; i++) block[i] = padded[b * 16 + i] ^ prev[i]
    cipherBlock(block, expanded)
    out.set(block, b * 16)
    prev = block
  }
  return out
}

function aesEcbEncrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  const expanded = keyExpansion(key)
  const padded = pkcs7Pad(data)
  const out = new Uint8Array(padded.length)
  for (let b = 0; b < padded.length / 16; b++) {
    const block = new Uint8Array(padded.subarray(b * 16, b * 16 + 16))
    cipherBlock(block, expanded)
    out.set(block, b * 16)
  }
  return out
}

function aesEcbDecrypt(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (data.length % 16 !== 0) throw new Error('bad length')
  const expanded = keyExpansion(key)
  const out = new Uint8Array(data.length)
  for (let b = 0; b < data.length / 16; b++) {
    const block = new Uint8Array(data.subarray(b * 16, b * 16 + 16))
    decipherBlock(block, expanded)
    out.set(block, b * 16)
  }
  return pkcs7Unpad(out)
}

// ---------- MD5 (hex output, pure JS) ----------
const MD5_S: number[] = [
  7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
  5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
  4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
  6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21,
]
const MD5_K: number[] = [
  0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
  0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
  0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
  0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
  0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
  0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
  0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
  0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
]

function md5Hex(message: string): string {
  const bytes = utf8Bytes(message)
  const ml = bytes.length * 8
  const padded: number[] = Array.from(bytes)
  padded.push(0x80)
  while (padded.length % 64 !== 56) padded.push(0x00)
  const lo = (ml & 0xffffffff) >>> 0
  const hi = Math.floor(ml / 4294967296) >>> 0
  padded.push(lo & 0xff, (lo >>> 8) & 0xff, (lo >>> 16) & 0xff, (lo >>> 24) & 0xff)
  padded.push(hi & 0xff, (hi >>> 8) & 0xff, (hi >>> 16) & 0xff, (hi >>> 24) & 0xff)

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476
  for (let off = 0; off < padded.length; off += 64) {
    const M: number[] = new Array(16)
    for (let i = 0; i < 16; i++) {
      const p = off + i * 4
      M[i] = (padded[p] | (padded[p + 1] << 8) | (padded[p + 2] << 16) | (padded[p + 3] << 24)) >>> 0
    }
    let A = a0, B = b0, C = c0, D = d0
    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + MD5_K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << MD5_S[i]) | (F >>> (32 - MD5_S[i])))) >>> 0
    }
    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  let hex = ''
  for (const w of [a0, b0, c0, d0]) {
    hex += (w & 0xff).toString(16).padStart(2, '0')
    hex += ((w >>> 8) & 0xff).toString(16).padStart(2, '0')
    hex += ((w >>> 16) & 0xff).toString(16).padStart(2, '0')
    hex += ((w >>> 24) & 0xff).toString(16).padStart(2, '0')
  }
  return hex
}

// ---------- NetEase constants ----------
const IV = '0102030405060708'
const presetKey = '0CoJUm6Qyw8W8jud'
const linuxapiKey = 'rFgB&h#%2?^eDg:Q'
const eapiKey = 'e82ckenh8dichen8'
const publicKey =
  '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7'

// AES-CBC encrypt -> base64
function aesEncrypt(plaintext: string, key: string): string {
  const cipher = aesCbcEncrypt(utf8Bytes(plaintext), utf8Bytes(key), utf8Bytes(IV))
  return bytesToBase64(cipher)
}

// BigInt modular exponentiation
function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n
  let b = base % mod
  let e = exp
  while (e > 0n) {
    if (e % 2n === 1n) result = (result * b) % mod
    e = e / 2n
    b = (b * b) % mod
  }
  return result
}

// RSA encrypt (reverse the text, convert to bigint, modPow)
function rsaEncrypt(text: string): string {
  const reversed = text.split('').reverse().join('')
  const base = BigInt('0x' + bytesToHex(utf8Bytes(reversed)))
  const result = modPow(base, BigInt('0x' + '010001'), BigInt('0x' + publicKey))
  return result.toString(16).padStart(256, '0')
}

// Random base62 key
function createSecretKey(size: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = ''
  for (let i = 0; i < size; i++) {
    key += chars[Math.floor(Math.random() * chars.length)]
  }
  return key
}

// weapi encryption
function weapi(data: Record<string, unknown>): { params: string; encSecKey: string } {
  const text = JSON.stringify(data)
  const secretKey = createSecretKey(16)
  return {
    params: aesEncrypt(aesEncrypt(text, presetKey), secretKey),
    encSecKey: rsaEncrypt(secretKey),
  }
}

// eapi encryption (AES-128-ECB, hex uppercase output)
function eapi(url: string, data: Record<string, unknown> | string): { params: string; encSecKey: string } {
  const text = typeof data === 'object' ? JSON.stringify(data) : data
  const message = `nobody${url}use${text}md5forencrypt`
  const digest = md5Hex(message)
  const dataStr = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`
  const encrypted = aesEcbEncrypt(utf8Bytes(dataStr), utf8Bytes(eapiKey))
  return {
    params: bytesToHex(encrypted).toUpperCase(),
    encSecKey: '',
  }
}

// eapi response decryption (AES-128-ECB)
function eapiDecrypt(encrypted: string): string | null {
  try {
    const decrypted = aesEcbDecrypt(hexToBytes(encrypted), utf8Bytes(eapiKey))
    return bytesToString(decrypted)
  } catch {
    return null
  }
}

// linuxapi encryption (AES-128-ECB)
function linuxapi(data: Record<string, unknown>): { eparams: string } {
  const text = JSON.stringify(data)
  const encrypted = aesEcbEncrypt(utf8Bytes(text), utf8Bytes(linuxapiKey))
  return {
    eparams: bytesToHex(encrypted).toUpperCase(),
  }
}

export {
  aesEncrypt,
  rsaEncrypt,
  createSecretKey,
  weapi,
  eapi,
  eapiDecrypt,
  linuxapi,
}