"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { deriveKey, compareKeys, encryptData, decryptData } from "@/lib/crypto"
import { authService } from "@/lib/auth"
import CryptoJS from 'crypto-js'

export interface VaultItem {
  id: string
  name: string
  username: string
  password: string
  url?: string
  folder?: string
  tags: string[]
  totpSecret?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Folder {
  id: string
  name: string
  color?: string
}

export interface Tag {
  id: string
  name: string
  color?: string
}

interface VaultContextType {
  // State
  vaultItems: VaultItem[]
  folders: Folder[]
  tags: Tag[]
  selectedItem: VaultItem | null
  masterKey: CryptoKey | null
  salt: Uint8Array | null
  isUnlocked: boolean
  userEmail: string | null

  // Actions
  setVaultItems: (items: VaultItem[]) => void
  addVaultItem: (item: Omit<VaultItem, "id" | "createdAt" | "updatedAt">) => void
  updateVaultItem: (id: string, updates: Partial<VaultItem>) => void
  deleteVaultItem: (id: string) => void
  setSelectedItem: (item: VaultItem | null) => void

  addFolder: (name: string) => void
  deleteFolder: (id: string) => void

  addTag: (name: string) => void
  deleteTag: (id: string) => void

  unlockVault: (password: string) => Promise<boolean>
  verifyMasterPassword: (password: string) => Promise<boolean>
  changeMasterPassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  lockVault: () => void
  clearAllData: () => void
  setUserEmail: (email: string) => void

  // File Storage Actions
  saveVaultToFile: () => Promise<void>
  loadVaultFromFile: () => Promise<void>
  exportVaultData: () => Promise<string>
  importVaultData: (encryptedData: string) => Promise<void>
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([
    {
      id: "1",
      name: "GitHub",
      username: "john.doe@email.com",
      password: "SecurePass123!",
      url: "https://github.com",
      folder: "Work",
      tags: ["development", "important"],
      totpSecret: "JBSWY3DPEHPK3PXP",
      notes: "Work GitHub account",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "Gmail",
      username: "personal@gmail.com",
      password: "MyEmail2024$",
      url: "https://gmail.com",
      folder: "Personal",
      tags: ["email", "personal"],
      notes: "Personal email account",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
  ])

  const [folders, setFolders] = useState<Folder[]>([
    { id: "1", name: "Personal", color: "#9D85C5" },
    { id: "2", name: "Work", color: "#4C2F7C" },
    { id: "3", name: "Finance", color: "#6B46C1" },
  ])

  const [tags, setTags] = useState<Tag[]>([
    { id: "1", name: "important", color: "#EF4444" },
    { id: "2", name: "development", color: "#10B981" },
    { id: "3", name: "email", color: "#3B82F6" },
    { id: "4", name: "personal", color: "#8B5CF6" },
  ])

  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(vaultItems[0])
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null)
  const [salt, setSalt] = useState<Uint8Array | null>(null)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const addVaultItem = (itemData: Omit<VaultItem, "id" | "createdAt" | "updatedAt">) => {
    const newItem: VaultItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setVaultItems((prev) => [...prev, newItem])
  }

  const updateVaultItem = (id: string, updates: Partial<VaultItem>) => {
    setVaultItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item)),
    )
  }

  const deleteVaultItem = (id: string) => {
    setVaultItems((prev) => prev.filter((item) => item.id !== id))
    if (selectedItem?.id === id) {
      setSelectedItem(null)
    }
  }

  const addFolder = (name: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      color: "#9D85C5",
    }
    setFolders((prev) => [...prev, newFolder])
  }

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((folder) => folder.id !== id))
  }

  const addTag = (name: string) => {
    const newTag: Tag = {
      id: Date.now().toString(),
      name,
      color: "#9D85C5",
    }
    setTags((prev) => [...prev, newTag])
  }

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((tag) => tag.id !== id))
  }

  const unlockVault = async (password: string): Promise<boolean> => {
    try {
      const storedSalt = salt || new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
      const { key: derivedKey } = await deriveKey(password, storedSalt)
      setMasterKey(derivedKey)
      setSalt(storedSalt)
      setIsUnlocked(true)
      return true
    } catch (error) {
      console.error("Failed to unlock vault:", error)
      return false
    }
  }

  const verifyMasterPassword = async (password: string): Promise<boolean> => {
    if (!masterKey || !salt) {
      return false
    }

    try {
      const { key: tempKey } = await deriveKey(password, salt)
      return await compareKeys(masterKey, tempKey)
    } catch (error) {
      console.error("Failed to verify password:", error)
      return false
    }
  }

  const changeMasterPassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!(await verifyMasterPassword(oldPassword))) {
      return false
    }

    try {
      const { key: newKey, salt: newSalt } = await deriveKey(newPassword)
      setMasterKey(newKey)
      setSalt(newSalt)
      return true
    } catch (error) {
      console.error("Failed to change master password:", error)
      return false
    }
  }

  const lockVault = () => {
    setMasterKey(null)
    setSalt(null)
    setIsUnlocked(false)
    setSelectedItem(null)
    authService.logout()
  }

  const clearAllData = () => {
    setVaultItems([])
    setFolders([])
    setTags([])
    setSelectedItem(null)
    lockVault()
  }

  // Get or generate device salt for encryption
  const getDeviceSalt = (): string => {
    let deviceSalt = localStorage.getItem('vault_device_salt')
    if (!deviceSalt) {
      // Generate a new 32-byte salt
      deviceSalt = CryptoJS.lib.WordArray.random(32).toString()
      localStorage.setItem('vault_device_salt', deviceSalt)
    }
    return deviceSalt
  }

  // Derive encryption key from master password + device salt
  const deriveFileEncryptionKey = (masterPassword: string): string => {
    const deviceSalt = getDeviceSalt()
    const combined = masterPassword + deviceSalt
    
    // Use PBKDF2 with 100,000 iterations for key derivation
    const key = CryptoJS.PBKDF2(combined, deviceSalt, {
      keySize: 256 / 32, // 256 bits = 8 words of 32 bits each
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    })
    
    return key.toString()
  }

  // Encrypt vault data for file storage
  const encryptVaultData = (data: any, masterPassword: string): string => {
    const encryptionKey = deriveFileEncryptionKey(masterPassword)
    const jsonData = JSON.stringify(data, null, 2)
    
    const encrypted = CryptoJS.AES.encrypt(jsonData, encryptionKey)
    return encrypted.toString()
  }

  // Decrypt vault data from file
  const decryptVaultData = (encryptedData: string, masterPassword: string): any => {
    const encryptionKey = deriveFileEncryptionKey(masterPassword)
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey)
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
      
      if (!decryptedString) {
        throw new Error('Failed to decrypt data - invalid key or corrupted data')
      }
      
      return JSON.parse(decryptedString)
    } catch (error) {
      throw new Error('Failed to decrypt vault data. Check your master password.')
    }
  }

  // Save vault to encrypted file
  const saveVaultToFile = async (): Promise<void> => {
    if (!isUnlocked || !masterKey) {
      throw new Error('Vault is locked. Please unlock first.')
    }

    // Get master password from user for file encryption
    const masterPassword = prompt('Enter your master password to encrypt the vault file:')
    if (!masterPassword) {
      throw new Error('Master password is required for encryption')
    }

    // Verify the master password
    if (!(await verifyMasterPassword(masterPassword))) {
      throw new Error('Invalid master password')
    }

    const vaultData = {
      vaultItems,
      folders,
      tags,
      version: '1.0',
      exportedAt: new Date().toISOString()
    }

    const encryptedData = encryptVaultData(vaultData, masterPassword)

    try {
      // Use File System Access API for modern browsers
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: 'vault.enc',
        types: [{
          description: 'Encrypted vault files',
          accept: { 'application/octet-stream': ['.enc'] }
        }]
      })

      const writable = await fileHandle.createWritable()
      await writable.write(encryptedData)
      await writable.close()
    } catch (error) {
      // Fallback to download for browsers without File System Access API
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vault.enc'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Load vault from encrypted file
  const loadVaultFromFile = async (): Promise<void> => {
    if (!isUnlocked || !masterKey) {
      throw new Error('Vault is locked. Please unlock first.')
    }

    // Get master password from user for file decryption
    const masterPassword = prompt('Enter your master password to decrypt the vault file:')
    if (!masterPassword) {
      throw new Error('Master password is required for decryption')
    }

    // Verify the master password
    if (!(await verifyMasterPassword(masterPassword))) {
      throw new Error('Invalid master password')
    }

    try {
      // Use File System Access API for modern browsers
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'Encrypted vault files',
          accept: { 'application/octet-stream': ['.enc'] }
        }],
        excludeAcceptAllOption: true,
        multiple: false
      })

      const file = await fileHandle.getFile()
      const encryptedData = await file.text()
      
      const vaultData = decryptVaultData(encryptedData, masterPassword)
      
      // Update vault state with loaded data
      if (vaultData.vaultItems) setVaultItems(vaultData.vaultItems)
      if (vaultData.folders) setFolders(vaultData.folders)
      if (vaultData.tags) setTags(vaultData.tags)
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('decrypt')) {
        throw error
      }
      throw new Error('Failed to load vault file. Please select a valid encrypted vault file.')
    }
  }

  // Export vault data as encrypted string
  const exportVaultData = async (): Promise<string> => {
    if (!isUnlocked || !masterKey) {
      throw new Error('Vault is locked. Please unlock first.')
    }

    // Get master password from user for encryption
    const masterPassword = prompt('Enter your master password to encrypt the vault data:')
    if (!masterPassword) {
      throw new Error('Master password is required for encryption')
    }

    // Verify the master password
    if (!(await verifyMasterPassword(masterPassword))) {
      throw new Error('Invalid master password')
    }

    const vaultData = {
      vaultItems,
      folders,
      tags,
      version: '1.0',
      exportedAt: new Date().toISOString()
    }

    return encryptVaultData(vaultData, masterPassword)
  }

  // Import vault data from encrypted string
  const importVaultData = async (encryptedData: string): Promise<void> => {
    if (!isUnlocked || !masterKey) {
      throw new Error('Vault is locked. Please unlock first.')
    }

    // Get master password from user for decryption
    const masterPassword = prompt('Enter your master password to decrypt the vault data:')
    if (!masterPassword) {
      throw new Error('Master password is required for decryption')
    }

    // Verify the master password
    if (!(await verifyMasterPassword(masterPassword))) {
      throw new Error('Invalid master password')
    }

    const vaultData = decryptVaultData(encryptedData, masterPassword)
    
    // Update vault state with imported data
    if (vaultData.vaultItems) setVaultItems(vaultData.vaultItems)
    if (vaultData.folders) setFolders(vaultData.folders)
    if (vaultData.tags) setTags(vaultData.tags)
  }

  return (
    <VaultContext.Provider
      value={{
        vaultItems,
        folders,
        tags,
        selectedItem,
        masterKey,
        salt,
        isUnlocked,
        userEmail,
        setVaultItems,
        addVaultItem,
        updateVaultItem,
        deleteVaultItem,
        setSelectedItem,
        addFolder,
        deleteFolder,
        addTag,
        deleteTag,
        unlockVault,
        verifyMasterPassword,
        changeMasterPassword,
        lockVault,
        clearAllData,
        setUserEmail,
        saveVaultToFile,
        loadVaultFromFile,
        exportVaultData,
        importVaultData,
      }}
    >
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const context = useContext(VaultContext)
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider")
  }
  return context
}
