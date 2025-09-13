"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface ToggleSwitchProps {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export function ToggleSwitch({ id, label, description, checked, onCheckedChange }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="space-y-1">
        <Label htmlFor={id} className="text-[#F5F5F5] font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-[#A1A1AA] text-sm">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
