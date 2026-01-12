'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, Send, X, Loader2, Cloud, Calendar, Sparkles, ChevronLeft,
  MapPin, Users, Wallet, Clock, Plane
} from 'lucide-react'

// Backend API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

type MessageType = {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

type ChatMode = 'selection' | 'weather' | 'itinerary'

type ItineraryState = {
  step: 'destination' | 'days' | 'travelers' | 'budget' | 'generating' | 'complete'
  destination: string
  days: number
  travelers: number
  budget: string
}

type WeatherState = {
  step: 'greeting' | 'destination' | 'dates' | 'fetching' | 'complete'
  destination: string
  dates: string
}

// Popular destinations for quick selection
const popularDestinations = [
  { name: 'Paris', icon: '🗼' },
  { name: 'Tokyo', icon: '🏯' },
  { name: 'New York', icon: '🗽' },
  { name: 'Bali', icon: '🏝️' },
  { name: 'Dubai', icon: '🏙️' },
  { name: 'London', icon: '🎡' },
  { name: 'Goa', icon: '🏖️' },
  { name: 'Singapore', icon: '🦁' },
]

const tripDurations = [
  { days: 3, label: 'Weekend Getaway', icon: '⚡' },
  { days: 5, label: 'Short Trip', icon: '🎒' },
  { days: 7, label: 'Week Long', icon: '🌟' },
  { days: 10, label: 'Extended Trip', icon: '✈️' },
  { days: 14, label: 'Two Weeks', icon: '🌍' },
]

const travelerOptions = [
  { count: 1, label: 'Solo', icon: '🧳' },
  { count: 2, label: 'Couple', icon: '💑' },
  { count: 4, label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { count: 6, label: 'Group', icon: '👥' },
]

const budgetOptions = [
  { value: 'budget', label: 'Budget Friendly', range: '₹10K - ₹25K', icon: '💰' },
  { value: 'moderate', label: 'Moderate', range: '₹25K - ₹50K', icon: '💳' },
  { value: 'premium', label: 'Premium', range: '₹50K - ₹1L', icon: '💎' },
  { value: 'luxury', label: 'Luxury', range: '₹1L+', icon: '👑' },
]
// Helper function to format detailed itinerary
const formatDetailedItinerary = (itineraryData: any) => {
  if (!itineraryData?.data?.itinerary?.days) {
    return itineraryData.message || 'Here\'s your personalized itinerary!'
  }

  const itinerary = itineraryData.data.itinerary
  const days = itinerary.days || []
  
  let formatted = `🎉 Your ${itinerary.destination} Itinerary is Ready!\n\n`
  formatted += `📅 Duration: ${itinerary.total_days} days\n`
  formatted += `💰 Total Budget: ₹${itinerary.total_budget.toLocaleString()}\n`
  formatted += `👥 Travelers: ${itinerary.memberPreferences?.length || itinerary.per_person_budget ? Math.round(itinerary.total_budget / itinerary.per_person_budget) : 'N/A'}\n`
  formatted += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`

  days.forEach((day: any) => {
    formatted += `📍 Day ${day.day_number} - ${day.theme || day.date}\n`
    if (day.notes) {
      formatted += `${day.notes}\n`
    }
    formatted += `💵 Budget: ₹${day.planned_budget?.toLocaleString() || 'N/A'}\n\n`

    const activities = day.itinerary_activities || []
    activities.forEach((activity: any, idx: number) => {
      const startTime = activity.start_time || ''
      const endTime = activity.end_time || ''
      const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : ''
      
      formatted += `   ${idx + 1}. ${activity.title || activity.name}\n`
      if (timeRange) {
        formatted += `      ⏰ ${timeRange}\n`
      }
      if (activity.description) {
        formatted += `      📝 ${activity.description}\n`
      }
      if (activity.estimated_cost) {
        formatted += `      💰 ₹${activity.estimated_cost}\n`
      }
      if (activity.tips) {
        formatted += `      💡 ${activity.tips}\n`
      }
      formatted += `\n`
    })

    formatted += `\n`
  })

  // Budget summary
  if (itinerary.budgetStatus) {
    formatted += `━━━━━━━━━━━━━━━━━━━━━━\n\n`
    formatted += `💰 Budget Summary:\n`
    formatted += `   Total: ₹${itinerary.budgetStatus.totalBudget?.toLocaleString() || itinerary.total_budget.toLocaleString()}\n`
    formatted += `   Planned: ₹${itinerary.budgetStatus.plannedSpend?.toLocaleString() || 'N/A'}\n`
    formatted += `   Remaining: ₹${itinerary.budgetStatus.remaining?.toLocaleString() || 'N/A'}\n`
  }

  formatted += `\n✨ Generated with AI to optimize your travel experience!`

  return formatted
}
export function FloatingTravelAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chatMode, setChatMode] = useState<ChatMode>('selection')
  const [itineraryState, setItineraryState] = useState<ItineraryState>({
    step: 'destination',
    destination: '',
    days: 0,
    travelers: 0,
    budget: ''
  })
  const [weatherState, setWeatherState] = useState<WeatherState>({
    step: 'greeting',
    destination: '',
    dates: ''
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user, isLoading: authLoading } = useAuth()

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Don't render if user is not logged in
  if (!user || authLoading) {
    return null
  }

  const handleModeSelection = (mode: 'weather' | 'itinerary') => {
    setChatMode(mode)
    
    if (mode === 'weather') {
      setWeatherState({ step: 'greeting', destination: '', dates: '' })
      const welcomeMessage: MessageType = {
        role: 'assistant',
        content: `Hello ${user.name}! 👋\n\nI'm your Travel Weather Assistant. I can help you check weather conditions and get travel recommendations for any destination.\n\nWhere are you planning to travel? You can type a city name or select from popular destinations below.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } else {
      setItineraryState({ step: 'destination', destination: '', days: 0, travelers: 0, budget: '' })
      const welcomeMessage: MessageType = {
        role: 'assistant',
        content: `Hi ${user.name}! 🌍\n\nLet's plan your perfect trip! I'll help you create a personalized itinerary.\n\nFirst, where would you like to go? Select a destination below or type your own.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }

  const handleBackToSelection = () => {
    setChatMode('selection')
    setMessages([])
    setInput('')
    setItineraryState({ step: 'destination', destination: '', days: 0, travelers: 0, budget: '' })
    setWeatherState({ step: 'greeting', destination: '', dates: '' })
  }

  // Handle weather flow
  const handleWeatherDestinationSelect = async (destination: string) => {
    setWeatherState(prev => ({ ...prev, destination, step: 'dates' }))
    
    const userMsg: MessageType = {
      role: 'user',
      content: destination,
      timestamp: new Date()
    }
    
    const assistantMsg: MessageType = {
      role: 'assistant',
      content: `Great choice! ${destination} is wonderful! 🌟\n\nWhen are you planning to visit? You can type dates like "next week", "December 15-20", or "this weekend".`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg, assistantMsg])
  }

  const handleWeatherDateInput = async (dates: string) => {
    setWeatherState(prev => ({ ...prev, dates, step: 'fetching' }))
    setIsLoading(true)
    
    const userMsg: MessageType = {
      role: 'user',
      content: dates,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Get weather forecast for ${weatherState.destination} during ${dates}. Provide detailed weather analysis, travel recommendations, best activities for the weather, packing suggestions, and any weather alerts.`,
          userId: user.id,
          mode: 'weather',
          metadata: {
            destination: weatherState.destination,
            dates: dates,
            userName: user.name
          }
        }),
      })

      const data = await response.json()
      
      const assistantMessage: MessageType = {
        role: 'assistant',
        content: data.message || data.response?.text || 'Here\'s the weather information for your trip.',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setWeatherState(prev => ({ ...prev, step: 'complete' }))
    } catch (error) {
      console.error('Weather fetch error:', error)
      const errorMsg: MessageType = {
        role: 'assistant',
        content: 'I apologize, but I couldn\'t fetch the weather data right now. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle itinerary flow
  const handleItineraryDestinationSelect = (destination: string) => {
    setItineraryState(prev => ({ ...prev, destination, step: 'days' }))
    
    const userMsg: MessageType = { role: 'user', content: destination, timestamp: new Date() }
    const assistantMsg: MessageType = {
      role: 'assistant',
      content: `${destination} sounds amazing! 🎉\n\nHow many days are you planning to spend there?`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg, assistantMsg])
  }

  const handleItineraryDaysSelect = (days: number) => {
    setItineraryState(prev => ({ ...prev, days, step: 'travelers' }))
    
    const userMsg: MessageType = { role: 'user', content: `${days} days`, timestamp: new Date() }
    const assistantMsg: MessageType = {
      role: 'assistant',
      content: `Perfect! A ${days}-day trip gives us plenty to work with. 📅\n\nHow many travelers will be joining?`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg, assistantMsg])
  }

  const handleItineraryTravelersSelect = (travelers: number) => {
    setItineraryState(prev => ({ ...prev, travelers, step: 'budget' }))
    
    const userMsg: MessageType = { role: 'user', content: `${travelers} ${travelers === 1 ? 'traveler' : 'travelers'}`, timestamp: new Date() }
    const assistantMsg: MessageType = {
      role: 'assistant',
      content: `Got it! Planning for ${travelers} ${travelers === 1 ? 'person' : 'people'}. 👥\n\nWhat's your budget range for this trip?`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg, assistantMsg])
  }

  const handleItineraryBudgetSelect = async (budget: string, budgetLabel: string) => {
    setItineraryState(prev => ({ ...prev, budget, step: 'generating' }))
    setIsLoading(true)
    
    const userMsg: MessageType = { role: 'user', content: budgetLabel, timestamp: new Date() }
    const generatingMsg: MessageType = {
      role: 'assistant',
      content: `Excellent choices! ✨\n\n📍 Destination: ${itineraryState.destination}\n📅 Duration: ${itineraryState.days} days\n👥 Travelers: ${itineraryState.travelers}\n💰 Budget: ${budgetLabel}\n\nGenerating your personalized itinerary...`,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMsg, generatingMsg])

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a detailed ${itineraryState.days}-day itinerary for ${itineraryState.travelers} travelers to ${itineraryState.destination} with a ${budget} budget. Include day-wise activities, best places to visit, food recommendations, and travel tips.`,
          userId: user.id,
          mode: 'itinerary',
          metadata: {
            destination: itineraryState.destination,
            days: itineraryState.days,
            travelers: itineraryState.travelers,
            budget: budget,
            userName: user.name
          }
        }),
      })

      const data = await response.json()
      
      // Format the detailed itinerary
      const formattedItinerary = formatDetailedItinerary(data)
      
      const itineraryMessage: MessageType = {
        role: 'assistant',
        content: formattedItinerary,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, itineraryMessage])
      setItineraryState(prev => ({ ...prev, step: 'complete' }))
    } catch (error) {
      console.error('Itinerary generation error:', error)
      const errorMsg: MessageType = {
        role: 'assistant',
        content: 'I apologize, but I couldn\'t generate the itinerary right now. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle free text input
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const message = input.trim()
    setInput('')

    // Handle based on current state
    if (chatMode === 'weather') {
      if (weatherState.step === 'greeting' || weatherState.step === 'destination') {
        handleWeatherDestinationSelect(message)
      } else if (weatherState.step === 'dates') {
        handleWeatherDateInput(message)
      } else {
        // General weather follow-up
        const userMsg: MessageType = { role: 'user', content: message, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              userId: user.id,
              mode: 'weather',
              metadata: { destination: weatherState.destination, userName: user.name }
            }),
          })
          const data = await response.json()
          const assistantMsg: MessageType = {
            role: 'assistant',
            content: data.message || data.response?.text || 'I can help with more weather information.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
          console.error('Error:', error)
        } finally {
          setIsLoading(false)
        }
      }
    } else if (chatMode === 'itinerary') {
      if (itineraryState.step === 'destination') {
        handleItineraryDestinationSelect(message)
      } else if (itineraryState.step === 'complete') {
        // Follow-up questions after itinerary is generated
        const userMsg: MessageType = { role: 'user', content: message, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setIsLoading(true)
        
        try {
          const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              userId: user.id,
              mode: 'itinerary',
              metadata: { 
                destination: itineraryState.destination,
                days: itineraryState.days,
                travelers: itineraryState.travelers,
                budget: itineraryState.budget,
                userName: user.name 
              }
            }),
          })
          const data = await response.json()
          const assistantMsg: MessageType = {
            role: 'assistant',
            content: data.message || data.response?.text || 'I can help with more trip details.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
          console.error('Error:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 z-50 group"
        size="icon"
      >
        <div className="relative">
          <MessageCircle className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </Button>
    )
  }

  // Opened chatbot interface
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={() => {
          setIsOpen(false)
          setChatMode('selection')
          setMessages([])
        }}
      />
      
      {/* Expanded Chat Panel */}
      <Card className="fixed inset-4 md:inset-8 lg:inset-12 shadow-2xl z-50 flex flex-col border-2 border-primary/20 animate-in slide-in-from-bottom-8 duration-300 max-w-[1400px] max-h-[900px] mx-auto my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-white p-6 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            {chatMode !== 'selection' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                className="text-white hover:bg-white/20 p-2 h-auto"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Travel Assistant</h3>
              <p className="text-sm opacity-90">
                {chatMode === 'selection' && 'Your AI travel companion'}
                {chatMode === 'weather' && 'Weather Insights'}
                {chatMode === 'itinerary' && 'Trip Planner'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsOpen(false)
              setChatMode('selection')
              setMessages([])
            }}
            className="text-white hover:bg-white/20 h-10 w-10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
          {chatMode === 'selection' ? (
            // Mode selection screen
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center gap-6 max-w-4xl mx-auto w-full">
              <div className="text-center mb-8">
                <h4 className="text-3xl md:text-4xl font-bold text-foreground mb-3">How can I help you today?</h4>
                <p className="text-lg text-muted-foreground">Choose a service to get started</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => handleModeSelection('weather')}
                  className="h-auto py-8 px-6 flex flex-col items-start gap-4 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transform hover:scale-[1.02] transition-all duration-300 shadow-xl rounded-2xl text-left"
                >
                  <div className="w-full space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Cloud className="w-8 h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xl mb-2">Weather Forecast</div>
                        <div className="text-sm opacity-90 leading-snug">Get real-time weather insights and travel recommendations</div>
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleModeSelection('itinerary')}
                  className="h-auto py-8 px-6 flex flex-col items-start gap-4 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-[1.02] transition-all duration-300 shadow-xl rounded-2xl text-left"
                >
                  <div className="w-full space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xl mb-2">Itinerary Planning</div>
                        <div className="text-sm opacity-90 leading-snug">Create personalized travel plans for your trip</div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            // Chat interface
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 h-full">
                <div className="p-6 md:p-8">
                  <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-5 shadow-lg ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-primary to-primary/90 text-white'
                            : 'bg-white border border-border text-foreground'
                        }`}
                      >
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-3 ${message.role === 'user' ? 'opacity-70' : 'text-muted-foreground'}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Weather: Destination Selection Cards */}
                  {chatMode === 'weather' && (weatherState.step === 'greeting' || weatherState.step === 'destination') && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {popularDestinations.map((dest) => (
                        <button
                          key={dest.name}
                          onClick={() => handleWeatherDestinationSelect(dest.name)}
                          className="p-4 bg-white border-2 border-border rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all duration-200 group transform hover:scale-105"
                        >
                          <div className="text-3xl mb-2">{dest.icon}</div>
                          <div className="font-semibold text-foreground group-hover:text-blue-600">{dest.name}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Itinerary: Destination Selection Cards */}
                  {chatMode === 'itinerary' && itineraryState.step === 'destination' && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {popularDestinations.map((dest) => (
                        <button
                          key={dest.name}
                          onClick={() => handleItineraryDestinationSelect(dest.name)}
                          className="p-4 bg-white border-2 border-border rounded-xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg transition-all duration-200 group transform hover:scale-105"
                        >
                          <div className="text-3xl mb-2">{dest.icon}</div>
                          <div className="font-semibold text-foreground group-hover:text-purple-600">{dest.name}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Itinerary: Days Selection Cards */}
                  {chatMode === 'itinerary' && itineraryState.step === 'days' && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                      {tripDurations.map((option) => (
                        <button
                          key={option.days}
                          onClick={() => handleItineraryDaysSelect(option.days)}
                          className="p-4 bg-white border-2 border-border rounded-xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg transition-all duration-200 group flex flex-col items-center transform hover:scale-105"
                        >
                          <div className="text-3xl mb-2">{option.icon}</div>
                          <div className="font-bold text-2xl text-foreground group-hover:text-purple-600">{option.days}</div>
                          <div className="text-xs text-muted-foreground text-center">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Itinerary: Travelers Selection Cards */}
                  {chatMode === 'itinerary' && itineraryState.step === 'travelers' && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      {travelerOptions.map((option) => (
                        <button
                          key={option.count}
                          onClick={() => handleItineraryTravelersSelect(option.count)}
                          className="p-5 bg-white border-2 border-border rounded-xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg transition-all duration-200 group flex flex-col items-center transform hover:scale-105"
                        >
                          <div className="text-4xl mb-3">{option.icon}</div>
                          <div className="font-bold text-2xl text-foreground group-hover:text-purple-600">{option.count}</div>
                          <div className="text-sm text-muted-foreground">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Itinerary: Budget Selection Cards */}
                  {chatMode === 'itinerary' && itineraryState.step === 'budget' && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      {budgetOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleItineraryBudgetSelect(option.value, option.label)}
                          className="p-5 bg-white border-2 border-border rounded-xl hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg transition-all duration-200 group flex flex-col items-center transform hover:scale-105"
                        >
                          <div className="text-4xl mb-3">{option.icon}</div>
                          <div className="font-bold text-foreground group-hover:text-purple-600">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.range}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-border rounded-2xl p-5 shadow-lg">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {chatMode === 'weather' ? 'Analyzing weather data...' : 'Creating your itinerary...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                  </div>
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="p-6 border-t bg-white/50 backdrop-blur">
                <div className="max-w-4xl mx-auto">
                  <div className="flex gap-3">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        chatMode === 'weather'
                          ? weatherState.step === 'dates' 
                            ? "Enter your travel dates..."
                            : "Type a destination or ask a question..."
                          : itineraryState.step === 'destination'
                            ? "Type your destination..."
                            : itineraryState.step === 'complete'
                              ? "Ask me anything about your trip..."
                              : "Select an option above..."
                      }
                      disabled={isLoading || (chatMode === 'itinerary' && !['destination', 'complete'].includes(itineraryState.step))}
                      className="flex-1 h-12 text-base px-4 border-2 rounded-xl"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="bg-primary hover:bg-primary/90 h-12 px-6 rounded-xl"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}
