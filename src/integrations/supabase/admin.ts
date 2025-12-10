import { createClient } from './client'

// This file now only provides type-safe interfaces to call secure Edge Functions
// No service role key is exposed on the client side

export interface AdminOperation {
  operation: string
  data?: any
}

export async function callAdminFunction(functionName: string, operation: AdminOperation) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('Authentication required')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Operation failed')
  }

  return response.json()
}

// Example secure admin functions
export const adminApi = {
  // User management
  getUserData: (userId: string) => callAdminFunction('admin-user-data', { operation: 'get_user', data: { userId } }),
  
  // Analytics
  getUsageStats: (timeRange: string) => callAdminFunction('admin-analytics', { operation: 'usage_stats', data: { timeRange } }),
  
  // System health
  getSystemStatus: () => callAdminFunction('admin-system', { operation: 'status' }),
}