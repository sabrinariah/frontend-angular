import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from './core/services/keycloak.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
  <div class="app-container">

    <!-- Sidebar -->
    <aside class="sidebar" [class.collapsed]="isSidebarCollapsed" *ngIf="!isLoginPage()">
      
      <!-- Toggle Button -->
      <button class="sidebar-toggle" (click)="toggleSidebar()">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M2 4H18M2 10H18M2 16H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <nav class="sidebar-nav">
        <!-- Logo/Brand -->
        <div class="sidebar-brand">
          <div class="brand-icon">⚡</div>
          <span class="brand-text" *ngIf="!isSidebarCollapsed">ProcessFlow</span>
        </div>

        <!-- Menu -->
        <ul class="nav-menu">
          <!-- Dashboard -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10L10 3L17 10M5 8V17H8V13H12V17H15V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Dashboard</span>
            </a>
          </li>

          <!-- Gestion Users -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/users" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/>
                <path d="M3 17C3 13.686 6.134 11 10 11C13.866 11 17 13.686 17 17" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Gestion Users</span>
            </a>
          </li>

          <!-- Gestion Processus -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/processus" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="14" height="14" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <line x1="3" y1="7" x2="17" y2="7" stroke="currentColor" stroke-width="1.5"/>
                <line x1="3" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="1.5"/>
                <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Gestion Processus</span>
            </a>
          </li>

          <!-- Processus Import -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/import" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3V14M10 14L6 10M10 14L14 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="3" y="14" width="14" height="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Processus Import</span>
            </a>
          </li>

          <!-- Import / Export Process -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/import-export" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3V17M10 3L6 7M10 3L14 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Import / Export</span>
            </a>
          </li>

          <!-- Démarrer Processus -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/start-process" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <polygon points="5,3 17,10 5,17" fill="currentColor"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Démarrer Processus</span>
            </a>
          </li>

          <!-- Processus Export -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/export" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2V14M10 14L6 10M10 14L14 10" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Processus Export</span>
            </a>
          </li>

          <!-- Gestion Règles Métier -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/regles" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M10 2V5M10 15V18M2 10H5M15 10H18 M4 4L6 6M14 14L16 16 M14 6L16 4M4 16L6 14" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Règles Métier</span>
            </a>
          </li>

          <!-- Liste des Tâches -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/tasks" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4" width="14" height="12" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="1.5"/>
                <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="1.5"/>
                <line x1="5" y1="13" x2="12" y2="13" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span class="nav-text" *ngIf="!isSidebarCollapsed">Liste des Tâches</span>
            </a>
          </li>
        </ul>

        <!-- Footer Logout -->
        <div class="nav-footer" *ngIf="keycloakService.ready">
          <ng-container *ngIf="keycloakService.isLoggedIn(); else loginBtn">
            <button class="logout-btn" (click)="logout()">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13 3H15C16 3 17 4 17 5V15C17 16 16 17 15 17H13" stroke="currentColor" stroke-width="1.5"/>
                <path d="M7 13L3 9M3 9L7 5M3 9H13" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span *ngIf="!isSidebarCollapsed">Déconnexion</span>
            </button>
          </ng-container>
          <ng-template #loginBtn>
            <button class="logout-btn" (click)="goToLogin()">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M13 3H15C16 3 17 4 17 5V15C17 16 16 17 15 17H13" stroke="currentColor" stroke-width="1.5"/>
                <path d="M7 13L3 9M3 9L7 5M3 9H13" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <span *ngIf="!isSidebarCollapsed">Connexion</span>
            </button>
          </ng-template>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content" [class.sidebar-collapsed]="isSidebarCollapsed">
      <router-outlet></router-outlet>
    </main>
  </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .app-container {
      display: flex;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Sidebar Styles */
    .sidebar {
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
      z-index: 100;
    }

    .sidebar.collapsed {
      width: 80px;
    }

    .sidebar-toggle {
      position: absolute;
      right: -12px;
      top: 20px;
      width: 24px;
      height: 24px;
      background: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      z-index: 101;
    }

    .sidebar-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 20px 16px;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 12px;
      margin-bottom: 32px;
      border-bottom: 2px solid rgba(102, 126, 234, 0.2);
    }

    .brand-icon {
      font-size: 28px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .brand-text {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .nav-menu {
      list-style: none;
      flex: 1;
    }

    .nav-item {
      margin-bottom: 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      color: #4a5568;
      text-decoration: none;
      border-radius: 12px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .nav-link::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 0;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
      z-index: -1;
    }

    .nav-link:hover::before {
      width: 100%;
    }

    .nav-link:hover {
      color: white;
      transform: translateX(4px);
    }

    .nav-link.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .nav-icon {
      flex-shrink: 0;
      stroke: currentColor;
    }

    .nav-text {
      font-size: 14px;
      font-weight: 500;
    }

    .nav-footer {
      margin-top: auto;
      padding-top: 20px;
      border-top: 1px solid rgba(102, 126, 234, 0.2);
    }

    .logout-btn {
      width: 100%;
      background: none;
      border: none;
      color: #e53e3e;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      transition: all 0.3s ease;
      font-size: 14px;
      font-weight: 500;
    }

    .logout-btn:hover {
      background: rgba(229, 62, 62, 0.1);
      transform: translateX(4px);
    }

    /* Main Content Styles */
    .main-content {
      flex: 1;
      padding: 32px;
      transition: all 0.3s ease;
      overflow-y: auto;
    }

    .main-content.sidebar-collapsed {
      padding-left: 32px;
    }

    /* Modern scrollbar */
    .main-content::-webkit-scrollbar {
      width: 8px;
    }

    .main-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .main-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }

    .main-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        height: 100vh;
        transform: translateX(-100%);
      }

      .sidebar.collapsed {
        transform: translateX(0);
        width: 280px;
      }

      .main-content {
        padding: 20px;
      }
    }

    /* Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .main-content > * {
      animation: fadeIn 0.5s ease-out;
    }
  `]
})
export class AppComponent {
  isSidebarCollapsed = false;

  constructor(
    public keycloakService: KeycloakService,
    private router: Router
  ) {}

  logout(): void {
    this.keycloakService.logout();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  isLoginPage(): boolean {
    return this.router.url.includes('login');
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
}