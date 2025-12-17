"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Users, 
  Target, 
  TrendingUp, 
  Settings, 
  Shield, 
  CreditCard, 
  Gift,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Download
} from "lucide-react"

interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  joinedAt: string
  totalSavings: number
  activeCircles: number
  status: 'active' | 'pending' | 'suspended'
  isVerified: boolean
  lastLogin: string
}

interface AdminCircle {
  id: string
  name: string
  destination: string
  target: number
  saved: number
  members: number
  status: 'active' | 'completed' | 'paused'
  createdAt: string
  endDate: string
  createdBy: string
}

interface AdminTransaction {
  id: string
  userId: string
  userName: string
  circleId: string
  circleName: string
  amount: number
  type: 'contribution' | 'withdrawal' | 'reward'
  status: 'completed' | 'pending' | 'failed'
  date: string
  paymentMethod: string
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'circles' | 'transactions' | 'rewards'>('overview')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock data
  const mockUsers: AdminUser[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+91 9876543210',
      joinedAt: '2024-01-01T00:00:00Z',
      totalSavings: 125000,
      activeCircles: 3,
      status: 'active',
      isVerified: true,
      lastLogin: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+91 9876543211',
      joinedAt: '2024-01-02T00:00:00Z',
      totalSavings: 85000,
      activeCircles: 2,
      status: 'pending',
      isVerified: false,
      lastLogin: '2024-01-14T15:20:00Z'
    }
  ]

  const mockCircles: AdminCircle[] = [
    {
      id: 'circle_001',
      name: 'Goa Beach Trip',
      destination: 'Goa, India',
      target: 100000,
      saved: 65000,
      members: 5,
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      createdBy: 'John Doe'
    },
    {
      id: 'circle_002',
      name: 'Thailand Adventure',
      destination: 'Bangkok & Phuket',
      target: 250000,
      saved: 180000,
      members: 8,
      status: 'active',
      createdAt: '2024-01-05T00:00:00Z',
      endDate: '2024-11-30T23:59:59Z',
      createdBy: 'Jane Smith'
    }
  ]

  const mockTransactions: AdminTransaction[] = [
    {
      id: 'txn_001',
      userId: '1',
      userName: 'John Doe',
      circleId: 'circle_001',
      circleName: 'Goa Beach Trip',
      amount: 8500,
      type: 'contribution',
      status: 'completed',
      date: '2024-01-15T10:00:00Z',
      paymentMethod: 'Razorpay'
    },
    {
      id: 'txn_002',
      userId: '2',
      userName: 'Jane Smith',
      circleId: 'circle_002',
      circleName: 'Thailand Adventure',
      amount: 12000,
      type: 'contribution',
      status: 'pending',
      date: '2024-01-14T14:30:00Z',
      paymentMethod: 'Razorpay'
    }
  ]

  const stats = {
    totalUsers: 1250,
    activeCircles: 78,
    totalTransactions: 5420,
    totalVolume: 12500000,
    pendingVerifications: 15,
    rewardsDistributed: 125000
  }

  const handleUserAction = (userId: string, action: 'verify' | 'suspend' | 'activate') => {
    console.log(`${action} user ${userId}`)
    // Implement user action logic
  }

  const handleTransactionAction = (transactionId: string, action: 'approve' | 'reject') => {
    console.log(`${action} transaction ${transactionId}`)
    // Implement transaction action logic
  }

  const simulateRewardPayout = (circleId: string) => {
    console.log(`Simulating reward payout for circle ${circleId}`)
    // Implement reward simulation logic
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">TravelCircle Management Dashboard</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.activeCircles}</div>
                <div className="text-sm text-muted-foreground">Active Circles</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalTransactions.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">₹{(stats.totalVolume / 1000000).toFixed(1)}M</div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.pendingVerifications}</div>
                <div className="text-sm text-muted-foreground">Pending KYC</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">₹{(stats.rewardsDistributed / 1000).toFixed(0)}K</div>
                <div className="text-sm text-muted-foreground">Rewards Paid</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-8">
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'users' as const, label: 'Users' },
            { id: 'circles' as const, label: 'Circles' },
            { id: 'transactions' as const, label: 'Transactions' },
            { id: 'rewards' as const, label: 'Rewards' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">New user registration</div>
                      <div className="text-sm text-muted-foreground">Sarah Wilson joined</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">2 hours ago</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Circle completed</div>
                      <div className="text-sm text-muted-foreground">Kerala Backwaters reached target</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">5 hours ago</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">Large transaction</div>
                      <div className="text-sm text-muted-foreground">₹25,000 payment processed</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">1 day ago</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4">Pending Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <div className="font-medium text-foreground">KYC Verifications</div>
                    <div className="text-sm text-muted-foreground">15 users pending verification</div>
                  </div>
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    Review
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <div className="font-medium text-foreground">Failed Transactions</div>
                    <div className="text-sm text-muted-foreground">3 transactions need attention</div>
                  </div>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                    Resolve
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-medium text-foreground">Reward Payouts</div>
                    <div className="text-sm text-muted-foreground">2 circles ready for rewards</div>
                  </div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Process
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-border rounded-lg focus:border-primary focus:outline-none"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <Card className="border-0 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium text-foreground">User</th>
                      <th className="text-left p-4 font-medium text-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-foreground">Savings</th>
                      <th className="text-left p-4 font-medium text-foreground">Circles</th>
                      <th className="text-left p-4 font-medium text-foreground">Joined</th>
                      <th className="text-left p-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-foreground">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'active' ? 'bg-green-100 text-green-800' :
                              user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                            {user.isVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-foreground">₹{user.totalSavings.toLocaleString()}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-foreground">{user.activeCircles}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(user.joinedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!user.isVerified && (
                              <Button 
                                size="sm" 
                                onClick={() => handleUserAction(user.id, 'verify')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Verify
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Transaction Management</h3>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>

            <Card className="border-0 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium text-foreground">Transaction</th>
                      <th className="text-left p-4 font-medium text-foreground">User</th>
                      <th className="text-left p-4 font-medium text-foreground">Circle</th>
                      <th className="text-left p-4 font-medium text-foreground">Amount</th>
                      <th className="text-left p-4 font-medium text-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-foreground">{transaction.id}</div>
                            <div className="text-sm text-muted-foreground">{transaction.paymentMethod}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-foreground">{transaction.userName}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-foreground">{transaction.circleName}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-foreground">₹{transaction.amount.toLocaleString()}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {transaction.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleTransactionAction(transaction.id, 'approve')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleTransactionAction(transaction.id, 'reject')}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Reward Management</h3>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Gift className="w-4 h-4 mr-2" />
                Simulate Payout
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6 border-0 shadow-sm">
                <h4 className="text-lg font-bold text-foreground mb-4">Reward Distribution</h4>
                <div className="space-y-4">
                  {mockCircles.map((circle) => {
                    const rewardAmount = Math.floor(circle.saved * 0.02)
                    const progress = (circle.saved / circle.target) * 100
                    
                    return (
                      <div key={circle.id} className="border border-border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-medium text-foreground">{circle.name}</div>
                            <div className="text-sm text-muted-foreground">{circle.members} members</div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            progress >= 100 ? 'bg-green-100 text-green-800' :
                            progress >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {Math.round(progress)}% complete
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-muted-foreground">Potential Reward</div>
                            <div className="text-lg font-bold text-primary">₹{rewardAmount.toLocaleString()}</div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => simulateRewardPayout(circle.id)}
                            disabled={progress < 100}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          >
                            {progress >= 100 ? 'Pay Reward' : 'Not Ready'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-sm">
                <h4 className="text-lg font-bold text-foreground mb-4">Reward Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Reward Percentage</label>
                    <input 
                      type="number" 
                      defaultValue={2} 
                      min={0} 
                      max={10} 
                      step={0.1}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:outline-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Percentage of total savings to give as reward</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Minimum Circle Size</label>
                    <input 
                      type="number" 
                      defaultValue={3} 
                      min={2} 
                      max={10}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:outline-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum members required for reward eligibility</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Reward Distribution</label>
                    <select className="w-full px-3 py-2 border border-border rounded-lg focus:border-primary focus:outline-none">
                      <option value="equal">Equal distribution</option>
                      <option value="contribution">Based on contribution</option>
                      <option value="performance">Based on performance</option>
                    </select>
                  </div>
                  
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                    Update Settings
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}