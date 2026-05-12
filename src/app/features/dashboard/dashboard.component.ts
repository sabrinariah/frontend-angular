// Le composant TypeScript reste identique, seul le style change
// Assurez-vous que votre composant a cette structure :

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KeycloakService } from '../../core/services/keycloak.service';

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
      <span class="kpi-value">1 248</span>
      <span class="kpi-label">Importations ce mois</span>
    </div>
    <div class="kpi-divider"></div>
    <div class="kpi-item">
      <span class="kpi-value">984</span>
      <span class="kpi-label">Exportations ce mois</span>
    </div>
    <div class="kpi-divider"></div>
    <div class="kpi-item">
      <span class="kpi-value">37</span>
      <span class="kpi-label">Règles actives</span>
    </div>
    <div class="kpi-divider"></div>
    <div class="kpi-item">
      <span class="kpi-value">12</span>
      <span class="kpi-label">Utilisateurs connectés</span>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .dashboard {
      padding: 2rem 2rem 3rem;
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    /* ── HEADER MODERN ─────────────────────────── */
    
    .dashboard-header {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      padding: 2rem 2rem;
      color: #1f2937;
      box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .dashboard-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 80%;
      height: 200%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
      border-radius: 50%;
      pointer-events: none;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      position: relative;
      z-index: 1;
    }
    
    .header-greeting {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .greeting-icon {
      font-size: 3rem;
      line-height: 1;
      filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
    }
    
    .header-greeting h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    
    .username {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-weight: 800;
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
      gap: 0.75rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .date-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      padding: 0.5rem 1rem;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: capitalize;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
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
    
    /* ── KPI STRIP MODERN ───────────────────────── */
    
    .kpi-strip {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 1.5rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-around;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .kpi-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.3s ease;
    }
    
    .kpi-item:hover {
      transform: translateY(-2px);
    }
    
    .kpi-value {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      line-height: 1;
    }
    
    .kpi-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    
    .kpi-divider {
      width: 1px;
      height: 50px;
      background: linear-gradient(to bottom, transparent, #e5e7eb, transparent);
    }
    
    /* ── ACTION CARDS MODERN ────────────────────── */
    
    .cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 1.5rem;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    
    .card:hover::before {
      opacity: 1;
    }
    
    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.2);
    }
    
    .card-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      transition: transform 0.3s ease;
    }
    
    .card:hover .card-icon-wrap {
      transform: scale(1.1);
    }
    
    .import-icon { 
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    .export-icon { 
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    .rules-icon { 
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    }
    .users-icon { 
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    
    .card-icon {
      filter: brightness(0) invert(1);
    }
    
    .card-body h3 {
      margin: 0 0 0.25rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
    }
    
    .card-body p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.4;
    }
    
    .card-arrow {
      margin-top: auto;
      font-size: 1.25rem;
      color: #cbd5e1;
      transition: all 0.3s ease;
    }
    
    .card:hover .card-arrow {
      color: #667eea;
      transform: translateX(6px);
    }
    
    /* Colored left-border accent */
    .card-accent {
      position: absolute;
      left: 0;
      top: 20px;
      bottom: 20px;
      width: 4px;
      border-radius: 0 4px 4px 0;
    }
    
    .import-accent { background: linear-gradient(to bottom, #3b82f6, #2563eb); }
    .export-accent { background: linear-gradient(to bottom, #10b981, #059669); }
    .rules-accent  { background: linear-gradient(to bottom, #8b5cf6, #7c3aed); }
    .users-accent  { background: linear-gradient(to bottom, #f59e0b, #d97706); }
    
    /* ── HERO MODERN ────────────────────────────── */
    
    .hero {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 380px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
    }
    
    .hero:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.15);
    }
    
    .hero-image-wrap {
      position: relative;
      overflow: hidden;
    }
    
    .hero-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }
    
    .hero:hover .hero-image-wrap img {
      transform: scale(1.05);
    }
    
    .hero-image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    }
    
    .hero-badge {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      letter-spacing: 0.02em;
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
      gap: 1rem;
    }
    
    .hero-tag {
      display: inline-block;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      color: #667eea;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.35rem 0.8rem;
      border-radius: 20px;
      width: fit-content;
    }
    
    .hero-text h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      line-height: 1.3;
      margin: 0;
      letter-spacing: -0.02em;
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
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
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
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 50%;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
    }
    
    /* ── RESPONSIVE MODERN ──────────────────────── */
    
    @media (max-width: 1024px) {
      .cards {
        grid-template-columns: repeat(2, 1fr);
      }
      .hero {
        grid-template-columns: 1fr;
      }
      .hero-image-wrap {
        height: 250px;
      }
      .dashboard {
        padding: 1.5rem;
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
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: center;
        padding: 1rem;
      }
      .kpi-divider {
        display: none;
      }
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      .hero-text {
        padding: 1.5rem;
      }
      .dashboard-header {
        padding: 1.5rem;
      }
    }
    
    /* Animations d'entrée */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .dashboard-header {
      animation: fadeInUp 0.5s ease-out;
    }
    
    .kpi-strip {
      animation: fadeInUp 0.5s ease-out 0.1s both;
    }
    
    .cards {
      animation: fadeInUp 0.5s ease-out 0.2s both;
    }
    
    .hero {
      animation: fadeInUp 0.5s ease-out 0.3s both;
    }
  `]
})
export class DashboardComponent {
  currentDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  constructor(public keycloakService: KeycloakService) {}
}