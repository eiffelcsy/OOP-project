import { apiClient } from '@/lib/api'

/**
 * Queue API Service
 * Handles all HTTP requests to the Queue backend endpoints
 */

// Queue API request/response types
export interface CreateQueueRequest {
  clinic_id: number
  queue_status?: 'ACTIVE' | 'PAUSED' | 'CLOSED'
}

export interface UpdateQueueRequest {
  clinic_id?: number
  queue_status?: 'ACTIVE' | 'PAUSED' | 'CLOSED'
  expected_updated_at?: number // Unix timestamp for optimistic locking
}

// Note: Backend uses Jackson SNAKE_CASE for JSON; responses are snake_case.
export interface QueueResponse {
  id: number
  clinic_id: number
  clinic_name: string | null
  queue_status: 'ACTIVE' | 'PAUSED' | 'CLOSED'
  created_at: number // Unix timestamp from backend
  updated_at: number // Unix timestamp from backend
}

export interface ListQueuesOptions {
  page?: number
  size?: number
  // Backend expects snake_case sort fields in query params
  sortBy?: 'created_at' | 'updated_at' | 'id'
  sortDir?: 'ASC' | 'DESC'
  clinicId?: number
  statuses?: ('ACTIVE' | 'PAUSED' | 'CLOSED')[]
  includeCount?: boolean
}

export interface ListResult<T> {
  data: T[]
  count?: number
}

/**
 * Queue API client
 */
export const queueApi = {
  /**
   * Create a new queue
   * POST /api/queues
   */
  async createQueue(request: CreateQueueRequest): Promise<QueueResponse> {
    return apiClient.post('/api/queues', request)
  },

  /**
   * Get queue by ID
   * GET /api/queues/{id}
   */
  async getQueueById(id: number): Promise<QueueResponse> {
    return apiClient.get(`/api/queues/${id}`)
  },

  /**
   * List queues with filters
   * GET /api/queues
   */
  async listQueues(options?: ListQueuesOptions): Promise<ListResult<QueueResponse>> {
    const params = new URLSearchParams()
    
    if (options?.page !== undefined) params.append('page', options.page.toString())
    if (options?.size !== undefined) params.append('size', options.size.toString())
    if (options?.sortBy) params.append('sortBy', options.sortBy)
    if (options?.sortDir) params.append('sortDir', options.sortDir)
    if (options?.clinicId !== undefined) params.append('clinicId', options.clinicId.toString())
    if (options?.statuses && options.statuses.length > 0) {
      params.append('statuses', options.statuses.join(','))
    }
    if (options?.includeCount !== undefined) {
      params.append('includeCount', options.includeCount.toString())
    }
    
    const queryString = params.toString()
    const endpoint = queryString ? `/api/queues?${queryString}` : '/api/queues'
    
    return apiClient.get(endpoint)
  },

  /**
   * Update an existing queue
   * PUT /api/queues/{id}
   */
  async updateQueue(id: number, request: UpdateQueueRequest): Promise<QueueResponse> {
    // Request is already in snake_case, no conversion needed
    return apiClient.put(`/api/queues/${id}`, request)
  },

  /**
   * Delete a queue
   * DELETE /api/queues/{id}
   */
  async deleteQueue(id: number): Promise<void> {
    return apiClient.delete(`/api/queues/${id}`)
  },

  /**
   * Get active queue for a specific clinic
   * Helper method to find the current active queue
   */
  async getActiveQueueByClinicId(clinicId: number): Promise<QueueResponse | null> {
    const result = await this.listQueues({
      clinicId,
      statuses: ['ACTIVE'],
      size: 1,
      sortBy: 'created_at',
      sortDir: 'DESC'
    })
    
    return result.data.length > 0 ? result.data[0] : null
  }
}
