"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CopyButton } from "@/components/copy-button"
import { StrengthMeter } from "@/components/strength-meter"
import { RefreshCw, Key, X, ArrowLeft, Save } from "lucide-react"
import { vaultService, type VaultItem } from "@/lib/vault"
import { useToast } from "@/hooks/use-toast"

interface PasswordGeneratorModalProps {
  onClose: () => void
  onPasswordGenerated?: (password: string) => void
  onCredentialSaved?: () => void
}

interface GeneratorSettings {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
}

interface ContextData {
  website: string
  username: string
  title: string
}

declare global {
  interface Window {
    zxcvbn?: (password: string) => {
      score: number
      feedback: {
        suggestions: string[]
        warning: string
      }
    }
  }
}

export function PasswordGeneratorModal({
  onClose,
  onPasswordGenerated,
  onCredentialSaved,
}: PasswordGeneratorModalProps) {
  const [password, setPassword] = useState("")
  const [isZxcvbnLoaded, setIsZxcvbnLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const [showContextForm, setShowContextForm] = useState(false)
  const [contextData, setContextData] = useState<ContextData>({
    website: "",
    username: "",
    title: "",
  })

  const [settings, setSettings] = useState<GeneratorSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("passwordGeneratorSettings")
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error("Failed to parse saved settings:", e)
        }
      }
    }
    return {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    }
  })

  useEffect(() => {
    const loadZxcvbn = async () => {
      if (window.zxcvbn) {
        setIsZxcvbnLoaded(true)
        return
      }

      try {
        // Load core library
        const coreScript = document.createElement("script")
        coreScript.src = "https://cdn.jsdelivr.net/npm/@zxcvbn-ts/core@3.0.4/dist/zxcvbn-ts.js"
        coreScript.onload = () => {
          // Load language pack
          const langScript = document.createElement("script")
          langScript.src = "https://cdn.jsdelivr.net/npm/@zxcvbn-ts/language-common@3.0.4/dist/zxcvbn-ts.js"
          langScript.onload = () => {
            setIsZxcvbnLoaded(true)
          }
          document.head.appendChild(langScript)
        }
        document.head.appendChild(coreScript)
      } catch (error) {
        console.error("Failed to load zxcvbn:", error)
      }
    }

    loadZxcvbn()
  }, [])

  const generatePassword = useCallback(() => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"

    let charset = ""
    const requiredChars: string[] = []

    if (settings.includeUppercase) {
      charset += uppercase
      requiredChars.push(uppercase[Math.floor(Math.random() * uppercase.length)])
    }
    if (settings.includeLowercase) {
      charset += lowercase
      requiredChars.push(lowercase[Math.floor(Math.random() * lowercase.length)])
    }
    if (settings.includeNumbers) {
      charset += numbers
      requiredChars.push(numbers[Math.floor(Math.random() * numbers.length)])
    }
    if (settings.includeSymbols) {
      charset += symbols
      requiredChars.push(symbols[Math.floor(Math.random() * symbols.length)])
    }

    if (charset === "") {
      setPassword("")
      return
    }

    // Generate remaining characters
    const remainingLength = settings.length - requiredChars.length
    const randomChars: string[] = []

    // Use crypto.getRandomValues for secure randomness
    const randomValues = new Uint32Array(remainingLength)
    crypto.getRandomValues(randomValues)

    for (let i = 0; i < remainingLength; i++) {
      randomChars.push(charset.charAt(randomValues[i] % charset.length))
    }

    // Combine required and random characters
    const allChars = [...requiredChars, ...randomChars]

    // Shuffle the password to avoid predictable patterns
    const shuffleValues = new Uint32Array(allChars.length)
    crypto.getRandomValues(shuffleValues)

    for (let i = allChars.length - 1; i > 0; i--) {
      const j = shuffleValues[i] % (i + 1)
      ;[allChars[i], allChars[j]] = [allChars[j], allChars[i]]
    }

    setPassword(allChars.join(""))
  }, [settings])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePassword()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [generatePassword])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("passwordGeneratorSettings", JSON.stringify(settings))
    }
  }, [settings])

  const handleUsePassword = () => {
    if (onPasswordGenerated) {
      onPasswordGenerated(password)
      onClose()
    } else {
      setShowContextForm(true)
    }
  }

  const handleSaveToVault = async () => {
    if (!contextData.website.trim() || !contextData.username.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both website and username.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const newItem: VaultItem = {
        id: crypto.randomUUID(),
        type: "login",
        name: contextData.title.trim() || contextData.website.trim(),
        data: {
          website: contextData.website.trim(),
          username: contextData.username.trim(),
          password: password,
          notes: contextData.title.trim(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await vaultService.saveVaultItem(newItem)

      toast({
        title: "Credential Saved",
        description: "Your new credential has been saved to the vault.",
      })

      if (onCredentialSaved) {
        onCredentialSaved()
      }

      onClose()
    } catch (error) {
      console.error("Failed to save credential:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save credential to vault. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackToGenerator = () => {
    setShowContextForm(false)
    setContextData({ website: "", username: "", title: "" })
  }

  const updateSettings = (key: keyof GeneratorSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (showContextForm) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] w-[95vw] max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Save className="w-5 h-5 text-[#9D85C5]" />
                Save Credential
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#333333] h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Generated Password Display */}
            <Card className="bg-[#2A2A2A] border-[#333333]">
              <CardContent className="p-4">
                <Label className="text-[#F5F5F5] font-medium mb-2 block">Generated Password</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#121212] p-3 rounded-md font-mono text-sm text-[#F5F5F5] break-all word-break min-h-[2.5rem] flex items-center">
                    {password}
                  </div>
                  <CopyButton text={password} />
                </div>
              </CardContent>
            </Card>

            {/* Context Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="text-[#F5F5F5] font-medium">
                  Website/Service *
                </Label>
                <Input
                  id="website"
                  type="text"
                  placeholder="e.g., google.com, GitHub, Netflix"
                  value={contextData.website}
                  onChange={(e) => setContextData((prev) => ({ ...prev, website: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#333333] text-[#F5F5F5] placeholder:text-[#A1A1AA]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#F5F5F5] font-medium">
                  Username/Email *
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g., john@example.com, username123"
                  value={contextData.username}
                  onChange={(e) => setContextData((prev) => ({ ...prev, username: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#333333] text-[#F5F5F5] placeholder:text-[#A1A1AA]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-[#F5F5F5] font-medium">
                  Title/Notes (Optional)
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Work Account, Personal Gmail"
                  value={contextData.title}
                  onChange={(e) => setContextData((prev) => ({ ...prev, title: e.target.value }))}
                  className="bg-[#2A2A2A] border-[#333333] text-[#F5F5F5] placeholder:text-[#A1A1AA]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveToVault}
                disabled={isSaving || !contextData.website.trim() || !contextData.username.trim()}
                className="flex-1 bg-[#4C2F7C] hover:bg-[#9D85C5] text-[#F5F5F5] disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save to Vault"}
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToGenerator}
                disabled={isSaving}
                className="border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#333333] bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5] w-[95vw] max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Key className="w-5 h-5 text-[#9D85C5]" />
              Password Generator
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#333333] h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generated Password */}
          <Card className="bg-[#2A2A2A] border-[#333333]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-[#121212] p-3 rounded-md font-mono text-base text-[#F5F5F5] break-all word-break min-h-[3rem] flex items-center">
                  {password || "Generate a password"}
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generatePassword}
                    className="text-[#A1A1AA] hover:text-[#9D85C5] hover:bg-[#333333] h-10 w-10 p-0"
                    title="Regenerate password"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <CopyButton text={password} />
                </div>
              </div>
              <StrengthMeter password={password} useZxcvbn={isZxcvbnLoaded} />
            </CardContent>
          </Card>

          {/* Length Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[#F5F5F5] font-medium">Length</Label>
              <span className="text-[#9D85C5] font-mono text-sm bg-[#2A2A2A] px-2 py-1 rounded">{settings.length}</span>
            </div>
            <Slider
              value={[settings.length]}
              onValueChange={(value) => updateSettings("length", value[0])}
              min={8}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          {/* Character Type Toggles */}
          <div className="space-y-4">
            <Label className="text-[#F5F5F5] font-medium">Character Types</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="uppercase" className="text-[#F5F5F5] cursor-pointer">
                  Uppercase Letters (A-Z)
                </Label>
                <Switch
                  id="uppercase"
                  checked={settings.includeUppercase}
                  onCheckedChange={(checked) => updateSettings("includeUppercase", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="lowercase" className="text-[#F5F5F5] cursor-pointer">
                  Lowercase Letters (a-z)
                </Label>
                <Switch
                  id="lowercase"
                  checked={settings.includeLowercase}
                  onCheckedChange={(checked) => updateSettings("includeLowercase", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="numbers" className="text-[#F5F5F5] cursor-pointer">
                  Numbers (0-9)
                </Label>
                <Switch
                  id="numbers"
                  checked={settings.includeNumbers}
                  onCheckedChange={(checked) => updateSettings("includeNumbers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="symbols" className="text-[#F5F5F5] cursor-pointer">
                  Symbols (!@#$%^&*)
                </Label>
                <Switch
                  id="symbols"
                  checked={settings.includeSymbols}
                  onCheckedChange={(checked) => updateSettings("includeSymbols", checked)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUsePassword}
              disabled={!password}
              className="flex-1 bg-[#4C2F7C] hover:bg-[#9D85C5] text-[#F5F5F5]"
            >
              Use Password
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#333333] bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
