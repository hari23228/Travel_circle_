"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Notification {
  id: string
  type: 'payment_reminder' | 'milestone_achievement' | 'circle_update' | 'reward_earned' | 'system'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  metadata?: {
    circleId?: string
    amount?: number
    userName?: string
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  sendNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    // Mock notifications
    {
      id: '1',
      type: 'payment_reminder',
      title: 'Payment Reminder',
      message: 'Your monthly contribution of ₹8,500 for Goa Beach Trip is due in 3 days.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: false,
      actionUrl: '/circle/goa',
      metadata: {
        circleId: 'goa',
        amount: 8500
      }
    },
    {
      id: '2',
      type: 'milestone_achievement',
      title: '🎉 Milestone Achieved!',
      message: 'Your Thailand Adventure circle has reached 75% of the target amount!',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isRead: false,
      actionUrl: '/circle/thailand',
      metadata: {
        circleId: 'thailand'
      }
    },
    {
      id: '3',
      type: 'circle_update',
      title: 'New Member Joined',
      message: 'Sarah Wilson joined your Kerala Backwaters circle.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      isRead: true,
      actionUrl: '/circle/kerala',
      metadata: {
        circleId: 'kerala',
        userName: 'Sarah Wilson'
      }
    },
    {
      id: '4',
      type: 'reward_earned',
      title: '💰 Reward Earned!',
      message: 'You earned ₹1,200 as a consistency bonus for making 3 consecutive payments.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      isRead: true,
      metadata: {
        amount: 1200
      }
    }
  ])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }

  const sendNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    // Simulate email/SMS sending
    console.log('📧 Email notification sent:', newNotification)
    console.log('📱 SMS notification sent:', newNotification)
  }

  // Simulate periodic notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate payment reminders
      const shouldSendReminder = Math.random() < 0.1 // 10% chance every 30 seconds
      
      if (shouldSendReminder) {
        const reminderNotifications = [
          {
            type: 'payment_reminder' as const,
            title: 'Payment Due Soon',
            message: 'Your contribution for Bali Serenity circle is due in 2 days.',
            actionUrl: '/circle/bali',
            metadata: { circleId: 'bali', amount: 12000 }
          },
          {
            type: 'milestone_achievement' as const,
            title: '🎯 80% Target Reached!',
            message: 'Your Manali Adventure circle is now 80% funded!',
            actionUrl: '/circle/manali',
            metadata: { circleId: 'manali' }
          },
          {
            type: 'circle_update' as const,
            title: 'Circle Activity',
            message: 'John Doe made a contribution to Dubai Luxury circle.',
            actionUrl: '/circle/dubai',
            metadata: { circleId: 'dubai', userName: 'John Doe' }
          }
        ]
        
        const randomNotification = reminderNotifications[Math.floor(Math.random() * reminderNotifications.length)]
        sendNotification(randomNotification)
      }
    }, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Notification Bell Component
export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'payment_reminder': return '💳'
      case 'milestone_achievement': return '🎉'
      case 'circle_update': return '👥'
      case 'reward_earned': return '💰'
      case 'system': return '🔔'
      default: return '📢'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5h-5l5 5zm-5-5V7a5 5 0 011-3V3a1 1 0 012 0v1a5 5 0 011 3v5l5 5H5l5-5z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="text-4xl mb-2">🔔</div>
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !notification.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-medium text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-muted-foreground hover:text-red-500 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-primary hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="text-xs text-primary hover:underline"
                              onClick={() => {
                                markAsRead(notification.id)
                                setIsOpen(false)
                              }}
                            >
                              View details →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}