// Le composant TypeScript reste identique, seul le style change
// Assurez-vous que votre composant a cette structure :

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KeycloakService } from '../../core/services/keycloak.service';
import { ProcessusService } from '../../core/services/processus.service';
import { RegleMetierService } from '../../core/services/regle.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `

<div class="dashboard">
 
  <!-- HEADER -->
  <header class="dashboard-header">
    <div class="header-content">
      <div class="header-greeting">
        <span class="greeting-icon">✨</span>
        <div>
          <h1>Bienvenue, <span class="username">{{ keycloakService.getUsername() }}</span></h1>
          <p class="subtitle">Plateforme de gestion du commerce international</p>
        </div>
      </div>
      <div class="header-meta">
        <div class="date-badge">{{ currentDate }}</div>
        <div class="status-dot"></div>
        <span class="status-label">Système actif</span>
      </div>
    </div>
  </header>
 
  <!-- KPI STRIP -->
  <section class="kpi-strip">
    <div class="kpi-item">
      <span class="kpi-value">{{ nbProcessus }}</span>
      <span class="kpi-label">Processus total</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">{{ nbProcessusActifs }}</span>
      <span class="kpi-label">Processus actifs</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">{{ nbRegles }}</span>
      <span class="kpi-label">Règles actives</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-value">{{ nbUsers }}</span>
      <span class="kpi-label">Utilisateurs</span>
    </div>
  </section>
 
  <!-- ACTION CARDS -->
  <section class="cards">
 
    <div class="card import" routerLink="/import">
      <div class="card-icon-wrap import-icon">
        <span class="card-icon">📦</span>
      </div>
      <div class="card-body">
        <h3>Import</h3>
        <p>Gestion des importations</p>
      </div>
      <div class="card-arrow">→</div>
      <div class="card-accent import-accent"></div>
    </div>
 
    <div class="card export" routerLink="/export">
      <div class="card-icon-wrap export-icon">
        <span class="card-icon">🚚</span>
      </div>
      <div class="card-body">
        <h3>Export</h3>
        <p>Gestion des exportations</p>
      </div>
      <div class="card-arrow">→</div>
      <div class="card-accent export-accent"></div>
    </div>
 
    <div class="card rules" routerLink="/rules">
      <div class="card-icon-wrap rules-icon">
        <span class="card-icon">⚙️</span>
      </div>
      <div class="card-body">
        <h3>Règles</h3>
        <p>Règles douanières</p>
      </div>
      <div class="card-arrow">→</div>
      <div class="card-accent rules-accent"></div>
    </div>
 
    <div class="card users" routerLink="/users">
      <div class="card-icon-wrap users-icon">
        <span class="card-icon">👥</span>
      </div>
      <div class="card-body">
        <h3>Utilisateurs</h3>
        <p>Gestion des comptes</p>
      </div>
      <div class="card-arrow">→</div>
      <div class="card-accent users-accent"></div>
    </div>
 
  </section>
 
  <!-- HERO / ABOUT -->
  <section class="hero">
    <div class="hero-image-wrap">
      <img src="assets/images/import-export.jpg" alt="Port de commerce international" />
      <div class="hero-image-overlay"></div>
      <div class="hero-badge">
        <span class="badge-dot"></span>
        Plateforme opérationnelle
      </div>
    </div>
 
    <div class="hero-text">
      <div class="hero-tag">À propos</div>
      <h2>Une plateforme pensée pour le commerce mondial</h2>
      <p>
        Automatisez vos workflows, gérez les flux d'import/export, appliquez
        les règles métiers douanières et supervisez vos utilisateurs depuis
        un seul espace centralisé.
      </p>
      <div class="hero-features">
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Workflows automatisés
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Conformité douanière
        </div>
        <div class="feature-item">
          <span class="feature-icon">✓</span>
          Supervision en temps réel
        </div>
      </div>
    </div>
  </section>
 
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    :host {
      display: block;
      background: #f8f9fa;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    
    /* ── HEADER CORPORATE ──────────────────────── */
    
    .dashboard-header {
      background: #ffffff;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      color: #1f2937;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
      position: relative;
      overflow: hidden;
    }
    
    .dashboard-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #0066cc 0%, #0080ff 100%);
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.5rem;
      position: relative;
      z-index: 1;
    }
    
    .header-greeting {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .greeting-icon {
      font-size: 2.5rem;
      line-height: 1;
    }
    
    .header-greeting h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      letter-spacing: -0.01em;
      color: #0066cc;
    }
    
    .username {
      color: #0066cc;
      font-weight: 700;
    }
    
    .subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 400;
    }
    
    .header-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .date-badge {
      background: #0066cc;
      color: white;
      border-radius: 6px;
      padding: 0.6rem 1.2rem;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: capitalize;
      box-shadow: 0 2px 4px rgba(0, 102, 204, 0.15);
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .status-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.2); }
    }
    
    /* ── KPI STRIP CORPORATE ───────────────────── */
    
    .kpi-strip {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.75rem 2rem;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
    }
    
    .kpi-item {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding-left: 1rem;
      border-left: 3px solid #0066cc;
      transition: all 0.3s ease;
    }
    
    .kpi-item:nth-child(2) { border-left-color: #0080ff; }
    .kpi-item:nth-child(3) { border-left-color: #0099ff; }
    .kpi-item:nth-child(4) { border-left-color: #00aaff; }
    
    .kpi-item:hover {
      transform: translateX(4px);
    }
    
    .kpi-value {
      font-size: 1.875rem;
      font-weight: 800;
      color: #0066cc;
      line-height: 1;
    }
    
    .kpi-label {
      font-size: 0.7rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
    }
    
    .kpi-divider {
      display: none;
    }
    
    /* ── ACTION CARDS CORPORATE ────────────────── */
    
    .cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    
    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 2rem 1.5rem;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #0066cc, #0080ff);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }
    
    .card:hover::before {
      transform: scaleX(1);
    }
    
    .card:hover {
      box-shadow: 0 4px 16px rgba(0, 102, 204, 0.1);
      border-color: #d1e7ff;
      transform: translateY(-2px);
    }
    
    .card-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      transition: all 0.3s ease;
      background: #f0f7ff;
    }
    
    .card:hover .card-icon-wrap {
      transform: scale(1.08);
    }
    
    .import-icon { 
      background: #e8f2ff;
    }
    .export-icon { 
      background: #e8f5f0;
    }
    .rules-icon { 
      background: #f0e8ff;
    }
    .users-icon { 
      background: #fff5e8;
    }
    
    .card-body h3 {
      margin: 0 0 0.3rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: #1f2937;
    }
    
    .card-body p {
      margin: 0;
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .card-arrow {
      margin-top: auto;
      font-size: 1.25rem;
      color: #d1d5db;
      transition: all 0.3s ease;
    }
    
    .card:hover .card-arrow {
      color: #0066cc;
      transform: translateX(4px);
    }
    
    /* Colored left-border accent */
    .card-accent {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      border-radius: 0;
    }
    
    .import-accent { background: #0066cc; }
    .export-accent { background: #10b981; }
    .rules-accent  { background: #8b5cf6; }
    .users-accent  { background: #f59e0b; }
    
    /* ── HERO CORPORATE ────────────────────────── */
    
    .hero {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      min-height: 340px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    
    .hero:hover {
      box-shadow: 0 4px 16px rgba(0, 102, 204, 0.1);
    }
    
    .hero-image-wrap {
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #0066cc 0%, #0080ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .hero-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
      opacity: 0.8;
    }
    
    .hero:hover .hero-image-wrap img {
      transform: scale(1.03);
      opacity: 1;
    }
    
    .hero-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(0, 102, 204, 0.3) 0%, rgba(0, 128, 255, 0.1) 100%);
    }
    
    .hero-badge {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(4px);
      color: #0066cc;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
      animation: pulse 2s ease-in-out infinite;
    }
    
    .hero-text {
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 1.25rem;
    }
    
    .hero-tag {
      display: inline-block;
      background: #e8f2ff;
      color: #0066cc;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      padding: 0.4rem 0.9rem;
      border-radius: 6px;
      width: fit-content;
    }
    
    .hero-text h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      line-height: 1.3;
      margin: 0;
      letter-spacing: -0.01em;
    }
    
    .hero-text p {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }
    
    .hero-features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }
    
    .feature-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: #0066cc;
      border-radius: 50%;
      color: white;
      font-size: 0.65rem;
      font-weight: 800;
      flex-shrink: 0;
    }
    
    /* ── RESPONSIVE CORPORATE ──────────────────── */
    
    @media (max-width: 1024px) {
      .cards {
        grid-template-columns: repeat(2, 1fr);
      }
      .kpi-strip {
        grid-template-columns: repeat(2, 1fr);
      }
      .hero {
        grid-template-columns: 1fr;
      }
      .hero-image-wrap {
        height: 240px;
      }
      .dashboard {
        padding: 1.5rem;
        gap: 1.5rem;
      }
    }
    
    @media (max-width: 640px) {
      .dashboard {
        padding: 1rem;
        gap: 1rem;
      }
      .cards {
        grid-template-columns: 1fr;
      }
      .kpi-strip {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }
      .kpi-item {
        border-left: 3px solid #0066cc;
      }
      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .hero-text {
        padding: 1.5rem;
      }
      .dashboard-header {
        padding: 1.5rem 1rem;
      }
      .card {
        padding: 1.5rem;
      }
    }
    
    /* Animations d'entrée */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .dashboard-header {
      animation: fadeInUp 0.4s ease-out;
    }
    
    .kpi-strip {
      animation: fadeInUp 0.4s ease-out 0.05s both;
    }
    
    .cards {
      animation: fadeInUp 0.4s ease-out 0.1s both;
    }
    
    .hero {
      animation: fadeInUp 0.4s ease-out 0.15s both;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  nbProcessus = 0;
  nbProcessusActifs = 0;
  nbRegles = 0;
  nbUsers = 0;

  constructor(
    public keycloakService: KeycloakService,
    private processusService: ProcessusService,
    private regleService: RegleMetierService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    forkJoin({
      processus: this.processusService.getAll().pipe(catchError(() => of([]))),
      regles: this.regleService.getAll().pipe(catchError(() => of([]))),
      users: this.userService.getUsers().pipe(catchError(() => of([])))
    }).subscribe(({ processus, regles, users }) => {
      this.nbProcessus = processus.length;
      this.nbProcessusActifs = processus.filter((p: any) => p.actif).length;
      this.nbRegles = regles.filter((r: any) => r.active).length;
      this.nbUsers = users.length;
    });
  }
}