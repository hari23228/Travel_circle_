'use client'

import dynamic from 'next/dynamic'

// Dynamic import of FloatingTravelAssistant (client-side only)
const FloatingTravelAssistant = dynamic(
  () => import('./floating-travel-assistant').then(mod => ({ default: mod.FloatingTravelAssistant })),
  { ssr: false }
)

export function ClientFloatingAssistant() {
  return <FloatingTravelAssistant />
}
