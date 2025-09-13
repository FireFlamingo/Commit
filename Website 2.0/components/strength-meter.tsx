"use client"

import { useState, useEffect } from "react"

interface StrengthMeterProps {
  password: string
  useZxcvbn?: boolean
}

interface StrengthResult {
  score: number
  label: string
  color: string
  feedback: string[]
  warning?: string
}

declare global {
  interface Window {
    zxcvbn?: (password: string) => {
      score: number
      feedback: {
        suggestions: string[]
        warning: string
      }
      crack_times_display: {
        offline_slow_hashing_1e4_per_second: string
      }
    }
    zxcvbnOptions?: any
  }
}

export function StrengthMeter({ password, useZxcvbn = false }: StrengthMeterProps) {
  const [zxcvbnLoaded, setZxcvbnLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!useZxcvbn || typeof window === "undefined") {
      return
    }

    if (window.zxcvbn) {
      setZxcvbnLoaded(true)
      return
    }

    setIsLoading(true)

    // Load zxcvbn core
    const coreScript = document.createElement("script")
    coreScript.src = "https://cdn.jsdelivr.net/npm/@zxcvbn-ts/core@3.0.4/dist/zxcvbn-ts.js"
    coreScript.onload = () => {
      // Load language pack
      const langScript = document.createElement("script")
      langScript.src = "https://cdn.jsdelivr.net/npm/@zxcvbn-ts/language-common@3.0.4/dist/zxcvbn-ts.js"
      langScript.onload = () => {
        // Initialize zxcvbn with language pack
        if (window.zxcvbnOptions && window.zxcvbn) {
          try {
            window.zxcvbn.setOptions(window.zxcvbnOptions.dictionary)
          } catch (e) {
            console.warn("Failed to set zxcvbn options:", e)
          }
        }
        setZxcvbnLoaded(true)
        setIsLoading(false)
      }
      langScript.onerror = () => {
        console.warn("Failed to load zxcvbn language pack, falling back to basic evaluation")
        setIsLoading(false)
      }
      document.head.appendChild(langScript)
    }
    coreScript.onerror = () => {
      console.warn("Failed to load zxcvbn, falling back to basic evaluation")
      setIsLoading(false)
    }
    document.head.appendChild(coreScript)
  }, [useZxcvbn])

  const calculateStrength = (password: string): StrengthResult => {
    if (!password)
      return {
        score: 0,
        label: "No password",
        color: "#A1A1AA",
        feedback: [],
      }

    if (useZxcvbn && zxcvbnLoaded && window.zxcvbn) {
      try {
        const result = window.zxcvbn(password)
        const scoreMap = [
          { label: "Very Weak", color: "#F87171" }, // Red
          { label: "Weak", color: "#FB923C" }, // Orange
          { label: "Fair", color: "#FDE047" }, // Yellow
          { label: "Good", color: "#4ADE80" }, // Light Green
          { label: "Strong", color: "#22C55E" }, // Green
        ]

        const strength = scoreMap[result.score] || scoreMap[0]

        return {
          score: result.score,
          label: strength.label,
          color: strength.color,
          feedback: result.feedback.suggestions || [],
          warning: result.feedback.warning,
        }
      } catch (error) {
        console.warn("zxcvbn evaluation failed, falling back to basic evaluation:", error)
      }
    }

    // Fallback basic evaluation
    let score = 0
    const feedback: string[] = []

    // Length scoring
    if (password.length >= 8) score += 1
    else feedback.push("Make it longer (at least 8 characters)")

    if (password.length >= 12) score += 1
    else if (password.length >= 8) feedback.push("Consider making it longer")

    if (password.length >= 16) score += 1

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1
    else feedback.push("Add lowercase letters")

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push("Add uppercase letters")

    if (/[0-9]/.test(password)) score += 1
    else feedback.push("Add numbers")

    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push("Add symbols")

    // Complexity bonus
    if (password.length >= 20 && score >= 6) score += 1

    // Determine strength level (normalize to 0-4 scale like zxcvbn)
    let normalizedScore = 0
    let label = "Very Weak"
    let color = "#F87171"

    if (score <= 2) {
      normalizedScore = 0
      label = "Very Weak"
      color = "#F87171"
    } else if (score <= 4) {
      normalizedScore = 1
      label = "Weak"
      color = "#FB923C"
    } else if (score <= 6) {
      normalizedScore = 2
      label = "Fair"
      color = "#FDE047"
    } else if (score <= 7) {
      normalizedScore = 3
      label = "Good"
      color = "#4ADE80"
    } else {
      normalizedScore = 4
      label = "Strong"
      color = "#22C55E"
    }

    return { score: normalizedScore, label, color, feedback }
  }

  const strength = calculateStrength(password)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#A1A1AA]">
          Password Strength
          {isLoading && <span className="ml-1 text-xs">(Loading...)</span>}
        </span>
        <span style={{ color: strength.color }} className="font-medium">
          {strength.label}
        </span>
      </div>

      <div className="w-full bg-[#333333] rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${(strength.score / 4) * 100}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>

      {password && (
        <div className="text-xs text-[#A1A1AA] space-y-1">
          <div className="flex items-center justify-between">
            <span>Length: {password.length} characters</span>
            {useZxcvbn && zxcvbnLoaded && <span className="text-[#4ADE80]">✓ Advanced analysis</span>}
          </div>

          <div className="flex flex-wrap gap-2">
            {password.length >= 12 && <span className="text-[#4ADE80]">✓ Good length</span>}
            {/[a-z]/.test(password) && /[A-Z]/.test(password) && <span className="text-[#4ADE80]">✓ Mixed case</span>}
            {/[0-9]/.test(password) && <span className="text-[#4ADE80]">✓ Numbers</span>}
            {/[^A-Za-z0-9]/.test(password) && <span className="text-[#4ADE80]">✓ Symbols</span>}
          </div>

          {strength.warning && <div className="text-[#FB923C] text-xs mt-2">⚠️ {strength.warning}</div>}

          {strength.feedback.length > 0 && (
            <div className="text-[#A1A1AA] text-xs mt-2">
              <div className="font-medium mb-1">Suggestions:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {strength.feedback.slice(0, 3).map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
