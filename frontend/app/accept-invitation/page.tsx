"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { CheckCircle, XCircle, Loader2, Users, MapPin, Target } from "lucide-react"
import Link from "next/link"

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationCode = searchParams.get("code")
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [circleDetails, setCircleDetails] = useState<any>(null)
  const [userAuthenticated, setUserAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthAndProcessInvitation()
  }, [invitationCode])

  const checkAuthAndProcessInvitation = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUserAuthenticated(false)
        setError("You need to be logged in to accept invitations")
        setLoading(false)
        return
      }

      setUserAuthenticated(true)

      // Process the invitation
      if (invitationCode) {
        await processInvitation(invitationCode, user.id)
      } else {
        setError("Invalid invitation link - no code provided")
        setLoading(false)
      }
    } catch (err) {
      console.error("Error checking auth:", err)
      setError("An error occurred while processing your invitation")
      setLoading(false)
    }
  }

  const processInvitation = async (code: string, userId: string) => {
    try {
      // Find the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('circle_invitations')
        .select('*, travel_circles(*)')
        .eq('invitation_code', code.toUpperCase())
        .single()

      if (inviteError || !invitation) {
        setError("Invalid invitation code")
        setLoading(false)
        return
      }

      // Check if already accepted
      if (invitation.status === 'accepted') {
        setError("This invitation has already been used")
        setLoading(false)
        return
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        setError("This invitation has expired")
        setLoading(false)
        return
      }

      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('circle_memberships')
        .select('id')
        .eq('circle_id', invitation.circle_id)
        .eq('user_id', userId)
        .single()

      if (existingMembership) {
        setCircleDetails(invitation.travel_circles)
        setError("You're already a member of this circle")
        setLoading(false)
        return
      }

      // Add user to the circle
      const { error: memberError } = await supabase
        .from('circle_memberships')
        .insert({
          circle_id: invitation.circle_id,
          user_id: userId,
          role: 'member',
          status: 'active'
        })

      if (memberError) {
        console.error("Error adding member:", memberError)
        setError("Failed to join the circle. Please try again.")
        setLoading(false)
        return
      }

      // Update invitation status
      await supabase
        .from('circle_invitations')
        .update({ 
          status: 'accepted', 
          responded_at: new Date().toISOString() 
        })
        .eq('id', invitation.id)

      // Success!
      setCircleDetails(invitation.travel_circles)
      setSuccess(true)
      setLoading(false)

      // Redirect to circle page after 2 seconds
      setTimeout(() => {
        router.push(`/circle/${invitation.circle_id}`)
      }, 2000)

    } catch (err) {
      console.error("Error processing invitation:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold mb-2">Processing Invitation</h2>
          <p className="text-gray-600">Please wait while we process your invitation...</p>
        </Card>
      </div>
    )
  }

  if (error && !userAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
          
          <div className="space-y-3">
            <Link href={`/login?redirect=/accept-invitation?code=${invitationCode}`}>
              <Button className="w-full" size="lg">
                Login to Accept Invitation
              </Button>
            </Link>
            <Link href={`/signup?redirect=/accept-invitation?code=${invitationCode}`}>
              <Button variant="outline" className="w-full" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Unable to Accept Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
          
          {circleDetails && (
            <div className="mb-6 text-left">
              <h3 className="font-semibold mb-2">Circle Details:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{circleDetails.name}</span>
                </div>
                {circleDetails.destination && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{circleDetails.destination}</span>
                  </div>
                )}
                {circleDetails.target_amount && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>₹{parseInt(circleDetails.target_amount).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {circleDetails && (
              <Link href={`/circle/${circleDetails.id}`}>
                <Button className="w-full">
                  View Circle
                </Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (success && circleDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to the Circle!</h2>
            <p className="text-gray-600 mb-6">
              You've successfully joined <strong>{circleDetails.name}</strong>
            </p>
          </div>
          
          <div className="mb-6 space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Circle Name</p>
                <p className="font-semibold">{circleDetails.name}</p>
              </div>
            </div>
            
            {circleDetails.destination && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-semibold">{circleDetails.destination}</p>
                </div>
              </div>
            )}
            
            {circleDetails.target_amount && (
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Target Amount</p>
                  <p className="font-semibold">₹{parseInt(circleDetails.target_amount).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
          
          <p className="text-center text-sm text-gray-600 mb-4">
            Redirecting to your circle...
          </p>
          
          <Link href={`/circle/${circleDetails.id}`}>
            <Button className="w-full" size="lg">
              Go to Circle Now
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return null
}
