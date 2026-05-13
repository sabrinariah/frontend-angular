import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { Processus } from '../../models/processus.model';

@Component({
  selector: 'app-processus-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="page-wrapper">

    <!-- ====== Breadcrumb / Back ====== -->
    <div class="breadcrumb">
      <a routerLink="/processus" class="breadcrumb-link">
        <span>←</span> Retour à la liste
      </a>
    </div>

    <!-- ====== Form Container ====== -->
    <div class="form-container">

      <<div class="form-header">

  <div class="header-image-wrapper">
    <img
      src="assets/images/plane-background.jpg"
      alt="Gestion import export"
      class="header-image" />

    <div class="header-image-overlay">
      
    </div>
  </div>


  <div>
    <h1 class="form-title">
      {{ isEdit ? 'Modifier le processus' : 'Nouveau processus métier' }}
    </h1>
    <p class="form-subtitle">
      {{ isEdit
        ? 'Mettez à jour les informations du processus'
        : 'Créez un nouveau processus pour orchestrer vos tâches métier' }}
    </p>
  </div>
</div>
      <!-- Alerte erreur -->
      <div *ngIf="errorMessage" class="alert-danger">
        <span class="alert-icon">⚠️</span>
        {{ errorMessage }}
      </div>

      <!-- Form Card -->
      <form (ngSubmit)="save()" #form="ngForm" class="form-card">

        <!-- ============ SECTION 1 : INFORMATIONS PRINCIPALES ============ -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">1</span>
            <div>
              <h3 class="section-title">Informations principales</h3>
              <p class="section-desc">Identité et nature du processus</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label">
                <span class="label-icon">📌</span>
                Nom du processus
                <span class="required">*</span>
              </label>
              <input
                [(ngModel)]="processus.nom"
                name="nom"
                required
                placeholder="Ex: Import Client Premium 2024"
                class="form-input" />
              <span class="form-hint">Un nom clair et descriptif du processus</span>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">🏷️</span>
                Type de processus
                <span class="required">*</span>
              </label>
              <select
                [(ngModel)]="processus.typeProcessus"
                name="typeProcessus"
                required
                class="form-input">
                <option value="">-- Sélectionner --</option>
                <option value="import">📥 Import</option>
                <option value="export">📤 Export</option>
                <option value="transit">🚚 Transit</option>
                <option value="dedouanement">🛃 Dédouanement</option>
                <option value="entreposage">📦 Entreposage</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">⚡</span>
                Statut initial
              </label>
              <div class="toggle-wrapper">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    [(ngModel)]="processus.actif"
                    name="actif" />
                  <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label" [class.toggle-on]="processus.actif">
                  {{ processus.actif ? '✅ Actif' : '⏸️ Inactif' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ SECTION 2 : PÉRIODE ============ -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">2</span>
            <div>
              <h3 class="section-title">Période d'exécution</h3>
              <p class="section-desc">Dates de début et de fin prévues</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📅</span>
                Date de début
                <span class="required">*</span>
              </label>
              <input
                type="date"
                [(ngModel)]="processus.dateDebut"
                name="dateDebut"
                required
                class="form-input" />
            </div>

            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">🏁</span>
                Date de fin
              </label>
              <input
                type="date"
                [(ngModel)]="processus.dateFin"
                name="dateFin"
                class="form-input" />
              <span class="form-hint">Optionnelle - sera complétée à la clôture</span>
            </div>
          </div>

          <!-- Aperçu durée -->
          <div *ngIf="processus.dateDebut && processus.dateFin" class="duration-preview">
            <span class="duration-icon">⏱️</span>
            <span>Durée prévue : <strong>{{ calculateDuration() }}</strong></span>
          </div>
        </div>

        <!-- ============ SECTION 3 : DESCRIPTION (OPTIONNELLE) ============ -->
       

          <div class="form-grid">
            <div class="form-group full-width">
             
             
            </div>
          </div>
       

        <!-- ============ ACTIONS ============ -->
        <div class="form-actions">
          <a routerLink="/processus" class="btn btn-secondary">
            <span>←</span> Annuler
          </a>
          <button type="submit" [disabled]="!form.valid || loading" class="btn btn-primary">
            <span *ngIf="!loading">
              {{ isEdit ? '💾 Mettre à jour' : '✨ Créer le processus' }}
            </span>
            <span *ngIf="loading" class="loading-spinner"></span>
          </button>
        </div>

      </form>

      <!-- Info card -->
      <div class="info-card">
     
        <div>
          
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
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-700: #374151;
      --gray-900: #111827;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04);
      --shadow-lg: 0 10px 25px -5px rgba(0,0,0,0.1);
      --radius: 12px;
      --radius-lg: 16px;
    }

    .page-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fb 0%, #eef2ff 100%);
      padding: 30px 40px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* ====== BREADCRUMB ====== */
    .breadcrumb {
      max-width: 900px;
      margin: 0 auto 20px;
    }
    .breadcrumb-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--gray-500);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 14px;
      border-radius: 8px;
      transition: all 0.2s;
      background: white;
      box-shadow: var(--shadow-sm);
    }
    .breadcrumb-link:hover {
      color: var(--primary);
      background: var(--primary-light);
      transform: translateX(-2px);
    }

    /* ====== FORM CONTAINER ====== */
    .form-container {
      max-width: 900px;
      margin: 0 auto;
    }

    /* ====== HEADER ====== */
    .form-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
      padding: 24px;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
    }
    .form-header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--purple));
    }
.header-image-wrapper {
  width: 200px;
  height: 200px;
  border-radius: 18px;
  overflow: hidden;
  position: center;
  flex-shrink: 0;
  box-shadow: 0 18px 20px rgba(79,70,229,0.3);
}
.header-image {
  width: 100%;
  height: 150%;
  object-fit: cover;
  display: block;
}
.header-image-overlay {
  position: absolute;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;
}
.header-overlay-icon {
  font-size: 50px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
    .header-icon-big {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, var(--primary), var(--purple));
      border-radius: 18px;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px;
      box-shadow: 0 8px 20px rgba(79,70,229,0.3);
      flex-shrink: 0;
    }
    .form-title {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: var(--gray-900);
      letter-spacing: -0.5px;
    }
    .form-subtitle {
      margin: 4px 0 0;
      color: var(--gray-500);
      font-size: 14px;
    }

    /* ====== ALERT ====== */
    .alert-danger {
      background: var(--danger-light);
      color: var(--danger);
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 14px;
      border-left: 4px solid var(--danger);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .alert-icon { font-size: 18px; }

    /* ====== FORM CARD ====== */
    .form-card {
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    /* ====== SECTIONS ====== */
    .form-section {
      padding: 28px;
      border-bottom: 1px solid var(--gray-100);
    }
    .form-section:last-of-type { border-bottom: none; }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 22px;
    }
    .section-number {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--primary), var(--purple));
      color: white;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800;
      font-size: 15px;
      box-shadow: 0 4px 10px rgba(79,70,229,0.3);
      flex-shrink: 0;
    }
    .section-title {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: var(--gray-900);
    }
    .section-desc {
      margin: 3px 0 0;
      color: var(--gray-500);
      font-size: 13px;
    }

    /* ====== FORM GRID ====== */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .form-group { display: flex; flex-direction: column; }
    .form-group.full-width { grid-column: 1 / -1; }

    .form-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: var(--gray-700);
      margin-bottom: 8px;
    }
    .label-icon { font-size: 14px; }
    .required { color: var(--danger); margin-left: 2px; }

    .form-input {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid var(--gray-200);
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      box-sizing: border-box;
      background: white;
      color: var(--gray-900);
      transition: all 0.2s;
    }
    .form-input:hover { border-color: var(--gray-300); }
    .form-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(79,70,229,0.1);
    }
    .form-textarea {
      resize: vertical;
      min-height: 100px;
      font-family: inherit;
    }
    .form-hint {
      font-size: 12px;
      color: var(--gray-400);
      margin-top: 6px;
    }

    /* ====== TOGGLE SWITCH ====== */
    .toggle-wrapper {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      background: var(--gray-50);
      border: 1.5px solid var(--gray-200);
      border-radius: 10px;
      height: 49px;
      box-sizing: border-box;
    }
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
      flex-shrink: 0;
    }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--gray-300);
      transition: 0.3s;
      border-radius: 26px;
    }
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px; width: 20px;
      left: 3px; bottom: 3px;
      background: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .toggle-switch input:checked + .toggle-slider {
      background: linear-gradient(135deg, var(--success), #34d399);
    }
    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(22px);
    }
    .toggle-label {
      font-size: 14px;
      font-weight: 700;
      color: var(--gray-500);
      transition: color 0.2s;
    }
    .toggle-label.toggle-on { color: var(--success); }

    /* ====== DURATION PREVIEW ====== */
    .duration-preview {
      margin-top: 14px;
      padding: 10px 14px;
      background: linear-gradient(135deg, var(--primary-light), var(--purple-light));
      border-radius: 10px;
      font-size: 13px;
      color: var(--primary-dark);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .duration-icon { font-size: 16px; }

    /* ====== ACTIONS ====== */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 22px 28px;
      background: var(--gray-50);
      border-top: 1px solid var(--gray-100);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      box-shadow: 0 4px 12px rgba(79,70,229,0.3);
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(79,70,229,0.4);
    }
    .btn-secondary {
      background: white;
      color: var(--gray-700);
      border: 1.5px solid var(--gray-200);
    }
    .btn-secondary:hover {
      background: var(--gray-50);
      border-color: var(--gray-300);
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2.5px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ====== INFO CARD ====== */
    .info-card {
      margin-top: 20px;
      padding: 16px 20px;
      background: linear-gradient(135deg, #fef9c3, #fef3c7);
      border-radius: var(--radius);
      border-left: 4px solid var(--warning);
      display: flex;
      gap: 12px;
      font-size: 13px;
      color: #78350f;
      line-height: 1.5;
    }
    .info-icon { font-size: 20px; flex-shrink: 0; }

    /* ====== RESPONSIVE ====== */
    @media (max-width: 768px) {
      .page-wrapper { padding: 20px 16px; }
      .form-header { padding: 18px; gap: 14px; }
      .header-icon-big { width: 56px; height: 56px; font-size: 28px; }
      .form-title { font-size: 20px; }
      .form-section { padding: 20px; }
      .form-grid { grid-template-columns: 1fr; gap: 14px; }
      .form-actions { flex-direction: column-reverse; padding: 18px; }
      .btn { justify-content: center; width: 100%; }
    }
  `]
})
export class ProcessusFormComponent implements OnInit {
  private processusService = inject(ProcessusService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  processus: Partial<Processus> = {
    nom: '',
    typeProcessus: '',
    dateDebut: '',
    dateFin: '',
    actif: true,
    
  };

  isEdit = false;
  loading = false;
  errorMessage = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.loadProcessus(+id);
    }
  }

  loadProcessus(id: number) {
    this.processusService.getById(id).subscribe({
      next: (data) => {
        this.processus = { ...data };
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement : ' + (err?.error?.message || err.message);
      }
    });
  }

  save() {
    this.errorMessage = '';
    this.loading = true;

    const payload = this.processus as Processus;
    const obs = this.isEdit && this.processus.id
      ? this.processusService.update(this.processus.id, payload)
      : this.processusService.create(payload);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/processus']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || err?.error?.error || 'Erreur lors de l\'enregistrement';
      }
    });
  }

  calculateDuration(): string {
    if (!this.processus.dateDebut || !this.processus.dateFin) return '—';
    const debut = new Date(this.processus.dateDebut);
    const fin = new Date(this.processus.dateFin);
    const diffMs = fin.getTime() - debut.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Date de fin invalide';
    if (days === 0) return 'Même jour';
    if (days === 1) return '1 jour';
    if (days < 30) return `${days} jours`;
    if (days < 365) return `${Math.round(days / 30)} mois (${days} jours)`;
    return `${(days / 365).toFixed(1)} an(s) (${days} jours)`;
  }
}