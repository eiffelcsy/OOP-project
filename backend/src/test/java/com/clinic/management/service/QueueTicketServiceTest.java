package com.clinic.management.service;

import com.clinic.management.dto.request.CreateQueueTicketRequest;
import com.clinic.management.dto.request.UpdateQueueTicketRequest;
import com.clinic.management.exception.CustomExceptions.*;
import com.clinic.management.model.Queue;
import com.clinic.management.model.QueueTicket;
import com.clinic.management.repository.AppointmentRepository;
import com.clinic.management.repository.PatientRepository;
import com.clinic.management.repository.QueueRepository;
import com.clinic.management.repository.QueueTicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueueTicketServiceTest {

    @Mock private QueueTicketRepository queueTicketRepository;
    @Mock private QueueRepository queueRepository;
    @Mock private AppointmentRepository appointmentRepository;
    @Mock private PatientRepository patientRepository;

    @InjectMocks private QueueTicketService service;

    private Queue existingQueue;

    @BeforeEach
    void setup() {
        existingQueue = new Queue();
        existingQueue.setId(123L);
    }

    @Test
    void create_withMinimalFields_savesWithDefaults() {
        // arrange
        when(queueRepository.findById(123L)).thenReturn(Optional.of(existingQueue));
        ArgumentCaptor<QueueTicket> captor = ArgumentCaptor.forClass(QueueTicket.class);
        when(queueTicketRepository.save(any(QueueTicket.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateQueueTicketRequest req = new CreateQueueTicketRequest();
        req.setQueueId(123L);
        req.setTicketNumber(42);

        // act
        QueueTicket result = service.create(req);

        // assert
        verify(queueTicketRepository).save(captor.capture());
        QueueTicket saved = captor.getValue();
        assertThat(saved.getQueue()).isEqualTo(existingQueue);
        assertThat(saved.getTicketNumber()).isEqualTo(42);
        assertThat(saved.getPriority()).isEqualTo((short) 0);
        assertThat(saved.getTicketStatus()).isEqualTo("waiting");
        // and returned instance mirrors saved
        assertThat(result.getTicketNumber()).isEqualTo(42);
    }

    // Read tests removed: backend no longer supports reading queue tickets; frontend reads via Supabase.

    @Test
    void update_withTimestampMismatch_throwsOptimisticLock() {
        QueueTicket existing = new QueueTicket();
        existing.setId(10L);
        existing.setUpdatedAt(OffsetDateTime.now());
        when(queueTicketRepository.findById(10L)).thenReturn(Optional.of(existing));

    UpdateQueueTicketRequest req = new UpdateQueueTicketRequest();
    // include at least one field update so hasUpdates() is true
    req.setTicketStatus("called");
    // set an expected time that's different
    req.setExpectedUpdatedAt(existing.getUpdatedAt().minusMinutes(5));

        assertThrows(OptimisticLockException.class, () -> service.update(10L, req));
        verify(queueTicketRepository, never()).save(any());
    }

    @Test
    void delete_whenNotExists_throwsNotFound() {
        when(queueTicketRepository.existsById(777L)).thenReturn(false);
        assertThrows(NotFoundException.class, () -> service.delete(777L));
        verify(queueTicketRepository, never()).deleteById(anyLong());
    }

    @Test
    void delete_whenExists_callsRepository() {
        when(queueTicketRepository.existsById(5L)).thenReturn(true);
        service.delete(5L);
        verify(queueTicketRepository).deleteById(5L);
    }
}
