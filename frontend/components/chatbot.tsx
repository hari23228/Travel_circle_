'use client'

import { useState, useRef, useEffect } from 'react'
import { useChatbot } from '@/hooks/use-chatbot'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Send, X, Loader2 } from 'lucide-react'

export function Chatbot() {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user, isLoading: authLoading } = useAuth()
  const { messages, isLoading, sendMessage } = useChatbot()

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Don't render chatbot if user is not logged in
  if (!user || authLoading) {
    return null
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const message = input
    setInput('')
    await sendMessage(message)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 rounded-full shadow-2xl hover:scale-105 transition-all z-50 h-20 px-8 text-lg font-semibold"
        size="lg"
      >
        <MessageCircle className="h-7 w-7 mr-3" />
        Travel Assistant
      </Button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <Card className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[1000px] h-[80vh] flex flex-col shadow-2xl z-50 border-2 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">AI Travel Assistant</h3>
            <p className="text-xs opacity-90">Intelligent trip planning with real-time weather analysis</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="hover:bg-primary-foreground/20 h-9 w-9"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12 space-y-5 max-w-3xl mx-auto">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-foreground">Welcome to Your AI Travel Assistant!</h2>
            <p className="text-base leading-relaxed text-muted-foreground px-6">
              I'm here to help you plan the perfect trip by analyzing real-time weather conditions,
              recommending optimal times for your activities, and creating personalized travel plans.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 px-4">
              <div className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary transition-colors">
                <div className="text-3xl mb-2">🌤️</div>
                <h3 className="font-semibold text-foreground mb-1">Weather Analysis</h3>
                <p className="text-xs">Real-time forecasts</p>
              </div>
              <div className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary transition-colors">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-foreground mb-1">Smart Recommendations</h3>
                <p className="text-xs">Best times for activities</p>
              </div>
              <div className="p-4 rounded-xl bg-card border-2 border-border hover:border-primary transition-colors">
                <div className="text-3xl mb-2">🎒</div>
                <h3 className="font-semibold text-foreground mb-1">Packing Lists</h3>
                <p className="text-xs">Personalized for your trip</p>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-base font-medium text-foreground mb-2">Ready to start planning?</p>
              <p className="text-sm text-muted-foreground">Type "hi" below to begin!</p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className="mb-8 max-w-5xl mx-auto">
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-6 shadow-lg ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card border-2 border-border'
              }`}>
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {message.text.split('\n').map((line, i) => {
                    // Handle markdown-style formatting
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <div key={i} className="font-bold text-xl mt-4 mb-2">{line.replace(/\*\*/g, '')}</div>
                    }
                    if (line.startsWith('# ')) {
                      return <div key={i} className="font-bold text-2xl mt-4 mb-2">{line.slice(2)}</div>
                    }
                    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                      return <div key={i} className="ml-4 my-1">{line}</div>
                    }
                    if (line.trim().startsWith('✅') || line.trim().startsWith('⚠️') || line.trim().startsWith('🌤️')) {
                      return <div key={i} className="my-2 font-medium">{line}</div>
                    }
                    return <div key={i}>{line || <br />}</div>
                  })}
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className={`mt-4 flex flex-wrap gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.suggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="lg"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-base px-5 py-2 h-auto border-2 hover:border-primary hover:bg-primary/10"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center justify-center gap-3 p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 bg-card border-2 border-primary/50 rounded-2xl px-8 py-6 shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-lg font-medium text-foreground">Analyzing your trip details...</span>
            </div>
          </div>
        )}
        
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input - Always visible at bottom */}
      <div className="border-t-2 bg-white p-5 flex-shrink-0 shadow-lg">
        <div className="flex gap-3 items-center max-w-5xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="💬 Type your message here... (e.g., 'Hi' or 'Paris, France')" 
            disabled={isLoading}
            className="flex-1 text-base py-3 px-4 h-12 border-2 focus:border-primary rounded-lg"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="h-12 px-8 text-base font-semibold flex-shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                Send
                <Send className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-semibold">Enter ↵</kbd> to send • I'll guide you step-by-step
        </p>
      </div>
    </Card>
    </>
  )
}
