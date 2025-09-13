"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ItemList } from "@/components/item-list"
import { DetailView } from "@/components/detail-view"
import { PasswordGeneratorModal } from "@/components/password-generator-modal"
import { AddPasswordModal } from "@/components/add-password-modal"
import { EditPasswordModal } from "@/components/edit-password-modal"
import { ConfirmPasswordModal } from "@/components/confirm-password-modal"
import { useVault, type VaultItem } from "@/app/contexts/vault-context"

export default function VaultPage() {
  const { vaultItems, selectedItem, setSelectedItem, deleteVaultItem } = useVault()
  const [selectedFolder, setSelectedFolder] = useState<string>("All Items")
  const [isPasswordGeneratorOpen, setIsPasswordGeneratorOpen] = useState<boolean>(false)
  const [isAddPasswordOpen, setIsAddPasswordOpen] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    confirmButtonText?: string
    confirmButtonVariant?: "default" | "destructive"
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  const filteredItems =
    selectedFolder === "All Items" ? vaultItems : vaultItems.filter((item) => item.folder === selectedFolder)

  const handleAddItem = () => {
    setIsAddPasswordOpen(true)
  }

  const handleGeneratePassword = () => {
    setIsPasswordGeneratorOpen(true)
  }

  const handlePasswordGeneratorClose = () => {
    setIsPasswordGeneratorOpen(false)
  }

  const handleEdit = (item: VaultItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Edit",
      message: "Enter your master password to edit this item.",
      onConfirm: () => setEditingItem(item),
      confirmButtonText: "Edit Item",
    })
  }

  const handleDelete = (itemId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Confirm Delete",
      message: "This action cannot be undone. Enter your master password to delete this item.",
      onConfirm: () => deleteVaultItem(itemId),
      confirmButtonText: "Delete Item",
      confirmButtonVariant: "destructive",
    })
  }

  const handleConfirmModalClose = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <div className="h-screen bg-[#121212] flex">
      {/* Left Pane - Navigation */}
      <Sidebar selectedFolder={selectedFolder} onFolderSelect={setSelectedFolder} />

      {/* Middle Pane - Item List */}
      <ItemList
        items={filteredItems}
        selectedItem={selectedItem}
        onItemSelect={setSelectedItem}
        onAddItem={handleAddItem}
        onGeneratePassword={handleGeneratePassword}
      />

      {/* Right Pane - Detail View */}
      <DetailView item={selectedItem} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Password Generator Modal */}
      {isPasswordGeneratorOpen && <PasswordGeneratorModal onClose={handlePasswordGeneratorClose} />}

      {/* Add Password Modal */}
      {isAddPasswordOpen && <AddPasswordModal onClose={() => setIsAddPasswordOpen(false)} />}

      {/* Edit Password Modal */}
      {editingItem && <EditPasswordModal item={editingItem} onClose={() => setEditingItem(null)} />}

      {/* Confirmation Modal */}
      <ConfirmPasswordModal
        isOpen={confirmModal.isOpen}
        onClose={handleConfirmModalClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmButtonText={confirmModal.confirmButtonText}
        confirmButtonVariant={confirmModal.confirmButtonVariant}
      />
    </div>
  )
}
