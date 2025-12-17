"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, Camera, Calendar, MapPin, Phone, Mail, Award, TrendingUp, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: user?.city || "",
    dateOfBirth: user?.dateOfBirth || "",
  })

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSave = async () => {
    const success = await updateProfile(formData)
    if (success) {
      setIsEditing(false)
    }
  }

  const achievements = [
    { name: "First Circle", description: "Created your first savings circle", earned: true },
    { name: "Consistent Saver", description: "Made 3 consecutive monthly payments", earned: true },
    { name: "Goal Achiever", description: "Completed your first travel goal", earned: false },
    { name: "Community Builder", description: "Invited 5 friends to join", earned: false },
  ]

  const recentTransactions = [
    { id: 1, circle: "Goa Beach Trip", amount: 5000, type: "contribution", date: "2024-01-15" },
    { id: 2, circle: "Thailand Adventure", amount: 8000, type: "contribution", date: "2024-01-10" },
    { id: 3, circle: "Kerala Backwaters", amount: 3000, type: "contribution", date: "2024-01-05" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="p-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          </div>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="p-8 mb-8 border-0 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{user.name.charAt(0)}</span>
                )}
              </div>
              {isEditing && (
                <button className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-3xl font-bold bg-transparent border-b-2 border-border focus:border-primary outline-none"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="text-muted-foreground bg-transparent border-b border-border focus:border-primary outline-none"
                  />
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{user.name}</h1>
                  <p className="text-muted-foreground mb-4">{user.email}</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="bg-transparent border-b border-border focus:border-primary outline-none"
                    />
                  ) : (
                    <span>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not set"}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="City"
                      className="bg-transparent border-b border-border focus:border-primary outline-none"
                    />
                  ) : (
                    <span>{user.city || "Not set"}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone"
                      className="bg-transparent border-b border-border focus:border-primary outline-none"
                    />
                  ) : (
                    <span>{user.phone || "Not set"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex gap-4 mt-6">
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Savings Summary */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4">Savings Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">₹{user.totalSavings.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Saved</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">{user.activeCircles}</div>
                  <div className="text-sm text-muted-foreground">Active Circles</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">₹{user.rewardsEarned.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Rewards Earned</div>
                </div>
              </div>
            </Card>

            {/* Recent Transactions */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4">Recent Contributions</h3>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 border border-border rounded-lg">
                    <div>
                      <div className="font-medium text-foreground">{transaction.circle}</div>
                      <div className="text-sm text-muted-foreground">{transaction.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+₹{transaction.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{transaction.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Achievements */}
          <div className="space-y-6">
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Achievements
              </h3>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${achievement.earned ? 'bg-primary/5 border-primary/20' : 'bg-muted border-border'}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${achievement.earned ? 'bg-primary text-white' : 'bg-muted-foreground text-white'}`}>
                        {achievement.earned ? '✓' : '?'}
                      </div>
                      <div>
                        <div className={`font-medium ${achievement.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {achievement.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{achievement.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 border-0 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/create-circle">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Create New Circle
                  </Button>
                </Link>
                <Link href="/join-circle">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Join Circle
                  </Button>
                </Link>
                <Button variant="ghost" onClick={logout} className="w-full justify-start text-destructive hover:text-destructive">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}