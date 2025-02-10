import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Session {
  id: number;
  datetime: string;
  duration: number;
  status: 'available' | 'booked' | 'cancelled';
  clientId: number;
  therapistId: number;
  feedback?: string; // Add this line
  therapist: {
    id: number;
    name: string;
    surname: string;
  }
}

interface SessionResponse {
  success: string;
  data: {
    sessions: Session[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private apiUrl = `${environment.apiUrl}/sessions`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getSessions(): Observable<Session[]> {
    const response = this.http.get<SessionResponse>(this.apiUrl, {
      headers: this.getHeaders()
    });
    return response.pipe(map(res => res.data.sessions));
  }

  cancelSession(sessionId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${sessionId}/cancel`, {} ,{
      headers: this.getHeaders()
    });
  }

  createSlot(slotData: { therapistId: number, datetime: number; duration: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}`, slotData, {
      headers: this.getHeaders()
    });
  }

  getAvailableSessions(): Observable<Session[]> {
    const response = this.http.get<SessionResponse>(`${this.apiUrl}/available`, {
      headers: this.getHeaders()
    });
    return response.pipe(map(res => res.data.sessions));
  }

  bookSession(sessionId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${sessionId}/book`, {}, {
      headers: this.getHeaders()
    });
  }

  rescheduleSession(sessionId: number, datetime: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${sessionId}/reschedule`, { datetime }, {
      headers: this.getHeaders()
    });
  }

  postFeedback(sessionId: number, feedback: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${sessionId}/feedback`, { feedback }, {
      headers: this.getHeaders()
    });
  }

  // Add more methods for booking new sessions, etc.
}
