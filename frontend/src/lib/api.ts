import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const apiClient = {
  async ensureToken(): Promise<string> {
    // Try to get a valid token; if missing, attempt a refresh once
    let token = await this.getToken()
    if (token) return token
    try {
      // Attempt to refresh the session
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error
      token = data.session?.access_token || null
    } catch {
      // ignore and fall through
    }
    if (!token) {
      throw new Error('User not authenticated. Please sign in again.')
    }
    return token
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

  async getToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }
}