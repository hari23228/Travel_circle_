# Multi-Account Support for Tripzz

This feature allows users to log in with multiple accounts on the same device and switch between them seamlessly.

## Features

- ✅ **Multiple Accounts**: Log in with multiple accounts simultaneously
- ✅ **Account Switching**: Switch between accounts without logging out
- ✅ **Session Persistence**: Each account's session is stored separately and persists after page refresh
- ✅ **Account Management**: Add, remove, and manage multiple accounts
- ✅ **Visual Account Switcher**: Dropdown UI to see all accounts and switch between them

## Implementation Details

### Storage Architecture

Each account's session data is stored with a unique storage key:
```
sb-<project>-auth-token-account-<userId>
```

This prevents session conflicts when multiple accounts are logged in.

### Core Components

1. **MultiAccountStorage** (`lib/multi-account-storage.ts`)
   - Custom storage adapter implementing Supabase's `SupportedStorage` interface
   - Isolates session data per account using unique keys
   - Manages account list and active account tracking

2. **AccountManager** (`lib/multi-account-storage.ts`)
   - Handles account metadata (id, email, name, lastActive)
   - Provides methods to add, remove, switch, and list accounts
   - Persists account list in localStorage

3. **Enhanced AuthContext** (`lib/auth-context.tsx`)
   - Extended with multi-account support
   - Provides `switchAccount`, `removeAccount`, `accounts`, and `activeAccountId`
   - Automatically registers new accounts on login

4. **AccountSwitcher Component** (`components/account-switcher.tsx`)
   - Visual dropdown to display all accounts
   - Quick account switching
   - Add/remove account actions

### Updated Supabase Client

The Supabase client now uses the custom storage adapter:

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: multiAccountStorage // Custom multi-account storage
  }
})
```

## Usage

### For Users

#### Adding Multiple Accounts

1. Log in with your first account normally
2. Click on your profile avatar (top right)
3. Select "Add Another Account" from the dropdown
4. Log in with a different account
5. Both accounts are now available

#### Switching Between Accounts

1. Click on your profile avatar
2. See the list of all logged-in accounts
3. Click on any account to switch to it
4. The page will reload with the selected account

#### Removing an Account

1. Click on your profile avatar
2. Find the account you want to remove
3. Click the logout icon next to it
4. Confirm removal

### For Developers

#### Using Multi-Account in Components

```typescript
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { 
    user,              // Current active user
    accounts,          // List of all logged-in accounts
    activeAccountId,   // ID of the active account
    switchAccount,     // Function to switch accounts
    removeAccount      // Function to remove an account
  } = useAuth()

  const handleSwitch = async (accountId: string) => {
    const success = await switchAccount(accountId)
    if (success) {
      console.log('Switched to account:', accountId)
    }
  }

  return (
    <div>
      <p>Active: {user?.name}</p>
      <p>Total accounts: {accounts.length}</p>
      {accounts.map(account => (
        <button key={account.id} onClick={() => handleSwitch(account.id)}>
          {account.name}
        </button>
      ))}
    </div>
  )
}
```

#### Manual Account Management

```typescript
import { AccountManager } from '@/lib/multi-account-storage'

// Get all accounts
const accounts = AccountManager.getAccounts()

// Get active account ID
const activeId = AccountManager.getActiveAccountId()

// Add an account
AccountManager.addAccount({
  id: 'user-uuid',
  email: 'user@example.com',
  name: 'John Doe',
  lastActive: Date.now()
})

// Switch account
AccountManager.switchAccount('user-uuid')

// Remove account
AccountManager.removeAccount('user-uuid')

// Clear all accounts
AccountManager.clearAllAccounts()
```

## Technical Notes

### Session Isolation

Each account's authentication session is completely isolated:
- Access tokens are stored separately
- Refresh tokens are stored separately
- Session expiry is tracked independently

### Storage Keys

The following keys are used in localStorage:

- `tripzz-accounts`: Array of account metadata
- `tripzz-active-account`: ID of the currently active account
- `sb-<project>-auth-token-account-<userId>`: Session data for each account

### Page Reload on Switch

When switching accounts, the page automatically reloads to ensure all components fetch data with the new session context. This prevents stale data from being displayed.

### Session Expiry

If an account's session expires, it will be automatically removed from the account list when attempting to switch to it.

## Integration

### Adding the Account Switcher to Your Layout

```tsx
import { AccountSwitcher } from '@/components/account-switcher'

export default function Layout({ children }) {
  return (
    <div>
      <header>
        <nav>
          {/* Your navigation */}
          <AccountSwitcher />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
```

### Customizing the Account Switcher

The `AccountSwitcher` component can be styled using Tailwind classes and customized to match your design system. It uses shadcn/ui components (DropdownMenu, Avatar, Button) which can be themed.

## Troubleshooting

### Account Not Switching

- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set correctly
- Check browser console for errors
- Verify the account session hasn't expired

### Sessions Lost After Refresh

- Ensure `persistSession: true` in Supabase client config
- Check localStorage isn't being cleared by browser settings
- Verify custom storage adapter is properly initialized

### RLS Policy Issues

When using multiple accounts with Row Level Security:
- Ensure RLS policies properly check `auth.uid()`
- The `uid()` will automatically reflect the active account
- Test policies with different accounts to ensure isolation

## Security Considerations

- Sessions are stored in localStorage (browser-specific)
- Each session has its own access/refresh token
- Logging out an account removes its tokens from storage
- Switching accounts doesn't expose one account's data to another
- All standard Supabase security features remain active

## Future Enhancements

Potential improvements:
- Account avatars fetched from profile
- Last active timestamp display
- Account nicknames/labels
- Quick switch keyboard shortcuts
- Account session health indicators
- Notification badges per account
