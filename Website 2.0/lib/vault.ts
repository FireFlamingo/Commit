import { authService } from "./auth"
import { deriveVaultKey, encryptVaultData, decryptVaultData } from "./crypto"

const BASE_URL = "https://temp-backend2.vercel.app"

export interface VaultItem {
  id: string
  type: "login" | "note" | "card"
  name: string
  data: any
  createdAt: string
  updatedAt: string
}

export interface VaultManifest {
  items: Array<{
    id: string
    type: string
    name: string
    createdAt: string
    updatedAt: string
  }>
}

export class VaultService {
  private static instance: VaultService
  private vaultKey: CryptoKey | null = null

  private constructor() {}

  static getInstance(): VaultService {
    if (!VaultService.instance) {
      VaultService.instance = new VaultService()
    }
    return VaultService.instance
  }

  async setVaultKey(masterPassword: string, serverSalt: string): Promise<void> {
    this.vaultKey = await deriveVaultKey(masterPassword, serverSalt)
  }

  clearVaultKey(): void {
    this.vaultKey = null
  }

  async getVaultManifest(): Promise<VaultManifest> {
    const response = await fetch(`${BASE_URL}/api/vault/manifest`, {
      headers: authService.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get vault manifest: ${response.statusText}`)
    }

    return response.json()
  }

  async getVaultItems(itemIds: string[]): Promise<VaultItem[]> {
    if (!this.vaultKey) {
      throw new Error("Vault key not set. Please unlock vault first.")
    }

    const response = await fetch(`${BASE_URL}/api/vault/items?itemIds=${itemIds.join(",")}`, {
      headers: authService.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get vault items: ${response.statusText}`)
    }

    const encryptedItems = await response.json()
    const decryptedItems: VaultItem[] = []

    for (const encryptedItem of encryptedItems) {
      try {
        const decryptedData = await decryptVaultData(this.vaultKey, encryptedItem.encryptedData)
        decryptedItems.push({
          id: encryptedItem.id,
          type: encryptedItem.type,
          name: encryptedItem.name,
          data: decryptedData,
          createdAt: encryptedItem.createdAt,
          updatedAt: encryptedItem.updatedAt,
        })
      } catch (error) {
        console.error(`Failed to decrypt item ${encryptedItem.id}:`, error)
      }
    }

    return decryptedItems
  }

  async saveVaultItems(items: VaultItem[]): Promise<void> {
    if (!this.vaultKey) {
      throw new Error("Vault key not set. Please unlock vault first.")
    }

    const encryptedItems = []

    for (const item of items) {
      const encryptedData = await encryptVaultData(this.vaultKey, item.data)
      encryptedItems.push({
        id: item.id,
        type: item.type,
        name: item.name,
        encryptedData,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })
    }

    const response = await fetch(`${BASE_URL}/api/vault/items`, {
      method: "POST",
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({ items: encryptedItems }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save vault items: ${response.statusText}`)
    }
  }

  async saveVaultItem(item: VaultItem): Promise<void> {
    return this.saveVaultItems([item])
  }
}

export const vaultService = VaultService.getInstance()
