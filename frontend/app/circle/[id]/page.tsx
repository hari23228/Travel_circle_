"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Users, Target, Calendar, CreditCard, Share2, Settings, Clock, TrendingUp, Gift, UserPlus, Mail, Copy, Check, Plus, Wallet, History, UserMinus, Edit, IndianRupee } from "lucide-react"
import { PaymentButton } from "@/lib/payment-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface CircleMember {
  id: string
  name: string
  email: string
  joinedAt: string
  totalContributed: number
  isAdmin: boolean
  profileImage?: string
  lastPayment?: string
}

interface Payment {
  id: string
  memberId: string
  memberName: string
  amount: number
  date: string
  type: 'online' | 'manual'
  note?: string
}

interface Circle {
  id: string
  name: string
  destination: string
  target: number
  saved: number
  members: CircleMember[]
  duration: number
  frequency: string
  contributionAmount: number
  createdAt: string
  endDate: string
  status: string
  image?: string
  description?: string
  payments?: Payment[]
}

export default function CircleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [circleId, setCircleId] = useState<string>('')
  
  // Resolve params Promise on mount
  useEffect(() => {
    params.then(resolvedParams => {
      setCircleId(resolvedParams.id)
    })
  }, [params])
  
  const getCircleId = () => {
    if (circleId) return circleId
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/')
      const idx = parts.indexOf('circle')
      if (idx !== -1 && parts[idx + 1]) {
        return parts[idx + 1]
      }
    }
    return ''
  }
  const [circle, setCircle] = useState<Circle | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'payments'>('overview')
  const [loading, setLoading] = useState(false)
  const [loadingCircle, setLoadingCircle] = useState(true)
  const [loadedFromCache, setLoadedFromCache] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showManualPaymentDialog, setShowManualPaymentDialog] = useState(false)
  const [manualPaymentAmount, setManualPaymentAmount] = useState("")
  const [manualPaymentMember, setManualPaymentMember] = useState("")
  const [manualPaymentNote, setManualPaymentNote] = useState("")

  useEffect(() => {
    // Don't fetch if circleId hasn't been resolved yet
    if (!circleId) return
    
    // Try to hydrate instantly from local cache for seamless UX
    if (typeof window === 'undefined') {
      return
    }
    try {
      const cached = localStorage.getItem(`circle:${circleId}`)
      if (cached) {
        const c = JSON.parse(cached)
        const targetDate = new Date(c.target_date)
        const createdDate = new Date(c.created_at)
        const duration = Math.ceil((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        const seededMembers = Array.isArray(c.members_seed) ? c.members_seed.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email || '',
          joinedAt: m.joinedAt,
          totalContributed: m.totalContributed || 0,
          isAdmin: !!m.isAdmin,
        })) : []
        setCircle({
          id: c.id,
          name: c.name,
          destination: c.destination,
          target: c.target_amount || 0,
          saved: c.current_amount || 0,
          duration: duration,
          frequency: c.contribution_frequency || 'monthly',
          contributionAmount: c.contribution_amount || 0,
          createdAt: c.created_at,
          endDate: c.target_date,
          status: c.status || 'active',
          description: c.description || `Save together for an amazing trip to ${c.destination}!`,
          image: c.image_url || '/placeholder.svg',
          members: seededMembers,
          payments: []
        })
        setLoadingCircle(false)
        setLoadedFromCache(true)
        console.log('Loaded from cache with', seededMembers.length, 'seeded members')
        // Kick off background refresh
        fetchCircleDetails()
        return
      }
    } catch (e) {
      console.warn('Failed to read local cache for circle:', e)
    }
    // Fallback to remote fetch
    fetchCircleDetails()
  }, [circleId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    // If coming from fresh creation, check URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('fresh') === 'true') {
      // Remove the query param from URL without reloading
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  const fetchCircleDetails = async () => {
    try {
      setLoadingCircle(true)
      const currentCircleId = getCircleId()
      console.log(`Fetching circle details for ID: ${currentCircleId}`)
      
      // Validate ID presence to avoid uuid syntax errors
      if (!currentCircleId || typeof currentCircleId !== 'string') {
        alert('Invalid circle URL. Please open from your dashboard.')
        router.push('/dashboard')
        return
      }

      // Check authentication with session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError)
        alert('Your session has expired. Please log in again.')
        router.push('/login')
        return
      }

      const user = session.user
      if (!user) {
        console.log('No user in session, redirecting to login')
        alert('Please log in to view circle details.')
        router.push('/login')
        return
      }

      console.log('User authenticated:', user.id)
      console.log('Session valid until:', new Date(session.expires_at! * 1000).toLocaleString())

      // Fetch all data in parallel for better performance
      const [circleResult, membershipsResult, contributionsResult] = await Promise.all([
        supabase
          .from('travel_circles')
          .select('*')
          .eq('id', circleId)
          .maybeSingle(),
        supabase
          .from('circle_memberships')
          .select(`
            user_id,
            role,
            joined_at,
            status,
            profiles (
              id,
              email,
              full_name
            )
          `)
          .eq('circle_id', circleId)
          .eq('status', 'active'),
        supabase
          .from('contributions')
          .select(`
            id,
            user_id,
            amount,
            created_at,
            payment_method,
            notes,
            profiles (
              full_name,
              email
            )
          `)
          .eq('circle_id', circleId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
      ])

      const { data: circleData, error: circleError } = circleResult
      const { data: memberships, error: membersError } = membershipsResult
      const { data: contributions } = contributionsResult

      console.log('Circle fetch result:', { 
        circleData, 
        circleError,
        circleId: circleId,
        userId: user.id 
      })

      if (circleError) {
        console.error('Error fetching circle:', circleError)
        console.error('Error details:', {
          message: circleError.message,
          details: circleError.details,
          hint: circleError.hint,
          code: circleError.code
        })
        alert(`Failed to load circle: ${circleError.message}\n\nThis might be a permissions issue. Please check Supabase RLS policies.`)
        router.push('/dashboard')
        return
      }

      if (!circleData) {
        console.error('No circle data returned')
        console.error('This usually means RLS policy is blocking access')
        alert('Circle not found. This might be a permissions issue. Please check your dashboard.')
        router.push('/dashboard')
        return
      }

      console.log('Circle found:', circleData.name)
      console.log('Memberships fetch result:', { memberships, membersError, count: memberships?.length })

      if (membersError) {
        console.error('Error fetching members:', membersError)
      }

      // Build a map of user contributions for quick lookup
      const contributionsByUser = (contributions || []).reduce((acc: any, c: any) => {
        if (!acc[c.user_id]) {
          acc[c.user_id] = []
        }
        acc[c.user_id].push(c)
        return acc
      }, {})

      // Process members with their contributions (no additional DB calls)
      const membersWithContributions = (memberships || []).map((membership: any) => {
        const userContributions = contributionsByUser[membership.user_id] || []
        const totalContributed = userContributions.reduce((sum: number, c: any) => sum + (c.amount || 0), 0)
        const lastPayment = userContributions.length > 0 ? userContributions[0].created_at : undefined

        return {
          id: membership.user_id,
          name: membership.profiles?.full_name || membership.profiles?.email?.split('@')[0] || 'Unknown',
          email: membership.profiles?.email || '',
          joinedAt: membership.joined_at,
          totalContributed,
          isAdmin: membership.role === 'admin' || membership.role === 'creator',
          lastPayment
        }
      })

      const payments: Payment[] = (contributions || []).map((c: any) => ({
        id: c.id,
        memberId: c.user_id,
        memberName: c.profiles?.full_name || c.profiles?.email?.split('@')[0] || 'Unknown',
        amount: c.amount,
        date: c.created_at,
        type: c.payment_method === 'cash' ? 'manual' : 'online',
        note: c.notes
      }))

      // Calculate duration from target_date
      const targetDate = new Date(circleData.target_date)
      const createdDate = new Date(circleData.created_at)
      const duration = Math.ceil((targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

      const updatedCircle = {
        id: circleData.id,
        name: circleData.name,
        destination: circleData.destination,
        target: circleData.target_amount || 0,
        saved: circleData.current_amount || 0,
        duration: duration,
        frequency: circleData.contribution_frequency || 'monthly',
        contributionAmount: circleData.contribution_amount || 0,
        createdAt: circleData.created_at,
        endDate: circleData.target_date,
        status: circleData.status,
        description: circleData.description || `Save together for an amazing trip to ${circleData.destination}!`,
        image: circleData.image_url || '/placeholder.svg',
        members: membersWithContributions.length > 0 ? membersWithContributions : (loadedFromCache ? circle?.members || [] : []),
        payments
      }
      
      console.log('Setting circle with', updatedCircle.members.length, 'members')
      setCircle(updatedCircle)
    } catch (error) {
      console.error('Error fetching circle details:', error)
      // If loaded from cache, don't redirect - just keep cached data
      if (!loadedFromCache) {
        alert('Failed to load circle details')
        router.push('/dashboard')
      }
    } finally {
      setLoadingCircle(false)
    }
  }

  if (loadingCircle || !circle) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-lg">Loading circle details...</div>
    </div>
  }

  const progress = (circle.saved / circle.target) * 100
  const daysRemaining = Math.ceil((new Date(circle.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const rewardAmount = Math.floor(circle.saved * 0.02) // 2% reward

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true)
    
    // Refresh circle data to get updated amounts
    await fetchCircleDetails()
    
    setTimeout(() => setPaymentSuccess(false), 5000)
  }

  const handleInviteByEmail = async () => {
    if (!inviteEmail) return
    
    try {
      setLoading(true)
      const session = await supabase.auth.getSession()
      
      if (!session.data.session) {
        alert('Please log in to send invitations')
        setLoading(false)
        return
      }

      const currentCircleId = getCircleId()
      if (!currentCircleId) {
        alert('Invalid circle ID. Please wait for the page to load completely.')
        setLoading(false)
        return
      }

      console.log('Sending invitation to:', inviteEmail, 'for circle:', currentCircleId)
      
      const response = await fetch(`http://localhost:5001/api/circles/${currentCircleId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({ invitee_email: inviteEmail })
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        let errorMessage = 'Failed to create invitation'
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
          console.error('Server error:', data)
        } catch (e) {
          console.error('Could not parse error response')
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Invitation created:', data)

      // Show success with the invitation code
      const code = data.invitation.invitation_code
      setInviteCode(code)
      alert(`✅ Invitation created for ${inviteEmail}!\n\nInvite Code: ${code}\n\nShare this code with them so they can join the circle.\n\n${data.invitation.email_sent ? 'Email sent successfully!' : '(Email not configured, please share the code manually)'}`)
      setInviteEmail("")
      setShowInviteDialog(false)
    } catch (error: any) {
      console.error('Error creating invitation:', error)
      let errorMsg = 'Please try again'
      
      if (error.message === 'Failed to fetch') {
        errorMsg = 'Cannot connect to server. Make sure backend is running on port 5001'
      } else if (error.message) {
        errorMsg = error.message
      }
      
      alert(`Failed to create invitation: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  const generateInviteCode = () => {
    // Generate a simple invite code if one doesn't exist
    if (!inviteCode) {
      setInviteCode(`TRIP${Math.random().toString(36).substring(2, 8).toUpperCase()}`)
    }
  }

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleJoinByCode = async () => {
    if (!joinCode) {
      alert('Please enter an invite code')
      return
    }

    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Please log in to join a circle')
        setLoading(false)
        return
      }

      const response = await fetch(`http://localhost:5001/api/circles/join-by-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ invitation_code: joinCode })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join with code')
      }

      alert('🎉 Joined the circle successfully!')
      setJoinCode("")
      // Refresh details to show new membership
      await fetchCircleDetails()
    } catch (error: any) {
      console.error('Error joining by code:', error)
      alert(`Could not join: ${error.message || 'Please check the code and try again'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleManualPayment = async () => {
    if (!manualPaymentAmount || !manualPaymentMember) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const amount = parseFloat(manualPaymentAmount)

      // Insert contribution into database
      const { error } = await supabase
        .from('contributions')
        .insert({
          circle_id: params.id,
          user_id: manualPaymentMember,
          amount: amount,
          payment_method: 'cash',
          status: 'completed',
          notes: manualPaymentNote || null
        })

      if (error) {
        console.error('Error recording payment:', error)
        alert('Failed to record payment: ' + error.message)
        return
      }

      // Update circle's current amount
      const newTotal = circle.saved + amount
      await supabase
        .from('travel_circles')
        .update({ current_amount: newTotal })
        .eq('id', params.id)

      // Refresh circle data
      await fetchCircleDetails()

      setManualPaymentAmount("")
      setManualPaymentMember("")
      setManualPaymentNote("")
      setShowManualPaymentDialog(false)
      alert('Manual payment recorded successfully!')
    } catch (error: any) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      setLoading(true)

      // Update membership status to inactive
      const { error } = await supabase
        .from('circle_memberships')
        .update({ status: 'inactive' })
        .eq('circle_id', params.id)
        .eq('user_id', memberId)

      if (error) {
        console.error('Error removing member:', error)
        alert('Failed to remove member: ' + error.message)
        return
      }

      // Refresh circle data
      await fetchCircleDetails()
      alert('Member removed successfully!')
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="p-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{circle.name}</h1>
              <p className="text-sm text-muted-foreground">{circle.destination}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" onClick={generateInviteCode}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Members</DialogTitle>
                  <DialogDescription>
                    Invite friends to join your circle via email or share the invite code
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Invite by Email</label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="friend@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={loading}
                      />
                      <Button onClick={handleInviteByEmail} disabled={loading || !inviteEmail}>
                        <Mail className="w-4 h-4 mr-2" />
                        {loading ? 'Sending...' : 'Send'}
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium mb-2 block">Share Invite Code</label>
                    <div className="flex gap-2">
                      <Input value={inviteCode} readOnly className="font-mono" />
                      <Button onClick={handleCopyInviteCode} variant="outline">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this code with friends to join your circle
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <label className="text-sm font-medium mb-2 block">Join via Code</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter invite code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        disabled={loading}
                        className="font-mono"
                      />
                      <Button onClick={handleJoinByCode} disabled={loading || !joinCode}>
                        Join
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Paste the code you received to join instantly
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </header>

      {paymentSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-green-800 font-medium">✅ Payment successful! Your contribution has been added to the circle.</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">₹{circle.saved.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">of ₹{circle.target.toLocaleString()}</div>
              </div>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{Math.round(progress)}% complete</div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{circle.members.length}</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{Math.max(daysRemaining, 0)}</div>
                <div className="text-sm text-muted-foreground">Days left</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">₹{rewardAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Rewards earned</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Contribution Card */}
                <Card className="p-6 border-0 shadow-sm">
                  <h3 className="text-xl font-bold text-foreground mb-4">Make Your Contribution</h3>
                  <div className="bg-primary/5 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-foreground">Monthly Contribution</span>
                      <span className="text-2xl font-bold text-primary">₹{circle.contributionAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Next payment due: {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <PaymentButton
                      amount={circle.contributionAmount}
                      circleId={circle.id}
                      description={`Monthly contribution to ${circle.name}`}
                      onSuccess={handlePaymentSuccess}
                      onError={(error) => console.error('Payment error:', error)}
                      className="w-full"
                    />
                    <Dialog open={showManualPaymentDialog} onOpenChange={setShowManualPaymentDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Wallet className="w-4 h-4 mr-2" />
                          Manual Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Manual Payment</DialogTitle>
                          <DialogDescription>
                            Add a cash or offline payment to the circle
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Select Member</label>
                            <select
                              className="w-full px-3 py-2 border border-border rounded-md"
                              value={manualPaymentMember}
                              onChange={(e) => setManualPaymentMember(e.target.value)}
                            >
                              <option value="">Select member</option>
                              {circle.members.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Amount (₹)</label>
                            <Input
                              type="number"
                              placeholder="Enter amount"
                              value={manualPaymentAmount}
                              onChange={(e) => setManualPaymentAmount(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Note (Optional)</label>
                            <Input
                              placeholder="e.g., Cash payment, Bank transfer"
                              value={manualPaymentNote}
                              onChange={(e) => setManualPaymentNote(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleManualPayment} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Record Payment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6 border-0 shadow-sm">
                  <h3 className="text-xl font-bold text-foreground mb-4">Member Contributions</h3>
                  <div className="space-y-3">
                    {circle.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">{member.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              {member.name}
                              {member.isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.lastPayment ? `Last: ${new Date(member.lastPayment).toLocaleDateString()}` : 'No payments yet'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">₹{member.totalContributed.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((member.totalContributed / circle.target) * 100)}% of target
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Circle Info */}
                <Card className="p-6 border-0 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">Circle Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{circle.duration} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium capitalize">{circle.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{new Date(circle.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={circle.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        {circle.status}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Progress Chart */}
                <Card className="p-6 border-0 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">Savings Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">₹{circle.target.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saved</span>
                      <span className="font-medium text-green-600">₹{circle.saved.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-medium">₹{Math.max(circle.target - circle.saved, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Circle Members ({circle.members.length})</h3>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {circle.members.map((member) => (
                  <Card key={member.id} className="p-4 border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-primary">{member.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {member.name}
                            {member.isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Joined: {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      {!member.isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                          <UserMinus className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">Contributed</div>
                        <div className="font-bold text-green-600">₹{member.totalContributed.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Progress</div>
                        <div className="font-bold">{Math.round((member.totalContributed / circle.target) * 100)}%</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Payment History</h3>
                <Button onClick={() => setShowManualPaymentDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Payment
                </Button>
              </div>
              {circle.payments && circle.payments.length > 0 ? (
                <div className="space-y-3">
                  {circle.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          payment.type === 'online' ? 'bg-blue-50' : 'bg-green-50'
                        }`}>
                          {payment.type === 'online' ? (
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Wallet className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{payment.memberName}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()} • {payment.type === 'online' ? 'Online Payment' : 'Manual Payment'}
                          </div>
                          {payment.note && (
                            <div className="text-xs text-muted-foreground mt-1">Note: {payment.note}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          {payment.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payment history yet</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
