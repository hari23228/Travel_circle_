"use client"

import Link from "next/link"
import { Brain } from "lucide-react"

export function AIFeaturesButton() {
  return (
    <Link href="/ai-features">
      <button
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300 group"
        aria-label="AI Features"
      >
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <Brain className="w-5 h-5" />
        </div>
        <span className="font-semibold text-lg">AI Features</span>
        
        {/* Pulse animation */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
      </button>
    </Link>
  )
}
