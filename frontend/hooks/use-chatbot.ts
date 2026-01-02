import { useState, useCallback } from 'react'
import { chatbotAPI, ChatbotMetadata } from '@/lib/chatbot-api'

interface Message {
  role: 'user' | 'assistant'
  text: string
  data?: any
  suggestions?: string[]
  actions?: any[]
  timestamp: Date
}

export function useChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<ChatbotMetadata>({})

  const sendMessage = useCallback(async (text: string) => {
    setIsLoading(true)
    setError(null)

    // Add user message
    const userMessage: Message = {
      role: 'user',
      text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await chatbotAPI.sendMessage(text, context)

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        text: response.response.text,
        data: response.response.data,
        suggestions: response.response.suggestions,
        actions: response.response.actions,
        timestamp: new Date(response.timestamp)
      }
      setMessages(prev => [...prev, assistantMessage])

      // Update context
      setContext({
        destination: response.context.destination || context.destination,
        travelDates: response.context.travelDates || context.travelDates,
        activities: response.context.activities || context.activities
      })

      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }, [context])

  const updateTripContext = useCallback(async (metadata: ChatbotMetadata) => {
    try {
      await chatbotAPI.updateContext(metadata)
      setContext(prev => ({ ...prev, ...metadata }))
    } catch (err) {
      console.error('Failed to update context:', err)
    }
  }, [])

  const clearChat = useCallback(async () => {
    try {
      await chatbotAPI.clearContext()
      setMessages([])
      setContext({})
      setError(null)
    } catch (err) {
      console.error('Failed to clear context:', err)
    }
  }, [])

  return {
    messages,
    isLoading,
    error,
    context,
    sendMessage,
    updateTripContext,
    clearChat
  }
}
