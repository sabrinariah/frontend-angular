import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { TacheService } from '../../core/services/tache.service';
import { Processus, Tache } from '../../models/processus.model';
import { BPMN_TASK_CATALOG, BpmnTaskTemplate, BpmnFormField } from '../../models/bpmn-tasks.model';

@Component({
  selector: 'app-processus-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="page-wrapper">

    <!-- ========== HEADER ========== -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">📊</div>
        <div>
          <h1>Gestion des Processus Métier</h1>
          <p class="header-subtitle">Suivez, gérez et orchestrez vos processus d'importation</p>
        </div>
      </div>
      <a routerLink="/processus/new" class="btn btn-primary btn-add">
        <span class="btn-icon">+</span> Nouveau Processus
      </a>
    </div>

    <!-- ========== KPI CARDS ========== -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-blue">
        <div class="kpi-icon">📋</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ processus.length }}</div>
          <div class="kpi-label">Total Processus</div>
        </div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-icon">✅</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ countActifs() }}</div>
          <div class="kpi-label">Actifs</div>
        </div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-icon">⏸️</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ countInactifs() }}</div>
          <div class="kpi-label">Inactifs</div>
        </div>
      </div>
      <div class="kpi-card kpi-purple">
        <div class="kpi-icon">📌</div>
        <div class="kpi-body">
          <div class="kpi-value">{{ totalTaches() }}</div>
          <div class="kpi-label">Total Tâches</div>
        </div>
      </div>
    </div>

    <!-- ========== TOOLBAR ========== -->
    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input [(ngModel)]="searchTerm" placeholder="Rechercher un processus..." class="search-input" />
      </div>
      <div class="filter-group">
        <button (click)="filterStatus = 'all'" [class.active]="filterStatus === 'all'" class="filter-btn">Tous</button>
        <button (click)="filterStatus = 'active'" [class.active]="filterStatus === 'active'" class="filter-btn">Actifs</button>
        <button (click)="filterStatus = 'inactive'" [class.active]="filterStatus === 'inactive'" class="filter-btn">Inactifs</button>
      </div>
    </div>

    <!-- ========== CARDS GRID ========== -->
    <div *ngIf="filteredProcessus().length > 0" class="processus-grid">
      <div *ngFor="let p of filteredProcessus()" class="processus-card" [class.card-inactive]="!p.actif">

        <div class="card-header">
          <div class="card-id-badge">#{{ p.id }}</div>
          <span class="status-pill" [class.pill-active]="p.actif" [class.pill-inactive]="!p.actif">
            <span class="status-dot"></span>
            {{ p.actif ? 'Actif' : 'Inactif' }}
          </span>
        </div>

        <div class="card-title-section">
          <h3 class="card-title">{{ p.nom }}</h3>
          <span class="type-tag">{{ p.typeProcessus }}</span>
        </div>

        <div class="card-dates">
          <div class="date-item">
            <span class="date-label">📅 Début</span>
            <span class="date-value">{{ p.dateDebut || '—' }}</span>
          </div>
          <div class="date-arrow">→</div>
          <div class="date-item">
            <span class="date-label">🏁 Fin</span>
            <span class="date-value">{{ p.dateFin || '—' }}</span>
          </div>
        </div>

        <div class="tasks-section">
          <div class="tasks-info">
            <span class="tasks-icon">📋</span>
            <span class="tasks-label">Tâches</span>
          </div>
          <div class="tasks-count" [class.zero]="taskCounts[p.id!] === 0">
            {{ taskCounts[p.id!] || 0 }}
          </div>
        </div>

        <div class="card-actions">
          <button (click)="openTachesPopup(p)" class="action-btn btn-details">
            <span>👁️</span> Détails
          </button>
          <a [routerLink]="['/processus', p.id, 'edit']" class="action-btn btn-edit" title="Modifier">✏️</a>
          <button (click)="toggle(p.id!)" class="action-btn btn-toggle" title="Activer/Désactiver">
            {{ p.actif ? '⏸️' : '▶️' }}
          </button>
          <button (click)="delete(p.id!)" class="action-btn btn-del" title="Supprimer">🗑️</button>
        </div>

      </div>
    </div>

    <div *ngIf="filteredProcessus().length === 0" class="empty-state">
      <div class="empty-icon-big">📭</div>
      <h3>Aucun processus trouvé</h3>
      <p *ngIf="searchTerm || filterStatus !== 'all'">Essayez d'ajuster vos filtres ou votre recherche.</p>
      <p *ngIf="!searchTerm && filterStatus === 'all'">Commencez par créer votre premier processus métier.</p>
      <a routerLink="/processus/new" class="btn btn-primary">+ Créer un processus</a>
    </div>

    <!-- ====================== POPUP TÂCHES ====================== -->
    <div *ngIf="selectedProcessus" class="popup-overlay" (click)="closePopup()">
      <div class="popup-content" (click)="$event.stopPropagation()">
        <div class="popup-header">
          <div class="popup-header-info">
            <h3>🗂️ {{ selectedProcessus.nom }}</h3>
            <span class="processus-type-badge">{{ selectedProcessus.typeProcessus }}</span>
          </div>
          <div class="popup-header-right">
            <span class="tache-counter">{{ taches.length }} tâche{{ taches.length > 1 ? 's' : '' }}</span>
            <button (click)="closePopup()" class="btn-close">✕</button>
          </div>
        </div>

        <div class="tabs">
          <button (click)="showCatalog = !showCatalog" class="btn btn-secondary">📋 Depuis catalogue BPMN</button>
          <button [class.tab-active]="activeTab === 'historique'" (click)="activeTab = 'historique'" class="tab-btn">📜 Historique des tâches</button>
        </div>

        <div *ngIf="showCatalog" class="catalog-panel">
          <input [(ngModel)]="catalogFilter" placeholder="Rechercher une tâche..." class="form-control" />
          <div *ngFor="let phase of catalogPhases">
            <div class="catalog-phase">{{ phase }}</div>
            <div *ngFor="let t of getTasksByPhase(phase)" class="catalog-item" (click)="openTaskFormFromCatalog(t)">
              <span class="catalog-type" [class.type-systeme]="t.type === 'SYSTEME'">{{ t.type }}</span>
              {{ t.nom }}
            </div>
          </div>
        </div>

        <div *ngIf="errorMessage" class="alert-danger">{{ errorMessage }}</div>

        <div *ngIf="activeTab === 'historique'" class="historique-container">
          <div *ngIf="taches.length === 0" class="empty-historique">
            <span class="empty-icon-big">📭</span>
            <p>Aucune tâche enregistrée pour ce processus.</p>
          </div>

          <div *ngIf="taches.length > 0" class="stats-bar">
            <div class="stat-item"><span class="stat-num">{{ taches.length }}</span><span class="stat-label">Total</span></div>
            <div class="stat-item stat-attente"><span class="stat-num">{{ countByStatut('EN_ATTENTE') }}</span><span class="stat-label">En attente</span></div>
            <div class="stat-item stat-cours"><span class="stat-num">{{ countByStatut('EN_COURS') }}</span><span class="stat-label">En cours</span></div>
            <div class="stat-item stat-termine"><span class="stat-num">{{ countByStatut('TERMINE') }}</span><span class="stat-label">Terminées</span></div>
          </div>

          <div *ngIf="taches.length > 0" class="progress-section">
            <div class="progress-label">Progression globale : <strong>{{ progressPercent() }}%</strong></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" [style.width.%]="progressPercent()"></div></div>
          </div>

          <div class="timeline" *ngIf="taches.length > 0">
            <div *ngFor="let t of tachesSorted(); let i = index" class="timeline-item"
              [class.timeline-termine]="t.statut === 'TERMINE'"
              [class.timeline-cours]="t.statut === 'EN_COURS'"
              [class.timeline-attente]="t.statut === 'EN_ATTENTE'">
              <div class="timeline-ordre">{{ t.ordre }}</div>
              <div class="timeline-line" *ngIf="i < taches.length - 1"></div>
              <div class="timeline-card" (click)="openTaskForm(t)" style="cursor: pointer;">
                <div class="timeline-card-header">
                  <div class="timeline-title-group">
                    <span class="timeline-icon">{{ t.statut === 'TERMINE' ? '✅' : t.statut === 'EN_COURS' ? '⚡' : '⏳' }}</span>
                    <strong class="timeline-nom">{{ t.nom }}</strong>
                    <span class="tl-badge tl-type">{{ t.type }}</span>
                    <span class="tl-badge" [ngClass]="{
                      'tl-statut-attente': t.statut === 'EN_ATTENTE',
                      'tl-statut-cours': t.statut === 'EN_COURS',
                      'tl-statut-termine': t.statut === 'TERMINE'
                    }">{{ t.statut }}</span>
                    <span class="badge-form-hint">📝 Cliquer pour remplir</span>
                  </div>
                  <div class="timeline-actions" (click)="$event.stopPropagation()">
                    <button (click)="deleteTache(t.id!)" class="btn-icon">🗑️</button>
                  </div>
                </div>
                <p *ngIf="t.description" class="timeline-desc">{{ t.description }}</p>
                <div class="timeline-meta">
                  <span *ngIf="t.assignee">👤 {{ t.assignee }}</span>
                  <span *ngIf="hasFormData(t)" class="meta-filled">✓ Formulaire rempli</span>
                  <span class="meta-id">ID #{{ t.id }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====================== POPUP FORMULAIRE DYNAMIQUE ====================== -->
    <div *ngIf="formTaskOpen" class="popup-overlay popup-overlay-2" (click)="closeTaskForm()">
      <div class="popup-content popup-form-content" (click)="$event.stopPropagation()">
        <div class="popup-header">
          <div class="popup-header-info">
            <h3>📝 {{ formTaskOpen.nom }}</h3>
            <span class="processus-type-badge">{{ formTaskOpen.type }}</span>
          </div>
          <button (click)="closeTaskForm()" class="btn-close">✕</button>
        </div>

        <div *ngIf="formError" class="alert-danger">{{ formError }}</div>

        <div class="dynamic-form">
          <div class="form-section">
            <h4>Informations générales</h4>
            <label>Assignée à</label>
            <input [(ngModel)]="formTaskOpen.assignee" class="form-control" placeholder="Personne / service" />
            <label>Description / commentaire</label>
            <textarea [(ngModel)]="formTaskOpen.description" rows="2" class="form-control" placeholder="Commentaire libre..."></textarea>
            <label>Statut</label>
            <select [(ngModel)]="formTaskOpen.statut" class="form-control">
              <option value="EN_ATTENTE">EN_ATTENTE</option>
              <option value="EN_COURS">EN_COURS</option>
              <option value="TERMINE">TERMINE</option>
            </select>
          </div>

          <div class="form-section" *ngIf="currentFormFields.length > 0">
            <h4>📋 Données spécifiques à la tâche</h4>
            <div *ngFor="let field of currentFormFields" class="dyn-field">
              <label [class.required]="field.required">
                {{ field.label }}<span *ngIf="field.required" class="req-star">*</span>
              </label>
              <input *ngIf="field.type === 'string'" [(ngModel)]="formValues[field.id]" class="form-control" />
              <input *ngIf="field.type === 'date'" type="date" [(ngModel)]="formValues[field.id]" class="form-control" />
              <input *ngIf="field.type === 'long'" type="number" [(ngModel)]="formValues[field.id]" class="form-control" />
              <select *ngIf="field.type === 'boolean'" [(ngModel)]="formValues[field.id]" class="form-control">
                <option [ngValue]="true">Oui</option>
                <option [ngValue]="false">Non</option>
              </select>
              <select *ngIf="field.type === 'enum'" [(ngModel)]="formValues[field.id]" class="form-control">
                <option *ngFor="let opt of field.options" [ngValue]="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>

          <div *ngIf="currentFormFields.length === 0" class="info-no-form">
            ℹ️ Aucun champ spécifique défini pour cette tâche.
          </div>

          <div class="form-actions">
            <button (click)="saveTaskForm()" class="btn btn-primary">💾 Enregistrer</button>
            <button (click)="closeTaskForm()" class="btn btn-secondary">Annuler</button>
          </div>
        </div>
      </div>
    </div>

  </div>
  `,
  styles: [`
    :host {
      --primary: #4f46e5;
      --primary-dark: #4338ca;
      --primary-light: #eef2ff;
      --success: #10b981;
      --success-light: #d1fae5;
      --warning: #f59e0b;
      --warning-light: #fef3c7;
      --danger: #ef4444;
      --danger-light: #fee2e2;
      --purple: #8b5cf6;
      --purple-light: #ede9fe;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-500: #6b7280;
      --gray-700: #374151;
      --gray-900: #111827;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
      --shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.1);
      --shadow-hover: 0 20px 40px -8px rgba(79,70,229,0.18);
      --radius: 12px;
      --radius-lg: 16px;
    }

    .page-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fb 0%, #eef2ff 100%);
      padding: 30px 40px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* HEADER */
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--gray-200);
      flex-wrap: wrap; gap: 16px;
    }
    .header-left { display: flex; align-items: center; gap: 18px; }
    .header-icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, var(--primary), var(--purple));
      border-radius: var(--radius); display: flex; align-items: center; justify-content: center;
      font-size: 28px; box-shadow: var(--shadow);
    }
    .page-header h1 {
      margin: 0; font-size: 26px; font-weight: 800; color: var(--gray-900); letter-spacing: -0.5px;
    }
    .header-subtitle { margin: 4px 0 0; color: var(--gray-500); font-size: 14px; }

    /* BUTTONS */
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 11px 20px; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white; box-shadow: 0 4px 12px rgba(79,70,229,0.3);
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(79,70,229,0.4); }
    .btn-secondary { background: var(--gray-100); color: var(--gray-700); }
    .btn-secondary:hover { background: var(--gray-200); }
    .btn-add .btn-icon {
      width: 22px; height: 22px; background: rgba(255,255,255,0.25); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700;
    }

    /* KPI */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px; margin-bottom: 28px;
    }
    .kpi-card {
      background: white; border-radius: var(--radius); padding: 22px;
      display: flex; align-items: center; gap: 16px;
      box-shadow: var(--shadow); border-left: 4px solid;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .kpi-blue { border-color: var(--primary); }
    .kpi-green { border-color: var(--success); }
    .kpi-red { border-color: var(--danger); }
    .kpi-purple { border-color: var(--purple); }
    .kpi-icon {
      width: 52px; height: 52px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 26px;
    }
    .kpi-blue .kpi-icon { background: var(--primary-light); }
    .kpi-green .kpi-icon { background: var(--success-light); }
    .kpi-red .kpi-icon { background: var(--danger-light); }
    .kpi-purple .kpi-icon { background: var(--purple-light); }
    .kpi-value { font-size: 30px; font-weight: 800; color: var(--gray-900); line-height: 1; }
    .kpi-label { font-size: 13px; color: var(--gray-500); margin-top: 4px; font-weight: 500; }

    /* TOOLBAR */
    .toolbar { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
    .search-box { position: relative; flex: 1; min-width: 280px; }
    .search-icon {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      font-size: 15px; color: var(--gray-500);
    }
    .search-input {
      width: 100%; padding: 12px 16px 12px 42px;
      border: 1px solid var(--gray-200); border-radius: 10px; background: white;
      font-size: 14px; box-shadow: var(--shadow-sm); transition: all 0.2s; box-sizing: border-box;
    }
    .search-input:focus {
      outline: none; border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    }
    .filter-group {
      display: flex; gap: 6px; background: white; padding: 4px;
      border-radius: 10px; box-shadow: var(--shadow-sm); border: 1px solid var(--gray-200);
    }
    .filter-btn {
      padding: 8px 16px; border: none; background: transparent;
      border-radius: 7px; font-size: 13px; font-weight: 600;
      color: var(--gray-500); cursor: pointer; transition: all 0.2s;
    }
    .filter-btn:hover { color: var(--gray-700); }
    .filter-btn.active {
      background: var(--primary); color: white;
      box-shadow: 0 2px 6px rgba(79,70,229,0.3);
    }

    /* CARDS */
    .processus-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 22px;
    }
    .processus-card {
      background: white; border-radius: var(--radius-lg); padding: 22px;
      box-shadow: var(--shadow); border: 1px solid var(--gray-100);
      transition: all 0.3s ease; position: relative; overflow: hidden;
    }
    .processus-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--purple));
    }
    .processus-card:hover {
      transform: translateY(-4px); box-shadow: var(--shadow-hover);
      border-color: var(--primary-light);
    }
    .processus-card.card-inactive::before {
      background: linear-gradient(90deg, var(--gray-300), var(--gray-500));
    }
    .processus-card.card-inactive { opacity: 0.78; }

    .card-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
    }
    .card-id-badge {
      background: var(--gray-100); color: var(--gray-500); padding: 4px 10px;
      border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
    }
    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .pill-active { background: var(--success-light); color: var(--success); }
    .pill-active .status-dot { background: var(--success); }
    .pill-inactive { background: var(--danger-light); color: var(--danger); }
    .pill-inactive .status-dot { background: var(--danger); animation: none; }

    .card-title-section { margin-bottom: 16px; }
    .card-title {
      margin: 0 0 8px; font-size: 18px; font-weight: 700;
      color: var(--gray-900); letter-spacing: -0.3px; line-height: 1.3;
    }
    .type-tag {
      display: inline-block; background: var(--primary-light); color: var(--primary);
      padding: 3px 10px; border-radius: 6px; font-size: 11px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
    }

    .card-dates {
      display: flex; align-items: center; gap: 8px;
      padding: 12px; background: var(--gray-50); border-radius: 10px; margin-bottom: 14px;
    }
    .date-item { flex: 1; }
    .date-label {
      display: block; font-size: 10px; color: var(--gray-500);
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;
    }
    .date-value { font-size: 13px; font-weight: 600; color: var(--gray-700); }
    .date-arrow { color: var(--gray-300); font-size: 16px; }

    .tasks-section {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 14px;
      background: linear-gradient(135deg, var(--primary-light), var(--purple-light));
      border-radius: 10px; margin-bottom: 16px;
    }
    .tasks-info { display: flex; align-items: center; gap: 8px; }
    .tasks-icon { font-size: 18px; }
    .tasks-label { font-size: 13px; font-weight: 600; color: var(--gray-700); }
    .tasks-count {
      background: var(--primary); color: white;
      min-width: 32px; height: 32px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; padding: 0 10px;
      box-shadow: 0 2px 6px rgba(79,70,229,0.3);
    }
    .tasks-count.zero { background: var(--gray-300); color: var(--gray-700); box-shadow: none; }

    .card-actions {
      display: flex; gap: 6px; padding-top: 14px; border-top: 1px solid var(--gray-100);
    }
    .action-btn {
      padding: 9px 12px; border: none; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 600; transition: all 0.2s;
      display: inline-flex; align-items: center; justify-content: center;
      gap: 6px; text-decoration: none;
    }
    .btn-details {
      flex: 1; background: var(--primary); color: white;
    }
    .btn-details:hover { background: var(--primary-dark); transform: translateY(-1px); }
    .btn-edit { background: var(--warning-light); color: var(--warning); }
    .btn-edit:hover { background: var(--warning); color: white; }
    .btn-toggle { background: var(--gray-100); color: var(--gray-700); }
    .btn-toggle:hover { background: var(--gray-200); }
    .btn-del { background: var(--danger-light); color: var(--danger); }
    .btn-del:hover { background: var(--danger); color: white; }

    /* EMPTY */
    .empty-state {
      background: white; border-radius: var(--radius-lg);
      padding: 60px 30px; text-align: center; box-shadow: var(--shadow);
    }
    .empty-icon-big { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .empty-state h3 { margin: 0 0 8px; color: var(--gray-900); font-size: 20px; }
    .empty-state p { color: var(--gray-500); margin-bottom: 20px; }

    /* POPUP */
    .popup-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(17,24,39,0.65); backdrop-filter: blur(4px);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000; animation: fadeIn 0.2s;
    }
    .popup-overlay-2 { z-index: 2000; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .popup-content {
      background: white; border-radius: var(--radius-lg);
      width: 90%; max-width: 900px; max-height: 92vh;
      overflow-y: auto; padding: 28px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.3); animation: slideUp 0.3s;
    }
    .popup-form-content { max-width: 700px; }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .popup-header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--gray-200); padding-bottom: 16px; margin-bottom: 16px;
    }
    .popup-header-info { display: flex; align-items: center; gap: 12px; }
    .popup-header-info h3 { margin: 0; color: var(--gray-900); font-size: 20px; font-weight: 700; }
    .processus-type-badge {
      background: var(--primary-light); color: var(--primary);
      padding: 4px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
    }
    .popup-header-right { display: flex; align-items: center; gap: 12px; }
    .tache-counter {
      background: linear-gradient(135deg, var(--primary), var(--purple));
      color: white; padding: 6px 14px; border-radius: 20px;
      font-size: 13px; font-weight: 700;
    }
    .btn-close {
      background: var(--danger-light); color: var(--danger); border: none;
      width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
      font-size: 16px; font-weight: bold; transition: all 0.2s;
    }
    .btn-close:hover { background: var(--danger); color: white; }

    .tabs { display: flex; gap: 8px; margin: 18px 0 16px; flex-wrap: wrap; }
    .tab-btn {
      background: var(--gray-100); border: none; padding: 10px 18px;
      cursor: pointer; font-size: 13px; font-weight: 600;
      color: var(--gray-500); border-radius: 8px; transition: all 0.2s;
    }
    .tab-btn:hover { background: var(--gray-200); }
    .tab-active { background: var(--primary) !important; color: white !important; }

    .form-control {
      width: 100%; margin: 6px 0; padding: 11px 14px;
      border: 1px solid var(--gray-200); border-radius: 8px;
      box-sizing: border-box; font-size: 14px; transition: all 0.2s;
    }
    .form-control:focus {
      outline: none; border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
    }
    .form-actions { margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; }

    .catalog-panel {
      background: var(--primary-light); border: 1px solid #c7d2fe;
      border-radius: 10px; padding: 14px; margin-top: 10px;
      max-height: 320px; overflow-y: auto;
    }
    .catalog-phase {
      font-size: 11px; font-weight: 700; color: var(--primary);
      text-transform: uppercase; letter-spacing: 0.5px; margin: 10px 0 4px;
    }
    .catalog-item {
      padding: 8px 12px; border-radius: 6px; font-size: 13px;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      transition: all 0.15s;
    }
    .catalog-item:hover { background: #c7d2fe; transform: translateX(3px); }
    .catalog-type {
      font-size: 10px; padding: 2px 7px; border-radius: 6px;
      background: #c7d2fe; color: var(--primary-dark); font-weight: 700;
    }
    .catalog-type.type-systeme { background: var(--success-light); color: var(--success); }

    .historique-container { padding: 10px 0; }
    .empty-historique { text-align: center; padding: 50px 20px; color: var(--gray-500); }

    .stats-bar { display: flex; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }
    .stat-item {
      flex: 1; min-width: 80px; text-align: center; background: white;
      border: 1px solid var(--gray-200); border-radius: 10px; padding: 14px 10px;
    }
    .stat-num { display: block; font-size: 24px; font-weight: 800; color: var(--gray-900); }
    .stat-label {
      font-size: 11px; color: var(--gray-500);
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;
    }
    .stat-attente .stat-num { color: var(--warning); }
    .stat-cours .stat-num { color: #06b6d4; }
    .stat-termine .stat-num { color: var(--success); }

    .progress-section { margin-bottom: 22px; }
    .progress-label { font-size: 13px; margin-bottom: 8px; color: var(--gray-700); }
    .progress-bar-bg {
      background: var(--gray-100); border-radius: 20px; height: 10px; overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%; background: linear-gradient(90deg, var(--success), #34d399);
      border-radius: 20px; transition: width 0.5s ease;
    }

    .timeline { position: relative; padding-left: 50px; }
    .timeline-item { position: relative; margin-bottom: 18px; }
    .timeline-ordre {
      position: absolute; left: -50px; top: 12px; width: 34px; height: 34px;
      border-radius: 50%; background: var(--primary); color: white;
      font-weight: 800; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 10px rgba(79,70,229,0.3); z-index: 2;
    }
    .timeline-termine .timeline-ordre { background: var(--success); box-shadow: 0 4px 10px rgba(16,185,129,0.3); }
    .timeline-cours .timeline-ordre { background: #06b6d4; box-shadow: 0 4px 10px rgba(6,182,212,0.3); }
    .timeline-attente .timeline-ordre { background: var(--warning); box-shadow: 0 4px 10px rgba(245,158,11,0.3); }

    .timeline-line {
      position: absolute; left: -33px; top: 46px;
      width: 2px; background: var(--gray-200); bottom: -18px;
    }

    .timeline-card {
      background: white; border: 1px solid var(--gray-200); border-radius: 10px;
      padding: 14px 16px; box-shadow: var(--shadow-sm); transition: all 0.2s;
    }
    .timeline-card:hover {
      box-shadow: var(--shadow); transform: translateY(-2px); border-color: var(--primary);
    }
    .timeline-termine .timeline-card { border-left: 4px solid var(--success); }
    .timeline-cours .timeline-card { border-left: 4px solid #06b6d4; }
    .timeline-attente .timeline-card { border-left: 4px solid var(--warning); }

    .timeline-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .timeline-title-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .timeline-icon { font-size: 16px; }
    .timeline-nom { font-size: 15px; font-weight: 600; color: var(--gray-900); }

    .badge-form-hint {
      font-size: 10px; padding: 2px 8px; border-radius: 10px;
      background: var(--warning-light); color: var(--warning); font-weight: 700;
    }
    .tl-badge {
      font-size: 10px; padding: 2px 8px; border-radius: 10px;
      font-weight: 700; text-transform: uppercase;
    }
    .tl-type { background: var(--gray-100); color: var(--gray-700); }
    .tl-statut-attente { background: var(--warning-light); color: var(--warning); }
    .tl-statut-cours { background: #cffafe; color: #0e7490; }
    .tl-statut-termine { background: var(--success-light); color: var(--success); }

    .timeline-desc { margin: 8px 0 6px; color: var(--gray-500); font-size: 13px; }
    .timeline-meta {
      display: flex; gap: 14px; font-size: 12px; color: var(--gray-500);
      margin-top: 4px; align-items: center; flex-wrap: wrap;
    }
    .meta-filled { color: var(--success); font-weight: 700; }
    .meta-id { margin-left: auto; }
    .timeline-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .btn-icon {
      background: none; border: none; cursor: pointer; font-size: 16px;
      padding: 4px 6px; border-radius: 6px;
    }
    .btn-icon:hover { background: var(--gray-100); }

    .alert-danger {
      background: var(--danger-light); color: var(--danger);
      padding: 12px 16px; border-radius: 8px; margin-bottom: 15px;
      font-weight: 600; font-size: 13px; border-left: 4px solid var(--danger);
    }

    .dynamic-form { padding: 5px 0; }
    .form-section {
      background: var(--gray-50); border: 1px solid var(--gray-200);
      border-radius: 10px; padding: 18px; margin-bottom: 16px;
    }
    .form-section h4 {
      margin: 0 0 12px; font-size: 13px; color: var(--primary);
      text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;
    }
    .dyn-field { margin-bottom: 12px; }
    .dyn-field label {
      display: block; font-size: 13px; color: var(--gray-700);
      margin-bottom: 4px; font-weight: 600;
    }
    .req-star { color: var(--danger); margin-left: 3px; }
    .info-no-form {
      padding: 16px; background: var(--primary-light); border-radius: 8px;
      color: var(--primary-dark); font-size: 14px; text-align: center;
    }

    @media (max-width: 768px) {
      .page-wrapper { padding: 20px 16px; }
      .processus-grid { grid-template-columns: 1fr; }
      .toolbar { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class ProcessusListComponent implements OnInit {
  private processusService = inject(ProcessusService);
  private tacheService = inject(TacheService);

  processus: Processus[] = [];
  catalog = BPMN_TASK_CATALOG;
  catalogPhases = [...new Set(BPMN_TASK_CATALOG.map(t => t.phase))];
  showCatalog = false;
  catalogFilter = '';

  taskCounts: Record<number, number> = {};

  searchTerm = '';
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  selectedProcessus: Processus | null = null;
  taches: Tache[] = [];
  errorMessage = '';
  activeTab: 'historique' = 'historique';

  formTaskOpen: Tache | null = null;
  currentFormFields: BpmnFormField[] = [];
  formValues: Record<string, any> = {};
  formError = '';
  isNewTaskFromCatalog = false;

  ngOnInit() { this.load(); }

  filteredProcessus(): Processus[] {
    return this.processus.filter(p => {
      const matchSearch = !this.searchTerm ||
        p.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.typeProcessus?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus =
        this.filterStatus === 'all' ||
        (this.filterStatus === 'active' && p.actif) ||
        (this.filterStatus === 'inactive' && !p.actif);
      return matchSearch && matchStatus;
    });
  }

  countActifs(): number { return this.processus.filter(p => p.actif).length; }
  countInactifs(): number { return this.processus.filter(p => !p.actif).length; }
  totalTaches(): number {
    return Object.values(this.taskCounts).reduce((sum, n) => sum + (n || 0), 0);
  }

  get catalogFiltered(): BpmnTaskTemplate[] {
    const q = this.catalogFilter.toLowerCase();
    return this.catalog.filter(t =>
      !q || t.nom.toLowerCase().includes(q) || t.phase.toLowerCase().includes(q)
    );
  }

  getTasksByPhase(phase: string): BpmnTaskTemplate[] {
    return this.catalogFiltered.filter(t => t.phase === phase);
  }

  openTaskFormFromCatalog(template: BpmnTaskTemplate) {
    if (!this.selectedProcessus?.id) return;
    this.isNewTaskFromCatalog = true;
    this.formTaskOpen = {
      nom: template.nom,
      description: '',
      assignee: template.assigneesSuggerees[0] ?? '',
      type: template.type,
      statut: 'EN_ATTENTE',
      ordre: template.ordre,
      processusId: this.selectedProcessus.id,
      templateId: template.id,
      formData: ''
    };
    this.currentFormFields = template.formFields || [];
    this.formValues = this.buildDefaultValues(this.currentFormFields);
    this.formError = '';
    this.showCatalog = false;
  }

  openTaskForm(tache: Tache) {
    this.isNewTaskFromCatalog = false;
    this.formTaskOpen = { ...tache };
    const template = this.findTemplateForTache(tache);
    this.currentFormFields = template?.formFields || [];
    this.formValues = this.parseFormData(tache.formData);
    this.currentFormFields.forEach(f => {
      if (this.formValues[f.id] === undefined && f.defaultValue !== undefined) {
        this.formValues[f.id] = f.defaultValue;
      }
    });
    this.formError = '';
  }

  closeTaskForm() {
    this.formTaskOpen = null;
    this.currentFormFields = [];
    this.formValues = {};
    this.formError = '';
  }

  saveTaskForm() {
    if (!this.formTaskOpen) return;
    this.formError = '';
    for (const f of this.currentFormFields) {
      if (f.required) {
        const v = this.formValues[f.id];
        if (v === undefined || v === null || v === '') {
          this.formError = `Le champ "${f.label}" est obligatoire.`;
          return;
        }
      }
    }
    const payload: Tache = {
      nom: this.formTaskOpen.nom,
      description: this.formTaskOpen.description || '',
      assignee: this.formTaskOpen.assignee || '',
      type: this.formTaskOpen.type,
      statut: this.formTaskOpen.statut,
      ordre: this.formTaskOpen.ordre,
      processusId: this.formTaskOpen.processusId,
      templateId: this.formTaskOpen.templateId,
      formData: JSON.stringify(this.formValues)
    };
    const obs = (!this.isNewTaskFromCatalog && this.formTaskOpen.id)
      ? this.tacheService.update(this.formTaskOpen.id, payload)
      : this.tacheService.create(payload);
    obs.subscribe({
      next: () => { this.closeTaskForm(); this.loadTaches(); },
      error: (err) => {
        this.formError = err?.error?.message || err?.error?.error || 'Erreur lors de la sauvegarde';
      }
    });
  }

  private findTemplateForTache(t: Tache): BpmnTaskTemplate | undefined {
    if (t.templateId) return this.catalog.find(c => c.id === t.templateId);
    return this.catalog.find(c => c.nom.toLowerCase() === t.nom?.toLowerCase());
  }

  private buildDefaultValues(fields: BpmnFormField[]): Record<string, any> {
    const v: Record<string, any> = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) v[f.id] = f.defaultValue;
      else if (f.type === 'boolean') v[f.id] = false;
      else v[f.id] = '';
    });
    return v;
  }

  private parseFormData(raw?: string): Record<string, any> {
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  hasFormData(t: Tache): boolean {
    if (!t.formData) return false;
    try {
      const obj = JSON.parse(t.formData);
      return Object.values(obj).some(v => v !== '' && v !== null && v !== undefined);
    } catch { return false; }
  }

  load() {
    this.processusService.getAll().subscribe(data => {
      this.processus = data;
      this.loadAllTaskCounts();
    });
  }

  loadAllTaskCounts() {
    this.processus.forEach(p => {
      if (p.id) {
        this.tacheService.getByProcessus(p.id).subscribe({
          next: (taches) => { this.taskCounts[p.id!] = taches.length; },
          error: () => { this.taskCounts[p.id!] = 0; }
        });
      }
    });
  }
toggle(id: number) {
  const processus = this.processus.find(p => p.id === id);
  if (!processus) {
    console.error('Processus introuvable:', id);
    return;
  }

  const ancienEtat = processus.actif;
  processus.actif = !processus.actif;

  this.processusService.toggle(id).subscribe({
    next: (updated: any) => {
      console.log('✅ Processus mis à jour:', updated);
      if (updated && typeof updated.actif === 'boolean') {
        processus.actif = updated.actif;
      }
    },
    error: (err) => {
      processus.actif = ancienEtat;
      console.error('❌ Erreur toggle:', err);
      alert('Erreur : ' + (err?.error?.message || err.message));
    }
  });
}
  delete(id: number) {
    if (confirm('Supprimer ce processus ?')) {
      this.processusService.delete(id).subscribe(() => this.load());
    }
  }

  openTachesPopup(p: Processus) {
    this.selectedProcessus = p;
    this.errorMessage = '';
    this.activeTab = 'historique';
    this.loadTaches();
  }

  closePopup() {
    this.selectedProcessus = null;
    this.taches = [];
    this.errorMessage = '';
  }

  loadTaches() {
    if (!this.selectedProcessus?.id) return;
    this.tacheService.getByProcessus(this.selectedProcessus.id).subscribe({
      next: (data) => {
        this.taches = data;
        if (this.selectedProcessus?.id) {
          this.taskCounts[this.selectedProcessus.id] = data.length;
        }
      },
      error: (err) => { this.errorMessage = err?.error?.message || 'Erreur chargement tâches'; }
    });
  }

  deleteTache(id: number) {
    if (!confirm('Supprimer cette tâche ?')) return;
    this.tacheService.delete(id).subscribe({
      next: () => this.loadTaches(),
      error: () => this.errorMessage = 'Erreur suppression'
    });
  }

  tachesSorted(): Tache[] {
    return [...this.taches].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }

  countByStatut(statut: string): number {
    return this.taches.filter(t => t.statut === statut).length;
  }

  progressPercent(): number {
    if (this.taches.length === 0) return 0;
    return Math.round((this.countByStatut('TERMINE') / this.taches.length) * 100);
  }
}