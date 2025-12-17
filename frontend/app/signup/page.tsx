"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Lock, User, Phone, Calendar, MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    city: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'phone'>('email')
  const { signup, sendOTP, loginWithPhone } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

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

    if (!formData.name || !formData.email || !formData.password || !formData.dateOfBirth || !formData.city) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    const success = await signup({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      dateOfBirth: formData.dateOfBirth,
      city: formData.city
    })
    
    if (success) {
      router.push(getRedirectUrl())
    } else {
      setError("Failed to create account. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join TravelCircle and start saving</p>
        </div>

        {/* Verification Method Toggle */}
        <div className="flex mb-6 bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setVerificationMethod('email')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              verificationMethod === 'email'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Email Signup
          </button>
          <button
            type="button"
            onClick={() => setVerificationMethod('phone')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              verificationMethod === 'phone'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Phone OTP
          </button>
        </div>

        {verificationMethod === 'phone' && !otpSent ? (
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
        ) : verificationMethod === 'phone' && otpSent ? (
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
            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
            <div className="flex items-center border-2 border-border rounded-lg px-4 py-2 focus-within:border-primary transition">
              <User className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="flex-1 outline-none bg-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

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
            <label className="block text-sm font-medium text-foreground mb-2">Date of Birth *</label>
            <div className="flex items-center border-2 border-border rounded-lg px-4 py-2 focus-within:border-primary transition">
              <Calendar className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="flex-1 outline-none bg-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">City *</label>
            <div className="flex items-center border-2 border-border rounded-lg px-4 py-2 focus-within:border-primary transition">
              <MapPin className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Mumbai"
                className="flex-1 outline-none bg-transparent text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
            <div className="flex items-center border-2 border-border rounded-lg px-4 py-2 focus-within:border-primary transition">
              <Lock className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
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
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>
        )}

        <p className="text-center text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href={`/login${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`} className="text-primary font-semibold hover:underline">
            Login here
          </Link>
        </p>
      </Card>
    </div>
  )
}
