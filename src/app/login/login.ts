import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private keycloakService: KeycloakService
  ) {}

  async login() {
    if (!this.username || !this.password) {
      alert('Veuillez entrer vos identifiants');
      return;
    }

    this.loading = true;

    try {
      // 🔹 Connexion avec username/password (Direct Grant)
      const success = await this.keycloakService.loginWithCredentials(
        this.username,
        this.password
      );

      if (success) {
        // 🔹 Récupérer les rôles depuis le token (realm_access.roles)
        const roles = this.keycloakService.getUserRoles() || [];
        console.log('Roles utilisateur depuis token:', roles);

        // 🔹 Filtrer les rôles pour SuperAdmin
        const filteredRoles = roles.includes('SuperAdmin') ? ['SuperAdmin'] : roles;

        // 🔹 Redirection selon rôle exact présent dans le token
        if (filteredRoles.includes('SuperAdmin')) {
          this.router.navigate(['/users']); // SuperAdmin → gestion users uniquement
        } 
        else if (filteredRoles.includes('Gestionnairedesprocessusmetier')) {
          this.router.navigate(['/processus']); // gestion processus
        } 
        else if (filteredRoles.includes('Gestionnairedesréglesmetier')) {
          this.router.navigate(['/regles']); // gestion règles
        } 
        else {
          this.router.navigate(['/dashboard']); // rôle inconnu → dashboard
        }

      } else {
        alert('Identifiants incorrects');
      }

    } catch (err) {
      console.error('Erreur login:', err);
      alert('Erreur lors de la connexion');
    } finally {
      this.loading = false;
    }
  }
}