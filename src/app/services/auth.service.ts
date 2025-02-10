import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

interface AuthResponse {
  data: {
    token: string;
    user: {
      id: number;
      email: string;
      name: string;
      surname: string;
      role: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/users';
  private tokenKey = 'auth_token';
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient, private router: Router) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromToken());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  register(email: string, password: string, name: string, surname: string, role: string) {
    return this.http.post(`${this.apiUrl}/register`, { email, password, name, surname, role });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(map(response => {
        if (response.data && response.data.token) {
          localStorage.setItem(this.tokenKey, response.data.token);
          this.currentUserSubject.next(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response;
      }));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): Observable<boolean> {
    return of(localStorage.getItem(this.tokenKey) !== null );
  }

  private getUserFromLocalStorage(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  private getUserFromToken(): any {
    const token = this.getToken();
    const user = this.getUserFromLocalStorage();
    if (token && user) {
      try {
        const expiration = JSON.parse(atob(token.split('.')[1])).exp;
        if (expiration < Date.now() / 1000) {
          this.logout();
          return null;
        }
        return user;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
