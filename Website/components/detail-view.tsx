"use client"

import { useState } from "react"
import { Eye, EyeOff, Edit, Trash2, Globe, Calendar, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TotpDisplay } from "@/components/totp-display"
import { CopyButton } from "@/components/copy-button"
import type { PasswordItem } from "@/app/vault/page"

interface DetailViewProps {
  item: PasswordItem | null
  onEdit: (item: PasswordItem) => void
  onDelete: (itemId: string) => void
}

export function DetailView({ item, onEdit, onDelete }: DetailViewProps) {
  const [showPassword, setShowPassword] = useState(false)

  if (!item) {
    return (
      <div className="flex-1 bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-[#A1A1AA]" />
          </div>
          <h3 className="text-lg font-medium text-[#F5F5F5] mb-2">Select an item</h3>
          <p className="text-[#A1A1AA] text-sm">Choose an item from the list to view its details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#121212] p-6 overflow-y-auto">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#F5F5F5] mb-2">{item.name}</h1>
            <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
              <Calendar className="w-4 h-4" />
              Last updated {item.updatedAt.toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(item)}
              variant="outline"
              size="sm"
              className="border-[#2A2A2A] text-[#F5F5F5] hover:bg-[#333333] hover:text-[#9D85C5]"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => onDelete(item.id)}
              variant="outline"
              size="sm"
              className="border-[#2A2A2A] text-[#F87171] hover:bg-[#333333] hover:text-[#F87171]"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Main Details */}
        <Card className="bg-[#1E1E1E] border-[#2A2A2A] mb-6">
          <CardHeader>
            <CardTitle className="text-[#F5F5F5] text-lg">Login Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL */}
            {item.url && (
              <div>
                <label className="text-sm font-medium text-[#A1A1AA] block mb-2">Website</label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#9D85C5]" />
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9D85C5] hover:underline"
                  >
                    {item.url}
                  </a>
                </div>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] block mb-2">Username</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#2A2A2A] px-3 py-2 rounded-md text-[#F5F5F5]">{item.username}</div>
                <CopyButton text={item.username} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-[#A1A1AA] block mb-2">Password</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#2A2A2A] px-3 py-2 rounded-md text-[#F5F5F5] font-mono">
                  {showPassword ? item.password : "••••••••••••"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#A1A1AA] hover:text-[#9D85C5] hover:bg-[#333333] h-10 w-10 p-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <CopyButton text={item.password} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TOTP Section */}
        {item.totpSecret && (
          <Card className="bg-[#1E1E1E] border-[#2A2A2A] mb-6">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5] text-lg"></CardTitle>
            </CardHeader>
            <CardContent>
              <TotpDisplay secret={item.totpSecret} />
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {item.notes && (
          <Card className="bg-[#1E1E1E] border-[#2A2A2A] mb-6">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5] text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#F5F5F5] whitespace-pre-wrap">{item.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <Card className="bg-[#1E1E1E] border-[#2A2A2A]">
            <CardHeader>
              <CardTitle className="text-[#F5F5F5] text-lg flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-[#4C2F7C] text-[#F5F5F5] hover:bg-[#9D85C5]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
