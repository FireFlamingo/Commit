"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { X, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react"
import { useVault } from "@/app/contexts/vault-context"
import { ReVerifyModal } from "./re-verify-modal"

interface ChangeMasterPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangeMasterPasswordModal({ isOpen, onClose }: ChangeMasterPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"verify" | "change" | "success">("verify")
  const [showReVerifyModal, setShowReVerifyModal] = useState(false)
  const { changeMasterPassword, verifyMasterPassword, userEmail } = useVault()

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const isValid = await verifyMasterPassword(currentPassword)

      if (isValid) {
        setShowReVerifyModal(true)
      } else {
        setError("Invalid current master password")
      }
    } catch (error) {
      console.error("Password verification failed:", error)
      setError("Failed to verify password")
    }

    setIsLoading(false)
  }

  const handleReVerifySuccess = () => {
    setStep("change")
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long")
      return
    }

    setIsLoading(true)

    try {
      const success = await changeMasterPassword(currentPassword, newPassword)

      if (success) {
        setStep("success")
      } else {
        setError("Failed to change password")
      }
    } catch (error) {
      console.error("Password change failed:", error)
      setError("Failed to change password")
    }

    setIsLoading(false)
  }

  const handleClose = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setStep("verify")
    setIsLoading(false)
    setShowReVerifyModal(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-[#333]">
            <h2 className="text-lg font-semibold text-[#F5F5F5]">
              {step === "verify" && "Verify Current Password"}
              {step === "change" && "Set New Password"}
              {step === "success" && "Password Changed"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-[#9D85C5] hover:text-[#F5F5F5] hover:bg-[#333]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6">
            {step === "verify" && (
              <form onSubmit={handleVerifyCurrentPassword} className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-[#2a1f3d] border border-[#4C2F7C] rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-[#9D85C5] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#F5F5F5]">
                    Enter your current master password to continue. You'll need to complete WebAuthn verification before
                    changing your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-[#F5F5F5]">
                    Current Master Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="bg-[#2a2a2a] border-[#444] text-[#F5F5F5] pr-10"
                      required
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9D85C5] hover:text-[#F5F5F5] h-6 w-6 p-0"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    className="flex-1 bg-[#4C2F7C] hover:bg-[#5a3691] text-white"
                    disabled={isLoading || !currentPassword}
                  >
                    {isLoading ? "Verifying..." : "Continue"}
                  </Button>
                </div>
              </form>
            )}

            {step === "change" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-[#F5F5F5]">
                    New Master Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-[#2a2a2a] border-[#444] text-[#F5F5F5] pr-10"
                      required
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9D85C5] hover:text-[#F5F5F5] h-6 w-6 p-0"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-[#F5F5F5]">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="bg-[#2a2a2a] border-[#444] text-[#F5F5F5] pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9D85C5] hover:text-[#F5F5F5] h-6 w-6 p-0"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("verify")}
                    className="flex-1 bg-transparent border-[#444] text-[#F5F5F5] hover:bg-[#333]"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#4C2F7C] hover:bg-[#5a3691] text-white"
                    disabled={isLoading || !newPassword || !confirmPassword}
                  >
                    {isLoading ? "Changing Password..." : "Change Password"}
                  </Button>
                </div>
              </form>
            )}

            {step === "success" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">Password Changed Successfully</h3>
                  <p className="text-[#A1A1AA] text-sm">
                    Your master password has been updated and all vault items have been re-encrypted.
                  </p>
                </div>
                <Button onClick={handleClose} className="w-full bg-[#4C2F7C] hover:bg-[#5a3691] text-white">
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReVerifyModal
        isOpen={showReVerifyModal}
        onClose={() => setShowReVerifyModal(false)}
        onSuccess={handleReVerifySuccess}
        email={userEmail || ""}
        title="Verify Identity to Change Password"
        description="Please complete WebAuthn verification to proceed with changing your master password."
      />
    </>
  )
}
