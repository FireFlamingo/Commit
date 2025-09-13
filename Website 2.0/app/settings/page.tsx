"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Shield, Clock, Key, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ToggleSwitch } from "@/components/toggle-switch"
import { DeviceManager } from "@/components/device-manager"
import { ConfirmPasswordModal } from "@/components/confirm-password-modal"
import { ChangeMasterPasswordModal } from "@/components/change-master-password-modal"
import { useVault } from "@/app/contexts/vault-context"

export default function SettingsPage() {
  const { clearAllData } = useVault()

  const [lockTimer, setLockTimer] = useState("15")
  const [strictDomainMatching, setStrictDomainMatching] = useState(true)
  const [autoFillEnabled, setAutoFillEnabled] = useState(true)
  const [biometricUnlock, setBiometricUnlock] = useState(false)
  const [clipboardClearTime, setClipboardClearTime] = useState("30")
  const [showPasswordsOnHover, setShowPasswordsOnHover] = useState(false)
  const [isChangeMasterPasswordOpen, setIsChangeMasterPasswordOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  const handleSaveSettings = () => {
    // In a real app, this would save to localStorage or a backend
    console.log("Settings saved:", {
      lockTimer,
      strictDomainMatching,
      autoFillEnabled,
      biometricUnlock,
      clipboardClearTime,
      showPasswordsOnHover,
    })

    // Show a temporary success message
    alert("Settings saved successfully!")
  }

  const handleDeleteAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: "Delete All Vault Data",
      message:
        "This will permanently delete ALL your passwords, notes, folders, and settings. This action cannot be undone. Enter your master password to confirm.",
      onConfirm: () => {
        clearAllData()
        alert("All vault data has been deleted.")
      },
    })
  }

  const handleChangeMasterPassword = () => {
    setIsChangeMasterPasswordOpen(true)
  }

  const handleConfirmModalClose = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }))
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/vault">
            <Button variant="ghost" size="sm" className="text-[#A1A1AA] hover:text-[#9D85C5] hover:bg-[#333333]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vault
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-[#F5F5F5] text-balance">Security Settings</h1>
            <p className="text-[#A1A1AA] mt-2">Configure security policies and manage your devices</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Auto-Lock Settings */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5] text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#9D85C5]" />
                Auto-Lock Settings
              </CardTitle>
              <p className="text-[#A1A1AA] text-sm">Configure when your vault automatically locks</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[#F5F5F5] font-medium">Lock Timer</Label>
                <Select value={lockTimer} onValueChange={setLockTimer}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#333333]">
                    <SelectItem value="1" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      1 minute
                    </SelectItem>
                    <SelectItem value="5" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      5 minutes
                    </SelectItem>
                    <SelectItem value="15" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      15 minutes
                    </SelectItem>
                    <SelectItem value="30" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      30 minutes
                    </SelectItem>
                    <SelectItem value="60" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      1 hour
                    </SelectItem>
                    <SelectItem value="never" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      Never
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[#A1A1AA] text-sm">
                  Vault will automatically lock after {lockTimer === "never" ? "never" : `${lockTimer} minutes`} of
                  inactivity
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#F5F5F5] font-medium">Clipboard Clear Time</Label>
                <Select value={clipboardClearTime} onValueChange={setClipboardClearTime}>
                  <SelectTrigger className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-[#333333]">
                    <SelectItem value="10" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      10 seconds
                    </SelectItem>
                    <SelectItem value="30" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      30 seconds
                    </SelectItem>
                    <SelectItem value="60" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      1 minute
                    </SelectItem>
                    <SelectItem value="never" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                      Never
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[#A1A1AA] text-sm">
                  Copied passwords will be cleared from clipboard after{" "}
                  {clipboardClearTime === "never" ? "never" : `${clipboardClearTime} seconds`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Policies */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5] text-xl flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#9D85C5]" />
                Security Policies
              </CardTitle>
              <p className="text-[#A1A1AA] text-sm">Configure security behavior and restrictions</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ToggleSwitch
                id="strict-domain"
                label="Strict Domain Matching"
                description="Only suggest passwords for exact domain matches"
                checked={strictDomainMatching}
                onCheckedChange={setStrictDomainMatching}
              />

              <ToggleSwitch
                id="auto-fill"
                label="Auto-Fill Enabled"
                description="Automatically fill login forms when possible"
                checked={autoFillEnabled}
                onCheckedChange={setAutoFillEnabled}
              />

              <ToggleSwitch
                id="biometric-unlock"
                label="Biometric Unlock"
                description="Use fingerprint or face recognition to unlock vault"
                checked={biometricUnlock}
                onCheckedChange={setBiometricUnlock}
              />

              <ToggleSwitch
                id="show-passwords-hover"
                label="Show Passwords on Hover"
                description="Reveal passwords when hovering over masked fields"
                checked={showPasswordsOnHover}
                onCheckedChange={setShowPasswordsOnHover}
              />
            </CardContent>
          </Card>

          {/* Device Management */}
          <DeviceManager />

          {/* Master Password */}
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5] text-xl flex items-center gap-2">
                <Key className="w-5 h-5 text-[#9D85C5]" />
                Master Password
              </CardTitle>
              <p className="text-[#A1A1AA] text-sm">Change your master password or security settings</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={handleChangeMasterPassword}
                  variant="outline"
                  className="border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5] bg-transparent"
                >
                  Change Master Password
                </Button>
                <Button
                  variant="outline"
                  className="border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5] bg-transparent"
                >
                  Setup Emergency Access
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-[#1E1E1E] border-[#F87171]/30">
            <CardHeader>
              <CardTitle className="text-[#F87171] text-xl flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <p className="text-[#A1A1AA] text-sm">Irreversible and destructive actions</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-[#F87171]/10 border border-[#F87171]/20 rounded-md">
                <h4 className="text-[#F87171] font-medium mb-2">Delete All Vault Data</h4>
                <p className="text-[#A1A1AA] text-sm mb-4">
                  This will permanently delete all your passwords, notes, and settings. This action cannot be undone.
                </p>
                <Button
                  onClick={handleDeleteAllData}
                  variant="destructive"
                  className="bg-[#F87171] hover:bg-[#EF4444] text-white"
                >
                  Delete All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Settings Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveSettings} className="bg-[#4C2F7C] hover:bg-[#9D85C5] text-[#F5F5F5]">
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Change Master Password Modal */}
      <ChangeMasterPasswordModal
        isOpen={isChangeMasterPasswordOpen}
        onClose={() => setIsChangeMasterPasswordOpen(false)}
      />

      {/* Confirmation Modal */}
      <ConfirmPasswordModal
        isOpen={confirmModal.isOpen}
        onClose={handleConfirmModalClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmButtonText="Delete All Data"
        confirmButtonVariant="destructive"
      />
    </div>
  )
}
