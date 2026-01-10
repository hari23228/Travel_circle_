"use client"

import dynamic from "next/dynamic"

// Lazy load chatbot for better initial page load
const Chatbot = dynamic(() => import("@/components/chatbot").then(mod => ({ default: mod.Chatbot })), {
  ssr: false,
  loading: () => null
})

export function ClientChatbot() {
  return <Chatbot />
}