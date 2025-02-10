import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class RegisterComponent {
  registerForm: any;

  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      givenName: ['', Validators.required],
      surname: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { email, password, givenName, surname, role } = this.registerForm.value;
      this.authService.register(email!, password!, givenName!, surname!, role!).pipe().subscribe((regResponse) => {
        if (regResponse) {
          console.log(regResponse);
          this.successMessage = 'Registration successful! Please login.';
          this.errorMessage = '';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        } else {
          this.errorMessage = 'Email already exists';
          this.successMessage = '';
        }
      });
    }
  }
}
