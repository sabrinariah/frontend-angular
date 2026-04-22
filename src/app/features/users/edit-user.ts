import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user.html',
  styleUrls: ['./edit-user.scss']
})
export class EditUserComponent implements OnInit {

  username!: string;
  saving = false;
  toastVisible = false;
  toastMessage = '';
  toastError = false;

  // ✅ USER AVEC PLUSIEURS RÔLES
  user: any = {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    roles: [] as string[], // ✅ IMPORTANT
    active: true
  };

  // ✅ Rôles disponibles
  availableRoles = [
    { value: 'SuperAdmin', label: 'Super Admin', color: '#534AB7' },
    { value: 'Gestionnaire des processus metier', label: 'Gestionnaire Processus', color: '#1D9E75' }
  ];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const usernameParam = this.route.snapshot.paramMap.get('username');
    if (usernameParam) {
      this.username = usernameParam;
      this.loadUser();
    }
  }

  // ✅ Charger utilisateur
  loadUser(): void {
    this.userService.getUserByUsername(this.username).subscribe({
      next: (data: any) => {
        console.log('USER BACKEND =>', data);

        this.user = {
          username: data.username || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          roles: data.roles || [], // ✅ CORRECT
          active: data.active ?? true
        };
      },
      error: (err) => {
        console.error('Erreur récupération utilisateur :', err);
        this.showToast('Impossible de récupérer l’utilisateur', true);
      }
    });
  }

  // ✅ Modifier utilisateur
  onSubmit(): void {
    this.saving = true;

    const payload = {
      username: this.user.username,
      email: this.user.email,
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      roles: this.user.roles, // ✅ IMPORTANT
      active: this.user.active
    };

    console.log('DATA SENT =>', payload);

    this.userService.updateUser(this.username, payload).subscribe({
      next: () => {
        this.saving = false;
        this.showToast('Utilisateur modifié avec succès');
        this.loadUser();
      },
      error: (err) => {
        this.saving = false;
        console.error('Erreur modification utilisateur :', err);
        this.showToast('Erreur lors de la modification', true);
      }
    });
  }

  // ✅ Toggle role
  toggleRole(role: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (!this.user.roles) {
      this.user.roles = [];
    }

    if (checked) {
      if (!this.user.roles.includes(role)) {
        this.user.roles.push(role);
      }
    } else {
      this.user.roles = this.user.roles.filter((r: string) => r !== role);
    }

    console.log('ROLES =>', this.user.roles);
  }

  // ✅ Reload
  recharger(): void {
    this.loadUser();
  }

  // ✅ Cancel
  cancel(): void {
    this.router.navigate(['/users']);
  }

  // ✅ Toast
  showToast(message: string, isError = false): void {
    this.toastMessage = message;
    this.toastError = isError;
    this.toastVisible = true;

    setTimeout(() => {
      this.toastVisible = false;
    }, 3000);
  }
   goBack() {
    this.router.navigate(['/users']);
  }
}