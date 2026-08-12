import crypto from 'node:crypto'
import { Buffer } from 'node:buffer'

const iv = '0102030405060708'
const presetKey = '0CoJUm6Qyw8W8jud'
const linuxapiKey = 'rFgB&h#%2?^eDg:Q'
const eapiKey = 'e82ckenh8dichen8'

const publicKey =
  '00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7'
const eapiPublicKey =
  'e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8e82ckenh8dichen8'

// AES-CBC encrypt -> base64
// Use Buffer explicitly for Workers compatibility
function aesEncrypt(plaintext: string, key: string): string {
  const keyBuf = Buffer.from(key, 'utf8')
  const ivBuf = Buffer.from(iv, 'utf8')
  const cipher = crypto.createCipheriv('aes-128-cbc', keyBuf, ivBuf)
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plaintext, 'utf8')),
    cipher.final(),
  ])
  return encrypted.toString('base64')
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
  const base = BigInt('0x' + Buffer.from(reversed, 'utf8').toString('hex'))
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
  const digest = crypto.createHash('md5').update(message).digest('hex')
  const dataStr = `${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}`
  const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(eapiKey, 'utf8'), Buffer.alloc(0))
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(dataStr, 'utf8')),
    cipher.final(),
  ]).toString('hex').toUpperCase()
  return {
    params: encrypted,
    encSecKey: '',
  }
}

// eapi response decryption (AES-128-ECB)
function eapiDecrypt(encrypted: string): string | null {
  try {
    const decipher = crypto.createDecipheriv('aes-128-ecb', Buffer.from(eapiKey, 'utf8'), Buffer.alloc(0))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final(),
    ]).toString('utf8')
    return decrypted
  } catch {
    return null
  }
}

// linuxapi encryption (AES-128-ECB)
function linuxapi(data: Record<string, unknown>): { eparams: string } {
  const text = JSON.stringify(data)
  const cipher = crypto.createCipheriv('aes-128-ecb', Buffer.from(linuxapiKey, 'utf8'), Buffer.alloc(0))
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(text, 'utf8')),
    cipher.final(),
  ]).toString('hex')
  return {
    eparams: encrypted.toUpperCase(),
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
