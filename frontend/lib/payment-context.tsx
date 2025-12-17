"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

export interface Transaction {
  id: string
  userId: string
  circleId: string
  amount: number
  type: 'contribution' | 'withdrawal' | 'reward'
  status: 'pending' | 'completed' | 'failed'
  paymentMethod: 'razorpay' | 'manual'
  razorpayPaymentId?: string
  razorpayOrderId?: string
  createdAt: string
  completedAt?: string
  description?: string
}

export interface PaymentOrder {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
}

interface PaymentContextType {
  transactions: Transaction[]
  createPaymentOrder: (amount: number, circleId: string, description?: string) => Promise<PaymentOrder | null>
  processPayment: (paymentData: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => Promise<boolean>
  getTransactionHistory: (userId?: string, circleId?: string) => Transaction[]
  isLoading: boolean
}

// Mock Razorpay SDK for development
const mockRazorpay = {
  open: (options: any) => {
    console.log('Mock Razorpay opened with options:', options)
    // Simulate successful payment after 2 seconds
    setTimeout(() => {
      options.handler({
        razorpay_payment_id: 'pay_' + Date.now(),
        razorpay_order_id: options.order_id,
        razorpay_signature: 'mock_signature_' + Date.now()
      })
    }, 2000)
  }
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([
    // Mock transactions
    {
      id: 'txn_001',
      userId: '1',
      circleId: 'circle_001',
      amount: 5000,
      type: 'contribution',
      status: 'completed',
      paymentMethod: 'razorpay',
      razorpayPaymentId: 'pay_mock001',
      razorpayOrderId: 'order_mock001',
      createdAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T10:00:30Z',
      description: 'Monthly contribution to Goa Beach Trip'
    },
    {
      id: 'txn_002',
      userId: '1',
      circleId: 'circle_002',
      amount: 8000,
      type: 'contribution',
      status: 'completed',
      paymentMethod: 'razorpay',
      razorpayPaymentId: 'pay_mock002',
      razorpayOrderId: 'order_mock002',
      createdAt: '2024-01-10T09:30:00Z',
      completedAt: '2024-01-10T09:30:45Z',
      description: 'Monthly contribution to Thailand Adventure'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const createPaymentOrder = async (amount: number, circleId: string, description?: string): Promise<PaymentOrder | null> => {
    setIsLoading(true)
    try {
      // Mock API call to create Razorpay order
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const order: PaymentOrder = {
        id: 'order_' + Date.now(),
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        status: 'created'
      }
      
      // Create pending transaction
      const transaction: Transaction = {
        id: 'txn_' + Date.now(),
        userId: '1', // Current user ID
        circleId,
        amount,
        type: 'contribution',
        status: 'pending',
        paymentMethod: 'razorpay',
        razorpayOrderId: order.id,
        createdAt: new Date().toISOString(),
        description
      }
      
      setTransactions(prev => [...prev, transaction])
      return order
      
    } catch (error) {
      console.error('Error creating payment order:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const processPayment = async (paymentData: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Mock payment verification
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update transaction status
      setTransactions(prev => prev.map(txn => 
        txn.razorpayOrderId === paymentData.razorpay_order_id
          ? {
              ...txn,
              status: 'completed' as const,
              razorpayPaymentId: paymentData.razorpay_payment_id,
              completedAt: new Date().toISOString()
            }
          : txn
      ))
      
      return true
    } catch (error) {
      console.error('Error processing payment:', error)
      
      // Update transaction status to failed
      setTransactions(prev => prev.map(txn => 
        txn.razorpayOrderId === paymentData.razorpay_order_id
          ? { ...txn, status: 'failed' as const }
          : txn
      ))
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactionHistory = (userId?: string, circleId?: string): Transaction[] => {
    return transactions.filter(txn => {
      if (userId && txn.userId !== userId) return false
      if (circleId && txn.circleId !== circleId) return false
      return true
    })
  }

  const value = {
    transactions,
    createPaymentOrder,
    processPayment,
    getTransactionHistory,
    isLoading
  }

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
}

export function usePayment() {
  const context = useContext(PaymentContext)
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider')
  }
  return context
}

// Payment button component
export function PaymentButton({ 
  amount, 
  circleId, 
  description, 
  onSuccess, 
  onError,
  disabled = false,
  className = ""
}: {
  amount: number
  circleId: string
  description?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}) {
  const { createPaymentOrder, processPayment, isLoading } = usePayment()

  const handlePayment = async () => {
    try {
      const order = await createPaymentOrder(amount, circleId, description)
      
      if (!order) {
        onError?.('Failed to create payment order')
        return
      }

      // Initialize Razorpay (mock in development)
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock_key',
        amount: order.amount,
        currency: order.currency,
        name: 'TravelCircle',
        description: description || 'Circle Contribution',
        order_id: order.id,
        handler: async (response: any) => {
          const success = await processPayment(response)
          if (success) {
            onSuccess?.()
          } else {
            onError?.('Payment verification failed')
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3B82F6'
        }
      }

      mockRazorpay.open(options)
      
    } catch (error) {
      console.error('Payment error:', error)
      onError?.('Payment failed')
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={`px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? 'Processing...' : `Pay ₹${amount.toLocaleString()}`}
    </button>
  )
}