import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Session, SessionService } from '../services/session.service';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class DashboardComponent implements OnInit {
  private datePipe = new DatePipe('en-CA');
  sessions: Session[] = [];
  isLoading = true;
  activeTab: 'upcoming' | 'past' = 'upcoming';
  minDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

  userRole: string;
  createSlotForm: FormGroup;
  showCreateSlotModal = false;

  availableSessions: Session[] = [];
  showBookingModal = false;
  isLoadingAvailable = false;

  feedbackForm: FormGroup;
  selectedSession: Session | null = null;
  showFeedbackModal = false;

  rescheduleForm: FormGroup;
  showRescheduleModal = false;

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.userRole = this.authService.currentUserValue.role;
    this.createSlotForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      duration: [60, [Validators.required, Validators.min(30), Validators.max(120)]]
    });
    this.feedbackForm = this.fb.group({
      feedback: ['', [Validators.required, Validators.minLength(3)]]
    });
    this.rescheduleForm = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadSessions();
  }

  formatSessionDateTime(utcDateTime: string): string {
    const localDate = new Date(utcDateTime);
    return this.datePipe.transform(localDate, 'MMM d, y h:mm a') || '';
  }

  get filteredSessions() {
    const now = new Date();
    return this.sessions
      .filter(session => {
        const sessionDate = new Date(session.datetime);
        return this.activeTab === 'upcoming'
          ? sessionDate >= now
          : sessionDate < now;
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }

  async loadSessions() {
    try {
      this.sessions = await firstValueFrom(this.sessionService.getSessions());
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loadAvailableSessions() {
    this.isLoadingAvailable = true;
    try {
      this.availableSessions = await firstValueFrom(this.sessionService.getAvailableSessions());
    } catch (error) {
      console.error('Error loading available sessions:', error);
    } finally {
      this.isLoadingAvailable = false;
    }
  }

  canCancelSession(session: Session): boolean {
    const sessionDate = new Date(session.datetime);
    const now = new Date();
    // Allow cancellation only for future sessions that are not already cancelled
    return sessionDate > now && session.status !== 'cancelled';
  }

  async cancelSession(sessionId: number) {
    if (confirm('Are you sure you want to cancel this session?')) {
      try {
        await this.sessionService.cancelSession(sessionId).toPromise();
        await this.loadSessions(); // Reload the sessions list
      } catch (error) {
        console.error('Error cancelling session:', error);
      }
    }
  }

  openBookingModal() {
    this.showBookingModal = true;
    this.loadAvailableSessions();
  }

  closeBookingModal() {
    this.showBookingModal = false;
  }

  async bookSession(sessionId: number) {
    try {
      await firstValueFrom(this.sessionService.bookSession(sessionId));
      await this.loadSessions(); // Reload main sessions list
      this.closeBookingModal();
    } catch (error) {
      console.error('Error booking session:', error);
    }
  }

  openCreateSlotModal() {
    this.showCreateSlotModal = true;
  }

  closeCreateSlotModal() {
    this.showCreateSlotModal = false;
    this.createSlotForm.reset({duration: 60});
  }

  async onCreateSlot() {
    if (this.createSlotForm.valid) {
      const formValue = this.createSlotForm.value;
      const datetime = (new Date(`${formValue.date}T${formValue.time}`).getTime() / 1000);

      try {
        await firstValueFrom(this.sessionService.createSlot({
          therapistId: this.authService.currentUserValue.id,
          datetime,
          duration: formValue.duration
        }));
        this.closeCreateSlotModal();
        await this.loadSessions(); // Reload sessions list
      } catch (error) {
        console.error('Error creating slot:', error);
      }
    }
  }

  openFeedbackModal(session: Session) {
    this.selectedSession = session;
    this.showFeedbackModal = true;
    this.feedbackForm.reset();
  }

  closeFeedbackModal() {
    this.showFeedbackModal = false;
    this.selectedSession = null;
  }

  async submitFeedback() {
    if (this.feedbackForm.valid && this.selectedSession) {
      try {
        await firstValueFrom(this.sessionService.postFeedback(
          this.selectedSession.id,
          this.feedbackForm.value.feedback
        ));
        await this.loadSessions(); // Reload to show new feedback
        this.closeFeedbackModal();
      } catch (error) {
        console.error('Error posting feedback:', error);
      }
    }
  }

  canLeaveFeedback(session: Session): boolean {
    const currentTime = new Date();
    const sessionTime = new Date(session.datetime);

    return this.userRole === 'client' &&
           sessionTime < currentTime && // Check if session is in the past
           !session.feedback;
  }

  openRescheduleModal(session: Session) {
    this.selectedSession = session;
    this.showRescheduleModal = true;

    // Set initial form values based on current session datetime
    const sessionDate = new Date(parseInt(session.datetime) * 1000);
    this.rescheduleForm.patchValue({
      date: sessionDate.toISOString().split('T')[0],
      time: sessionDate.toTimeString().split(':').slice(0,2).join(':')
    });
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
    this.selectedSession = null;
    this.rescheduleForm.reset();
  }

  async onReschedule() {
    if (this.rescheduleForm.valid && this.selectedSession) {
      const formValue = this.rescheduleForm.value;
      const newDatetime = (new Date(`${formValue.date}T${formValue.time}`).getTime() / 1000);

      try {
        await firstValueFrom(this.sessionService.rescheduleSession(
          this.selectedSession.id,
          newDatetime
        ));
        await this.loadSessions();
        this.closeRescheduleModal();
      } catch (error) {
        console.error('Error rescheduling session:', error);
      }
    }
  }

  canRescheduleSession(session: Session): boolean {
    if (!session || session.status === 'cancelled') {
      return false;
    }

    const currentTime = new Date();
    const sessionTime = new Date(session.datetime);

    return (this.userRole === 'client' || this.userRole === 'therapist') &&
           sessionTime > currentTime;
  }
}
