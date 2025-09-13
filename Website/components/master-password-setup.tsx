"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Eye, EyeOff, AlertCircle, Lock, CheckCircle } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

export function MasterPasswordSetup() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [masterPassword, setMasterPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showMasterPassword, setShowMasterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const usernameParam = searchParams.get("username")
    const emailParam = searchParams.get("email")
    if (usernameParam) setUsername(usernameParam)
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  const passwordStrength = {
    length: masterPassword.length >= 12,
    uppercase: /[A-Z]/.test(masterPassword),
    lowercase: /[a-z]/.test(masterPassword),
    number: /\d/.test(masterPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(masterPassword),
  }

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean)
  const passwordsMatch = masterPassword === confirmPassword && confirmPassword.length > 0

  const handleSetupMasterPassword = async () => {
    if (!masterPassword || !confirmPassword) {
      setError("Please fill in both password fields")
      return
    }

    if (!isPasswordStrong) {
      setError("Please meet all password requirements")
      return
    }

    if (!passwordsMatch) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setError("")

    setTimeout(() => {
      router.push("/vault")
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md bg-card border-border shadow-2xl">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary rounded-full">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-card-foreground text-balance">Set up WebAuthn authentication</h1>
        <p className="text-muted-foreground text-sm">Create your master password to secure your vault</p>
        {username && <p className="text-secondary text-xs font-medium">Welcome, {username}!</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showMasterPassword ? "text" : "password"}
            placeholder="Master Password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground pl-12 pr-12 h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleSetupMasterPassword()}
          />
          <button
            type="button"
            onClick={() => setShowMasterPassword(!showMasterPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
          >
            {showMasterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Master Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground pl-12 pr-12 h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleSetupMasterPassword()}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-card-foreground">Password Requirements:</p>
          <div className="space-y-2">
            <div
              className={`flex items-center gap-2 text-xs ${passwordStrength.length ? "text-green-500" : "text-muted-foreground"}`}
            >
              {passwordStrength.length ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground" />
              )}
              <span>At least 12 characters</span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs ${passwordStrength.uppercase ? "text-green-500" : "text-muted-foreground"}`}
            >
              {passwordStrength.uppercase ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground" />
              )}
              <span>One uppercase letter</span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs ${passwordStrength.lowercase ? "text-green-500" : "text-muted-foreground"}`}
            >
              {passwordStrength.lowercase ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground" />
              )}
              <span>One lowercase letter</span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs ${passwordStrength.number ? "text-green-500" : "text-muted-foreground"}`}
            >
              {passwordStrength.number ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground" />
              )}
              <span>One number</span>
            </div>
            <div
              className={`flex items-center gap-2 text-xs ${passwordStrength.special ? "text-green-500" : "text-muted-foreground"}`}
            >
              {passwordStrength.special ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-muted-foreground" />
              )}
              <span>One special character</span>
            </div>
          </div>

          {confirmPassword && (
            <div
              className={`flex items-center gap-2 text-xs ${passwordsMatch ? "text-green-500" : "text-destructive"}`}
            >
              {passwordsMatch ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{passwordsMatch ? "Passwords match" : "Passwords do not match"}</span>
            </div>
          )}
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-card-foreground mb-1">Important:</p>
              <p>Your master password cannot be recovered if lost. Make sure to remember it or store it safely.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleSetupMasterPassword}
          disabled={!isPasswordStrong || !passwordsMatch || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Securing Your Vault..." : "Secure My Vault"}
        </Button>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">Next: Set up biometric authentication for quick access</p>
        </div>
      </CardContent>
    </Card>
  )
}
