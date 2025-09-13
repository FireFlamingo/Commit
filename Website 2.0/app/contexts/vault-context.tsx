"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { deriveKey, compareKeys } from "@/lib/crypto"
import { authService } from "@/lib/auth"

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
