"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Lock, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phone: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const { login, loginWithPhone, sendOTP, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const addAccount = searchParams.get('addAccount')
    if (addAccount === 'true') {
      setIsAddingAccount(true)
    }
  }, [searchParams])

  const getRedirectUrl = () => {
    const redirect = searchParams.get('redirect')
    return redirect || '/dashboard'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSendOTP = async () => {
    if (!formData.phone) {
      setError("Please enter phone number")
      return
    }
    
    setLoading(true)
    const success = await sendOTP(formData.phone)
    if (success) {
      setOtpSent(true)
      setError("")
    } else {
      setError("Failed to send OTP. Please try again.")
    }
    setLoading(false)
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      setError("Please enter OTP")
      return
    }

    setLoading(true)
    const success = await loginWithPhone(formData.phone, otp)
    if (success) {
      router.push(getRedirectUrl())
    } else {
      setError("Invalid OTP. Please try again.")
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    const success = await login(formData.email, formData.password)
    if (success) {
      router.push(getRedirectUrl())
    } else {
      setError("Invalid email or password")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {isAddingAccount ? 'Add Another Account' : 'Welcome Back'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAddingAccount 
              ? 'Sign in with a different account to switch between them' 
              : 'Login to your TravelCircle account'}
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex mb-6 bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              loginMethod === 'email'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              loginMethod === 'phone'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {loginMethod === 'phone' && !otpSent ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
              <div className="flex items-center border-2 border-border rounded-lg px-4 py-2 focus-within:border-primary transition">
                <Phone className="w-5 h-5 text-muted-foreground mr-3" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="flex-1 outline-none bg-transparent text-foreground placeholder-muted-foreground"
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm">{error}</div>
            )}
            
            <Button
              type="button"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold text-lg"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </div>
        ) : loginMethod === 'phone' && otpSent ? (
          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground mt-1">OTP sent to {formData.phone}</p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm">{error}</div>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold text-lg"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOtpSent(false)}
              className="w-full text-primary"
            >
              Change Phone Number
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
            <div className="flex items-center border-2 border-border rounded-lg px-4 py-2 focus-within:border-primary transition">
              <Mail className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="flex-1 outline-none bg-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
            <div className="flex items-center border-2 border-border rounded-lg px-4 py-2 focus-within:border-primary transition">
              <Lock className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="flex-1 outline-none bg-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-700 text-sm">{error}</div>
          )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-semibold text-lg"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Link href="/forgot-password" className="block text-center text-primary hover:underline text-sm">
              Forgot password?
            </Link>
          </form>
        )}        <p className="text-center text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href={`/signup${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`} className="text-primary font-semibold hover:underline">
            Sign up here
          </Link>
        </p>
      </Card>
    </div>
  )
}
