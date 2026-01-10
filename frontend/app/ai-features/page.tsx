"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Sparkles, CloudSun, Brain, Zap, Calendar, MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AIFeaturesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Features</h1>
              <p className="text-sm text-muted-foreground">Intelligent travel planning tools</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Zap className="w-4 h-4" />
            Powered by AI
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Smart Travel Planning
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Leverage the power of AI to create perfect itineraries and get real-time weather insights for your trips
          </p>
        </div>

        {/* AI Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Smart Itinerary Generator Card */}
          <Link href="/generate-itinerary">
            <Card className="group p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary cursor-pointer h-full bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-foreground">Smart Itinerary Generator</h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Create AI-powered travel itineraries with budget-first planning, personalized recommendations, and group consensus building.
                </p>
                
                {/* Features list */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-primary" />
                    </div>
                    <span>Day-by-day activity planning</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-primary" />
                    </div>
                    <span>Location-based recommendations</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-primary" />
                    </div>
                    <span>Budget optimization</span>
                  </div>
                </div>
                
                <Button className="bg-primary hover:bg-primary/90 text-white w-full group-hover:shadow-lg transition-shadow">
                  Generate Itinerary
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </Link>

          {/* Weather Forecaster Card */}
          <Link href="/weather-forecast">
            <Card className="group p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-secondary cursor-pointer h-full bg-gradient-to-br from-secondary/5 via-secondary/10 to-primary/5 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary/70 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <CloudSun className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-foreground">Weather Forecaster</h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Get AI-powered weather analysis for your travel destinations with activity recommendations and packing suggestions.
                </p>
                
                {/* Features list */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center">
                      <CloudSun className="w-3 h-3 text-secondary" />
                    </div>
                    <span>Real-time weather data</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center">
                      <Calendar className="w-3 h-3 text-secondary" />
                    </div>
                    <span>10-day forecast analysis</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center">
                      <Zap className="w-3 h-3 text-secondary" />
                    </div>
                    <span>Smart packing lists</span>
                  </div>
                </div>
                
                <Button className="bg-secondary hover:bg-secondary/90 text-white w-full group-hover:shadow-lg transition-shadow">
                  Check Weather
                  <CloudSun className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </Link>
        </div>

        {/* Info Section */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">How AI Features Work</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our AI features use advanced language models (Groq's Llama 3.3 70B) to analyze your travel preferences, 
                budget constraints, and real-time data to provide personalized recommendations. The itinerary generator 
                creates day-by-day plans while the weather forecaster helps you prepare for your trip conditions.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
