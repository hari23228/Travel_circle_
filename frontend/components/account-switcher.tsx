"use client"

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, Plus, UserCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AccountSwitcher() {
  const { user, accounts, activeAccountId, switchAccount, removeAccount } = useAuth()
  const router = useRouter()
  const [switching, setSwitching] = useState(false)

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === activeAccountId) return
    
    setSwitching(true)
    try {
      await switchAccount(accountId)
    } catch (error) {
      console.error('Failed to switch account:', error)
    } finally {
      setSwitching(false)
    }
  }

  const handleAddAccount = () => {
    router.push('/login?addAccount=true')
  }

  const handleRemoveAccount = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Remove this account? You\'ll need to log in again to access it.')) {
      removeAccount(accountId)
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImage} alt={user.name} />
            <AvatarFallback>
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {accounts.length > 1 && (
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {accounts.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        {accounts.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch Account
            </DropdownMenuLabel>
            {accounts.map((account) => (
              <DropdownMenuItem
                key={account.id}
                onClick={() => handleSwitchAccount(account.id)}
                disabled={switching || account.id === activeAccountId}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {account.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">{account.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{account.email}</span>
                  </div>
                  {account.id === activeAccountId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  {account.id !== activeAccountId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleRemoveAccount(account.id, e)}
                    >
                      <LogOut className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleAddAccount} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          <span>Add Another Account</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => router.push('/profile')}
          className="cursor-pointer"
        >
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
