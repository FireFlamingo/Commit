"use client"

import { Plus, Search, Globe, Shield, Key, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { PasswordItem } from "@/app/vault/page"
import { useState } from "react"

// Declare ItemListProps type
type ItemListProps = {
  items: PasswordItem[]
  selectedItem?: PasswordItem
  onItemSelect: (item: PasswordItem) => void
  onAddItem: () => void
  onGeneratePassword: () => void
}

export function ItemList({ items, selectedItem, onItemSelect, onAddItem, onGeneratePassword }: ItemListProps) {
  const [showAddOptions, setShowAddOptions] = useState(false)

  return (
    <div className="w-80 bg-[#1A1A1A] border-r border-[#2A2A2A] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F5F5F5]">Vault Items ({items.length})</h2>
          <div className="relative">
            <Button
              onClick={() => setShowAddOptions(!showAddOptions)}
              size="sm"
              className="bg-[#4C2F7C] hover:bg-[#9D85C5] text-[#F5F5F5] h-8 px-3"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>

            {showAddOptions && (
              <div className="absolute right-0 top-10 bg-[#2A2A2A] border border-[#444] rounded-lg shadow-lg z-10 min-w-[160px]">
                <button
                  onClick={() => {
                    onAddItem()
                    setShowAddOptions(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[#F5F5F5] hover:bg-[#333] flex items-center gap-2 rounded-t-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  Add Password
                </button>
                <button
                  onClick={() => {
                    onGeneratePassword()
                    setShowAddOptions(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[#F5F5F5] hover:bg-[#333] flex items-center gap-2 rounded-b-lg"
                >
                  <Key className="w-4 h-4" />
                  Generate Password
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]" />
          <Input
            placeholder="Search vault..."
            className="pl-10 bg-[#2A2A2A] border-[#2A2A2A] text-[#F5F5F5] placeholder:text-[#A1A1AA] focus:ring-[#9D85C5] focus:border-[#9D85C5]"
          />
        </div>
      </div>

      {showAddOptions && <div className="fixed inset-0 z-5" onClick={() => setShowAddOptions(false)} />}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
            <p className="text-[#A1A1AA] text-sm">No items found</p>
          </div>
        ) : (
          <div className="p-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onItemSelect(item)}
                className={cn(
                  "w-full text-left p-3 rounded-lg mb-2 transition-colors",
                  selectedItem?.id === item.id ? "bg-[#4C2F7C] text-[#F5F5F5]" : "hover:bg-[#333333] text-[#F5F5F5]",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {item.url ? (
                      <div className="w-8 h-8 bg-[#2A2A2A] rounded-full flex items-center justify-center">
                        <Globe className="w-4 h-4 text-[#9D85C5]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-[#4C2F7C] rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-[#F5F5F5]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-[#A1A1AA] truncate">{item.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-[#2A2A2A] px-2 py-0.5 rounded text-[#9D85C5]">{item.folder}</span>
                      {item.totpSecret && (
                        <span className="text-xs bg-[#4C2F7C] px-2 py-0.5 rounded text-[#F5F5F5]">2FA</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
