/**
 * Multi-Account Storage Adapter for Supabase
 * Allows multiple accounts to be logged in simultaneously on the same device
 */

import { SupportedStorage } from '@supabase/supabase-js'

export interface StoredAccount {
  id: string
  email: string
  name: string
  lastActive: number
}

const ACCOUNTS_LIST_KEY = 'tripzz-accounts'
const ACTIVE_ACCOUNT_KEY = 'tripzz-active-account'

export class MultiAccountStorage implements SupportedStorage {
  private accountId: string | null = null

  constructor(accountId?: string) {
    this.accountId = accountId || null
  }

  private getStorageKey(key: string): string {
    if (!this.accountId) {
      return key // Fallback to default behavior
    }
    return `${key}-account-${this.accountId}`
  }

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null
    try {
      return window.localStorage.getItem(this.getStorageKey(key))
    } catch {
      return null
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(this.getStorageKey(key), value)
    } catch (error) {
      console.error('Storage setItem error:', error)
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(this.getStorageKey(key))
    } catch (error) {
      console.error('Storage removeItem error:', error)
    }
  }

  setAccountId(accountId: string | null): void {
    this.accountId = accountId
  }

  getAccountId(): string | null {
    return this.accountId
  }
}

/**
 * Account Manager - Handles switching between accounts
 */
export class AccountManager {
  static getAccounts(): StoredAccount[] {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(ACCOUNTS_LIST_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static getActiveAccountId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY)
  }

  static setActiveAccountId(accountId: string | null): void {
    if (typeof window === 'undefined') return
    if (accountId) {
      localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId)
      // Update last active timestamp
      this.updateAccountLastActive(accountId)
    } else {
      localStorage.removeItem(ACTIVE_ACCOUNT_KEY)
    }
  }

  static addAccount(account: StoredAccount): void {
    if (typeof window === 'undefined') return
    const accounts = this.getAccounts()
    const existingIndex = accounts.findIndex(acc => acc.id === account.id)
    
    if (existingIndex >= 0) {
      accounts[existingIndex] = { ...account, lastActive: Date.now() }
    } else {
      accounts.push({ ...account, lastActive: Date.now() })
    }
    
    localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(accounts))
    this.setActiveAccountId(account.id)
  }

  static removeAccount(accountId: string): void {
    if (typeof window === 'undefined') return
    const accounts = this.getAccounts().filter(acc => acc.id !== accountId)
    localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(accounts))
    
    // Clear all storage keys for this account
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes(`-account-${accountId}`)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    // If this was the active account, switch to another or clear
    if (this.getActiveAccountId() === accountId) {
      if (accounts.length > 0) {
        this.setActiveAccountId(accounts[0].id)
      } else {
        this.setActiveAccountId(null)
      }
    }
  }

  static updateAccountLastActive(accountId: string): void {
    if (typeof window === 'undefined') return
    const accounts = this.getAccounts()
    const account = accounts.find(acc => acc.id === accountId)
    if (account) {
      account.lastActive = Date.now()
      localStorage.setItem(ACCOUNTS_LIST_KEY, JSON.stringify(accounts))
    }
  }

  static switchAccount(accountId: string): boolean {
    const accounts = this.getAccounts()
    const account = accounts.find(acc => acc.id === accountId)
    if (account) {
      this.setActiveAccountId(accountId)
      return true
    }
    return false
  }

  static clearAllAccounts(): void {
    if (typeof window === 'undefined') return
    const accounts = this.getAccounts()
    accounts.forEach(account => {
      // Clear all storage for each account
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes(`-account-${account.id}`)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    })
    localStorage.removeItem(ACCOUNTS_LIST_KEY)
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY)
  }
}

// Create the global storage instance
export const multiAccountStorage = new MultiAccountStorage()
