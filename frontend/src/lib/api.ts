import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Cache the token in memory to avoid repeated getSession calls
let cachedToken: string | null = null
let tokenExpiry: number = 0

export const apiClient = {
  async ensureToken(): Promise<string> {
    // Check if we have a valid cached token
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken
    }

    // Try to get a token from localStorage directly (faster than getSession)
    let token = this.getTokenFromLocalStorage()
    
    if (!token) {
      // If no token in localStorage, try refreshing the session
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) throw error
        token = data.session?.access_token || null
        
        // Cache the token with expiry (tokens typically last 1 hour, cache for 50 minutes)
        if (token) {
          cachedToken = token
          tokenExpiry = Date.now() + 50 * 60 * 1000 // 50 minutes
        }
      } catch {
        // ignore and fall through
      }
    } else {
      // Cache the token from localStorage
      cachedToken = token
      tokenExpiry = Date.now() + 50 * 60 * 1000 // 50 minutes
    }

    if (!token) {
      throw new Error('User not authenticated. Please sign in again.')
    }
    return token
  },

  // Clear token cache when user logs out or token becomes invalid
  clearTokenCache(): void {
    cachedToken = null
    tokenExpiry = 0
  },
  async get(endpoint: string) {
    const token = await this.ensureToken()
    const doFetch = async (bearer: string) => fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Content-Type': 'application/json'
      }
    })
    let response = await doFetch(token)
    if (response.status === 401 || response.status === 403) {
      // Clear cached token and try to get a fresh one
      this.clearTokenCache()
      const retryToken = await this.ensureToken()
      response = await doFetch(retryToken)
    }
    
    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (e) {
        // If response body is not JSON, use default message
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  },

  async post(endpoint: string, data: any) {
    const token = await this.ensureToken()
    const doFetch = async (bearer: string) => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    let response = await doFetch(token)
    if (response.status === 401 || response.status === 403) {
      // Clear cached token and try to get a fresh one
      this.clearTokenCache()
      const retryToken = await this.ensureToken()
      response = await doFetch(retryToken)
    }
    
    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (e) {
        // If response body is not JSON, use default message
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  },

  async put(endpoint: string, data: any) {
    const token = await this.ensureToken()
    const doFetch = async (bearer: string) => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    let response = await doFetch(token)
    if (response.status === 401 || response.status === 403) {
      // Clear cached token and try to get a fresh one
      this.clearTokenCache()
      const retryToken = await this.ensureToken()
      response = await doFetch(retryToken)
    }
    
    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (e) {
        // If response body is not JSON, use default message
      }
      throw new Error(errorMessage)
    }
    
    return response.json()
  },

  async delete(endpoint: string) {
    const token = await this.ensureToken()
    const doFetch = async (bearer: string) => fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${bearer}`,
        'Content-Type': 'application/json'
      }
    })
    let response = await doFetch(token)
    if (response.status === 401 || response.status === 403) {
      // Clear cached token and try to get a fresh one
      this.clearTokenCache()
      const retryToken = await this.ensureToken()
      response = await doFetch(retryToken)
    }
    
    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } catch (e) {
        // If response body is not JSON, use default message
      }
      throw new Error(errorMessage)
    }
    
    // DELETE may return no content
    if (response.status === 204) {
      return null
    }
    
    return response.json()
  },

  getTokenFromLocalStorage(): string | null {
    // Read session from localStorage directly without async call
    const key = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const data = JSON.parse(item)
      const token = data?.access_token
      
      // Check if token is expired
      const expiresAt = data?.expires_at
      if (expiresAt && expiresAt * 1000 < Date.now()) {
        return null
      }
      
      return token || null
    } catch {
      return null
    }
  },

  async getToken(): Promise<string | null> {
    // Use cached token if available
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken
    }
    
    // Otherwise try localStorage first (synchronous, fast)
    const localToken = this.getTokenFromLocalStorage()
    if (localToken) {
      cachedToken = localToken
      tokenExpiry = Date.now() + 50 * 60 * 1000
      return localToken
    }
    
    // Last resort: call getSession (this can hang)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || null
    if (token) {
      cachedToken = token
      tokenExpiry = Date.now() + 50 * 60 * 1000
    }
    return token
  }
}