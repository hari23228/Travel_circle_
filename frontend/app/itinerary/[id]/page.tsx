"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Wallet,
  Users,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Share2,
  Download,
  Map,
  Loader2,
  IndianRupee,
  Coffee,
  UtensilsCrossed,
  Sun,
  Sunset,
  Moon,
  Star,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface Activity {
  id: string
  name: string
  description: string
  category: string
  start_time: string
  end_time: string
  duration_minutes: number
  estimated_cost: number
  cost_category: string
  tips?: string
  rating?: number
  is_buffer_time: boolean
  sequence_order: number
  activity_votes?: Array<{
    id: string
    vote_type: string
    user_id: string
    profiles: { full_name: string; avatar_url?: string }
  }>
}

interface Day {
  id: string
  day_number: number
  date: string
  theme: string
  planned_budget: number
  actual_spend?: number
  notes?: string
  itinerary_activities: Activity[]
}

interface Itinerary {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  total_days: number
  total_budget: number
  per_person_budget: number
  per_day_budget: number
  planned_spend: number
  interests: string[]
  pace: string
  status: string
  days: Day[]
  memberPreferences: any[]
  budgetStatus: {
    totalBudget: number
    plannedSpend: number
    remaining: number
    isUnderBudget: boolean
    percentUsed: string
  }
  travel_circles?: { id: string; name: string }
  profiles?: { full_name: string; avatar_url?: string }
}

const categoryIcons: Record<string, React.ReactNode> = {
  restaurant: <UtensilsCrossed className="h-4 w-4" />,
  cafe: <Coffee className="h-4 w-4" />,
  attraction: <Star className="h-4 w-4" />,
  activity: <Sun className="h-4 w-4" />,
  nature: <MapPin className="h-4 w-4" />,
  shopping: <MapPin className="h-4 w-4" />,
}

const getTimeIcon = (time: string) => {
  const hour = parseInt(time.split(":")[0])
  if (hour < 12) return <Sun className="h-4 w-4 text-yellow-500" />
  if (hour < 17) return <Sun className="h-4 w-4 text-orange-400" />
  if (hour < 20) return <Sunset className="h-4 w-4 text-orange-500" />
  return <Moon className="h-4 w-4 text-indigo-500" />
}

export default function ItineraryViewPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading } = useAuth()
  
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedDay, setSelectedDay] = useState(1)
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  const [votingActivity, setVotingActivity] = useState<string | null>(null)

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
      } else {
        setError(response.error || "Failed to load itinerary")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load itinerary")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async (activityId: string, voteType: "upvote" | "downvote") => {
    try {
      setVotingActivity(activityId)
      await api.post(`/itineraries/activities/${activityId}/vote`, {
        voteType
      })
      // Refresh itinerary to get updated votes
      await fetchItinerary(params.id as string)
    } catch (err) {
      console.error("Failed to vote:", err)
    } finally {
      setVotingActivity(null)
    }
  }

  const currentDay = useMemo(() => {
    if (!itinerary) return null
    return itinerary.days.find(d => d.day_number === selectedDay)
  }, [itinerary, selectedDay])

  const toggleActivityExpand = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(activityId)) {
        newSet.delete(activityId)
      } else {
        newSet.add(activityId)
      }
      return newSet
    })
  }

  const getVoteCount = (votes: Activity["activity_votes"], type: string) => {
    return votes?.filter(v => v.vote_type === type).length || 0
  }

  const getUserVote = (votes: Activity["activity_votes"]) => {
    return votes?.find(v => v.user_id === user?.id)?.vote_type
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">Failed to load itinerary</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Map className="mr-2 h-4 w-4" />
                View Map
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Itinerary
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                {itinerary.status === "generated" ? "Ready" : itinerary.status}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{itinerary.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {itinerary.destination}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(itinerary.start_date), "MMM d")} - {format(parseISO(itinerary.end_date), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {itinerary.total_days} Days
                </span>
              </div>
            </div>
            
            {itinerary.profiles && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Created by</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={itinerary.profiles.avatar_url} />
                  <AvatarFallback>{itinerary.profiles.full_name?.[0]}</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Day Selector */}
            <Card>
              <CardContent className="p-4">
                <ScrollArea className="w-full">
                  <div className="flex gap-2">
                    {itinerary.days.map((day) => (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDay(day.day_number)}
                        className={cn(
                          "flex-shrink-0 px-4 py-3 rounded-lg border transition-all min-w-[100px]",
                          selectedDay === day.day_number
                            ? "border-primary bg-primary/10"
                            : "border-muted hover:border-primary/50"
                        )}
                      >
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(day.date), "EEE")}
                        </div>
                        <div className="font-semibold">Day {day.day_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(day.date), "MMM d")}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Day Theme & Activities */}
            {currentDay && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-xl">Day {currentDay.day_number}</span>
                          <Badge variant="outline">{currentDay.theme}</Badge>
                        </CardTitle>
                        <CardDescription>
                          {format(parseISO(currentDay.date), "EEEE, MMMM d, yyyy")}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Day Budget</p>
                        <p className="text-xl font-bold text-primary">
                          ₹{currentDay.planned_budget?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Activities Timeline */}
                <div className="space-y-3">
                  {currentDay.itinerary_activities
                    ?.sort((a, b) => a.sequence_order - b.sequence_order)
                    .map((activity, idx) => {
                      const isExpanded = expandedActivities.has(activity.id)
                      const userVote = getUserVote(activity.activity_votes)
                      
                      return (
                        <Card 
                          key={activity.id}
                          className={cn(
                            "transition-all",
                            activity.is_buffer_time && "opacity-60"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* Time column */}
                              <div className="flex flex-col items-center min-w-[60px]">
                                {getTimeIcon(activity.start_time)}
                                <span className="text-sm font-medium mt-1">
                                  {activity.start_time}
                                </span>
                                <div className="flex-1 w-px bg-border my-2" />
                                <span className="text-xs text-muted-foreground">
                                  {activity.end_time}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold">{activity.name}</h3>
                                      {activity.rating && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                          {activity.rating.toFixed(1)}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        {categoryIcons[activity.category] || <MapPin className="h-3 w-3" />}
                                        {activity.category}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {activity.duration_minutes} min
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <IndianRupee className="h-3 w-3" />
                                        {activity.estimated_cost?.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Vote buttons */}
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant={userVote === "upvote" ? "default" : "ghost"}
                                      size="sm"
                                      disabled={votingActivity === activity.id}
                                      onClick={() => handleVote(activity.id, "upvote")}
                                    >
                                      <ThumbsUp className="h-4 w-4" />
                                      <span className="ml-1 text-xs">
                                        {getVoteCount(activity.activity_votes, "upvote")}
                                      </span>
                                    </Button>
                                    <Button
                                      variant={userVote === "downvote" ? "destructive" : "ghost"}
                                      size="sm"
                                      disabled={votingActivity === activity.id}
                                      onClick={() => handleVote(activity.id, "downvote")}
                                    >
                                      <ThumbsDown className="h-4 w-4" />
                                      <span className="ml-1 text-xs">
                                        {getVoteCount(activity.activity_votes, "downvote")}
                                      </span>
                                    </Button>
                                  </div>
                                </div>

                                {/* Description */}
                                {activity.description && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {activity.description}
                                  </p>
                                )}

                                {/* Expandable tips */}
                                {activity.tips && (
                                  <button
                                    onClick={() => toggleActivityExpand(activity.id)}
                                    className="flex items-center gap-1 text-sm text-primary mt-2"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="h-4 w-4" />
                                        Hide tips
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-4 w-4" />
                                        Show tips
                                      </>
                                    )}
                                  </button>
                                )}
                                
                                {isExpanded && activity.tips && (
                                  <div className="mt-3 p-3 bg-muted rounded-lg">
                                    <p className="text-sm">💡 {activity.tips}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>

                {/* Add Activity Button */}
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget Card - DIFFERENTIATOR #1 */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Budget Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget Used</span>
                    <span className={cn(
                      "font-medium",
                      itinerary.budgetStatus.isUnderBudget ? "text-green-600" : "text-red-600"
                    )}>
                      {itinerary.budgetStatus.percentUsed}%
                    </span>
                  </div>
                  <Progress 
                    value={parseFloat(itinerary.budgetStatus.percentUsed)} 
                    className={cn(
                      "h-3",
                      !itinerary.budgetStatus.isUnderBudget && "[&>div]:bg-red-500"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold">₹{itinerary.total_budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planned Spend</span>
                    <span className="font-semibold">₹{itinerary.planned_spend.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={cn(
                      "font-bold",
                      itinerary.budgetStatus.isUnderBudget ? "text-green-600" : "text-red-600"
                    )}>
                      {itinerary.budgetStatus.isUnderBudget ? "+" : "-"}₹{Math.abs(itinerary.budgetStatus.remaining).toLocaleString()}
                    </span>
                  </div>
                </div>

                {itinerary.budgetStatus.isUnderBudget ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm">Within budget! You have room for extras.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-red-700 dark:text-red-300">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm">Over budget. Consider removing some activities.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trip Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{itinerary.destination}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{itinerary.total_days} Days</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{itinerary.pace} Pace</span>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {itinerary.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="capitalize">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Circle Consensus - DIFFERENTIATOR #2 */}
            {itinerary.memberPreferences && itinerary.memberPreferences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Circle Consensus
                  </CardTitle>
                  <CardDescription>
                    {itinerary.memberPreferences.length} members have submitted preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex -space-x-2">
                    {itinerary.memberPreferences.slice(0, 5).map((pref, idx) => (
                      <Avatar key={idx} className="border-2 border-background">
                        <AvatarImage src={pref.profiles?.avatar_url} />
                        <AvatarFallback>{pref.profiles?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                    {itinerary.memberPreferences.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                        +{itinerary.memberPreferences.length - 5}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View All Preferences
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
