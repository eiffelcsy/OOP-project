import { supabase } from '@/lib/supabase'

/**
 * Staff API Service
 * Handles staff-related operations
 */

export interface StaffInfo {
    id: number
    user_id: string
    clinic_id: number
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    role: string | null
    created_at: string
    updated_at: string
}

/**
 * Get the clinic_id for the currently authenticated user
 * @returns The clinic_id of the authenticated staff member
 * @throws Error if user is not authenticated or not found in staff table
 */
export async function getCurrentUserClinicId(): Promise<number> {
    // Get the authenticated user's ID
    const { data: { session } } = await supabase.auth.getSession()

    if (!session || !session.user) {
        throw new Error('User is not authenticated')
    }

    const userId = session.user.id

    // Query the staff table to get the clinic_id for this user
    const { data: staff, error } = await supabase
        .from('staff')
        .select('clinic_id')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching staff info:', error)
        throw new Error(`Failed to fetch staff information: ${error.message}`)
    }

    if (!staff) {
        throw new Error('User is not associated with any staff record')
    }

    if (staff.clinic_id === null || staff.clinic_id === undefined) {
        throw new Error('Staff record does not have a clinic assigned')
    }

    return staff.clinic_id
}

/**
 * Get full staff information for the currently authenticated user
 * @returns The staff record for the authenticated user
 * @throws Error if user is not authenticated or not found in staff table
 */
export async function getCurrentUserStaffInfo(): Promise<StaffInfo> {
    // Get the authenticated user's ID
    const { data: { session } } = await supabase.auth.getSession()

    if (!session || !session.user) {
        throw new Error('User is not authenticated')
    }

    const userId = session.user.id

    // Query the staff table to get the full staff info
    const { data: staff, error } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching staff info:', error)
        throw new Error(`Failed to fetch staff information: ${error.message}`)
    }

    if (!staff) {
        throw new Error('User is not associated with any staff record')
    }

    return staff as StaffInfo
}

export const staffApi = {
    getCurrentUserClinicId,
    getCurrentUserStaffInfo
}
