import { supabase } from './supabase'

// Remove /api from base URL since we add it in the endpoint paths
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/api$/, '')

export interface ChatMessage {
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
}

export interface ChatbotMetadata {
  destination?: string
  travelDates?: {
    start: string
    end: string
  }
  activities?: string[]
  preferences?: {
    budget?: string
    travelStyle?: string
  }
}

export interface ChatbotResponse {
  success: boolean
  intent: string
  confidence: number
  response: {
    text: string
    data: any
    suggestions: string[]
    actions: Array<{
      type: string
      label: string
      data: any
    }>
  }
  context: {
    destination: string | null
    travelDates: any
    activities: string[]
  }
  timestamp: string
}

class ChatbotAPI {
  private cachedSession: any = null
  private sessionTimestamp: number = 0

  private async getHeaders() {
    // Cache session for 5 minutes to avoid repeated Supabase calls
    const now = Date.now()
    if (!this.cachedSession || now - this.sessionTimestamp > 300000) {
      const { data: { session } } = await supabase.auth.getSession()
      this.cachedSession = session
      this.sessionTimestamp = now
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.cachedSession?.access_token) {
      headers.Authorization = `Bearer ${this.cachedSession.access_token}`
    }

    return headers
  }

  // Clear session cache (call on logout)
  clearSessionCache() {
    this.cachedSession = null
    this.sessionTimestamp = 0
  }

  async sendMessage(message: string, metadata?: ChatbotMetadata): Promise<ChatbotResponse> {
    const headers = await this.getHeaders()
    const url = `${API_BASE_URL}/api/chatbot/message`
    
    console.log('[Chatbot API] Sending message to:', url)
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, metadata })
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[Chatbot API] Error response:', response.status, errorText)
      throw new Error(`Failed to send message: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async getContext() {
    const headers = await this.getHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/chatbot/context`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      throw new Error('Failed to get context')
    }

    return response.json()
  }

  async updateContext(metadata: ChatbotMetadata) {
    const headers = await this.getHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/chatbot/context`, {
      method: 'POST',
      headers,
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      throw new Error('Failed to update context')
    }

    return response.json()
  }

  async clearContext() {
    const headers = await this.getHeaders()
    
    const response = await fetch(`${API_BASE_URL}/api/chatbot/context`, {
      method: 'DELETE',
      headers
    })

    if (!response.ok) {
      throw new Error('Failed to clear context')
    }

    return response.json()
  }

  async getFeatures() {
    const response = await fetch(`${API_BASE_URL}/api/chatbot/features`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to get features')
    }

    return response.json()
  }
}

export const chatbotAPI = new ChatbotAPI()
