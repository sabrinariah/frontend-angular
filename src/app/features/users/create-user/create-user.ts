import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.scss'],
})
export class CreateUserComponent {
  username = '';
  email = '';
  firstName = '';
  lastName = '';
  password = '';
  role = '';
  roles = ['SuperAdmin', 'Gestionnaire des processus metier', 'Gestionnaire des réglesmetier'];

  sections = {
    userInfo: true
  };

 private readonly apiUrl = 'http://localhost:8081/api/users/create';

  constructor(private http: HttpClient, private router: Router) {}

  toggleSection(section: 'userInfo') {
    this.sections[section] = !this.sections[section];
  }

  // 🔹 Création de l'utilisateur avec message succès
  createUser() {
    if (!this.username || !this.email || !this.firstName || !this.lastName || !this.password || !this.role) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const user = {
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      password: this.password,
      roles: [this.role]
    };

    this.http.post(this.apiUrl, user, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Utilisateur créé :', response);
        alert('✅ Utilisateur créé avec succès !'); // message clair de succès
        this.resetForm();
        this.router.navigate(['/users']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur HTTP :', err);
        if (err.status === 409) {
          alert('⚠️ Erreur : un utilisateur existe déjà avec ce nom d’utilisateur.');
        } else {
          alert('Erreur lors de la création : ' + (err.error || err.message));
        }
      },
    });
  }

  // 🔹 Réinitialiser le formulaire
  private resetForm() {
    this.username = '';
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.password = '';
    this.role = '';
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}