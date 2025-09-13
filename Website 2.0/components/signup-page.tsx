"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Shield, Eye, EyeOff, AlertCircle, User, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function SignUpPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignUp = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    // TODO: Implement actual sign-up logic
    setTimeout(() => {
      router.push(`/master-password-setup?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`)
    }, 1000)
  }

  return (
    <Card className="w-full max-w-md bg-card border-border shadow-2xl">
      <CardHeader className="text-center pb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary rounded-full">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-card-foreground text-balance">Create Your Account</h1>
        <p className="text-muted-foreground text-sm">Join thousands of users securing their digital lives</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground pl-12 h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
          />
        </div>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground pl-12 h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground pl-12 pr-12 h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Password requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li className={password.length >= 8 ? "text-green-500" : ""}>At least 8 characters</li>
            <li className={/[A-Z]/.test(password) ? "text-green-500" : ""}>One uppercase letter</li>
            <li className={/[a-z]/.test(password) ? "text-green-500" : ""}>One lowercase letter</li>
            <li className={/\d/.test(password) ? "text-green-500" : ""}>One number</li>
          </ul>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleSignUp}
          disabled={!username || !email || !password || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-secondary hover:text-secondary/80 font-medium">
              Sign In
            </Link>
          </p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Home
          </Link>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-secondary hover:text-secondary/80">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-secondary hover:text-secondary/80">
            Privacy Policy
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
