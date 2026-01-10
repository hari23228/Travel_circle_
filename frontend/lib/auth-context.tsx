"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, reinitializeSupabaseForAccount } from './supabase'
import { AccountManager, StoredAccount } from './multi-account-storage'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth?: string
  city?: string
  profileImage?: string
  joinedAt: string
  isVerified: boolean
  totalSavings: number
  activeCircles: number
  rewardsEarned: number
  username?: string
  bio?: string
}

interface AuthContextType {
  user: User | null
  supabaseUser: SupabaseUser | null
  session: any
  login: (email: string, password: string) => Promise<boolean>
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>
  signup: (userData: SignupData) => Promise<boolean>
  logout: () => void
  sendOTP: (phone: string) => Promise<boolean>
  updateProfile: (data: Partial<User>) => Promise<boolean>
  isLoading: boolean
  // Multi-account support
  accounts: StoredAccount[]
  switchAccount: (accountId: string) => Promise<boolean>
  removeAccount: (accountId: string) => void
  activeAccountId: string | null
}

export interface SignupData {
  name: string
  email: string
  phone: string
  password: string
  dateOfBirth: string
  city: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null)

  useEffect(() => {
    // Load accounts list
    setAccounts(AccountManager.getAccounts())
    setActiveAccountId(AccountManager.getActiveAccountId())

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
      }
      
      if (initialSession?.user) {
        setSession(initialSession)
        setSupabaseUser(initialSession.user)
        await fetchUserProfile(initialSession.user.id)
      }
      
      setIsLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (session?.user) {
        setSession(session)
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id)
      } else {
        setSession(null)
        setSupabaseUser(null)
        setUser(null)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          name: profile.full_name || '',
          email: supabaseUser?.email || '',
          phone: profile.phone || '',
          dateOfBirth: profile.date_of_birth,
          city: profile.city,
          profileImage: profile.avatar_url,
          joinedAt: profile.created_at,
          isVerified: profile.is_verified,
          totalSavings: profile.total_savings || 0,
          activeCircles: profile.active_circles || 0,
          rewardsEarned: profile.rewards_earned || 0,
          username: profile.username,
          bio: profile.bio
        }
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // For development: Use phone login to bypass email issues
      // We'll need to get the phone from the user's stored data
      const accounts = AccountManager.getAccounts()
      const account = accounts.find(acc => acc.email === email)

      if (!account) {
        console.error('Account not found for email:', email)
        return false
      }

      // For now, let's use a dummy phone number for testing
      // In production, you'd store the phone number with the account
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email, // Keep using email for login since phone signup still requires verification
        password
      })

      if (error) {
        console.error('Login error:', error.message)
        return false
      }

      if (data.user) {
        // Add this account to the accounts list
        const profile = await fetchAndGetProfile(data.user.id)
        if (profile) {
          const accountInfo: StoredAccount = {
            id: data.user.id,
            email: data.user.email || email,
            name: profile.full_name || email.split('@')[0],
            lastActive: Date.now()
          }
          AccountManager.addAccount(accountInfo)
          setAccounts(AccountManager.getAccounts())
          setActiveAccountId(data.user.id)
        }
        // User profile will be fetched automatically by the auth state change listener
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAndGetProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return profile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const loginWithPhone = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      })

      if (error) {
        console.error('OTP verification error:', error.message)
        return false
      }

      if (data.user) {
        // User profile will be fetched automatically by the auth state change listener
        return true
      }
      
      return false
    } catch (error) {
      console.error('Phone login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (userData: SignupData): Promise<boolean> => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
            phone: userData.phone,
            date_of_birth: userData.dateOfBirth,
            city: userData.city
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
          // Disable email confirmation for development
          emailConfirm: false
        }
      })

      if (error) {
        console.error('Signup error:', error.message, error)
        // Show specific error message to user
        let errorMessage = error.message
        if (error.message.toLowerCase().includes('already') || error.status === 422) {
          errorMessage = 'This email is already registered. Please try logging in instead.'
        }
        alert(`Signup failed: ${errorMessage}`)
        return false
      }

      if (data.user) {
        console.log('User created:', data.user)
        
        // Create profile in backend
        try {
          // For signup, we need to create the profile without auth since the session might not be established yet
          const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: data.user.id,
              full_name: userData.name,
              phone: userData.phone,
              date_of_birth: userData.dateOfBirth,
              city: userData.city
            })
          })
          
          if (!profileResponse.ok) {
            console.warn('Profile creation in backend failed, but auth user created')
          }
        } catch (profileError) {
          console.warn('Profile creation request failed:', profileError)
        }
        
        // Since email confirmation is disabled, user should be logged in immediately
        return true
      }
      
      return false
    } catch (error: any) {
      console.error('Signup error:', error)
      alert(`Signup error: ${error?.message || 'Unknown error'}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const sendOTP = async (phone: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone
      })

      if (error) {
        console.error('Send OTP error:', error.message)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Send OTP error:', error)
      return false
    }
  }

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!user || !supabaseUser) return false
    
    try {
      const profileUpdate: any = {}
      
      if (data.name) profileUpdate.full_name = data.name
      if (data.phone) profileUpdate.phone = data.phone
      if (data.dateOfBirth) profileUpdate.date_of_birth = data.dateOfBirth
      if (data.city) profileUpdate.city = data.city
      if (data.profileImage) profileUpdate.avatar_url = data.profileImage
      if (data.username) profileUpdate.username = data.username
      if (data.bio) profileUpdate.bio = data.bio

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id)

      if (error) {
        console.error('Update profile error:', error.message)
        return false
      }

      // Refresh user profile
      await fetchUserProfile(user.id)
      return true
    } catch (error) {
      console.error('Update profile error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      const currentUserId = user?.id
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error.message)
      }
      
      // Remove this account from the list
      if (currentUserId) {
        AccountManager.removeAccount(currentUserId)
        setAccounts(AccountManager.getAccounts())
        
        // If there are other accounts, switch to the first one
        const remainingAccounts = AccountManager.getAccounts()
        if (remainingAccounts.length > 0) {
          await switchAccount(remainingAccounts[0].id)
        } else {
          setActiveAccountId(null)
        }
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Clear state (this will happen automatically via auth state change listener)
    setUser(null)
    setSupabaseUser(null)
    setSession(null)
  }

  const switchAccount = async (accountId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      // Switch the storage context
      const success = AccountManager.switchAccount(accountId)
      if (!success) {
        console.error('Account not found:', accountId)
        return false
      }
      
      setActiveAccountId(accountId)
      reinitializeSupabaseForAccount(accountId)
      
      // Force reload the session for the new account
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error switching account:', error)
        return false
      }
      
      if (session?.user) {
        setSession(session)
        setSupabaseUser(session.user)
        await fetchUserProfile(session.user.id)
        
        // Reload the page to refresh all components with new account data
        window.location.reload()
        return true
      } else {
        console.warn('No session found for account:', accountId)
        // Account session expired, remove it
        AccountManager.removeAccount(accountId)
        setAccounts(AccountManager.getAccounts())
        return false
      }
    } catch (error) {
      console.error('Switch account error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeAccount = (accountId: string) => {
    AccountManager.removeAccount(accountId)
    setAccounts(AccountManager.getAccounts())
    
    // If removing the active account, switch to another or clear
    if (activeAccountId === accountId) {
      const remainingAccounts = AccountManager.getAccounts()
      if (remainingAccounts.length > 0) {
        switchAccount(remainingAccounts[0].id)
      } else {
        setActiveAccountId(null)
        setUser(null)
        setSupabaseUser(null)
        setSession(null)
      }
    }
  }

  const value = {
    user,
    supabaseUser,
    session,
    login,
    loginWithPhone,
    signup,
    logout,
    sendOTP,
    updateProfile,
    isLoading,
    accounts,
    switchAccount,
    removeAccount,
    activeAccountId
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}