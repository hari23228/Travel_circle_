import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// API client with authentication
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`
    }

    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = await this.getAuthHeaders()

    // Add timeout for long-running requests (2 minutes for itinerary generation)
    const timeoutMs = endpoint.includes('/itineraries/generate') ? 120000 : 30000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const config: RequestInit = {
      headers,
      signal: controller.signal,
      ...options,
    }

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body)
    }

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
      const response = await fetch(url, config)
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ API Response: ${options.method || 'GET'} ${url}`, data)
      return data
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error(`⏱️ API Timeout [${options.method || 'GET'}] ${endpoint}`)
        throw new Error(`Request timed out after ${timeoutMs/1000}s. The server might be slow or unavailable.`)
      }
      console.error(`❌ API Error [${options.method || 'GET'}] ${endpoint}:`, error)
      throw error
    }
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_URL)

// Specific API methods
export const authAPI = {
  me: () => apiClient.get<{ user: any }>('/auth/me'),
  refreshToken: (refreshToken: string) => 
    apiClient.post<{ session: any }>('/auth/refresh', { refresh_token: refreshToken }),
  forgotPassword: (email: string) => 
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),
}

export const userAPI = {
  getProfile: () => apiClient.get<{ profile: any }>('/users/profile'),
  updateProfile: (data: any) => apiClient.put<{ profile: any }>('/users/profile', data),
  getCircles: (params?: any) => apiClient.get<{ circles: any[]; pagination: any }>(`/users/circles?${new URLSearchParams(params)}`),
  getGoals: (params?: any) => apiClient.get<{ goals: any[]; pagination: any }>(`/users/goals?${new URLSearchParams(params)}`),
  getBookings: (params?: any) => apiClient.get<{ bookings: any[]; pagination: any }>(`/users/bookings?${new URLSearchParams(params)}`),
  getNotifications: (params?: any) => apiClient.get<{ notifications: any[]; pagination: any }>(`/users/notifications?${new URLSearchParams(params)}`),
  markNotificationRead: (id: string) => apiClient.patch<{ notification: any }>(`/users/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.patch<{ message: string }>('/users/notifications/read-all'),
  getStats: () => apiClient.get<{ stats: any; recent_contributions: any[] }>('/users/stats'),
}

export const circleAPI = {
  getAll: (params?: any) => apiClient.get<{ circles: any[]; pagination: any }>(`/circles?${new URLSearchParams(params)}`),
  getById: (id: string) => apiClient.get<{ circle: any }>(`/circles/${id}`),
  create: (data: any) => apiClient.post<{ circle: any }>('/circles', data),
  update: (id: string, data: any) => apiClient.put<{ circle: any }>(`/circles/${id}`, data),
  join: (id: string, invitationCode?: string) => 
    apiClient.post<{ membership: any }>(`/circles/${id}/join`, { invitation_code: invitationCode }),
  leave: (id: string) => apiClient.post<{ message: string }>(`/circles/${id}/leave`),
  getMembers: (id: string, params?: any) => 
    apiClient.get<{ members: any[]; pagination: any }>(`/circles/${id}/members?${new URLSearchParams(params)}`),
  invite: (id: string, data: { invitee_email?: string; invitee_phone?: string }) => 
    apiClient.post<{ invitation: any }>(`/circles/${id}/invite`, data),
  getContributions: (id: string, params?: any) => 
    apiClient.get<{ contributions: any[]; pagination: any }>(`/circles/${id}/contributions?${new URLSearchParams(params)}`),
  contribute: (id: string, data: any) => 
    apiClient.post<{ contribution: any }>(`/circles/${id}/contribute`, data),
}

export const goalAPI = {
  create: (data: any) => apiClient.post<{ goal: any }>('/goals', data),
  update: (id: string, data: any) => apiClient.put<{ goal: any }>(`/goals/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/goals/${id}`),
}

export const bookingAPI = {
  create: (data: any) => apiClient.post<{ booking: any }>('/bookings', data),
  getById: (id: string) => apiClient.get<{ booking: any }>(`/bookings/${id}`),
  update: (id: string, data: any) => apiClient.put<{ booking: any }>(`/bookings/${id}`, data),
  cancel: (id: string) => apiClient.patch<{ booking: any }>(`/bookings/${id}/cancel`),
}

// Export the api object for direct use
export const api = apiClient

export const itineraryAPI = {
  generate: (data: any) => apiClient.post<{ success: boolean; data: any }>('/itineraries/generate', data),
  getById: (id: string) => apiClient.get<{ success: boolean; data: any }>(`/itineraries/${id}`),
  getByCircle: (circleId: string) => apiClient.get<{ success: boolean; data: any[] }>(`/itineraries/circle/${circleId}`),
  getMyItineraries: () => apiClient.get<{ success: boolean; data: any[] }>('/itineraries/user/my'),
  updateStatus: (id: string, status: string) => apiClient.put<{ success: boolean; data: any }>(`/itineraries/${id}/status`, { status }),
  submitPreferences: (id: string, data: any) => apiClient.post<{ success: boolean; data: any }>(`/itineraries/${id}/preferences`, data),
  voteOnActivity: (activityId: string, voteType: string, comment?: string) => 
    apiClient.post<{ success: boolean; data: any }>(`/itineraries/activities/${activityId}/vote`, { voteType, comment }),
  reorderActivities: (dayId: string, activityIds: string[]) => 
    apiClient.put<{ success: boolean }>(`/itineraries/days/${dayId}/reorder`, { activityIds }),
  deleteActivity: (activityId: string) => 
    apiClient.delete<{ success: boolean }>(`/itineraries/activities/${activityId}`),
  addActivity: (itineraryId: string, data: any) => 
    apiClient.post<{ success: boolean; data: any }>(`/itineraries/${itineraryId}/activities`, data),
}

// Error handling helper
export const handleApiError = (error: any) => {
  if (error.message) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'An unexpected error occurred'
}

// Utility function to build query parameters
export const buildQueryParams = (params: Record<string, any>): string => {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
  
  return new URLSearchParams(filtered).toString()
}
