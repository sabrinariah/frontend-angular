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
<aside class="sidebar" *ngIf="!isLoginPage()">
      <nav class="sidebar-nav">

        <!-- Menu -->
        <ul class="nav-menu">

          <!-- Dashboard -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
                <path d="M3 10L10 3L17 10M5 8V17H8V13H12V17H15V8"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="nav-text">Dashboard</span>
            </a>
          </li>

          <!-- Gestion Users -->
          <li class="nav-item">
            <a class="nav-link" routerLink="/users" routerLinkActive="active">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="6" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M3 17C3 13.686 6.134 11 10 11C13.866 11 17 13.686 17 17" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span class="nav-text">Gestion Users</span>
            </a>
          </li>
<!-- Gestion Processus -->
<li class="nav-item">
  <a class="nav-link" routerLink="/processus" routerLinkActive="active">
    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
      <rect x="3" y="3" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="3" y1="7" x2="17" y2="7" stroke="currentColor" stroke-width="2"/>
      <line x1="3" y1="11" x2="17" y2="11" stroke="currentColor" stroke-width="2"/>
      <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2"/>
    </svg>
    <span class="nav-text">Gestion Processus</span>
  </a>
</li>
<!-- 🆕 Gestion Processus Import -->
<li class="nav-item">
  <a class="nav-link" routerLink="/import" routerLinkActive="active">
    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
      <path d="M10 3V14M10 14L6 10M10 14L14 10" 
            stroke="currentColor" stroke-width="2" 
            stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="3" y="14" width="14" height="3" 
            stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>
    <span class="nav-text">Processus Import</span>
  </a>
</li>
        <!-- 📦 Import / Export Process -->
<li class="nav-item">
  <a class="nav-link" routerLink="/import-export" routerLinkActive="active">
    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
      <path d="M10 3V17M10 3L6 7M10 3L14 7"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="nav-text">Import / Export</span>
  </a>
</li>
        </ul>
<!-- 🔥 Camunda / Processus -->
<li class="nav-item">
  <a class="nav-link" routerLink="/start-process" routerLinkActive="active">
    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
      <polygon points="5,3 17,10 5,17" fill="currentColor"/>
    </svg>
    <span class="nav-text">Démarrer Processus</span>
  </a>
</li>
<li class="nav-item">
  <a class="nav-link" routerLink="/export" routerLinkActive="active">
    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
      <path d="M10 2V14M10 14L6 10M10 14L14 10" 
            stroke="currentColor" stroke-width="2"/>
    </svg>
    <span class="nav-text">Processus Export</span>
  </a>
</li>
<!-- ⚙️ Gestion Règles Métier -->
<li class="nav-item">
  <a class="nav-link" routerLink="/regles" routerLinkActive="active">
    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M10 2V5M10 15V18M2 10H5M15 10H18
               M4 4L6 6M14 14L16 16
               M14 6L16 4M4 16L6 14"
            stroke="currentColor" stroke-width="2"/>
    </svg>
    <span class="nav-text">Règles Métier</span>
  </a>
</li>
<li class="nav-item">
  <a class="nav-link" routerLink="/tasks" routerLinkActive="active">
    <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
      <rect x="3" y="4" width="14" height="12" stroke="currentColor" stroke-width="2" fill="none"/>
      <line x1="5" y1="7" x2="15" y2="7" stroke="currentColor" stroke-width="2"/>
      <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" stroke-width="2"/>
      <line x1="5" y1="13" x2="12" y2="13" stroke="currentColor" stroke-width="2"/>
    </svg>
    <span class="nav-text">Liste des Tâches</span>
  </a>
</li>
        <!-- Footer Logout -->
        <div class="nav-footer" *ngIf="keycloakService.ready">

          <ng-container *ngIf="keycloakService.isLoggedIn(); else loginBtn">
            <button class="nav-link logout-btn" (click)="logout()">
              <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20">
                <path d="M13 3H15C16 3 17 4 17 5V15C17 16 16 17 15 17H13" stroke="currentColor" stroke-width="2"/>
                <path d="M7 13L3 9M3 9L7 5M3 9H13" stroke="currentColor" stroke-width="2"/>
              </svg>
              <span class="nav-text">Logout</span>
            </button>
          </ng-container>

          <ng-template #loginBtn>
            <button class="nav-link logout-btn" (click)="goToLogin()">Login</button>
          </ng-template>

        </div>

      </nav>

      <!-- Background Image -->
      <div class="sidebar-bg">
        <img src="assets/images/plane-background.jpg" class="bg-image" />
      </div>

    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

  </div>
  `,
  styles: [`
  .app-container{
    display:flex;
    min-height:100vh;
    font-family: Arial, sans-serif;
  }

  .sidebar{
    width:260px;
    background:#0b2a4a;
    color:white;
    display:flex;
    flex-direction:column;
    position:relative;
  }

  .sidebar-nav{
    display:flex;
    flex-direction:column;
    height:100%;
    padding:20px;
    z-index:2;
  }

  .nav-menu{
    list-style:none;
    padding:0;
    margin:0;
  }

  .nav-item{
    margin-bottom:10px;
  }

  .nav-link{
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px;
    color:white;
    text-decoration:none;
    border-radius:6px;
    transition:0.3s;
  }

  .nav-link:hover{
    background:#1c4b7a;
  }

  .nav-link.active{
    background:#1976d2;
  }

  .nav-icon{
    stroke:white;
  }

  .nav-text{
    font-size:14px;
  }

  .nav-footer{
    margin-top:auto;
  }

  .logout-btn{
    width:100%;
    background:none;
    border:none;
    color:white;
    cursor:pointer;
    display:flex;
    align-items:center;
    gap:10px;
    padding:10px;
  }

  .main-content{
    flex:1;
    background:#f5f5f5;
    padding:30px;
  }

  .sidebar-bg{
    position:absolute;
    bottom:0;
    width:100%;
    opacity:0.2;
  }

  .bg-image{
    width:100%;
  }
  `]
})
export class AppComponent {

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

}