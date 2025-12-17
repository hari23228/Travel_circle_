"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, LinkIcon, Search, Users, Target, MapPin, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function JoinCirclePage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [circles, setCircles] = useState<any[]>([])
  const [loadingCircles, setLoadingCircles] = useState(true)
  const [showCodeInput, setShowCodeInput] = useState(false)

  useEffect(() => {
    fetchAllCircles()
  }, [])

  const fetchAllCircles = async () => {
    try {
      setLoadingCircles(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Fetch all active circles (single query)
      const { data: allCircles, error } = await supabase
        .from('travel_circles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching circles:', error)
        return
      }

      const circleIds = (allCircles || []).map((c: any) => c.id)
      if (circleIds.length === 0) {
        setCircles([])
        return
      }

      // Fetch memberships for these circles in bulk for member counts
      const [allMembersRes, myMembershipsRes] = await Promise.all([
        supabase
          .from('circle_memberships')
          .select('circle_id')
          .in('circle_id', circleIds)
          .eq('status', 'active'),
        supabase
          .from('circle_memberships')
          .select('circle_id')
          .in('circle_id', circleIds)
          .eq('user_id', user.id)
      ])

      const { data: allMembers, error: allMembersError } = allMembersRes
      const { data: myMemberships, error: myMembershipsError } = myMembershipsRes

      if (allMembersError) {
        console.error('Error fetching member counts:', allMembersError)
      }
      if (myMembershipsError) {
        console.error('Error fetching user memberships:', myMembershipsError)
      }

      // Reduce to counts per circle
      const counts: Record<string, number> = {}
      for (const row of allMembers || []) {
        counts[row.circle_id] = (counts[row.circle_id] || 0) + 1
      }

      const mySet = new Set((myMemberships || []).map((m: any) => m.circle_id))

      const circlesWithDetails = (allCircles || []).map((circle: any) => ({
        ...circle,
        memberCount: counts[circle.id] || 0,
        isAlreadyMember: mySet.has(circle.id)
      }))

      setCircles(circlesWithDetails)
    } catch (error) {
      console.error('Error fetching circles:', error)
    } finally {
      setLoadingCircles(false)
    }
  }

  const handleJoinCircle = async (circleId: string) => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError("You must be logged in to join a circle")
        setLoading(false)
        return
      }

      // Join the circle
      const { error: memberError } = await supabase
        .from('circle_memberships')
        .insert({
          circle_id: circleId,
          user_id: user.id,
          role: 'member'
        })

      if (memberError) {
        if (memberError.message.includes('duplicate')) {
          setError("You're already a member of this circle")
        } else {
          setError("Failed to join circle. Please try again.")
        }
        setLoading(false)
        return
      }

      // Redirect to circle page
      router.push(`/circle/${circleId}`)
    } catch (error) {
      console.error('Error joining circle:', error)
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteCode.trim()) {
      setError("Please enter an invite code")
      return
    }

    setLoading(true)
    setError("")

    try {
      // First, find the invitation by code
      const { data: invitation, error: inviteError } = await supabase
        .from('circle_invitations')
        .select('*, travel_circles(*)')
        .eq('invitation_code', inviteCode.toUpperCase())
        .eq('status', 'pending')
        .single()

      if (inviteError || !invitation) {
        setError("Invalid or expired invite code")
        setLoading(false)
        return
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        setError("This invite code has expired")
        setLoading(false)
        return
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("You must be logged in to join a circle")
        setLoading(false)
        return
      }

      // Join the circle
      const { error: memberError } = await supabase
        .from('circle_memberships')
        .insert({
          circle_id: invitation.circle_id,
          user_id: user.id,
          role: 'member'
        })

      if (memberError) {
        if (memberError.message.includes('duplicate')) {
          setError("You're already a member of this circle")
        } else {
          setError("Failed to join circle. Please try again.")
        }
        setLoading(false)
        return
      }

      // Update invitation status
      await supabase
        .from('circle_invitations')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', invitation.id)

      // Redirect to circle page
      router.push(`/circle/${invitation.circle_id}`)
    } catch (error) {
      console.error('Error joining circle:', error)
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Join a Circle</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">Browse Travel Circles</h2>
          <p className="text-muted-foreground mb-6">Discover and join circles to save together for amazing trips</p>
          
          <Button 
            onClick={() => setShowCodeInput(!showCodeInput)}
            variant="outline" 
            className="gap-2"
          >
            <LinkIcon className="w-4 h-4" />
            {showCodeInput ? "Browse Circles" : "Have an Invite Code?"}
          </Button>
        </div>

        {/* Invite Code Input Section */}
        {showCodeInput && (
          <Card className="p-8 border-0 shadow-lg mb-10 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <LinkIcon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Join with Invite Code</h3>
              <p className="text-muted-foreground">Enter the code shared by a circle member</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" /> Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter the 6-digit code (e.g., AB12CD)"
                  required
                  className="w-full px-4 py-3 border-2 border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none uppercase"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm">{error}</div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg rounded-lg"
              >
                {loading ? "Joining..." : "Join Circle"}
              </Button>
            </form>
          </Card>
        )}

        {/* Circles Grid */}
        {!showCodeInput && (
          <div>
            {loadingCircles ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-lg text-muted-foreground">Loading available circles...</div>
              </div>
            ) : circles.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No Circles Available</h3>
                    <p className="text-muted-foreground mb-6">
                      Be the first to create a travel circle!
                    </p>
                    <Link href="/create-circle">
                      <Button className="gap-2 bg-primary hover:bg-primary/90">
                        Create Circle
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {circles.map((circle) => {
                  const progress = circle.target_amount > 0 
                    ? (circle.current_amount / circle.target_amount) * 100 
                    : 0
                  const isFull = circle.memberCount >= circle.max_members

                  return (
                    <Card
                      key={circle.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow border-0"
                    >
                      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MapPin className="w-16 h-16 text-primary/30" />
                        <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {Math.round(progress)}%
                        </div>
                      </div>

                      <div className="p-6">
                        <h4 className="font-bold text-lg text-foreground mb-1">{circle.name}</h4>
                        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
                          <MapPin className="w-4 h-4" />
                          {circle.destination}
                        </div>

                        {/* Target Amount */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              Goal
                            </span>
                            <span className="text-sm font-semibold text-foreground">
                              ₹{circle.target_amount?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Members and Target Date */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              Members
                            </span>
                            <span className="text-foreground font-medium">
                              {circle.memberCount}/{circle.max_members}
                            </span>
                          </div>
                          {circle.target_date && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Target Date
                              </span>
                              <span className="text-foreground font-medium">
                                {new Date(circle.target_date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          )}
                        </div>

                        {circle.isAlreadyMember ? (
                          <Link href={`/circle/${circle.id}`}>
                            <Button className="w-full" variant="outline">
                              View Circle
                            </Button>
                          </Link>
                        ) : isFull ? (
                          <Button className="w-full" disabled>
                            Circle Full
                          </Button>
                        ) : (
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white"
                            onClick={() => handleJoinCircle(circle.id)}
                            disabled={loading}
                          >
                            {loading ? "Joining..." : "Join Circle"}
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Create Circle CTA */}
        {!showCodeInput && circles.length > 0 && (
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">Want to start your own circle?</p>
            <Link href="/create-circle">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 bg-transparent">
                Create Your Own Circle
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
