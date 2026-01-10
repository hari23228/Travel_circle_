"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Loader2,
  Users,
  Palette,
  Coffee,
  Mountain,
  Leaf,
  ShoppingBag,
  PartyPopper,
  Sparkles,
  Heart,
  CheckCircle,
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

const interestRatings = [
  { id: "culture", label: "Culture & History", icon: Palette, color: "text-purple-500" },
  { id: "food", label: "Food & Dining", icon: Coffee, color: "text-orange-500" },
  { id: "adventure", label: "Adventure", icon: Mountain, color: "text-red-500" },
  { id: "nature", label: "Nature", icon: Leaf, color: "text-green-500" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "text-pink-500" },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper, color: "text-indigo-500" },
  { id: "relaxation", label: "Relaxation", icon: Heart, color: "text-rose-500" },
]

const paceOptions = [
  { value: "relaxed", label: "Relaxed", emoji: "🧘" },
  { value: "moderate", label: "Moderate", emoji: "⚖️" },
  { value: "packed", label: "Packed", emoji: "🚀" },
]

export default function ItineraryPreferencesPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading } = useAuth()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [itinerary, setItinerary] = useState<any>(null)
  
  // Preferences state
  const [ratings, setRatings] = useState<Record<string, number>>({
    culture: 3,
    food: 3,
    adventure: 3,
    nature: 3,
    shopping: 3,
    nightlife: 3,
    relaxation: 3,
  })
  const [maxBudget, setMaxBudget] = useState(50000)
  const [preferredPace, setPreferredPace] = useState("moderate")
  const [restrictions, setRestrictions] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    
    if (params.id) {
      fetchItinerary(params.id as string)
    }
  }, [params.id, user, authLoading, router])

  const fetchItinerary = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await api.get(`/itineraries/${id}`)
      if (response.success) {
        setItinerary(response.data)
        // Check if user already submitted preferences
        const existingPref = response.data.memberPreferences?.find(
          (p: any) => p.user_id === user?.id
        )
        if (existingPref) {
          setRatings({
            culture: existingPref.culture_rating || 3,
            food: existingPref.food_rating || 3,
            adventure: existingPref.adventure_rating || 3,
            nature: existingPref.nature_rating || 3,
            shopping: existingPref.shopping_rating || 3,
            nightlife: existingPref.nightlife_rating || 3,
            relaxation: existingPref.relaxation_rating || 3,
          })
          setMaxBudget(existingPref.max_budget || 50000)
          setPreferredPace(existingPref.preferred_pace || "moderate")
          setRestrictions(existingPref.dietary_restrictions || "")
          setIsSubmitted(true)
        }
      } else {
        setError("Failed to load itinerary")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load itinerary")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError("")
      
      const response = await api.post(`/itineraries/${params.id}/preferences`, {
        cultureRating: ratings.culture,
        foodRating: ratings.food,
        adventureRating: ratings.adventure,
        natureRating: ratings.nature,
        shoppingRating: ratings.shopping,
        nightlifeRating: ratings.nightlife,
        relaxationRating: ratings.relaxation,
        maxBudget,
        preferredPace,
        restrictions
      })

      if (response.success) {
        setIsSubmitted(true)
      } else {
        setError(response.error || "Failed to submit preferences")
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit preferences")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateRating = (id: string, value: number) => {
    setRatings(prev => ({ ...prev, [id]: value }))
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Preferences Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your travel preferences have been recorded. The itinerary will be optimized based on everyone's input.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push(`/itinerary/${params.id}`)}
                className="w-full"
              >
                View Itinerary
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="w-full"
              >
                Update Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Your Travel Preferences</h1>
              <p className="text-muted-foreground">
                Help us create the perfect itinerary for your group
              </p>
            </div>
          </div>
        </div>

        {itinerary && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trip to</p>
                  <p className="font-semibold">{itinerary.destination}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{itinerary.memberPreferences?.length || 0} responses</p>
                  <Progress value={(itinerary.memberPreferences?.length / 5) * 100} className="w-20 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences Form */}
        <div className="space-y-6">
          {/* Interest Ratings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Rate Your Interests
              </CardTitle>
              <CardDescription>
                Rate each category from 1 (not interested) to 5 (very interested)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {interestRatings.map((interest) => {
                const Icon = interest.icon
                return (
                  <div key={interest.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Icon className={cn("h-5 w-5", interest.color)} />
                        {interest.label}
                      </Label>
                      <span className="font-bold text-lg">{ratings[interest.id]}</span>
                    </div>
                    <Slider
                      value={[ratings[interest.id]]}
                      onValueChange={([val]) => updateRating(interest.id, val)}
                      min={1}
                      max={5}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Not interested</span>
                      <span>Very interested</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Your Budget
              </CardTitle>
              <CardDescription>
                What's your maximum budget for this trip?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Maximum Budget</Label>
                  <span className="text-2xl font-bold text-primary">
                    ₹{maxBudget.toLocaleString()}
                  </span>
                </div>
                <Slider
                  value={[maxBudget]}
                  onValueChange={([val]) => setMaxBudget(val)}
                  min={10000}
                  max={300000}
                  step={5000}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹10,000</span>
                  <span>₹3,00,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pace */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Pace</CardTitle>
              <CardDescription>
                How many activities per day suits you best?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={preferredPace} onValueChange={setPreferredPace}>
                <div className="grid grid-cols-3 gap-4">
                  {paceOptions.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex flex-col items-center p-4 rounded-lg border cursor-pointer transition-all",
                        preferredPace === option.value
                          ? "border-primary bg-primary/10"
                          : "border-muted hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <span className="text-2xl mb-2">{option.emoji}</span>
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Restrictions */}
          <Card>
            <CardHeader>
              <CardTitle>Dietary & Other Restrictions</CardTitle>
              <CardDescription>
                Any allergies, dietary preferences, or physical limitations we should know?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Vegetarian, allergic to peanuts, prefer wheelchair-accessible venues..."
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {error && (
            <p className="text-destructive text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full py-6 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Submit Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
