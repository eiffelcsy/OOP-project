# BookAppointments (Patients)
1. GET /api/patient/clinics - Fetch all clinics
2. GET /api/patient/clinics/:id/doctors - Fetch doctors for a specific clinic
3. GET /api/patient/doctors/:id/available-slots?date=YYYY-MM-DD - Fetch available time slots
4. POST /api/patient/appointments - Create a new appointment booking

# ViewAppointments (Patients)

# ViewAppointments (Staff)
1. GET /api/staff/appointments

# ScheduleWalkIn (Staff)
2. POST /api/staff/appointments

# ManagementAppointments (Staff)
3. PUT /api/staff/appointments/:id
4. DELETE /api/staff/appointments/:id
