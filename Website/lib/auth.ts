import { startAuthentication, startRegistration } from "@simplewebauthn/browser"

const BASE_URL = "https://temp-backend2.vercel.app"

export interface AuthUser {
  email: string
  token: string
}

export class AuthService {
  private static instance: AuthService
  private token: string | null = null

  private constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async checkUserExists(email: string): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/test-user?email=${encodeURIComponent(email)}`)
      return response.ok
    } catch (error) {
      console.error("Error checking user existence:", error)
      return false
    }
  }

  async registerUser(
    email: string,
    masterPassword: string,
  ): Promise<{ success: boolean; error?: string; salt?: string }> {
    try {
      // Start registration
      const startResponse = await fetch(`${BASE_URL}/api/auth/register/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!startResponse.ok) {
        const error = await startResponse.text()
        return { success: false, error: `Registration start failed: ${error}` }
      }

      const registrationOptions = await startResponse.json()

      // Complete WebAuthn registration
      const credential = await startRegistration(registrationOptions)

      // Verify registration
      const verifyResponse = await fetch(`${BASE_URL}/api/auth/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          credential,
          masterPassword,
        }),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.text()
        return { success: false, error: `Registration verification failed: ${error}` }
      }

      const result = await verifyResponse.json()

      // Store token
      this.token = result.token
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", result.token)
      }

      return { success: true, salt: result.salt }
    } catch (error: any) {
      console.error("Registration error:", error)
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      }
    }
  }

  async loginUser(email: string, masterPassword: string): Promise<{ success: boolean; error?: string; salt?: string }> {
    try {
      // Start login
      const startResponse = await fetch(`${BASE_URL}/api/auth/login/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!startResponse.ok) {
        const error = await startResponse.text()
        return { success: false, error: `Login start failed: ${error}` }
      }

      const authenticationOptions = await startResponse.json()

      // Complete WebAuthn authentication
      const credential = await startAuthentication(authenticationOptions)

      // Verify login
      const verifyResponse = await fetch(`${BASE_URL}/api/auth/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          credential,
          masterPassword,
        }),
      })

      if (!verifyResponse.ok) {
        const error = await verifyResponse.text()
        return { success: false, error: `Login verification failed: ${error}` }
      }

      const result = await verifyResponse.json()

      // Store token
      this.token = result.token
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", result.token)
      }

      return { success: true, salt: result.salt }
    } catch (error: any) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      }
    }
  }

  async reVerifyUser(
    email: string,
    masterPassword: string,
  ): Promise<{ success: boolean; error?: string; salt?: string }> {
    // Re-verification uses the same login flow
    return this.loginUser(email, masterPassword)
  }

  getToken(): string | null {
    return this.token
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  logout(): void {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  // Check if WebAuthn is supported
  isWebAuthnSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "navigator" in window &&
      "credentials" in navigator &&
      "create" in navigator.credentials &&
      "get" in navigator.credentials
    )
  }
}

export const authService = AuthService.getInstance()
