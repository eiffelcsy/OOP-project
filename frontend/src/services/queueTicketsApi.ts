import { apiClient } from '@/lib/api'

export interface QueueTicketResponse {
  id: number
  queue_id: number
  appointment_id: number | null
  patient_name?: string | null // Patient's full name from profiles
  ticket_number: number
  priority: number | null // 0=Normal, 1=Fast-Track
  ticket_status: string | null // waiting|called|completed|no_show|...
  called_at: string | null
  completed_at: string | null
  no_show_at: string | null
  created_at: string | null
  updated_at: string | null
}

export type CreateQueueTicketRequest = {
  queue_id: number
  appointment_id: number
  ticket_number: number
  priority: number // 0 or 1
  ticket_status: string // e.g. 'Checked In'
  called_at: string | null
  completed_at: string | null
  no_show_at: string | null
}

export const queueTicketsApi = {
  async list(queueId: number): Promise<QueueTicketResponse[]> {
    return apiClient.get(`/api/staff/queues/${queueId}/tickets`)
  },

  async create(payload: CreateQueueTicketRequest): Promise<QueueTicketResponse> {
    return apiClient.post(`/api/queue-tickets`, payload)
  },

  async update(id: number, payload: Partial<{
    queue_id: number
    appointment_id: number | null
    ticket_number: number
    priority: number | null
    ticket_status: string | null
    called_at: string | null
    completed_at: string | null
    no_show_at: string | null
    expected_updated_at: string | null
  }>): Promise<QueueTicketResponse> {
    return apiClient.put(`/api/queue-tickets/${id}`, payload)
  },
}
