"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users, Target, TrendingUp, LogOut, Menu, User, MapPin, Plane, Hotel } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { NotificationBell } from "@/lib/notification-context"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [circles, setCircles] = useState<any[]>([])
  const [loadingCircles, setLoadingCircles] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user?.id) {
      // Load from cache immediately for instant display
      const cached = localStorage.getItem('dashboard:circles')
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached)
          // Use cache if less than 60 seconds old (increased from 30s)
          if (Date.now() - timestamp < 60000) {
            console.log('Using cached circles data')
            setCircles(data)
            setLoadingCircles(false)
            // Fetch fresh data in background after showing cached
            setTimeout(() => fetchUserCircles(true), 100)
            return
          }
        } catch (e) {
          console.warn('Failed to parse cached circles')
        }
      }
      fetchUserCircles(false)
    }
  }, [user?.id]) // Only refetch when user ID changes, not on every user object change

  const fetchUserCircles = useCallback(async (isBackgroundRefresh = false) => {
    if (!user?.id) return // Exit early if no user
    
    // Don't show loading spinner for background refreshes
    if (!isBackgroundRefresh) {
      setLoadingCircles(true)
    }
    
    try {
      console.log('Fetching circles for user:', user.id)

      // Fetch memberships and circles in parallel
      const [membershipsResult, allMembershipsResult] = await Promise.all([
        supabase
          .from('circle_memberships')
          .select('circle_id')
          .eq('user_id', user.id)
          .eq('is_active', true),
        // Fetch all active memberships to calculate member counts efficiently
        supabase
          .from('circle_memberships')
          .select('circle_id')
          .eq('is_active', true)
      ])

      const { data: memberships, error: membershipsError } = membershipsResult
      const { data: allMemberships } = allMembershipsResult

      console.log('=== DASHBOARD DEBUG ===')
      console.log('User ID:', user.id)
      console.log('Memberships result:', { memberships, error: membershipsError })
      console.log('All memberships count:', allMemberships?.length)

      if (membershipsError) {
        console.error('Error fetching memberships:', membershipsError)
        return
      }

      const circleIds = (memberships || []).map(m => m.circle_id)
      console.log('User membership circle IDs:', circleIds)

      if (circleIds.length === 0) {
        console.log('No memberships found for user')
        setCircles([])
        return
      }

      // Create a map of circle_id to member count
      const memberCounts = (allMemberships || []).reduce((acc: any, m: any) => {
        if (circleIds.includes(m.circle_id)) {
          acc[m.circle_id] = (acc[m.circle_id] || 0) + 1
        }
        return acc
      }, {})

      // Fetch circle details
      const { data: circlesData, error: circlesError } = await supabase
        .from('travel_circles')
        .select('id, name, destination, target_amount, current_amount, target_date, image_url, description')
        .in('id', circleIds)

      if (circlesError) {
        console.error('Error fetching travel_circles:', circlesError)
        return
      }

      // Map circles with pre-calculated member counts (no additional DB calls)
      const circlesWithMembers = (circlesData || []).map((circle: any) => ({
        id: circle.id,
        name: circle.name,
        destination: circle.destination,
        target: circle.target_amount || 0,
        saved: circle.current_amount || 0,
        members: memberCounts[circle.id] || 0,
        image: circle.image_url || '/placeholder.svg',
        description: circle.description,
        targetDate: circle.target_date || null
      }))

      console.log('Fetched circles count:', circlesWithMembers.length)
      setCircles(circlesWithMembers)
      
      // Cache the results for 30 seconds
      try {
        localStorage.setItem('dashboard:circles', JSON.stringify({
          data: circlesWithMembers,
          timestamp: Date.now()
        }))
      } catch (e) {
        console.warn('Failed to cache circles data')
      }
      
      setLastFetch(Date.now())
    } catch (error) {
      console.error('Error fetching circles:', error)
    } finally {
      setLoadingCircles(false)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  if (!user) {
    return null
  }

  const activeCirclesCount = loadingCircles ? '—' : circles.length.toString()
  const stats = [
    { label: "Active Circles", value: activeCirclesCount, icon: Users },
    { label: "Total Saved", value: `₹${(user.totalSavings ?? 0).toLocaleString()}`, icon: TrendingUp },
    { label: "Rewards Earned", value: `₹${(user.rewardsEarned ?? 0).toLocaleString()}`, icon: Target },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-muted rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">TravelCircle</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Link href="/join-circle">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                <Users className="w-5 h-5 mr-2" />
                Join Circle
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" className="text-foreground hover:text-primary">
                <User className="w-5 h-5 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="text-foreground hover:text-destructive">
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, {user.name}!</h2>
          <p className="text-muted-foreground">Manage your savings circles and track your progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <Card key={i} className="p-6 border-0 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    {stat.label === 'Active Circles' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById('my-circles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                      >
                        View My Circles
                      </Button>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
        {/* Quick access button for mobile below stats */}
        <div className="mb-10 md:hidden">
          <Button 
            className="w-full" 
            variant="secondary"
            onClick={() => {
              document.getElementById('my-circles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            View My Circles
          </Button>
        </div>

        {/* Main Action Cards */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold text-foreground mb-6">What would you like to do?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create Circle Card */}
            <Link href="/create-circle">
              <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary cursor-pointer h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Create Circle</h3>
                  <p className="text-muted-foreground mb-6">
                    Start a savings circle with friends and save together for your dream vacation
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-white w-full">
                    Create New Circle
                  </Button>
                </div>
              </Card>
            </Link>

            {/* Travel Booking Card */}
            <Link href="/book-transport">
              <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary cursor-pointer h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Plane className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Book Transport</h3>
                  <p className="text-muted-foreground mb-6">
                    Book trains, buses, or flights to India's top tourist destinations
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-white w-full">
                    Search Transport
                  </Button>
                </div>
              </Card>
            </Link>

            {/* Hotel Booking Card */}
            <Link href="/book-hotel">
              <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary cursor-pointer h-full">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Hotel className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">Book Hotel</h3>
                  <p className="text-muted-foreground mb-6">
                    Find and book hotels at top destinations with 10-12 options per city
                  </p>
                  <Button className="bg-primary hover:bg-primary/90 text-white w-full">
                    Search Hotels
                  </Button>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Circles Section */}
        <div className="mb-10" id="my-circles">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-foreground">Your Circles</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => fetchUserCircles()}
                disabled={loadingCircles}
              >
                {loadingCircles ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Link href="/create-circle">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Plus className="w-5 h-5 mr-2" />
                  New Circle
                </Button>
              </Link>
            </div>
          </div>

          {loadingCircles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                    <div className="flex gap-4 mb-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                    <div className="h-2 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : circles.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Travel Circles Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first travel circle or join an existing one with an invite code
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/create-circle">
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="w-4 h-4" />
                        Create Circle
                      </Button>
                    </Link>
                    <Link href="/join-circle">
                      <Button variant="outline" className="gap-2">
                        <Users className="w-4 h-4" />
                        Join Circle
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {circles.map((circle) => {
                const progress = (circle.saved / circle.target) * 100
                return (
                  <Card
                    key={circle.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow border-0 cursor-pointer group"
                  >
                    <div className="relative h-48 bg-muted overflow-hidden">
                      <img
                        src={circle.image || "/placeholder.svg"}
                        alt={circle.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {Math.round(progress)}%
                      </div>
                    </div>

                    <div className="p-6">
                      <h4 className="font-bold text-lg text-foreground mb-1">{circle.name}</h4>
                      <p className="text-muted-foreground text-sm mb-4">{circle.destination}</p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-muted-foreground">₹{circle.saved.toLocaleString()}</span>
                          <span className="text-sm text-muted-foreground">₹{circle.target.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Members */}
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <Users className="w-4 h-4 mr-1" />
                        {circle.members} members
                      </div>

                      <Link href={`/circle/${circle.id}`}>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-white">View Details</Button>
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
