"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Shield, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"

export function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }

    setIsLoading(true)
    setError("")

    setTimeout(() => {
      window.location.href = `/auth?email=${encodeURIComponent(username)}&returning=true`
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
        <h1 className="text-2xl font-semibold text-card-foreground text-balance">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">Sign in to access your secure vault</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        </div>

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input border-border text-card-foreground placeholder:text-muted-foreground pr-12 h-12 text-lg focus:ring-ring focus:border-ring"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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

        <Button
          onClick={handleLogin}
          disabled={!username || !password || isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-secondary hover:text-secondary/80 font-medium">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Home
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
