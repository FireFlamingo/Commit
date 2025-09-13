"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Eye, EyeOff } from "lucide-react"
import { useVault } from "@/app/contexts/vault-context"

interface AddPasswordModalProps {
  onClose: () => void
}

export function AddPasswordModal({ onClose }: AddPasswordModalProps) {
  const { folders, addVaultItem } = useVault()

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    url: "",
    notes: "",
    folder: "Personal",
    tags: "",
    totpSecret: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showTotpSecret, setShowTotpSecret] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.username || !formData.password) {
      return
    }

    addVaultItem({
      name: formData.name,
      username: formData.username,
      password: formData.password,
      url: formData.url || undefined,
      notes: formData.notes || undefined,
      folder: formData.folder,
      tags: formData.tags ? formData.tags.split(",").map((tag) => tag.trim()) : [],
      totpSecret: formData.totpSecret || undefined,
    })

    onClose()
  }

  const availableFolders = folders.map((f) => f.name)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">Add New Password</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-[#9D85C5] hover:text-[#f5f5f5] hover:bg-[#333]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-[#f5f5f5] text-sm font-medium">
              Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Gmail, GitHub, Bank"
              className="mt-1 bg-[#2a2a2a] border-[#444] text-[#f5f5f5] placeholder-[#888] focus:border-[#9D85C5]"
              required
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-[#f5f5f5] text-sm font-medium">
              Username/Email *
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="username or email"
              className="mt-1 bg-[#2a2a2a] border-[#444] text-[#f5f5f5] placeholder-[#888] focus:border-[#9D85C5]"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-[#f5f5f5] text-sm font-medium">
              Password *
            </Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                className="bg-[#2a2a2a] border-[#444] text-[#f5f5f5] placeholder-[#888] focus:border-[#9D85C5] pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9D85C5] hover:text-[#f5f5f5] h-6 w-6 p-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="url" className="text-[#f5f5f5] text-sm font-medium">
              Website URL
            </Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com"
              className="mt-1 bg-[#2a2a2a] border-[#444] text-[#f5f5f5] placeholder-[#888] focus:border-[#9D85C5]"
            />
          </div>

          <div>
            <Label htmlFor="folder" className="text-[#f5f5f5] text-sm font-medium">
              Folder
            </Label>
            <Select value={formData.folder} onValueChange={(value) => setFormData({ ...formData, folder: value })}>
              <SelectTrigger className="mt-1 bg-[#2a2a2a] border-[#444] text-[#f5f5f5] focus:border-[#9D85C5]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-[#444]">
                {availableFolders.map((folder) => (
                  <SelectItem key={folder} value={folder} className="text-[#f5f5f5] focus:bg-[#4C2F7C]">
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags" className="text-[#f5f5f5] text-sm font-medium">
              Tags
            </Label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="email, work, social (comma separated)"
              className="mt-1 bg-[#2a2a2a] border-[#444] text-[#f5f5f5] placeholder-[#888] focus:border-[#9D85C5]"
            />
          </div>

          <div>
            <Label htmlFor="totpSecret" className="text-[#f5f5f5] text-sm font-medium">
              TOTP Secret (Optional)
            </Label>
            <div className="relative mt-1">
              <Input
                id="totpSecret"
                type={showTotpSecret ? "text" : "password"}
                value={formData.totpSecret}
                onChange={(e) => setFormData({ ...formData, totpSecret: e.target.value })}
                placeholder="Base32 encoded secret"
                className="bg-[#2a2a2a] border-[#444] text-[#f5f5f5] placeholder-[#888] focus:border-[#9D85C5] pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTotpSecret(!showTotpSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9D85C5] hover:text-[#f5f5f5] h-6 w-6 p-0"
              >
                {showTotpSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="text-[#f5f5f5] text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="mt-1 bg-[#2a2a2a] border-[#444] text-[#f5f5f5] placeholder-[#888] focus:border-[#9D85C5] resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#444] text-[#f5f5f5] hover:bg-[#333] hover:text-[#f5f5f5] bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#4C2F7C] hover:bg-[#5a3a8a] text-white">
              Add Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
