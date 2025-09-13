"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, Eye, EyeOff, Fingerprint, AlertCircle } from "lucide-react"
import { authService } from "@/lib/auth"

interface ReVerifyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  description?: string
  email: string
}

export function ReVerifyModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Verify Your Identity",
  description = "Please re-enter your master password to continue with this sensitive action.",
  email,
}: ReVerifyModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async () => {
    if (!password) {
      setError("Please enter your master password")
      return
    }

    if (!authService.isWebAuthnSupported()) {
      setError("WebAuthn is not supported in this browser")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await authService.reVerifyUser(email, password)

      if (result.success) {
        onSuccess()
        handleClose()
      } else {
        setError(result.error || "Verification failed")
      }
    } catch (error) {
      console.error("Re-verification failed:", error)
      setError("Verification failed. Please try again.")
    }

    setIsLoading(false)
  }

  const handleClose = () => {
    setPassword("")
    setShowPassword(false)
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md bg-[#1E1E1E] border-[#2A2A2A]">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#4C2F7C] rounded-full">
              <Shield className="w-6 h-6 text-[#F5F5F5]" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-[#F5F5F5] text-balance">{title}</DialogTitle>
          <p className="text-[#A1A1AA] text-sm">{description}</p>
          <p className="text-[#9D85C5] text-xs font-medium">{email}</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Master Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#A1A1AA] pr-12 h-12 text-lg focus:ring-[#9D85C5] focus:border-[#9D85C5]"
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#9D85C5] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-[#2A2A2A] text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#2A2A2A] bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!password || isLoading}
              className="flex-1 bg-[#4C2F7C] hover:bg-[#9D85C5] text-[#F5F5F5] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Fingerprint className="w-4 h-4" />
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
