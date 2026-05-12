import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  selectedRole = 'Gestionnaire des processus metier';

  loading = false;
  error = '';
  success = '';

  availableRoles = [
    { value: 'Gestionnaire des processus metier', label: 'Gestionnaire des processus métier' },
    { value: 'Gestionnaire des règles metier',    label: 'Gestionnaire des règles métier' }
  ];

  constructor(
    private router: Router,
    private keycloakService: KeycloakService
  ) {}

  // ✅ VALIDATION
  isFormValid(): boolean {
    return (
      this.firstName.trim().length > 0 &&
      this.lastName.trim().length > 0 &&
      this.email.trim().length > 0 &&
      this.password.length >= 6 &&
      this.password === this.confirmPassword
    );
  }

  // ✅ REGISTER
  async register() {

    if (!this.isFormValid()) {
      this.error = 'Veuillez remplir correctement tous les champs';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    try {

      const success = await this.keycloakService.registerUser({
        username:  this.email,
        email:     this.email,
        firstName: this.firstName,
        lastName:  this.lastName,
        password:  this.password,
        roles:     [this.selectedRole]
      });

      if (success) {
        this.success = 'Compte créé avec succès ! Redirection...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);

      } else {
        this.error = 'Erreur lors de la création du compte';
      }

    } catch (err: any) {
      console.error(err);
      this.error = "Erreur serveur lors de l'inscription";
    } finally {
      this.loading = false;
    }
  }

  // 🔥 PASSWORD STRENGTH
  getPasswordStrength(): 'weak' | 'medium' | 'strong' | '' {

    if (!this.password) return '';

    let score = 0;

    if (this.password.length >= 8) score++;
    if (/[A-Z]/.test(this.password)) score++;
    if (/[a-z]/.test(this.password)) score++;
    if (/[0-9]/.test(this.password)) score++;
    if (/[^A-Za-z0-9]/.test(this.password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  }
getStrengthPercent(): string {
  const s = this.getPasswordStrength();
  if (s === 'weak')   return '33%';
  if (s === 'medium') return '66%';
  if (s === 'strong') return '100%';
  return '0%';
}

getStrengthColor(): string {
  const s = this.getPasswordStrength();
  if (s === 'weak')   return '#E24B4A';
  if (s === 'medium') return '#EF9F27';
  if (s === 'strong') return '#1D9E75';
  return 'transparent';
}

getStrengthLabel(): string {
  const s = this.getPasswordStrength();
  if (s === 'weak')   return 'Mot de passe faible';
  if (s === 'medium') return 'Mot de passe moyen';
  if (s === 'strong') return 'Mot de passe fort';
  return 'Force du mot de passe';
}
  // ✅ PASSWORD MATCH
  passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }
}