"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft, CloudSun, MapPin, Calendar, Thermometer, Droplets, Wind, Sun, Cloud, CloudRain, Loader2, Umbrella, Shirt, Backpack } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  wind: number
  feelsLike: number
  forecast: DayForecast[]
}

interface DayForecast {
  date: string
  day: string
  high: number
  low: number
  condition: string
  precipitation: number
}

interface PackingItem {
  category: string
  items: string[]
}

export default function WeatherForecastPage() {
  const [destination, setDestination] = useState("")
  const [travelDate, setTravelDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [packingList, setPackingList] = useState<PackingItem[]>([])
  const [error, setError] = useState("")
  
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destination.trim()) {
      setError("Please enter a destination")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      // Call the backend chatbot API for weather analysis
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `What's the weather forecast for ${destination}${travelDate ? ` on ${travelDate}` : ''}?`,
          context: {
            destination,
            travelDates: travelDate ? { start: travelDate } : null
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }

      const data = await response.json()
      
      // Parse the weather data from the chatbot response
      if (data.data?.currentWeather) {
        setWeatherData({
          location: data.data.currentWeather.location || destination,
          temperature: data.data.currentWeather.temperature || 25,
          condition: data.data.currentWeather.condition || 'Clear',
          humidity: data.data.currentWeather.humidity || 60,
          wind: data.data.currentWeather.windSpeed || 10,
          feelsLike: data.data.currentWeather.feelsLike || 26,
          forecast: (data.data.forecast || []).slice(0, 7).map((day: any, i: number) => ({
            date: day.date || new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
            day: day.dayName || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.now() + i * 86400000).getDay()],
            high: day.maxTemp || day.temperature || 30,
            low: day.minTemp || (day.temperature ? day.temperature - 5 : 20),
            condition: day.condition || 'Clear',
            precipitation: day.precipitationProbability || 0
          }))
        })
        
        // Generate packing list based on weather
        setPackingList(data.data.packingList || generatePackingList(data.data.forecast || []))
      } else {
        // Fallback to mock data for demo
        setWeatherData(generateMockWeather(destination))
        setPackingList(generatePackingList([]))
      }
    } catch (err) {
      console.error('Weather fetch error:', err)
      // Use mock data as fallback
      setWeatherData(generateMockWeather(destination))
      setPackingList(generatePackingList([]))
    } finally {
      setLoading(false)
    }
  }

  const generateMockWeather = (dest: string): WeatherData => {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear']
    return {
      location: dest,
      temperature: Math.floor(Math.random() * 15) + 20,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.floor(Math.random() * 30) + 50,
      wind: Math.floor(Math.random() * 15) + 5,
      feelsLike: Math.floor(Math.random() * 15) + 20,
      forecast: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.now() + i * 86400000).getDay()],
        high: Math.floor(Math.random() * 10) + 25,
        low: Math.floor(Math.random() * 10) + 15,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        precipitation: Math.floor(Math.random() * 40)
      }))
    }
  }

  const generatePackingList = (forecast: any[]): PackingItem[] => {
    const hasRain = forecast.some((d: any) => d.precipitationProbability > 30 || d.condition?.toLowerCase().includes('rain'))
    const isHot = forecast.some((d: any) => (d.maxTemp || d.high) > 30)
    const isCold = forecast.some((d: any) => (d.minTemp || d.low) < 15)
    
    return [
      {
        category: "Clothing",
        items: [
          ...(isHot ? ["Light cotton shirts", "Shorts", "Sunglasses", "Sun hat"] : []),
          ...(isCold ? ["Warm jacket", "Sweater", "Long pants", "Scarf"] : []),
          "Comfortable walking shoes",
          "Casual outfit for dining"
        ]
      },
      {
        category: "Weather Protection",
        items: [
          ...(hasRain ? ["Umbrella", "Rain jacket", "Waterproof bag"] : []),
          "Sunscreen SPF 50+",
          "Lip balm with SPF"
        ]
      },
      {
        category: "Essentials",
        items: [
          "Travel documents",
          "Phone charger",
          "Power bank",
          "First aid kit",
          "Reusable water bottle"
        ]
      }
    ]
  }

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase()
    if (c.includes('rain')) return <CloudRain className="w-6 h-6" />
    if (c.includes('cloud')) return <Cloud className="w-6 h-6" />
    return <Sun className="w-6 h-6" />
  }

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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/ai-features">
            <Button variant="ghost" size="sm" className="p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/70 rounded-full flex items-center justify-center">
              <CloudSun className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Weather Forecaster</h1>
              <p className="text-sm text-muted-foreground">AI-powered weather analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <Card className="p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="destination">Destination</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter city or destination (e.g., Paris, Tokyo)"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="travelDate">Travel Date (Optional)</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="travelDate"
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Weather...
                </>
              ) : (
                <>
                  <CloudSun className="w-4 h-4 mr-2" />
                  Get Weather Forecast
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Weather Results */}
        {weatherData && (
          <div className="space-y-6">
            {/* Current Weather */}
            <Card className="p-6 bg-gradient-to-br from-secondary/10 to-primary/10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{weatherData.location}</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-bold text-foreground">{weatherData.temperature}°C</div>
                    <div className="flex items-center gap-2 text-lg text-muted-foreground">
                      {getWeatherIcon(weatherData.condition)}
                      {weatherData.condition}
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-2">Feels like {weatherData.feelsLike}°C</p>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <Droplets className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                    <div className="text-lg font-semibold">{weatherData.humidity}%</div>
                    <div className="text-xs text-muted-foreground">Humidity</div>
                  </div>
                  <div className="text-center">
                    <Wind className="w-6 h-6 mx-auto text-gray-500 mb-1" />
                    <div className="text-lg font-semibold">{weatherData.wind} km/h</div>
                    <div className="text-xs text-muted-foreground">Wind</div>
                  </div>
                  <div className="text-center">
                    <Thermometer className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                    <div className="text-lg font-semibold">{weatherData.feelsLike}°C</div>
                    <div className="text-xs text-muted-foreground">Feels Like</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 7-Day Forecast */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">7-Day Forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                {weatherData.forecast.map((day, i) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="font-semibold text-sm">{day.day}</div>
                    <div className="my-2">{getWeatherIcon(day.condition)}</div>
                    <div className="text-sm">
                      <span className="font-semibold">{day.high}°</span>
                      <span className="text-muted-foreground ml-1">{day.low}°</span>
                    </div>
                    {day.precipitation > 0 && (
                      <div className="text-xs text-blue-500 mt-1 flex items-center justify-center gap-1">
                        <Droplets className="w-3 h-3" />
                        {day.precipitation}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Packing List */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Backpack className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold">Suggested Packing List</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packingList.map((category, i) => (
                  <div key={i}>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      {category.category === "Clothing" && <Shirt className="w-4 h-4" />}
                      {category.category === "Weather Protection" && <Umbrella className="w-4 h-4" />}
                      {category.category === "Essentials" && <Backpack className="w-4 h-4" />}
                      {category.category}
                    </h4>
                    <ul className="space-y-2">
                      {category.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!weatherData && !loading && (
          <Card className="p-12 text-center">
            <CloudSun className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Enter a Destination</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search for any city or travel destination to get AI-powered weather analysis, 
              forecasts, and personalized packing recommendations.
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
