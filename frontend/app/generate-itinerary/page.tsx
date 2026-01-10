"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  CalendarIcon,
  MapPin,
  Wallet,
  Users,
  Sparkles,
  Coffee,
  Mountain,
  ShoppingBag,
  Palette,
  PartyPopper,
  Leaf,
  ArrowLeft,
  ArrowRight,
  Loader2,
  IndianRupee,
  Clock,
  Zap
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { touristDestinations } from "@/lib/tourist-destinations"

const interestOptions = [
  { id: "culture", label: "Culture & History", icon: Palette, color: "bg-purple-500" },
  { id: "food", label: "Food & Dining", icon: Coffee, color: "bg-orange-500" },
  { id: "adventure", label: "Adventure", icon: Mountain, color: "bg-red-500" },
  { id: "nature", label: "Nature", icon: Leaf, color: "bg-green-500" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "bg-pink-500" },
  { id: "nightlife", label: "Nightlife", icon: PartyPopper, color: "bg-indigo-500" },
]

const paceOptions = [
  { value: "relaxed", label: "Relaxed", desc: "3 activities/day, plenty of rest", icon: "🧘" },
  { value: "moderate", label: "Moderate", desc: "4-5 activities/day, balanced", icon: "⚖️" },
  { value: "packed", label: "Packed", desc: "6+ activities/day, maximize experiences", icon: "🚀" },
]

export default function GenerateItineraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  
  const circleId = searchParams.get("circleId")
  
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [destination, setDestination] = useState("")
  const [destinationSuggestions, setDestinationSuggestions] = useState<typeof touristDestinations>([])
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [totalBudget, setTotalBudget] = useState(50000)
  const [memberCount, setMemberCount] = useState(1)
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["culture", "food"])
  const [pace, setPace] = useState("moderate")
  
  // Budget breakdown (calculated)
  const perPersonBudget = totalBudget / memberCount
  const days = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 
    : 0
  const perDayBudget = days > 0 ? perPersonBudget / days : 0

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/generate-itinerary")
    }
  }, [user, authLoading, router])

  // Destination autocomplete
  const handleDestinationChange = (value: string) => {
    setDestination(value)
    if (value.length > 1) {
      const filtered = touristDestinations.filter(d => 
        d.name.toLowerCase().includes(value.toLowerCase()) ||
        d.state.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setDestinationSuggestions(filtered)
    } else {
      setDestinationSuggestions([])
    }
  }

  const selectDestination = (dest: typeof touristDestinations[0]) => {
    setDestination(dest.name)
    setDestinationSuggestions([])
  }

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(i => i !== interestId)
        : [...prev, interestId]
    )
  }

  const handleGenerate = async () => {
    if (!destination || !startDate || !endDate || selectedInterests.length === 0) {
      setError("Please fill in all required fields")
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      console.log('🔄 Starting itinerary generation...', {
        destination,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        interests: selectedInterests,
        totalBudget,
        memberCount,
        pace
      })

      const response = await api.post("/itineraries/generate", {
        destination,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        interests: selectedInterests,
        totalBudget,
        memberCount,
        pace,
        circleId
      })

      console.log('✅ API Response:', response)

      if (response.success && response.data) {
        router.push(`/itinerary/${response.data.id}`)
      } else {
        console.error('❌ Generation failed:', response.error)
        setError(response.error || "Failed to generate itinerary")
        setIsGenerating(false)
      }
    } catch (err: any) {
      console.error('❌ API Error:', err)
      setError(err.message || "Failed to generate itinerary. Please check your connection and try again.")
      setIsGenerating(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1: return destination.length > 0
      case 2: return startDate && endDate
      case 3: return totalBudget > 0
      case 4: return selectedInterests.length > 0
      default: return true
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Smart Itinerary Generator</h1>
              <p className="text-muted-foreground">
                Create a personalized trip plan with AI-powered recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {step} of 5</span>
            <span>{Math.round((step / 5) * 100)}% Complete</span>
          </div>
          <Progress value={(step / 5) * 100} className="h-2" />
          
          <div className="flex justify-between mt-4">
            {["Destination", "Dates", "Budget", "Interests", "Review"].map((label, idx) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center",
                  idx + 1 <= step ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1",
                  idx + 1 < step ? "bg-primary text-primary-foreground" :
                  idx + 1 === step ? "border-2 border-primary text-primary" :
                  "border border-muted-foreground"
                )}>
                  {idx + 1}
                </div>
                <span className="text-xs hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Step 1: Destination */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Where do you want to go?</h2>
                  <p className="text-muted-foreground">Enter your dream destination</p>
                </div>
                
                <div className="max-w-md mx-auto relative">
                  <Label>Destination</Label>
                  <Input
                    placeholder="e.g., Goa, Manali, Jaipur..."
                    value={destination}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    className="text-lg py-6"
                  />
                  
                  {destinationSuggestions.length > 0 && (
                    <Card className="absolute z-10 w-full mt-1 shadow-lg">
                      <CardContent className="p-2">
                        {destinationSuggestions.map((dest) => (
                          <button
                            key={dest.name}
                            onClick={() => selectDestination(dest)}
                            className="w-full p-3 text-left hover:bg-muted rounded-lg flex items-center gap-3"
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{dest.name}</div>
                              <div className="text-sm text-muted-foreground">{dest.state}</div>
                            </div>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Popular destinations */}
                <div className="mt-8">
                  <p className="text-sm text-muted-foreground mb-3 text-center">Popular Destinations</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Goa", "Manali", "Jaipur", "Kerala", "Rishikesh"].map((dest) => (
                      <Badge
                        key={dest}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => setDestination(dest)}
                      >
                        {dest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dates */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <CalendarIcon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">When are you traveling?</h2>
                  <p className="text-muted-foreground">Select your trip dates</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-xl mx-auto">
                  <div>
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => 
                            date < (startDate || new Date())
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {days > 0 && (
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg py-2 px-4">
                      <Clock className="h-4 w-4 mr-2" />
                      {days} {days === 1 ? "Day" : "Days"} Trip
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Budget (DIFFERENTIATOR #1) */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Wallet className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Budget-First Planning</h2>
                  <p className="text-muted-foreground">
                    We'll create an itinerary that fits your budget perfectly
                  </p>
                </div>

                <div className="max-w-xl mx-auto space-y-8">
                  {/* Total Budget */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Total Trip Budget</Label>
                      <span className="text-2xl font-bold text-primary">
                        ₹{totalBudget.toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      value={[totalBudget]}
                      onValueChange={([val]) => setTotalBudget(val)}
                      min={10000}
                      max={500000}
                      step={5000}
                      className="my-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>₹10,000</span>
                      <span>₹5,00,000</span>
                    </div>
                  </div>

                  {/* Member Count */}
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      Number of Travelers
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMemberCount(Math.max(1, memberCount - 1))}
                      >
                        -
                      </Button>
                      <span className="text-2xl font-bold w-12 text-center">{memberCount}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setMemberCount(memberCount + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Budget Breakdown */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IndianRupee className="h-5 w-5" />
                        Budget Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Person</span>
                        <span className="font-semibold">₹{perPersonBudget.toLocaleString()}</span>
                      </div>
                      {days > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Per Day (per person)</span>
                          <span className="font-semibold">₹{Math.round(perDayBudget).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          💡 Our AI will optimize your itinerary to give you the best experience within this budget
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 4: Interests */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">What interests you?</h2>
                  <p className="text-muted-foreground">Select at least one to personalize your trip</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {interestOptions.map((interest) => {
                    const Icon = interest.icon
                    const isSelected = selectedInterests.includes(interest.id)
                    return (
                      <button
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-muted hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mb-2",
                          interest.color
                        )}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="font-medium">{interest.label}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Pace Selection */}
                <div className="max-w-xl mx-auto mt-8">
                  <Label className="mb-4 block">Trip Pace</Label>
                  <RadioGroup value={pace} onValueChange={setPace}>
                    {paceOptions.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all",
                          pace === option.value 
                            ? "border-primary bg-primary/5" 
                            : "border-muted hover:border-primary/50"
                        )}
                        onClick={() => setPace(option.value)}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <div className="flex-1">
                          <Label htmlFor={option.value} className="cursor-pointer">
                            <span className="mr-2">{option.icon}</span>
                            {option.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{option.desc}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">Ready to Generate!</h2>
                  <p className="text-muted-foreground">Review your trip details</p>
                </div>

                <div className="max-w-xl mx-auto space-y-4">
                  <Card>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" /> Destination
                        </span>
                        <span className="font-semibold">{destination}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" /> Dates
                        </span>
                        <span className="font-semibold">
                          {startDate && format(startDate, "MMM d")} - {endDate && format(endDate, "MMM d, yyyy")}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Duration
                        </span>
                        <span className="font-semibold">{days} Days</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Wallet className="h-4 w-4" /> Budget
                        </span>
                        <span className="font-semibold">₹{totalBudget.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Users className="h-4 w-4" /> Travelers
                        </span>
                        <span className="font-semibold">{memberCount} {memberCount === 1 ? "person" : "people"}</span>
                      </div>
                      
                      <div className="py-2">
                        <span className="text-muted-foreground block mb-2">Interests</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedInterests.map((interest) => {
                            const option = interestOptions.find(i => i.id === interest)
                            return (
                              <Badge key={interest} variant="secondary">
                                {option?.label}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground">Pace</span>
                        <span className="font-semibold capitalize">{pace}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {error && (
                    <p className="text-destructive text-sm text-center">{error}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || isGenerating}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Itinerary
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
