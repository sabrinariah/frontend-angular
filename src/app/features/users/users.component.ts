import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

import { KeycloakService } from '../../core/services/keycloak.service';
import { UserService, User } from '../../core/services/user.service';
import { UserDetailComponent } from './user-detail/user-detail';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    UserDetailComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];

  searchTerm = '';
  selectedRole: string = '';
  selectedStatus: string = ''; // 🔥 NEW

  error = '';
  isAdminUser = false;

  currentPage = 1;
  pageSize = 3;

  totalPages = 1;
  pages: number[] = [];

  selectedUser: User | null = null;
  showModal = false;

  constructor(
    private keycloakService: KeycloakService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdminUser = this.checkAdminRoles();
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getKeycloakUsers().subscribe({
      next: (data: User[]) => {

        this.users = (data || []).map(user => {

          const roles: string[] = Array.isArray(user.roles) ? user.roles : [];

          const cleanRoles = roles.filter(r =>
            r &&
            !r.startsWith('default-roles') &&
            r !== 'offline_access' &&
            r !== 'uma_authorization'
          );

          return {
            ...user,
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            roles: cleanRoles,
            active: user.active ?? true
          };
        });

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

  updatePagination(): void {
    this.totalPages = Math.max(
      1,
      Math.ceil(this.filteredUsers.length / this.pageSize)
    );

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

  // 🔥 FILTRAGE GLOBAL
  filterUsers(): void {

    const term = this.searchTerm.toLowerCase();

    this.filteredUsers = this.users.filter(u => {

      const matchSearch =
        u.username.toLowerCase().includes(term) ||
        (u.email?.toLowerCase().includes(term) ?? false);

      const matchRole =
        !this.selectedRole ||
        (u.roles && u.roles.some(r =>
          r.toLowerCase().includes(this.selectedRole.toLowerCase())
        ));

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

  addUser(): void {
    this.router.navigate(['/create-user']);
  }

  editUser(username: string): void {
    this.router.navigate(['/users/edit', username]);
  }

  openDetails(user: User) {
    this.selectedUser = user;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  deleteUser(user: User): void {

    if (!confirm(`Supprimer ${user.username} ?`)) return;

    this.userService.deleteUser(user.username).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.username !== user.username);
        this.filteredUsers = this.filteredUsers.filter(u => u.username !== user.username);
        this.updatePagination();
      },
      error: () => this.loadUsers()
    });
  }

toggleUserActive(user: User): void {

  const newStatus = !user.active;

  this.userService.toggleUserActive(user.username, newStatus).subscribe({
    next: () => {

      // ✅ mise à jour propre du tableau
      this.users = this.users.map(u =>
        u.username === user.username ? { ...u, active: newStatus } : u
      );

      // ✅ recalcul filtre + pagination
      this.filterUsers();
    },
    error: () => {
      console.error('Erreur toggle');
    }
  });
}
trackByUsername(index: number, user: User): string {
  return user.username; // identifiant unique
}
}