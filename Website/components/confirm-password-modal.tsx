"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { X, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { useVault } from "@/app/contexts/vault-context"

interface ConfirmPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmButtonText?: string
  confirmButtonVariant?: "default" | "destructive"
}

export function ConfirmPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  confirmButtonVariant = "default",
}: ConfirmPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { verifyMasterPassword } = useVault()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const isValid = await verifyMasterPassword(password)

      if (isValid) {
        onConfirm()
        handleClose()
      } else {
        setError("Invalid master password")
      }
    } catch (error) {
      console.error("Password verification failed:", error)
      setError("Failed to verify password")
    }

    setIsLoading(false)
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    setShowPassword(false)
    setIsLoading(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-[#9D85C5] hover:text-[#F5F5F5] hover:bg-[#333]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[#2a1f3d] border border-[#4C2F7C] rounded-lg">
            <AlertTriangle className="h-5 w-5 text-[#9D85C5] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#F5F5F5]">{message}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="master-password" className="text-[#F5F5F5]">
              Master Password
            </Label>
            <div className="relative">
              <Input
                id="master-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your master password"
                className="bg-[#2a2a2a] border-[#444] text-[#F5F5F5] pr-10"
                required
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9D85C5] hover:text-[#F5F5F5] h-6 w-6 p-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent border-[#444] text-[#F5F5F5] hover:bg-[#333]"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={confirmButtonVariant}
              className={`flex-1 ${
                confirmButtonVariant === "destructive"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-[#4C2F7C] hover:bg-[#5a3691] text-white"
              }`}
              disabled={isLoading || !password}
            >
              {isLoading ? "Verifying..." : confirmButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
