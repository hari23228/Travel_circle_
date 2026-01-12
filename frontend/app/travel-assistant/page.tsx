"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Sparkles, Calendar, Cloud, MapPin, TrendingUp, MessageCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function TravelAssistantPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeFeature, setActiveFeature] = useState<string | null>(null)

  // Redirect if not authenticated
  if (!isLoading && !user) {
    router.push('/login')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const aiFeatures = [
    {
      id: 'itinerary',
      title: 'AI Itinerary Planner',
      description: 'Generate personalized travel itineraries with AI assistance',
      icon: Calendar,
      href: '/generate-itinerary',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'weather',
      title: 'Weather Insights',
      description: 'Get real-time weather forecasts and travel recommendations',
      icon: Cloud,
      href: '/weather-forecast',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'destinations',
      title: 'Smart Destinations',
      description: 'Discover trending destinations based on your preferences',
      icon: MapPin,
      href: '/ai-features',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'budget',
      title: 'Budget Optimizer',
      description: 'AI-powered budget planning and expense tracking',
      icon: TrendingUp,
      href: '/dashboard',
      color: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Travel Assistant</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Travel Companion</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Powered by Advanced AI
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Your Personal Travel Assistant
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Chat with our AI assistant to plan trips, get weather insights, discover destinations, 
            and receive personalized travel recommendations tailored just for you.
          </p>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <Link key={feature.id} href={feature.href}>
                <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer group h-full">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* AI Chat Assistant Info */}
        <div className="mb-12">
          <Card className="border-2 border-primary/20 overflow-hidden bg-gradient-to-br from-primary/5 to-purple/5">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">AI Travel Chat Assistant</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Click the floating chat button in the bottom-right corner to start a conversation with our AI assistant.
                Choose between Weather Forecast (Gemini AI) or Itinerary Planning (Groq AI) for specialized help!
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span>AI Assistant Ready</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-primary/10">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Tips for Better Results
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Be Specific</p>
                <p className="text-sm text-muted-foreground">
                  Provide details like dates, budget, and preferences for better recommendations
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Ask Follow-ups</p>
                <p className="text-sm text-muted-foreground">
                  Refine your plans by asking additional questions about the suggestions
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Share Context</p>
                <p className="text-sm text-muted-foreground">
                  Mention your travel group size, interests, and any special requirements
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Explore Features</p>
                <p className="text-sm text-muted-foreground">
                  Try different AI tools above for comprehensive travel planning
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
