"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Smartphone, Monitor, Tablet, Trash2, Shield, Calendar, Plus } from "lucide-react"

interface Device {
  id: string
  name: string
  type: "desktop" | "mobile" | "tablet"
  lastActive: Date
  location: string
  isCurrentDevice: boolean
}

const mockDevices: Device[] = [
  {
    id: "1",
    name: "MacBook Pro",
    type: "desktop",
    lastActive: new Date(),
    location: "San Francisco, CA",
    isCurrentDevice: true,
  },
  {
    id: "2",
    name: "iPhone 15 Pro",
    type: "mobile",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    location: "San Francisco, CA",
    isCurrentDevice: false,
  },
  {
    id: "3",
    name: "iPad Air",
    type: "tablet",
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    location: "San Francisco, CA",
    isCurrentDevice: false,
  },
  {
    id: "4",
    name: "Windows Desktop",
    type: "desktop",
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    location: "New York, NY",
    isCurrentDevice: false,
  },
]

export function DeviceManager() {
  const [devices, setDevices] = useState<Device[]>(mockDevices)
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false)
  const [newDeviceName, setNewDeviceName] = useState("")
  const [newDeviceType, setNewDeviceType] = useState<Device["type"]>("desktop")

  const getDeviceIcon = (type: Device["type"]) => {
    switch (type) {
      case "desktop":
        return <Monitor className="w-5 h-5" />
      case "mobile":
        return <Smartphone className="w-5 h-5" />
      case "tablet":
        return <Tablet className="w-5 h-5" />
    }
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Active now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const handleRevokeDevice = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)
    if (
      device &&
      confirm(
        `Are you sure you want to revoke access for "${device.name}"? This device will no longer be able to access your vault.`,
      )
    ) {
      setDevices(devices.filter((device) => device.id !== deviceId))
    }
  }

  const handleAddDevice = () => {
    if (!newDeviceName.trim()) {
      alert("Please enter a device name")
      return
    }

    const newDevice: Device = {
      id: Date.now().toString(),
      name: newDeviceName.trim(),
      type: newDeviceType,
      lastActive: new Date(),
      location: "Unknown Location", // In a real app, this would be detected
      isCurrentDevice: false,
    }

    setDevices([...devices, newDevice])
    setNewDeviceName("")
    setNewDeviceType("desktop")
    setIsAddDeviceOpen(false)

    alert(`Device "${newDevice.name}" has been added to your vault. You can now access your vault from this device.`)
  }

  return (
    <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
      <CardHeader>
        <CardTitle className="text-[#F5F5F5] text-xl flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#9D85C5]" />
          Device Management
        </CardTitle>
        <p className="text-[#A1A1AA] text-sm">Manage devices with access to your vault</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 bg-[#2A2A2A] rounded-lg border border-[#333333]"
          >
            <div className="flex items-center gap-4">
              <div className="text-[#9D85C5]">{getDeviceIcon(device.type)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[#F5F5F5] font-medium">{device.name}</h4>
                  {device.isCurrentDevice && (
                    <Badge variant="secondary" className="bg-[#4C2F7C] text-[#F5F5F5] text-xs">
                      Current Device
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-[#A1A1AA] mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatLastActive(device.lastActive)}
                  </span>
                  <span>{device.location}</span>
                </div>
              </div>
            </div>
            {!device.isCurrentDevice && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeDevice(device.id)}
                className="text-[#F87171] hover:text-[#F87171] hover:bg-[#F87171]/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Revoke
              </Button>
            )}
          </div>
        ))}

        <div className="pt-4 border-t border-[#2A2A2A]">
          <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5] bg-transparent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Device
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E1E1E] border-[#2A2A2A] text-[#F5F5F5]">
              <DialogHeader>
                <DialogTitle className="text-[#F5F5F5]">Add New Device</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="device-name" className="text-[#F5F5F5]">
                    Device Name
                  </Label>
                  <Input
                    id="device-name"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="e.g., John's iPhone, Work Laptop"
                    className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#A1A1AA]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-type" className="text-[#F5F5F5]">
                    Device Type
                  </Label>
                  <Select value={newDeviceType} onValueChange={(value: Device["type"]) => setNewDeviceType(value)}>
                    <SelectTrigger className="bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2A2A2A] border-[#333333]">
                      <SelectItem value="desktop" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Desktop
                        </div>
                      </SelectItem>
                      <SelectItem value="mobile" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Mobile
                        </div>
                      </SelectItem>
                      <SelectItem value="tablet" className="text-[#F5F5F5] focus:bg-[#4C2F7C] focus:text-[#F5F5F5]">
                        <div className="flex items-center gap-2">
                          <Tablet className="w-4 h-4" />
                          Tablet
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDeviceOpen(false)}
                    className="flex-1 border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#333333] bg-transparent"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddDevice} className="flex-1 bg-[#4C2F7C] hover:bg-[#9D85C5] text-[#F5F5F5]">
                    Add Device
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
