import { createClient } from '@supabase/supabase-js'
import { multiAccountStorage, AccountManager } from './multi-account-storage'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Initialize with the active account ID if available
if (typeof window !== 'undefined') {
  const activeAccountId = AccountManager.getActiveAccountId()
  if (activeAccountId) {
    multiAccountStorage.setAccountId(activeAccountId)
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: multiAccountStorage
  }
})

/**
 * Reinitialize Supabase client with a specific account
 * This should be called when switching accounts
 */
export function reinitializeSupabaseForAccount(accountId: string | null) {
  multiAccountStorage.setAccountId(accountId)
  // Force refresh the session
  supabase.auth.getSession()
}

// Database types (you can generate these with Supabase CLI)
export interface Profile {
  id: string
  username?: string
  full_name: string
  phone?: string
  date_of_birth?: string
  city?: string
  bio?: string
  avatar_url?: string
  total_savings: number
  active_circles: number
  rewards_earned: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface TravelCircle {
  id: string
  name: string
  description?: string
  destination?: string
  image_url?: string
  target_amount: number
  current_amount: number
  creator_id: string
  max_members: number
  is_private: boolean
  is_active: boolean
  target_date?: string
  created_at: string
  updated_at: string
}

export interface CircleMembership {
  id: string
  circle_id: string
  user_id: string
  role: 'admin' | 'moderator' | 'member'
  contribution_amount: number
  last_contribution_date?: string
  joined_at: string
  is_active: boolean
}

export interface CircleContribution {
  id: string
  circle_id: string
  user_id: string
  amount: number
  payment_method: string
  payment_reference?: string
  status: 'pending' | 'confirmed' | 'failed' | 'refunded'
  contribution_date: string
  notes?: string
}

export interface TravelGoal {
  id: string
  user_id: string
  title: string
  description?: string
  destination?: string
  target_amount: number
  current_amount: number
  target_date?: string
  is_completed: boolean
  priority: 'low' | 'medium' | 'high'
  category: 'leisure' | 'adventure' | 'business' | 'family' | 'solo'
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  circle_id?: string
  booking_type: 'hotel' | 'transport' | 'package'
  title: string
  description?: string
  destination: string
  booking_date: string
  start_date: string
  end_date?: string
  total_amount: number
  paid_amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  booking_data: any
  external_booking_id?: string
  provider_name?: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'general' | 'circle' | 'booking' | 'payment' | 'goal'
  is_read: boolean
  action_url?: string
  related_id?: string
  created_at: string
}
