import { ref, computed, type Ref } from 'vue'
import { appointmentsApi } from '@/services/appointmentsApi'
import { doctorsApi } from '@/services/doctorsApi'
import type { QueueTicketResponse } from '@/services/patientsApi'

interface DoctorAndClinicDetails {
    id: number
    name: string
    clinicId: number | null
    clinicName: string | null
}

export function useQueueDoctors(currentTicket: Ref<QueueTicketResponse[]>) {
    const doctorDetails = ref(new Map<number, DoctorAndClinicDetails>())
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    async function fetchDoctorDetails() {
        console.log('[QueueDoctors] Fetching doctor details for tickets:', currentTicket.value)
        isLoading.value = true
        error.value = null
        doctorDetails.value.clear()

        try {
            for (const ticket of currentTicket.value) {
                try {
                    console.log('[QueueDoctors] Processing ticket:', ticket.id)
                    // Search for appointment to get doctor_id and clinic info
                    const appointments = await appointmentsApi.getPatientAppointments()
                    const appointment = appointments.find(a => a.id === ticket.appointment_id)
                    
                    if (appointment?.doctor_id) {
                        // Search for doctor details using doctor_id
                        const doctor = await doctorsApi.getDoctorById(appointment.doctor_id)
                        doctorDetails.value.set(ticket.id, {
                            id: doctor.id,
                            name: doctor.name,
                            clinicId: appointment.clinic_id || null,
                            clinicName: appointment.clinic_name ?? 'Main Clinic' // Provide default if not included
                        })
                        console.log('[QueueDoctors] Added doctor and clinic details:', {
                            ticketId: ticket.id,
                            doctorId: doctor.id,
                            doctorName: doctor.name,
                            clinicId: appointment.clinic_id,
                            clinicName: appointment.clinic_name
                        })
                    } else {
                        console.warn('[QueueDoctors] No doctor_id found for appointment:', ticket.appointment_id)
                    }
                } catch (e) {
                    console.error('[QueueDoctors] Error fetching details for ticket:', ticket.id, e)
                    error.value = 'Failed to fetch some doctor details'
                }
            }

            // Log final state
            console.log('[QueueDoctors] Completed. Doctor details map:', doctorDetails.value)
        
        } catch (e) {
            console.error('[QueueDoctors] Fatal error:', e)
            error.value = 'Failed to fetch doctor information'
            throw e
        } finally {
            isLoading.value = false
        }
    }

    const getDoctorName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.name ?? 'Not available'
    )

    const getClinicName = computed(() => (ticketId: number) => 
        doctorDetails.value.get(ticketId)?.clinicName ?? 'Clinic info unavailable'
    )

    return {
        doctorDetails,
        isLoading,
        error,
        fetchDoctorDetails,
        getDoctorName,
        getClinicName
    }
}