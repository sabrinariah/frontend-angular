import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  // LOGIN
  username = '';
  password = '';
  loading = false;
  loginError = '';

  // REGISTER MODAL
  showRegisterModal = false;
  firstName = '';
  lastName = '';
  email = '';
  regPassword = '';
  confirmPassword = '';
  selectedRole = 'Gestionnairedesprocessusmetier';
  registerLoading = false;
  registerError = '';
  registerSuccess = '';

  // FORGOT PASSWORD MODAL
  showForgotModal = false;
  forgotEmail = '';
  forgotLoading = false;
  forgotSuccess = '';
  forgotError = '';

  availableRoles = [
    { value: 'Gestionnairedesprocessusmetier', label: 'Gestionnaire des processus métier' },
    { value: 'Gestionnairedesréglesmetier',    label: 'Gestionnaire des règles métier' }
  ];

  constructor(
    private router: Router,
    private keycloakService: KeycloakService
  ) {}

  // ─────────────── LOGIN ───────────────
  async login() {
    if (!this.username || !this.password) {
      this.loginError = 'Veuillez entrer vos identifiants';
      return;
    }

    this.loading = true;
    this.loginError = '';

    try {
      const success = await this.keycloakService.loginWithCredentials(
        this.username, this.password
      );

      if (success) {
        const roles = this.keycloakService.getUserRoles();

        if (roles.includes('SuperAdmin')) {
          this.router.navigate(['/users']);
        } else if (roles.includes('Gestionnairedesprocessusmetier')) {
          this.router.navigate(['/processus']);
        } else if (roles.includes('Gestionnairedesréglesmetier')) {
          this.router.navigate(['/regles']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.loginError = 'Identifiants incorrects';
      }
    } catch (err) {
      this.loginError = 'Erreur lors de la connexion';
    } finally {
      this.loading = false;
    }
  }

  // ─────────────── REGISTER ───────────────
  openRegister()  { this.showRegisterModal = true; }
  closeRegister() {
    this.showRegisterModal = false;
    this.registerError = '';
    this.registerSuccess = '';
  }

  passwordsMatch(): boolean {
    return this.regPassword === this.confirmPassword;
  }

  async registerUser() {
    if (!this.firstName || !this.lastName || !this.email || !this.regPassword) {
      this.registerError = 'Veuillez remplir tous les champs';
      return;
    }
    if (!this.passwordsMatch()) {
      this.registerError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.registerLoading = true;
    this.registerError = '';

    try {
      const success = await this.keycloakService.registerUser({
        username:  this.email,
        email:     this.email,
        firstName: this.firstName,
        lastName:  this.lastName,
        password:  this.regPassword,
        roles:     [this.selectedRole]
      });

      if (success) {
        this.registerSuccess = 'Compte créé avec succès !';
        setTimeout(() => this.closeRegister(), 1500);
      } else {
        this.registerError = 'Erreur lors de la création du compte';
      }
    } catch (err) {
      this.registerError = 'Erreur serveur';
    } finally {
      this.registerLoading = false;
    }
  }

  // ─────────────── FORGOT PASSWORD ───────────────
  openForgot()  { this.showForgotModal = true; }
  closeForgot() {
    this.showForgotModal = false;
    this.forgotEmail = '';
    this.forgotSuccess = '';
    this.forgotError = '';
  }

  async sendForgotPassword() {
    if (!this.forgotEmail.trim()) {
      this.forgotError = 'Veuillez saisir votre email';
      return;
    }

    this.forgotLoading = true;
    this.forgotError = '';

    try {
      await this.keycloakService.forgotPassword(this.forgotEmail);
      this.forgotSuccess = 'Si cet email existe, un lien vous a été envoyé.';
    } catch (err) {
      this.forgotError = 'Erreur lors de l\'envoi';
    } finally {
      this.forgotLoading = false;
    }
  }
  getRegStrength(): 'weak' | 'medium' | 'strong' {
  let score = 0;
  const p = this.regPassword;
  if (p.length >= 8)           score++;
  if (/[A-Z]/.test(p))         score++;
  if (/[a-z]/.test(p))         score++;
  if (/[0-9]/.test(p))         score++;
  if (/[^A-Za-z0-9]/.test(p))  score++;
  if (score <= 2) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}
}