"use client"

import { useState, useEffect } from "react"
import { CopyButton } from "@/components/copy-button"

interface TotpDisplayProps {
  secret: string
}

export function TotpDisplay({ secret }: TotpDisplayProps) {
  const [code, setCode] = useState("000000")
  const [timeLeft, setTimeLeft] = useState(30)

  // Mock TOTP generation (in real app, you'd use a proper TOTP library)
  useEffect(() => {
    const generateCode = () => {
      // This is a mock implementation - use a real TOTP library in production
      const mockCode = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")
      setCode(mockCode)
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000)
      const timeLeft = 30 - (now % 30)
      setTimeLeft(timeLeft)

      if (timeLeft === 30) {
        generateCode()
      }
    }

    generateCode()
    updateTimer()

    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [secret])

  const progress = (timeLeft / 30) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="text-3xl font-mono font-bold text-[#F5F5F5] tracking-wider">
            {code.slice(0, 3)} {code.slice(3)}
          </div>
          <div className="text-sm text-[#A1A1AA] mt-1">Refreshes in {timeLeft}s</div>
        </div>
        <CopyButton text={code} />
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#2A2A2A] rounded-full h-2">
        <div
          className="bg-[#9D85C5] h-2 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
