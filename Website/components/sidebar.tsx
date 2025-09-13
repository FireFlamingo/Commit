"use client"

import { Folder, Tag, Settings, Plus, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useVault } from "@/app/contexts/vault-context"
import { useToast } from "@/hooks/use-toast"

interface SidebarProps {
  selectedFolder: string
  onFolderSelect: (folder: string) => void
}

export function Sidebar({ selectedFolder, onFolderSelect }: SidebarProps) {
  const { folders, tags, addFolder, addTag, saveVaultToFile, loadVaultFromFile, isUnlocked } = useVault()
  const { toast } = useToast()

  const handleAddFolder = () => {
    const name = window.prompt("Enter folder name:")
    if (name && name.trim()) {
      addFolder(name.trim())
    }
  }

  const handleAddTag = () => {
    const name = window.prompt("Enter tag name:")
    if (name && name.trim()) {
      addTag(name.trim())
    }
  }

  const handleSaveVault = async () => {
    if (!isUnlocked) {
      toast({
        title: "Vault Locked",
        description: "Please unlock your vault first.",
        variant: "destructive"
      })
      return
    }

    try {
      await saveVaultToFile()
      toast({
        title: "Vault Saved",
        description: "Your vault has been encrypted and saved to file."
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save vault",
        variant: "destructive"
      })
    }
  }

  const handleLoadVault = async () => {
    if (!isUnlocked) {
      toast({
        title: "Vault Locked",
        description: "Please unlock your vault first.",
        variant: "destructive"
      })
      return
    }

    try {
      await loadVaultFromFile()
      toast({
        title: "Vault Loaded",
        description: "Your vault has been loaded from the encrypted file."
      })
    } catch (error) {
      toast({
        title: "Load Failed",
        description: error instanceof Error ? error.message : "Failed to load vault",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="w-64 bg-[#1E1E1E] border-r border-[#2A2A2A] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <h2 className="text-lg font-semibold text-[#F5F5F5] flex items-center gap-2">
          <div className="p-1 bg-[#4C2F7C] rounded">
            <Folder className="w-4 h-4 text-[#F5F5F5]" />
          </div>
          Hasheger
        </h2>
      </div>

      {/* Folders Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#A1A1AA] uppercase tracking-wide">Folders</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddFolder}
              className="h-6 w-6 p-0 text-[#A1A1AA] hover:text-[#9D85C5] hover:bg-[#333333]"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onFolderSelect(folder.name)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
                  selectedFolder === folder.name
                    ? "bg-[#9D85C5] text-[#121212] font-medium"
                    : "text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5]",
                )}
              >
                <Folder className="w-4 h-4" />
                {folder.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="p-4 border-t border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[#A1A1AA] uppercase tracking-wide">Tags</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddTag}
              className="h-6 w-6 p-0 text-[#A1A1AA] hover:text-[#9D85C5] hover:bg-[#333333]"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="w-full text-left px-3 py-2 rounded-md text-sm text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5] transition-colors flex items-center gap-2"
              >
                <Tag className="w-4 h-4" />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* File Operations */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={handleSaveVault}
            disabled={!isUnlocked}
            className="w-full justify-start text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5] disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Save Vault
          </Button>
          <Button
            variant="ghost"
            onClick={handleLoadVault}
            disabled={!isUnlocked}
            className="w-full justify-start text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5] disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Load Vault
          </Button>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-[#2A2A2A]">
        <Link href="/settings">
          <Button
            variant="ghost"
            className="w-full justify-start text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5]"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </Link>
      </div>
    </div>
  )
}
