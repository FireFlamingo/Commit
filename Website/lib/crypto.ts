export interface DerivedKey {
  key: CryptoKey
  salt: Uint8Array
}

// Derive encryption key from master password + server salt (310,000 iterations as per spec)
export async function deriveVaultKey(masterPassword: string, serverSalt: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  )

  // Convert base64 server salt to Uint8Array
  const saltBytes = new Uint8Array(
    atob(serverSalt)
      .split("")
      .map((char) => char.charCodeAt(0)),
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 310000, // Updated to match backend spec
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  )

  return key
}

// Legacy function for backward compatibility
export async function deriveKey(password: string, salt?: Uint8Array): Promise<DerivedKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  )

  const actualSalt = salt || crypto.getRandomValues(new Uint8Array(16))

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: actualSalt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  )

  return { key, salt: actualSalt }
}

export async function compareKeys(key1: CryptoKey, key2: CryptoKey): Promise<boolean> {
  try {
    const exported1 = await crypto.subtle.exportKey("raw", key1)
    const exported2 = await crypto.subtle.exportKey("raw", key2)

    const array1 = new Uint8Array(exported1)
    const array2 = new Uint8Array(exported2)

    if (array1.length !== array2.length) return false

    let result = 0
    for (let i = 0; i < array1.length; i++) {
      result |= array1[i] ^ array2[i]
    }

    return result === 0
  } catch {
    return false
  }
}

export async function encryptData(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encodedData = new TextEncoder().encode(data)

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedData)

  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedData)
      .split("")
      .map((char) => char.charCodeAt(0)),
  )

  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted)

  return new TextDecoder().decode(decrypted)
}

export async function encryptVaultData(vaultKey: CryptoKey, data: any): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encodedData = new TextEncoder().encode(JSON.stringify(data))

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, vaultKey, encodedData)

  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptVaultData(vaultKey: CryptoKey, encryptedData: string): Promise<any> {
  const combined = new Uint8Array(
    atob(encryptedData)
      .split("")
      .map((char) => char.charCodeAt(0)),
  )

  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, vaultKey, encrypted)

  return JSON.parse(new TextDecoder().decode(decrypted))
}
