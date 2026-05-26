import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { KeycloakService } from '../../core/services/keycloak.service';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];

  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  error = '';
  isAdminUser = false;

  currentPage = 1;
  pageSize = 3;
  totalPages = 1;
  pages: number[] = [];

  // ── Modal détail (Voir)
  selectedUser: User | null = null;
  showModal = false;

  // ── Modal formulaire (Ajouter / Modifier)
  showFormModal = false;
  formMode: 'create' | 'edit' = 'create';
  savingForm = false;
  formErrors: Record<string, string> = {};

  formUser = {
    username:  '',
    email:     '',
    firstName: '',
    lastName:  '',
    password:  '',
    roles:     [] as string[],
    active:    true
  };

  // Toast global (liste)
  toastMsg = '';
  toastError = false;
  toastVisible = false;

  readonly availableRoles = [
    { value: 'SuperAdmin',                            label: 'Super Admin' },
    { value: 'Gestionnaire des processus metier',     label: 'Gestionnaire Processus' },
    { value: "Gestionnaire des règles métier",        label: 'Gestionnaire Règles' }
  ];

  constructor(
    private keycloakService: KeycloakService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isAdminUser = this.checkAdminRoles();
    this.loadUsers();
  }

  // ── Chargement ──────────────────────────────────────────────
  loadUsers(): void {
    this.userService.getKeycloakUsers().subscribe({
      next: (data: User[]) => {
        this.users = (data || []).map(user => ({
          ...user,
          firstName: user.firstName ?? '',
          lastName:  user.lastName ?? '',
          roles: (user.roles || []).filter(r =>
            r && !r.startsWith('default-roles') &&
            r !== 'offline_access' && r !== 'uma_authorization'
          ),
          active: user.active ?? true
        }));
        this.filteredUsers = [...this.users];
        this.updatePagination();
      },
      error: () => this.loadUsersFallback()
    });
  }

  loadUsersFallback(): void {
    this.userService.getUsers().subscribe({
      next: (data: User[]) => {
        this.users = data || [];
        this.filteredUsers = [...this.users];
        this.updatePagination();
      },
      error: () => this.error = 'Erreur chargement utilisateurs'
    });
  }

  // ── Pagination ──────────────────────────────────────────────
  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedUsers();
  }

  // ── Filtrage ────────────────────────────────────────────────
  filterUsers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(u => {
      const matchSearch =
        u.username.toLowerCase().includes(term) ||
        (u.email?.toLowerCase().includes(term) ?? false);
      const matchRole =
        !this.selectedRole ||
        (u.roles && u.roles.some(r => r.toLowerCase().includes(this.selectedRole.toLowerCase())));
      const matchStatus =
        !this.selectedStatus ||
        (this.selectedStatus === 'active' && u.active) ||
        (this.selectedStatus === 'inactive' && !u.active);
      return matchSearch && matchRole && matchStatus;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  checkAdminRoles(): boolean {
    return ['SuperAdmin', 'Gestionnaire des processus metier', 'Gestionnaire des règles métier']
      .some(r => this.keycloakService.isUserInRole(r));
  }

  // ── Modal Détail ────────────────────────────────────────────
  openDetails(user: User): void {
    this.selectedUser = user;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // ── Modal Formulaire : Ajouter ──────────────────────────────
  openCreateModal(): void {
    this.formUser = { username: '', email: '', firstName: '', lastName: '', password: '', roles: [], active: true };
    this.formErrors = {};
    this.formMode = 'create';
    this.showFormModal = true;
  }

  // ── Modal Formulaire : Modifier ─────────────────────────────
  openEditModal(user: User): void {
    this.formUser = {
      username:  user.username,
      email:     user.email || '',
      firstName: user.firstName || '',
      lastName:  user.lastName || '',
      password:  '',
      roles:     [...(user.roles || [])],
      active:    user.active ?? true
    };
    this.formErrors = {};
    this.formMode = 'edit';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
  }

  // ── Rôles (checkboxes) ──────────────────────────────────────
  toggleFormRole(role: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.formUser.roles.includes(role)) this.formUser.roles.push(role);
    } else {
      this.formUser.roles = this.formUser.roles.filter(r => r !== role);
    }
  }

  // ── Validation ──────────────────────────────────────────────
  private validateForm(): boolean {
    this.formErrors = {};
    if (!this.formUser.username?.trim())
      this.formErrors['username'] = 'Ce champ est obligatoire';
    if (!this.formUser.email?.trim())
      this.formErrors['email'] = 'Ce champ est obligatoire';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formUser.email))
      this.formErrors['email'] = 'Adresse email invalide';
    if (!this.formUser.firstName?.trim())
      this.formErrors['firstName'] = 'Ce champ est obligatoire';
    if (!this.formUser.lastName?.trim())
      this.formErrors['lastName'] = 'Ce champ est obligatoire';
    if (this.formMode === 'create' && !this.formUser.password?.trim())
      this.formErrors['password'] = 'Ce champ est obligatoire';
    return Object.keys(this.formErrors).length === 0;
  }

  // ── Soumission ──────────────────────────────────────────────
  submitForm(): void {
    if (!this.validateForm() || this.savingForm) return;
    this.savingForm = true;

    if (this.formMode === 'create') {
      this.userService.createUser(this.formUser).subscribe({
        next: () => {
          this.savingForm = false;
          this.closeFormModal();
          this.showToast('Utilisateur créé avec succès !');
          this.loadUsers();
        },
        error: (err: any) => {
          this.savingForm = false;
          this.formErrors['global'] = err?.status === 409
            ? 'Cet identifiant existe déjà'
            : 'Erreur lors de la création';
        }
      });
    } else {
      this.userService.updateUser(this.formUser.username, this.formUser).subscribe({
        next: () => {
          this.savingForm = false;
          this.closeFormModal();
          this.showToast('Utilisateur modifié avec succès !');
          this.loadUsers();
        },
        error: () => {
          this.savingForm = false;
          this.formErrors['global'] = 'Erreur lors de la modification';
        }
      });
    }
  }

  // ── Suppression ─────────────────────────────────────────────
  deleteUser(user: User): void {
    if (!confirm(`Supprimer ${user.username} ?`)) return;
    this.userService.deleteUser(user.username).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.username !== user.username);
        this.filteredUsers = this.filteredUsers.filter(u => u.username !== user.username);
        this.updatePagination();
        this.showToast('Utilisateur supprimé.');
      },
      error: () => this.loadUsers()
    });
  }

  // ── Toggle Actif ────────────────────────────────────────────
  toggleUserActive(user: User): void {
    const newStatus = !user.active;
    this.userService.toggleUserActive(user.username, newStatus).subscribe({
      next: () => {
        this.users = this.users.map(u =>
          u.username === user.username ? { ...u, active: newStatus } : u
        );
        this.filterUsers();
      },
      error: () => console.error('Erreur toggle actif')
    });
  }

  // ── Toast global ────────────────────────────────────────────
  showToast(msg: string, isError = false): void {
    this.toastMsg = msg;
    this.toastError = isError;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; }, 3500);
  }

  trackByUsername(index: number, user: User): string {
    return user.username;
  }
}
