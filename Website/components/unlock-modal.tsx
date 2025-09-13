"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Shield, Eye, EyeOff, Fingerprint, AlertCircle } from "lucide-react"
import { useVault } from "@/app/contexts/vault-context"
import { authService } from "@/lib/auth"
import { useSearchParams } from "next/navigation"

export function UnlockModal() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)
  const [step, setStep] = useState<"email" | "auth">("email")
  const { unlockVault } = useVault()

  useEffect(() => {
    const emailParam = searchParams.get("email")
    const setupParam = searchParams.get("setup")
    const returningParam = searchParams.get("returning")

    if (emailParam) {
      setEmail(emailParam)
      if (returningParam === "true") {
        setIsNewUser(false)
        setStep("auth")
      } else {
        setStep("email")
      }
    }
  }, [searchParams])

  const handleEmailSubmit = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const userExists = await authService.checkUserExists(email)
      setIsNewUser(!userExists)
      setStep("auth")
    } catch (error) {
      console.error("Email check failed:", error)
      setError("Failed to verify email. Please try again.")
    }

    setIsLoading(false)
  }

  const handleWebAuthnAuth = async () => {
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
      let result
      if (isNewUser) {
        result = await authService.registerUser(email, password)
      } else {
        result = await authService.loginUser(email, password)
      }

      if (result.success) {
        // Unlock the vault with the master password
        const vaultUnlocked = await unlockVault(password)
        if (vaultUnlocked) {
          window.location.href = "/vault"
        } else {
          setError("Failed to unlock vault after authentication")
        }
      } else {
        setError(result.error || "Authentication failed")
      }
    } catch (error) {
      console.error("WebAuthn authentication failed:", error)
      setError("Authentication failed. Please try again.")
    }

    setIsLoading(false)
  }

  const handleBack = () => {
    setStep("email")
    setError("")
    setPassword("")
  }

  if (step === "email") {
    return (
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-card-foreground text-balance">Access Your Vault</h1>
          <p className="text-muted-foreground text-sm">Enter your email to continue</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground h-12 text-lg focus:ring-ring focus:border-ring"
              onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleEmailSubmit}
            disabled={!email || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Checking..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md bg-card border-border shadow-2xl">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary rounded-full">
            <Fingerprint className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-card-foreground text-balance">Unlock Your Vault</h1>
        <p className="text-muted-foreground text-sm">Use WebAuthn to securely access your vault</p>
        <p className="text-secondary text-xs font-medium">{email}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Master Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground pr-12 h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleWebAuthnAuth()}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleWebAuthnAuth}
            disabled={!password || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Fingerprint className="w-5 h-5" />
            {isLoading ? "Authenticating..." : "Login with WebAuthn"}
          </Button>

          <Button
            onClick={handleBack}
            variant="outline"
            className="w-full border-border text-muted-foreground hover:text-card-foreground hover:bg-muted h-10 bg-transparent"
          >
            Back
          </Button>
        </div>

        {!authService.isWebAuthnSupported() && (
          <div className="text-center text-sm text-amber-400 bg-amber-400/10 p-3 rounded-lg">
            WebAuthn is not supported in this browser. Please use a modern browser with biometric authentication
            support.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
