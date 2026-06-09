import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { TacheService } from '../../core/services/tache.service';
import { RegleMetierService } from '../../core/services/regle.service';
import { Processus, Tache } from '../../models/processus.model';
import { RegleMetier } from '../../models/regle.model';
import {
  BpmnElement, BpmnEdge, BpmnDiagram,
  ChampDynamique, SubprocessDirect, RegleTransition
} from './processus-list.component';

@Component({
  selector: 'app-processus-workflow',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="wf-page">

  <!-- ═══ TOOLBAR ═══ -->
  <div class="wf-toolbar">
    <button class="wf-back-btn" (click)="goBack()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Retour
    </button>

    <div class="wf-title-block" *ngIf="processus">
      <div class="wf-process-name">{{ processus.nom }}</div>
      <div class="wf-meta">
        <span class="wf-type-badge">{{ processus.typeProcessus }}</span>
        <span class="wf-status-pill" [class.wf-actif]="processus.actif">
          <span class="wf-status-dot"></span>
          {{ processus.actif ? 'Actif' : 'Inactif' }}
        </span>
        <span class="wf-task-count">{{ taches.length }} tâche{{ taches.length > 1 ? 's' : '' }}</span>
      </div>
    </div>

    <div class="wf-toolbar-right">
      <button class="wf-new-task-btn" (click)="openNewTacheForm()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round"/>
        </svg>
        Nouvelle tâche
      </button>
      <button class="wf-export-btn" (click)="exportBpmn()" [disabled]="taches.length === 0">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 19H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 15V19M20 15V19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Exporter BPMN
      </button>
    </div>
  </div>

  <!-- ═══ TOASTS ═══ -->
  <div class="wf-toast-container">
    <div *ngFor="let t of toasts" [class]="'wf-toast wf-toast-' + t.type">
      <span class="wf-toast-icon">{{ t.type === 'success' ? '✅' : t.type === 'info' ? 'ℹ️' : t.type === 'warning' ? '⚠️' : '❌' }}</span>
      <div class="wf-toast-body">
        <div class="wf-toast-msg">{{ t.message }}</div>
        <div *ngIf="t.detail" class="wf-toast-detail">{{ t.detail }}</div>
      </div>
      <button class="wf-toast-close" (click)="removeToast(t.id)">✕</button>
    </div>
  </div>

  <!-- ═══ ÉDITEUR TÂCHE (création + édition) ═══ -->
  <div *ngIf="formTaskOpen" class="wf-editor-overlay" (click)="closeTaskForm()">
    <div class="wf-editor-panel" (click)="$event.stopPropagation()">

      <!-- En-tête -->
      <div class="wf-ed-header">
        <div class="wf-ed-title-row">
          <span class="wf-ed-nom">{{ isNewTask ? 'Nouvelle tâche' : formTaskOpen.nom }}</span>
          <span class="wf-ed-type-badge">{{ formTaskOpen.type }}</span>
        </div>
        <div class="wf-ed-actions">
          <button *ngIf="!isNewTask && formTaskOpen.id" (click)="confirmDeleteTache(formTaskOpen)" class="wf-btn-danger-sm">Supprimer</button>
          <button (click)="closeTaskForm()" class="wf-ed-close">✕</button>
        </div>
      </div>

      <div *ngIf="formError" class="wf-ed-error">{{ formError }}</div>

      <!-- Stepper -->
      <div class="wf-stepper">
        <div class="wf-step" [class.wf-step-active]="formStep === 1" [class.wf-step-done]="formStep > 1" (click)="goToStep(1)">
          <div class="wf-step-circle">{{ formStep > 1 ? '✓' : '1' }}</div>
          <span class="wf-step-label">Informations</span>
        </div>
        <div class="wf-step-line" [class.wf-step-line-done]="formStep > 1"></div>
        <div class="wf-step" [class.wf-step-active]="formStep === 2" [class.wf-step-done]="formStep > 2" (click)="goToStep(2)">
          <div class="wf-step-circle">{{ formStep > 2 ? '✓' : '2' }}</div>
          <span class="wf-step-label">Champs</span>
        </div>
        <div class="wf-step-line" [class.wf-step-line-done]="formStep > 2"></div>
        <div class="wf-step" [class.wf-step-active]="formStep === 3" [class.wf-step-done]="formStep > 3" (click)="goToStep(3)">
          <div class="wf-step-circle">{{ formStep > 3 ? '✓' : '3' }}</div>
          <span class="wf-step-label">Règles</span>
        </div>
        <div class="wf-step-line" [class.wf-step-line-done]="formStep > 3"></div>
        <div class="wf-step" [class.wf-step-active]="formStep === 4" (click)="goToStep(4)">
          <div class="wf-step-circle">4</div>
          <span class="wf-step-label">Sous-processus</span>
        </div>
      </div>

      <!-- Corps -->
      <div class="wf-ed-body">

        <!-- ÉTAPE 1 : INFORMATIONS -->
        <div *ngIf="formStep === 1" class="wf-ed-section">
          <div class="wf-ed-sec-header"><span>📋</span><span class="wf-ed-sec-title">Informations générales</span></div>
          <div class="wf-ed-sec-body">
            <div class="wf-ed-group-full">
              <label class="wf-ed-label">Nom <span class="wf-ed-req">*</span></label>
              <input [(ngModel)]="formTaskOpen.nom" class="wf-ed-input" placeholder="Ex: Vérification documents"/>
            </div>
            <div class="wf-ed-group-full">
              <label class="wf-ed-label">Description</label>
              <textarea [(ngModel)]="formTaskOpen.description" rows="2" class="wf-ed-input wf-ed-textarea"></textarea>
            </div>
            <div class="wf-ed-row">
              <div class="wf-ed-group">
                <label class="wf-ed-label">Type</label>
                <select [(ngModel)]="formTaskOpen.type" class="wf-ed-input">
                  <option value="HUMAINE">HUMAINE</option>
                  <option value="SYSTEME">SYSTÈME</option>
                </select>
              </div>
              <div class="wf-ed-group">
                <label class="wf-ed-label">Statut</label>
                <select [(ngModel)]="formTaskOpen.statut" class="wf-ed-input">
                  <option value="EN_ATTENTE">EN_ATTENTE</option>
                  <option value="EN_COURS">EN_COURS</option>
                  <option value="TERMINE">TERMINE</option>
                </select>
              </div>
              <div class="wf-ed-group">
                <label class="wf-ed-label">Ordre <span class="wf-ed-req">*</span></label>
                <input type="number" [(ngModel)]="formTaskOpen.ordre" class="wf-ed-input" min="1"/>
              </div>
              <div class="wf-ed-group">
                <label class="wf-ed-label">Assigné à</label>
                <input [(ngModel)]="formTaskOpen.assignee" class="wf-ed-input" placeholder="Personne / service"/>
              </div>
            </div>
          </div>
        </div>

        <!-- ÉTAPE 2 : CHAMPS -->
        <div *ngIf="formStep === 2" class="wf-ed-section">
          <div class="wf-ed-sec-header">
            <span>📝</span>
            <span class="wf-ed-sec-title">Champs <span class="wf-ed-sec-count">{{ currentChamps.length }}</span></span>
            <button (click)="addChamp()" class="wf-btn-sec-sm">+ Ajouter</button>
          </div>
          <div class="wf-ed-sec-body">
            <div *ngFor="let c of currentChamps; let i = index" class="wf-param-card">
              <div class="wf-param-head">
                <strong>Champ #{{ i + 1 }}</strong>
                <button (click)="removeChamp(i)" class="wf-mini-btn wf-mini-danger">🗑️</button>
              </div>
              <div class="wf-ed-row">
                <div class="wf-ed-group"><label>Libellé *</label><input [(ngModel)]="c.label" class="wf-ed-input"/></div>
                <div class="wf-ed-group"><label>Identifiant *</label><input [(ngModel)]="c.id" class="wf-ed-input"/></div>
                <div class="wf-ed-group">
                  <label>Type</label>
                  <select [(ngModel)]="c.type" class="wf-ed-input">
                    <option value="string">Texte court</option>
                    <option value="textarea">Texte long</option>
                    <option value="number">Nombre</option>
                    <option value="date">Date</option>
                    <option value="boolean">Oui/Non</option>
                    <option value="enum">Liste de choix</option>
                  </select>
                </div>
                <div class="wf-ed-group">
                  <label><input type="checkbox" [(ngModel)]="c.required"/> Obligatoire</label>
                </div>
              </div>
              <div *ngIf="c.type === 'enum'" style="margin-top:6px">
                <label>Options (virgule)</label>
                <input [ngModel]="enumOptionsToString(c)" (ngModelChange)="stringToEnumOptions(c, $event)" class="wf-ed-input"/>
              </div>
            </div>
            <div *ngIf="currentChamps.length === 0" class="wf-empty-mini">Aucun champ. Cliquez sur "+ Ajouter".</div>
          </div>
        </div>

        <!-- DONNÉES (étape 2, tâche existante avec champs) -->
        <div *ngIf="formStep === 2 && !isNewTask && currentChamps.length > 0" class="wf-ed-section">
          <div class="wf-ed-sec-header"><span>💾</span><span class="wf-ed-sec-title">Données</span></div>
          <div class="wf-ed-sec-body">
            <div class="wf-info-box">💾 Remplissez les valeurs. La règle déterminera la tâche suivante.</div>
            <div *ngFor="let field of currentChamps" class="wf-dyn-field">
              <label [class.wf-required]="field.required">{{ field.label }}<span *ngIf="field.required" class="wf-req-star">*</span></label>
              <input *ngIf="field.type === 'string'"   [(ngModel)]="formValues[field.id]" class="wf-ed-input"/>
              <textarea *ngIf="field.type === 'textarea'" [(ngModel)]="formValues[field.id]" rows="2" class="wf-ed-input wf-ed-textarea"></textarea>
              <input *ngIf="field.type === 'date'"    type="date"   [(ngModel)]="formValues[field.id]" class="wf-ed-input"/>
              <input *ngIf="field.type === 'number'"  type="number" [(ngModel)]="formValues[field.id]" class="wf-ed-input"/>
              <select *ngIf="field.type === 'boolean'" [(ngModel)]="formValues[field.id]" class="wf-ed-input">
                <option [ngValue]="true">Oui</option><option [ngValue]="false">Non</option>
              </select>
              <select *ngIf="field.type === 'enum'" [(ngModel)]="formValues[field.id]" class="wf-ed-input">
                <option *ngFor="let opt of field.options" [ngValue]="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div *ngIf="getEvaluationResult() as ev" class="wf-match-box" [class.wf-match-non]="!ev.match">
              <div class="wf-match-header">🎯 {{ ev.match ? 'Règle VALIDÉE — branche SI VRAI' : 'Règle NON validée — branche SINON' }}</div>
              <div class="wf-match-rule">{{ ev.regle.nom || 'Règle sans nom' }}</div>
              <div style="font-size:18px;color:#94a3b8;margin:3px 0">↓</div>
              <div class="wf-match-target" *ngIf="ev.match">
                ✓ Passage à :
                <ng-container *ngIf="(ev.regle.tacheOuiOrdres?.length || 0) > 1"><strong>{{ ev.regle.tacheOuiOrdres?.length }} tâches en parallèle</strong></ng-container>
                <ng-container *ngIf="(ev.regle.tacheOuiOrdres?.length || 0) === 1"><strong>#{{ ev.regle.tacheOuiOrdres![0] }} - {{ getTacheNameByOrdre(ev.regle.tacheOuiOrdres![0]) }}</strong></ng-container>
                <ng-container *ngIf="(ev.regle.tacheOuiOrdres?.length || 0) === 0"><span *ngIf="getTacheSuivante() as ts"><strong>#{{ ts.ordre }} - {{ ts.nom }}</strong></span><em *ngIf="!getTacheSuivante()">Fin du processus</em></ng-container>
              </div>
              <div class="wf-match-target" *ngIf="!ev.match">✗ Passage à : <strong *ngIf="ev.regle.tacheSinonOrdre && ev.regle.tacheSinonOrdre > 0">#{{ ev.regle.tacheSinonOrdre }} - {{ getTacheNameByOrdre(ev.regle.tacheSinonOrdre) }}</strong><em *ngIf="!ev.regle.tacheSinonOrdre || ev.regle.tacheSinonOrdre === 0">Fin du processus</em></div>
            </div>
            <div *ngIf="currentRegles.length === 0" class="wf-no-match">ℹ️ Aucune règle — tâche suivante dans l'ordre.</div>
          </div>
        </div>

        <!-- ÉTAPE 3 : RÈGLES -->
        <div *ngIf="formStep === 3" class="wf-ed-section">
          <div class="wf-ed-sec-header">
            <span>⚙️</span>
            <span class="wf-ed-sec-title">Règles <span class="wf-ed-sec-count">{{ currentRegles.length }}</span></span>
            <button (click)="addRegle()" class="wf-btn-sec-sm">+ Ajouter</button>
          </div>
          <div class="wf-ed-sec-body">
            <div *ngFor="let r of currentRegles; let ri = index" class="wf-rule-card">
              <div class="wf-rule-head">
                <input [(ngModel)]="r.nom" class="wf-ed-input" placeholder="Nom de la règle"/>
                <button (click)="removeRegle(ri)" class="wf-mini-btn wf-mini-danger">🗑️</button>
              </div>
              <div class="wf-mode-toggle">
                <button type="button" (click)="toggleModeRegle(r, 'simple')" [class.wf-mode-active]="r.modeRegle === 'simple'" class="wf-mode-btn">⚙️ Règle simple</button>
                <button type="button" (click)="toggleModeRegle(r, 'metier')" [class.wf-mode-active]="r.modeRegle === 'metier'" class="wf-mode-btn" [disabled]="reglesMetierDisponibles.length === 0">📜 Règle métier ({{ reglesMetierDisponibles.length }})</button>
              </div>
              <div class="wf-rule-body">
                <!-- MODE SIMPLE -->
                <div *ngIf="r.modeRegle === 'simple'">
                  <div class="wf-rule-line">
                    <span class="wf-tag-if">SI</span>
                    <select [(ngModel)]="r.champId" class="wf-ed-input wf-inline">
                      <option value="">-- Choisir un champ --</option>
                      <option *ngFor="let ch of currentChamps" [value]="ch.id">{{ ch.label }}</option>
                    </select>
                    <select [(ngModel)]="r.operateur" class="wf-ed-input wf-inline">
                      <option value="==">est égal à</option>
                      <option value="!=">est différent de</option>
                      <option value=">">supérieur à</option>
                      <option value="<">inférieur à</option>
                      <option value=">=">sup. ou égal</option>
                      <option value="<=">inf. ou égal</option>
                      <option value="contains">contient</option>
                      <option value="isEmpty">est vide</option>
                      <option value="isNotEmpty">n'est pas vide</option>
                    </select>
                    <input *ngIf="r.operateur !== 'isEmpty' && r.operateur !== 'isNotEmpty'" [(ngModel)]="r.valeur" class="wf-ed-input wf-inline" placeholder="Valeur"/>
                  </div>
                </div>
                <!-- MODE MÉTIER -->
                <div *ngIf="r.modeRegle === 'metier'" class="wf-metier-section">
                  <div class="wf-metier-header">
                    <span class="wf-tag-if">SI</span>
                    <span>{{ (r.regleMetierIds?.length || 0) }} règle(s) sélectionnée(s)</span>
                    <div *ngIf="(r.regleMetierIds?.length || 0) > 1" style="display:flex;gap:4px">
                      <button type="button" (click)="r.logiqueCombinaison = 'ET'" [class.wf-logiq-active]="r.logiqueCombinaison === 'ET'" class="wf-logiq-btn">ET</button>
                      <button type="button" (click)="r.logiqueCombinaison = 'OU'" [class.wf-logiq-active]="r.logiqueCombinaison === 'OU'" class="wf-logiq-btn">OU</button>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <label style="font-size:12px;font-weight:600">Filtrer :</label>
                    <select [(ngModel)]="filtreCategorieRegle" class="wf-ed-input wf-inline">
                      <option value="TOUS">Toutes</option>
                      <option *ngFor="let cat of getCategoriesDistinctes()" [value]="cat">{{ iconCategorie(cat) }} {{ cat }}</option>
                    </select>
                  </div>
                  <div class="wf-rm-list">
                    <div *ngFor="let rm of getReglesMetierFiltrees()" class="wf-rm-item" [class.wf-rm-selected]="isRegleMetierSelected(r, rm.id)" (click)="rm.id && toggleRegleMetier(r, rm.id)">
                      <input type="checkbox" [checked]="isRegleMetierSelected(r, rm.id)" (click)="$event.stopPropagation()" (change)="rm.id && toggleRegleMetier(r, rm.id)"/>
                      <span class="wf-rm-icon" [style.background]="couleurCategorie(rm.categorie?.type) + '22'" [style.color]="couleurCategorie(rm.categorie?.type)">{{ iconCategorie(rm.categorie?.type) }}</span>
                      <div class="wf-rm-body">
                        <div><strong>{{ rm.code }}</strong> — {{ rm.nom }}</div>
                        <div style="font-size:11px;color:#64748b">{{ rm.categorie?.type || '—' }} · {{ rm.conditions?.length || 0 }} condition(s) · ⚡ {{ rm.action }}</div>
                      </div>
                    </div>
                    <div *ngIf="getReglesMetierFiltrees().length === 0" class="wf-empty-mini">Aucune règle métier.</div>
                  </div>
                  <div *ngIf="getChampsManquantsRegleMetier(r).length > 0" style="color:#d97706;font-size:12px;margin-top:6px">
                    ⚠️ Champs manquants : <strong>{{ getChampsManquantsRegleMetier(r).join(', ') }}</strong>
                  </div>
                  <div style="margin-top:10px">
                    <label style="font-size:12px;font-weight:600">⚡ Action douanière :</label>
                    <input [(ngModel)]="r.actionDouaniere" class="wf-ed-input" placeholder="Ex: CIRCUIT_VERT..."/>
                    <div *ngIf="getActionsSuggestionsForRegle(r).length > 0" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
                      <button *ngFor="let act of getActionsSuggestionsForRegle(r)" type="button" (click)="r.actionDouaniere = act" class="wf-sugg-chip">{{ act }}</button>
                    </div>
                  </div>
                </div>
                <!-- SI VRAI / SINON -->
                <div class="wf-si-sinon">
                  <div class="wf-branch wf-branch-oui">
                    <div class="wf-branch-header">
                      <span class="wf-tag-oui">✓ SI VRAI</span>
                      <span style="font-size:13px;color:#185fa5">→ Aller à :</span>
                    </div>
                    <div class="wf-multi-cible-list">
                      <div *ngFor="let t of autresTaches()" class="wf-multi-cible-item" [class.wf-multi-cible-sel]="isOuiCibleSelected(r, t.ordre!)" (click)="toggleOuiCible(r, t.ordre!)">
                        <input type="checkbox" [checked]="isOuiCibleSelected(r, t.ordre!)" (click)="$event.stopPropagation()" (change)="toggleOuiCible(r, t.ordre!)"/>
                        <span class="wf-cible-ord">#{{ t.ordre }}</span>
                        <span class="wf-cible-nom">{{ t.nom }}</span>
                        <span class="wf-cible-type">{{ t.type }}</span>
                      </div>
                      <div *ngIf="autresTaches().length === 0" class="wf-empty-mini">Aucune autre tâche.</div>
                    </div>
                    <div style="font-size:12px;color:#475569;margin-top:4px">Cible(s) : <strong>{{ getOuiCiblesLabel(r) }}</strong></div>
                  </div>
                  <div class="wf-branch wf-branch-non">
                    <span class="wf-tag-non">✗ SINON</span>
                    <span style="font-size:13px;color:#b91c1c">→ Aller à :</span>
                    <select [(ngModel)]="r.tacheSinonOrdre" class="wf-ed-input wf-inline">
                      <option [ngValue]="0">-- Fin du processus --</option>
                      <option *ngFor="let t of autresTaches()" [ngValue]="t.ordre">#{{ t.ordre }} - {{ t.nom }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div *ngIf="currentRegles.length === 0" class="wf-empty-mini">Aucune règle. Cliquez sur "+ Ajouter".</div>
          </div>
        </div>

        <!-- ÉTAPE 4 : SOUS-PROCESSUS -->
        <div *ngIf="formStep === 4" class="wf-ed-section">
          <div class="wf-ed-sec-header">
            <span>🔀</span>
            <span class="wf-ed-sec-title">Sous-processus <span class="wf-ed-sec-count">{{ currentSubprocess.taches.length }}</span></span>
            <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;margin-left:auto">
              <input type="checkbox" [(ngModel)]="currentSubprocess.actif"/> Activer
            </label>
          </div>
          <div class="wf-ed-sec-body">
            <div class="wf-ed-group-full">
              <label class="wf-ed-label">Nom du sous-processus</label>
              <input [(ngModel)]="currentSubprocess.nom" class="wf-ed-input" placeholder="Ex: Contrôle documentaire"/>
            </div>
            <div class="wf-sp-list">
              <div *ngFor="let st of currentSubprocess.taches; let i = index; trackBy: trackByIndex" class="wf-sp-row">
                <span class="wf-sp-idx">{{ i + 1 }}</span>
                <input [(ngModel)]="st.nom" class="wf-ed-input" placeholder="Nom de la sous-tâche"/>
                <select [(ngModel)]="st.type" class="wf-ed-input" style="min-width:100px">
                  <option value="HUMAINE">HUMAINE</option>
                  <option value="SYSTEME">SYSTEME</option>
                </select>
                <select *ngIf="currentRegles.length > 0" [(ngModel)]="st.branche" class="wf-ed-input" style="min-width:100px">
                  <option value="">Parallèle</option>
                  <option value="OUI">Branche OUI</option>
                  <option value="NON">Branche NON</option>
                </select>
                <input [(ngModel)]="st.assignee" class="wf-ed-input" placeholder="Assigné à"/>
                <button type="button" class="wf-mini-btn wf-mini-danger" (click)="removeSubprocessDirectTache(i)">🗑️</button>
              </div>
              <div *ngIf="!currentSubprocess.taches || currentSubprocess.taches.length === 0" class="wf-empty-mini">Aucune sous-tâche.</div>
            </div>
            <button type="button" class="wf-btn-sec-sm" style="margin-top:8px" (click)="addSubprocessDirectTache()">+ Ajouter une sous-tâche</button>
          </div>
        </div>

      </div><!-- fin corps -->

      <!-- Pied -->
      <div class="wf-ed-footer">
        <button (click)="closeTaskForm()" class="wf-btn-secondary">Annuler</button>
        <button *ngIf="formStep > 1" (click)="prevFormStep()" class="wf-btn-step-prev">← Précédent</button>
        <div style="flex:1;text-align:center;font-size:12px;color:#94a3b8">Étape {{ formStep }} / 4</div>
        <button *ngIf="formStep < 4" (click)="nextFormStep()" class="wf-btn-step-next" [disabled]="formStep === 1 && !formTaskOpen!.nom.trim()">Suivant →</button>
        <button *ngIf="formStep === 4" (click)="saveTaskForm()" class="wf-btn-primary-ed">{{ isNewTask ? '✓ Créer' : '💾 Enregistrer' }}</button>
      </div>

    </div>
  </div>

  <!-- ═══ CONFIRMATION SUPPRESSION ═══ -->
  <div *ngIf="tacheToDelete" class="wf-editor-overlay" (click)="cancelDeleteTache()">
    <div class="wf-confirm-box" (click)="$event.stopPropagation()">
      <div style="font-size:24px;margin-bottom:10px">🗑️</div>
      <div style="font-weight:700;font-size:15px;margin-bottom:6px">Supprimer cette tâche ?</div>
      <div style="color:#64748b;font-size:13px;margin-bottom:18px">« {{ tacheToDelete.nom }} »</div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button (click)="cancelDeleteTache()" class="wf-btn-secondary" [disabled]="deleting">Annuler</button>
        <button (click)="executeDeleteTache()" class="wf-btn-danger" [disabled]="deleting">
          <span *ngIf="!deleting">Supprimer</span>
          <span *ngIf="deleting" class="wf-spinner-sm"></span>
        </button>
      </div>
    </div>
  </div>

  <!-- ═══ ÉTATS ═══ -->
  <div *ngIf="loading" class="wf-state">
    <div class="wf-spinner"></div>
    <p>Chargement du diagramme...</p>
  </div>

  <div *ngIf="!loading && error" class="wf-state wf-error-state">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#ef4444" stroke-width="1.8"/>
      <path d="M12 8V12M12 16h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <p>{{ error }}</p>
    <button class="wf-back-btn" (click)="goBack()">Retour à la liste</button>
  </div>

  <div *ngIf="!loading && !error && taches.length === 0" class="wf-state">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="9" rx="2" stroke="#94a3b8" stroke-width="1.8"/>
      <rect x="14" y="3" width="7" height="5" rx="2" stroke="#94a3b8" stroke-width="1.8"/>
      <rect x="14" y="12" width="7" height="9" rx="2" stroke="#94a3b8" stroke-width="1.8"/>
      <rect x="3" y="16" width="7" height="5" rx="2" stroke="#94a3b8" stroke-width="1.8"/>
    </svg>
    <p>Ce processus ne contient aucune tâche.</p>
  </div>

  <!-- ═══ CANVAS SVG ═══ -->
  <div *ngIf="!loading && !error && taches.length > 0" class="wf-canvas">
    <div class="wf-hint">Cliquez sur une tâche pour l'éditer</div>
    <div class="wf-svg-scroll">
      <svg
        [attr.width]="bpmnDiagram.viewWidth"
        [attr.height]="bpmnDiagram.viewHeight"
        [attr.viewBox]="'0 0 ' + bpmnDiagram.viewWidth + ' ' + bpmnDiagram.viewHeight"
        xmlns="http://www.w3.org/2000/svg"
        class="wf-svg">

        <defs>
          <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#64748b"/>
          </marker>
          <marker id="wf-arrow-oui" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#16a34a"/>
          </marker>
          <marker id="wf-arrow-non" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#dc2626"/>
          </marker>
          <pattern id="wf-dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#e2e8f0"/>
          </pattern>
        </defs>

        <rect x="0" y="0" [attr.width]="bpmnDiagram.viewWidth" [attr.height]="bpmnDiagram.viewHeight" fill="white"/>
        <rect x="0" y="0" [attr.width]="bpmnDiagram.viewWidth" [attr.height]="bpmnDiagram.viewHeight"
              fill="url(#wf-dotGrid)" opacity="0.5"/>

        <text x="20" y="26" font-size="11" fill="#94a3b8"
              font-family="'Inter', sans-serif" font-weight="700" letter-spacing="1">
          PROCESSUS : {{ processus?.nom | uppercase }}
        </text>

        <!-- ARÊTES -->
        <g *ngFor="let edge of bpmnDiagram.edges">
          <ng-container *ngIf="getEdgePath(edge) as ep">
            <path [attr.d]="ep.d" fill="none"
                  [attr.stroke]="getEdgeColor(edge)"
                  [attr.stroke-width]="getEdgeStrokeWidth(edge)"
                  [attr.stroke-dasharray]="getEdgeDashArray(edge)"
                  stroke-linecap="round" stroke-linejoin="round"
                  [attr.marker-end]="getEdgeMarker(edge)"/>
            <g *ngIf="edge.label">
              <rect [attr.x]="ep.labelX - (edge.label!.length * 3.5 + 8)"
                    [attr.y]="ep.labelY - 10"
                    [attr.width]="edge.label!.length * 7 + 16"
                    height="20" rx="10" fill="white"
                    [attr.stroke]="getEdgeColor(edge)" stroke-width="1.5"/>
              <text [attr.x]="ep.labelX" [attr.y]="ep.labelY"
                    text-anchor="middle" dominant-baseline="central"
                    font-size="11" [attr.fill]="getEdgeColor(edge)"
                    font-family="'Inter', sans-serif" font-weight="700">
                {{ truncate(edge.label!, 24) }}
              </text>
            </g>
          </ng-container>
        </g>

        <!-- ÉLÉMENTS -->
        <g *ngFor="let el of bpmnDiagram.elements">

          <!-- DÉBUT -->
          <g *ngIf="el.type === 'startEvent'">
            <circle [attr.cx]="el.x + el.width/2" [attr.cy]="el.y + el.height/2"
                    r="26" fill="#16a34a" opacity="0.12"/>
            <circle [attr.cx]="el.x + el.width/2" [attr.cy]="el.y + el.height/2"
                    [attr.r]="el.width/2" fill="#16a34a"/>
            <polygon
              [attr.points]="(el.x + el.width/2 - 6) + ',' + (el.y + el.height/2 - 8) + ' ' +
                             (el.x + el.width/2 - 6) + ',' + (el.y + el.height/2 + 8) + ' ' +
                             (el.x + el.width/2 + 8) + ',' + (el.y + el.height/2)"
              fill="white"/>
            <text [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height + 20"
                  text-anchor="middle" font-size="11" fill="#0a1929"
                  font-family="'Inter', sans-serif" font-weight="700" letter-spacing="0.5">DÉBUT</text>
          </g>

          <!-- FIN -->
          <g *ngIf="el.type === 'endEvent'">
            <circle [attr.cx]="el.x + el.width/2" [attr.cy]="el.y + el.height/2"
                    [attr.r]="el.width/2" fill="white" stroke="#0a1929" stroke-width="3"/>
            <circle [attr.cx]="el.x + el.width/2" [attr.cy]="el.y + el.height/2"
                    [attr.r]="el.width/2 - 6" fill="#0a1929"/>
            <text [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height + 20"
                  text-anchor="middle" font-size="11" fill="#0a1929"
                  font-family="'Inter', sans-serif" font-weight="700" letter-spacing="0.5">FIN</text>
          </g>

          <!-- SOUS-TÂCHE (lane=1) -->
          <g *ngIf="el.type === 'task' && el.lane === 1">
            <rect [attr.x]="el.x" [attr.y]="el.y"
                  [attr.width]="el.width" [attr.height]="el.height"
                  rx="8" fill="#f0f9ff" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="5,3"/>
            <text [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height/2 - 6"
                  text-anchor="middle" font-size="11" font-weight="600"
                  font-family="'Inter', sans-serif" fill="#0369a1">
              {{ truncate(el.label, 16) }}
            </text>
            <text [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height/2 + 10"
                  text-anchor="middle" font-size="9" fill="#0ea5e9"
                  font-family="'Inter', sans-serif">{{ el.sublabel }}</text>
          </g>

          <!-- TÂCHE NORMALE -->
          <g *ngIf="el.type === 'task' && el.lane !== 1"
             style="cursor:pointer"
             (click)="el.tache && openTaskForm(el.tache)">
            <rect [attr.x]="el.x" [attr.y]="el.y"
                  [attr.width]="el.width" [attr.height]="el.height"
                  rx="8" fill="white"
                  [attr.stroke]="getTaskStroke(el.tache)" stroke-width="2"/>
            <rect [attr.x]="el.x" [attr.y]="el.y"
                  width="5" [attr.height]="el.height"
                  [attr.fill]="getTaskStroke(el.tache)" rx="8"/>
            <rect [attr.x]="el.x + 3" [attr.y]="el.y"
                  width="2" [attr.height]="el.height"
                  [attr.fill]="getTaskStroke(el.tache)"/>
            <circle [attr.cx]="el.x + 22" [attr.cy]="el.y + 20" r="11"
                    [attr.fill]="getTaskStroke(el.tache)"/>
            <text [attr.x]="el.x + 22" [attr.y]="el.y + 24"
                  text-anchor="middle" font-size="11" fill="white" font-weight="800"
                  font-family="'Inter', sans-serif">{{ el.tache?.ordre }}</text>
            <text [attr.x]="el.x + el.width - 10" [attr.y]="el.y + 22"
                  text-anchor="end" font-size="9" fill="#64748b" font-weight="700"
                  font-family="'Inter', sans-serif" letter-spacing="0.5">
              {{ el.tache?.type }}
            </text>
            <text [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height/2 + 4"
                  text-anchor="middle" font-size="13" font-weight="600"
                  font-family="'Inter', sans-serif" fill="#0a1929">
              {{ truncate(el.label, 20) }}
            </text>
            <text *ngIf="el.tache?.assignee"
                  [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height/2 + 20"
                  text-anchor="middle" font-size="10" fill="#64748b"
                  font-family="'Inter', sans-serif">
              👤 {{ truncate(el.tache!.assignee!, 18) }}
            </text>
            <text [attr.x]="el.x + el.width - 12" [attr.y]="el.y + el.height - 10"
                  text-anchor="end" font-size="14">
              {{ el.tache?.statut === 'TERMINE' ? '✅' : el.tache?.statut === 'EN_COURS' ? '⏳' : '⚪' }}
            </text>
          </g>

          <!-- GATEWAY -->
          <g *ngIf="el.type === 'gateway'">
            <polygon [attr.points]="getDiamondPoints(el.x, el.y, el.width, el.height)"
                     fill="white" stroke="#0a1929" stroke-width="2"/>
            <text [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height/2 + 6"
                  text-anchor="middle" font-size="20" fill="#0a1929" font-weight="700"
                  font-family="'Inter', sans-serif">{{ el.question ? '?' : '+' }}</text>
            <text *ngIf="el.question"
                  [attr.x]="el.x + el.width/2" [attr.y]="el.y + el.height + 20"
                  text-anchor="middle" font-size="11" fill="#0a1929"
                  font-family="'Inter', sans-serif" font-weight="600">
              {{ truncate(el.question, 26) }}
            </text>
          </g>

        </g>
      </svg>
    </div>
  </div>

</div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; background: #f8fafc; }

    .wf-page { display: flex; flex-direction: column; height: 100%; }

    /* ── TOOLBAR ── */
    .wf-toolbar {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 24px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .wf-back-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px;
      background: #f1f5f9; border: 1px solid #e2e8f0;
      border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      color: #475569; cursor: pointer;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .wf-back-btn:hover { background: #e2e8f0; color: #1e293b; }

    .wf-title-block { flex: 1; min-width: 0; }
    .wf-process-name {
      font-size: 1.1rem; font-weight: 700; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .wf-meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap; }

    .wf-type-badge {
      background: #e6f1fb; color: #185fa5;
      font-size: 0.72rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.06em;
      padding: 2px 8px; border-radius: 10px;
    }
    .wf-status-pill {
      display: flex; align-items: center; gap: 5px;
      font-size: 0.75rem; font-weight: 600; color: #94a3b8;
    }
    .wf-status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #94a3b8;
    }
    .wf-status-pill.wf-actif { color: #16a34a; }
    .wf-status-pill.wf-actif .wf-status-dot {
      background: #16a34a;
      box-shadow: 0 0 6px #16a34a;
      animation: wfPulse 2s ease-in-out infinite;
    }
    @keyframes wfPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

    .wf-task-count { font-size: 0.78rem; color: #64748b; }

    .wf-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

    .wf-new-task-btn {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 16px;
      background: #16a34a; color: #fff;
      border: none; border-radius: 8px;
      font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
      white-space: nowrap;
    }
    .wf-new-task-btn:hover { background: #15803d; }

    .wf-export-btn {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 16px;
      background: #185fa5; color: #fff;
      border: none; border-radius: 8px;
      font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
      white-space: nowrap;
    }
    .wf-export-btn:hover:not(:disabled) { background: #1565c0; }
    .wf-export-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* ── STATES ── */
    .wf-state {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 14px; color: #94a3b8;
      font-size: 0.95rem; padding: 40px;
    }
    .wf-error-state { color: #ef4444; }

    .wf-spinner {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #185fa5;
      border-radius: 50%;
      animation: wfSpin 0.8s linear infinite;
    }
    @keyframes wfSpin { to { transform: rotate(360deg); } }

    /* ── CANVAS ── */
    .wf-canvas {
      flex: 1; display: flex; flex-direction: column;
      overflow: hidden; padding: 16px 20px 20px;
    }

    .wf-hint {
      font-size: 0.72rem; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.08em;
      font-weight: 600; margin-bottom: 10px;
    }

    .wf-svg-scroll {
      flex: 1; overflow: auto;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: white;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    .wf-svg { display: block; }

    /* ── MODAL ── */
    .wf-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(15,23,42,0.45);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .wf-modal {
      background: #fff; border-radius: 16px;
      width: 100%; max-width: 560px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      display: flex; flex-direction: column;
      max-height: 90vh;
    }
    .wf-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .wf-modal-title {
      display: flex; align-items: center; gap: 14px;
    }
    .wf-modal-icon {
      width: 42px; height: 42px; border-radius: 10px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .wf-modal-title h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #0f172a; }
    .wf-modal-title p  { margin: 2px 0 0; font-size: 0.78rem; color: #94a3b8; }
    .wf-modal-close {
      width: 32px; height: 32px; border-radius: 8px;
      border: 1px solid #e2e8f0; background: #f8fafc;
      color: #64748b; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .wf-modal-close:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

    .wf-modal-error {
      margin: 0 24px 0;
      padding: 10px 14px;
      background: #fef2f2; border: 1px solid #fca5a5;
      border-radius: 8px; color: #dc2626;
      font-size: 0.83rem; margin-top: 12px;
    }

    .wf-modal-body {
      padding: 20px 24px;
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 14px; overflow-y: auto;
    }
    .wf-field { display: flex; flex-direction: column; gap: 5px; }
    .wf-field-full { grid-column: 1 / -1; }
    .wf-label { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .wf-req { color: #ef4444; }
    .wf-input {
      padding: 9px 12px;
      border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #0f172a;
      outline: none; transition: border-color 0.15s;
      font-family: inherit; background: #fff; width: 100%; box-sizing: border-box;
    }
    .wf-input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
    .wf-textarea { resize: vertical; min-height: 70px; }

    .wf-modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
    }
    .wf-btn-secondary {
      padding: 9px 18px; border-radius: 8px;
      border: 1px solid #e2e8f0; background: #f8fafc;
      color: #475569; font-size: 0.875rem; font-weight: 500;
      cursor: pointer; transition: background 0.15s;
    }
    .wf-btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
    .wf-btn-primary {
      padding: 9px 20px; border-radius: 8px;
      border: none; background: #16a34a; color: #fff;
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
      display: flex; align-items: center; gap: 6px; min-width: 130px; justify-content: center;
    }
    .wf-btn-primary:hover:not(:disabled) { background: #15803d; }
    .wf-btn-primary:disabled, .wf-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

    .wf-spinner-sm {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: wfSpin 0.7s linear infinite;
      display: inline-block;
    }

    /* ── TOASTS ── */
    .wf-toast-container {
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px; max-width: 360px;
    }
    .wf-toast {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 16px; background: #fff;
      border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      border-left: 3px solid #94a3b8;
      animation: wfSlideIn .2s ease-out;
    }
    @keyframes wfSlideIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .wf-toast-success { border-left-color: #16a34a; }
    .wf-toast-info    { border-left-color: #0891b2; }
    .wf-toast-warning { border-left-color: #d97706; }
    .wf-toast-error   { border-left-color: #dc2626; }
    .wf-toast-icon  { font-size: 16px; }
    .wf-toast-body  { flex: 1; }
    .wf-toast-msg   { font-weight: 600; font-size: 13px; color: #1e293b; }
    .wf-toast-detail{ font-size: 12px; color: #64748b; margin-top: 2px; }
    .wf-toast-close { background: none; border: none; font-size: 14px; cursor: pointer; color: #94a3b8; padding: 0; }
    .wf-toast-close:hover { color: #475569; }

    /* ── ÉDITEUR OVERLAY ── */
    .wf-editor-overlay {
      position: fixed; inset: 0; z-index: 1010;
      background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }
    .wf-editor-panel {
      background: #fff; border-radius: 14px;
      width: 100%; max-width: 680px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      display: flex; flex-direction: column;
      max-height: 92vh;
    }

    /* En-tête éditeur */
    .wf-ed-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
      background: #f8fafc; border-radius: 14px 14px 0 0; flex-shrink: 0;
    }
    .wf-ed-title-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .wf-ed-nom { font-size: 15px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wf-ed-type-badge { background: #e6f1fb; color: #185fa5; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
    .wf-ed-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .wf-ed-close { background: none; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 13px; color: #64748b; }
    .wf-ed-close:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }
    .wf-ed-error { margin: 8px 20px 0; padding: 10px 14px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; color: #dc2626; font-size: 13px; flex-shrink: 0; }

    /* Stepper */
    .wf-stepper { display: flex; align-items: center; padding: 14px 24px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
    .wf-step { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; min-width: 68px; }
    .wf-step-circle { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: #e2e8f0; color: #64748b; border: 2px solid #e2e8f0; transition: all 0.15s; }
    .wf-step-label { font-size: 10px; font-weight: 600; color: #94a3b8; white-space: nowrap; }
    .wf-step.wf-step-active .wf-step-circle { background: #278bef; border-color: #278bef; color: #fff; }
    .wf-step.wf-step-active .wf-step-label  { color: #278bef; }
    .wf-step.wf-step-done  .wf-step-circle  { background: #16a34a; border-color: #16a34a; color: #fff; }
    .wf-step.wf-step-done  .wf-step-label   { color: #16a34a; }
    .wf-step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 4px 16px; transition: background 0.3s; }
    .wf-step-line.wf-step-line-done { background: #16a34a; }

    /* Corps scrollable */
    .wf-ed-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
    .wf-ed-section { border-bottom: 1px solid #f1f5f9; }
    .wf-ed-section:last-child { border-bottom: none; }
    .wf-ed-sec-header { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .wf-ed-sec-title { font-weight: 700; color: #185fa5; flex: 1; letter-spacing: .3px; }
    .wf-ed-sec-count { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #185fa5; color: #fff; font-size: 11px; font-weight: 700; margin-left: 4px; }
    .wf-ed-sec-body { padding: 14px 20px; display: flex; flex-direction: column; gap: 10px; }

    /* Form controls */
    .wf-ed-input {
      width: 100%; padding: 8px 11px; border: 1px solid #e2e8f0; border-radius: 7px;
      font-size: 13px; color: #0f172a; outline: none; font-family: inherit; box-sizing: border-box;
      background: #fff; transition: border-color 0.15s;
    }
    .wf-ed-input:focus { border-color: #278bef; box-shadow: 0 0 0 2px rgba(39,139,239,0.1); }
    .wf-ed-textarea { resize: vertical; min-height: 60px; }
    .wf-inline { width: auto; display: inline-block; min-width: 110px; }
    .wf-ed-label { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
    .wf-ed-req { color: #ef4444; }
    .wf-ed-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
    .wf-ed-group { display: flex; flex-direction: column; gap: 4px; }
    .wf-ed-group-full { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 4px; }

    /* Param card */
    .wf-param-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .wf-param-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .wf-mini-btn { background: #fff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.15s; }
    .wf-mini-danger:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

    /* Rule card */
    .wf-rule-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
    .wf-rule-head { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .wf-rule-head .wf-ed-input { flex: 1; }
    .wf-mode-toggle { display: flex; gap: 2px; background: #f1f5f9; padding: 3px; }
    .wf-mode-btn { flex: 1; padding: 6px 10px; border: none; border-radius: 5px; font-size: 12px; font-weight: 500; cursor: pointer; background: none; color: #64748b; transition: all 0.15s; }
    .wf-mode-active { background: #fff; color: #185fa5; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .wf-rule-body { padding: 12px; }
    .wf-rule-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .wf-tag-if  { background: #dbeafe; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }
    .wf-tag-oui { background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }
    .wf-tag-non { background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; flex-shrink: 0; }

    /* Métier */
    .wf-metier-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
    .wf-metier-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .wf-rm-list { display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; }
    .wf-rm-item { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: background 0.1s; }
    .wf-rm-item:hover { background: #f0f9ff; }
    .wf-rm-selected { background: #eff6ff; border-color: #93c5fd; }
    .wf-rm-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
    .wf-rm-body { flex: 1; font-size: 12px; }
    .wf-logiq-btn { padding: 3px 10px; border: 1px solid #e2e8f0; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: 700; background: #fff; }
    .wf-logiq-active { background: #185fa5; color: #fff; border-color: #185fa5; }
    .wf-sugg-chip { padding: 2px 8px; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-size: 11px; background: #f8fafc; transition: background 0.1s; }
    .wf-sugg-chip:hover { background: #e6f1fb; border-color: #185fa5; color: #185fa5; }

    /* SI/SINON */
    .wf-si-sinon { margin-top: 10px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .wf-branch { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
    .wf-branch:not(:last-child) { border-bottom: 1px solid #e2e8f0; }
    .wf-branch-oui { background: #f0fdf4; border-left: 3px solid #16a34a; }
    .wf-branch-non { background: #fef2f2; border-left: 3px solid #dc2626; flex-direction: row; align-items: center; flex-wrap: wrap; gap: 8px; }
    .wf-branch-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .wf-multi-cible-list { display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto; }
    .wf-multi-cible-item { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .wf-multi-cible-item:hover { background: #f0fdf4; }
    .wf-multi-cible-sel { background: #dcfce7; border-color: #86efac; }
    .wf-cible-ord { font-weight: 700; color: #185fa5; }
    .wf-cible-nom { flex: 1; color: #0f172a; }
    .wf-cible-type { font-size: 10px; color: #94a3b8; background: #f1f5f9; padding: 1px 5px; border-radius: 4px; }

    /* Sous-processus */
    .wf-sp-list { display: flex; flex-direction: column; gap: 6px; }
    .wf-sp-row { display: grid; grid-template-columns: 26px 1fr auto auto 1fr auto; gap: 5px; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 7px; padding: 6px 8px; }
    .wf-sp-idx { width: 22px; height: 22px; border-radius: 50%; background: #185fa5; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    /* Champs dynamiques */
    .wf-dyn-field { margin-bottom: 8px; }
    .wf-required::before { content: '*'; color: #d97706; margin-right: 3px; }
    .wf-req-star { color: #d97706; margin-left: 2px; }
    .wf-info-box { background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 7px; padding: 10px; font-size: 13px; color: #0369a1; }
    .wf-match-box { margin-top: 10px; padding: 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; text-align: center; }
    .wf-match-non  { background: #fef2f2; border-color: #fca5a5; }
    .wf-match-header { font-weight: 800; font-size: 13px; color: #15803d; margin-bottom: 3px; }
    .wf-match-non .wf-match-header { color: #b91c1c; }
    .wf-match-rule { font-style: italic; color: #64748b; font-size: 12px; margin-bottom: 4px; }
    .wf-match-target { color: #185fa5; font-size: 13px; font-weight: 600; }
    .wf-no-match { padding: 10px; background: #f8fafc; border-radius: 7px; font-size: 13px; color: #64748b; }
    .wf-empty-mini { padding: 10px; color: #94a3b8; font-size: 12px; border: 1px dashed #e2e8f0; border-radius: 7px; text-align: center; }

    /* Pied éditeur + boutons */
    .wf-ed-footer { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-top: 1px solid #f1f5f9; background: #f8fafc; border-radius: 0 0 14px 14px; flex-shrink: 0; }
    .wf-btn-secondary { padding: 8px 16px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #475569; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
    .wf-btn-secondary:hover:not(:disabled) { background: #e2e8f0; }
    .wf-btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
    .wf-btn-step-prev { padding: 8px 14px; border-radius: 7px; border: 1px solid #e2e8f0; background: #fff; color: #185fa5; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .wf-btn-step-prev:hover { background: #e6f1fb; }
    .wf-btn-step-next { padding: 8px 16px; border-radius: 7px; border: none; background: #278bef; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .wf-btn-step-next:hover:not(:disabled) { background: #185fa5; }
    .wf-btn-step-next:disabled { opacity: 0.45; cursor: not-allowed; }
    .wf-btn-primary-ed { padding: 8px 18px; border-radius: 7px; border: none; background: #16a34a; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    .wf-btn-primary-ed:hover { background: #15803d; }
    .wf-btn-danger-sm { padding: 5px 12px; border-radius: 6px; border: 1px solid #fca5a5; background: #fee2e2; color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer; }
    .wf-btn-danger { padding: 8px 18px; border-radius: 7px; border: none; background: #dc2626; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    .wf-btn-sec-sm { padding: 4px 12px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; color: #185fa5; font-size: 12px; font-weight: 600; cursor: pointer; margin-left: auto; flex-shrink: 0; }
    .wf-btn-sec-sm:hover { background: #e6f1fb; }

    /* Boîte confirmation */
    .wf-confirm-box { background: #fff; border-radius: 14px; padding: 28px 32px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-width: 360px; width: 100%; }
  `]
})
export class ProcessusWorkflowComponent implements OnInit {

  processus: Processus | null = null;
  taches: Tache[] = [];
  loading = true;
  error = '';
  bpmnDiagram: BpmnDiagram = { elements: [], edges: [], viewWidth: 800, viewHeight: 280 };

  // ── Task editor ──
  formTaskOpen: Tache | null = null;
  isNewTask = false;
  formStep = 1;
  currentSubprocess: SubprocessDirect = { actif: false, nom: '', taches: [] };
  currentChamps: ChampDynamique[] = [];
  currentRegles: RegleTransition[] = [];
  formValues: Record<string, any> = {};
  formError = '';

  // ── Delete confirm ──
  tacheToDelete: Tache | null = null;
  deleting = false;

  // ── Toasts ──
  toasts: { id: number; type: 'success'|'info'|'warning'|'error'; message: string; detail?: string }[] = [];
  private toastCounter = 0;

  // ── Règles métier ──
  reglesMetierDisponibles: RegleMetier[] = [];
  filtreCategorieRegle = 'TOUS';
  private readonly actionsSuggeresParCategorie: Record<string, string[]> = {
    'TAXE':          ['CALCULER_DROITS', 'APPLIQUER_TVA', 'EXONERER', 'TAXATION_REDUITE'],
    'QUOTA':         ['AUTORISER_IMPORT', 'BLOQUER_IMPORT', 'ALERTER_QUOTA', 'DEMANDER_DEROGATION'],
    'CERTIFICATION': ['EXIGER_CERTIFICAT', 'VALIDER_CERTIFICAT', 'REJETER_CERTIFICAT'],
    'VERIFICATION':  ['VERIFICATION_SIMPLE', 'VERIFICATION_APPROFONDIE', 'ESCALADE_SUPERVISEUR'],
    'CONTROLE':      ['CIRCUIT_VERT', 'CIRCUIT_JAUNE', 'CIRCUIT_ROUGE', 'PRELEVER_ECHANTILLON'],
    'DOUANE':        ['ACCEPTER_DECLARATION', 'LIQUIDER', 'ACCORDER_MAINLEVEE', 'EXIGER_CAUTION']
  };

  private readonly TASK_W = 160;
  private readonly TASK_H = 70;
  private readonly GW_SIZE = 54;
  private readonly EVT_R = 20;
  private readonly H_GAP = 70;
  private readonly LANE_TOP_Y = 200;
  private readonly LANE_BOT_OFFSET = 130;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private processusService: ProcessusService,
    private tacheService: TacheService,
    private regleMetierService: RegleMetierService
  ) {}

  ngOnInit(): void {
    this.loadReglesMetier();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'ID de processus invalide'; this.loading = false; return; }

    this.processusService.getById(id).subscribe({
      next: (p) => {
        this.processus = p;
        this.tacheService.getByProcessus(id).subscribe({
          next: (taches) => {
            this.taches = taches;
            this.buildBpmnDiagram();
            this.loading = false;
          },
          error: () => { this.error = 'Impossible de charger les tâches'; this.loading = false; }
        });
      },
      error: () => { this.error = 'Processus introuvable'; this.loading = false; }
    });
  }

  goBack(): void { this.router.navigate(['/processus']); }

  // ── Toast ──────────────────────────────────────────────────────
  addToast(type: 'success'|'info'|'warning'|'error', message: string, detail?: string, duration = 4000): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message, detail });
    setTimeout(() => this.removeToast(id), duration);
  }
  removeToast(id: number): void { this.toasts = this.toasts.filter(t => t.id !== id); }

  // ── Règles métier ──────────────────────────────────────────────
  loadReglesMetier(): void {
    this.regleMetierService.getAll().subscribe({
      next: (data) => { this.reglesMetierDisponibles = (data || []).filter((r: RegleMetier) => r.active); },
      error: () => { this.reglesMetierDisponibles = []; }
    });
  }

  // ── Reload tâches ──────────────────────────────────────────────
  private reloadTaches(onDone?: (taches: Tache[]) => void): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.tacheService.getByProcessus(id).subscribe(taches => {
      this.taches = taches;
      this.buildBpmnDiagram();
      if (onDone) onDone(taches);
    });
  }

  // ── Form helpers ───────────────────────────────────────────────
  getChamps(t: Tache): ChampDynamique[] {
    try { return !t.formData ? [] : JSON.parse(t.formData).champs || []; } catch { return []; }
  }
  getValeurs(t: Tache): Record<string, any> {
    try { return !t.formData ? {} : JSON.parse(t.formData).valeurs || {}; } catch { return {}; }
  }
  getReglesAll(t: Tache): RegleTransition[] {
    try { return !t.formData ? [] : JSON.parse(t.formData).regles || []; } catch { return []; }
  }

  getTacheNameByOrdre(ordre: number): string {
    return this.taches.find(t => t.ordre === ordre)?.nom || '?';
  }
  getTacheSuivante(): Tache | null {
    if (!this.formTaskOpen?.ordre) return null;
    const cur = this.formTaskOpen.ordre;
    const suivantes = this.tachesSorted().filter(t => (t.ordre ?? 0) > cur && t.id !== this.formTaskOpen!.id);
    return suivantes.length > 0 ? suivantes[0] : null;
  }
  autresTaches(): Tache[] {
    if (!this.formTaskOpen) return [];
    return this.tachesSorted().filter(t => t.ordre !== this.formTaskOpen!.ordre);
  }

  enumOptionsToString(c: ChampDynamique): string { return (c.options || []).map(o => o.label).join(', '); }
  stringToEnumOptions(c: ChampDynamique, val: string) {
    c.options = val.split(',').map(s => s.trim()).filter(s => s).map(s => ({ value: s, label: s }));
  }
  trackByIndex(index: number): number { return index; }

  // ── Task form open/close ────────────────────────────────────────
  openNewTacheForm(): void {
    this.isNewTask = true;
    this.formTaskOpen = {
      nom: 'Nouvelle tâche', description: '', assignee: '',
      type: 'HUMAINE', statut: 'EN_ATTENTE',
      ordre: this.taches.length + 1,
      processusId: this.processus?.id ?? 0, formData: ''
    };
    this.currentChamps = []; this.currentRegles = []; this.formValues = {};
    this.currentSubprocess = { actif: false, nom: '', taches: [] };
    this.formError = ''; this.formStep = 1;
  }

  openTaskForm(tache: Tache): void {
    this.isNewTask = false;
    this.formTaskOpen = { ...tache };
    this.currentChamps = this.getChamps(tache).map(c => ({ ...c }));
    this.currentRegles = this.getReglesAll(tache).map(r => {
      let ouiOrdres = r.tacheOuiOrdres || [];
      if ((!ouiOrdres || ouiOrdres.length === 0) && r.tacheOuiOrdre && r.tacheOuiOrdre > 0) ouiOrdres = [r.tacheOuiOrdre];
      return { ...r, modeRegle: r.modeRegle || 'simple', regleMetierIds: r.regleMetierIds || [], logiqueCombinaison: r.logiqueCombinaison || 'ET', actionDouaniere: r.actionDouaniere || '', tacheOuiOrdres: ouiOrdres, tacheOuiOrdre: r.tacheOuiOrdre || 0, tacheSinonOrdre: r.tacheSinonOrdre || 0, cibleType: r.cibleType || 'suivante', tacheCibleOrdre: r.tacheCibleOrdre || 0 };
    });
    this.formValues = { ...this.getValeurs(tache) };
    try {
      const data = JSON.parse(tache.formData || '{}');
      const sp = data.subprocess || { actif: false, nom: '', taches: [] };
      if (sp.taches) sp.taches.forEach((st: any) => { if (!st.branche) st.branche = ''; });
      this.currentSubprocess = sp;
    } catch { this.currentSubprocess = { actif: false, nom: '', taches: [] }; }
    this.formError = ''; this.formStep = 1;
  }

  closeTaskForm(): void {
    this.formTaskOpen = null;
    this.currentChamps = []; this.currentRegles = [];
    this.formValues = {}; this.formError = '';
    this.currentSubprocess = { actif: false, nom: '', taches: [] };
    this.formStep = 1;
  }

  nextFormStep(): void { if (this.formStep < 4) this.formStep++; }
  prevFormStep(): void { if (this.formStep > 1) this.formStep--; }
  goToStep(n: number): void { if (n <= this.formStep) this.formStep = n; }

  // ── Save task form ──────────────────────────────────────────────
  saveTaskForm(): void {
    if (!this.formTaskOpen) return;
    this.formError = '';
    if (!this.formTaskOpen.nom?.trim()) { this.formError = 'Le nom de la tâche est obligatoire.'; return; }
    for (const r of this.currentRegles) {
      if (r.modeRegle === 'metier' && (!r.regleMetierIds || r.regleMetierIds.length === 0)) {
        this.formError = `La règle "${r.nom || 'sans nom'}" : sélectionnez au moins une règle métier.`; return;
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
      formData: JSON.stringify({ champs: this.currentChamps, regles: this.currentRegles, valeurs: this.formValues, subprocess: this.currentSubprocess })
    };

    const obs = (!this.isNewTask && this.formTaskOpen.id)
      ? this.tacheService.update(this.formTaskOpen.id, payload)
      : this.tacheService.create(payload);

    obs.subscribe({
      next: () => {
        this.closeTaskForm();
        this.addToast('success', `Tâche ${this.isNewTask ? 'créée' : 'mise à jour'} avec succès`);
        this.reloadTaches();
      },
      error: (err: any) => { this.formError = err?.error?.message || err?.error?.error || 'Erreur lors de la sauvegarde'; }
    });
  }

  // ── Delete task ────────────────────────────────────────────────
  confirmDeleteTache(tache: Tache): void { if (!tache.id) return; this.tacheToDelete = tache; }
  cancelDeleteTache(): void { this.tacheToDelete = null; this.deleting = false; }
  executeDeleteTache(): void {
    if (!this.tacheToDelete?.id) return;
    this.deleting = true;
    const nom = this.tacheToDelete.nom;
    const id  = this.tacheToDelete.id;
    this.tacheService.delete(id).subscribe({
      next: () => {
        this.deleting = false; this.tacheToDelete = null;
        if (this.formTaskOpen?.id === id) this.closeTaskForm();
        this.addToast('success', `Tâche "${nom}" supprimée`);
        this.reloadTaches();
      },
      error: (err: any) => {
        this.deleting = false;
        this.addToast('error', 'Erreur lors de la suppression', err?.error?.message);
        this.tacheToDelete = null;
      }
    });
  }

  // ── Champs ────────────────────────────────────────────────────
  addChamp(): void { this.currentChamps.push({ id: 'champ_' + (this.currentChamps.length + 1), label: '', type: 'string', required: false }); }
  removeChamp(i: number): void { this.currentChamps.splice(i, 1); }

  // ── Règles ────────────────────────────────────────────────────
  addRegle(): void {
    this.currentRegles.push({ id: 'r_' + Date.now(), nom: '', modeRegle: 'simple', champId: '', operateur: '==', valeur: '', regleMetierIds: [], logiqueCombinaison: 'ET', actionDouaniere: '', tacheOuiOrdres: [], tacheOuiOrdre: 0, tacheSinonOrdre: 0, tacheCibleOrdre: 0, cibleType: 'suivante', actif: true });
  }
  removeRegle(i: number): void { this.currentRegles.splice(i, 1); }

  toggleModeRegle(regle: RegleTransition, mode: 'simple' | 'metier'): void {
    regle.modeRegle = mode;
    if (mode === 'metier') { if (!regle.regleMetierIds) regle.regleMetierIds = []; }
    else { if (!regle.operateur) regle.operateur = '=='; }
  }
  toggleRegleMetier(regle: RegleTransition, id: number): void {
    if (!regle.regleMetierIds) regle.regleMetierIds = [];
    const idx = regle.regleMetierIds.indexOf(id);
    if (idx >= 0) regle.regleMetierIds.splice(idx, 1); else regle.regleMetierIds.push(id);
  }
  isRegleMetierSelected(regle: RegleTransition, id?: number): boolean {
    return !!id && (regle.regleMetierIds || []).includes(id);
  }

  toggleOuiCible(regle: RegleTransition, ordre: number): void {
    if (!regle.tacheOuiOrdres) regle.tacheOuiOrdres = [];
    const idx = regle.tacheOuiOrdres.indexOf(ordre);
    if (idx >= 0) regle.tacheOuiOrdres.splice(idx, 1); else regle.tacheOuiOrdres.push(ordre);
  }
  isOuiCibleSelected(regle: RegleTransition, ordre: number): boolean { return (regle.tacheOuiOrdres || []).includes(ordre); }
  getOuiCiblesLabel(regle: RegleTransition): string {
    const ordres = regle.tacheOuiOrdres || [];
    if (ordres.length === 0) { const s = this.getTacheSuivante(); return s ? `#${s.ordre} ${s.nom} (auto)` : 'Fin du processus'; }
    if (ordres.length === 1) return `#${ordres[0]} ${this.getTacheNameByOrdre(ordres[0])}`;
    return `${ordres.length} tâches en parallèle`;
  }

  // ── Règles métier ──────────────────────────────────────────────
  getCategoriesDistinctes(): string[] {
    const cats = new Set<string>();
    this.reglesMetierDisponibles.forEach(r => { if (r.categorie?.type) cats.add(r.categorie.type.toUpperCase()); });
    return Array.from(cats).sort();
  }
  getReglesMetierFiltrees(): RegleMetier[] {
    if (this.filtreCategorieRegle === 'TOUS') return this.reglesMetierDisponibles;
    return this.reglesMetierDisponibles.filter(r => r.categorie?.type?.toUpperCase() === this.filtreCategorieRegle);
  }
  iconCategorie(type?: string): string {
    const map: Record<string, string> = { 'TAXE':'💰','QUOTA':'📊','CERTIFICATION':'📜','VERIFICATION':'🔍','CONTROLE':'🛃','DOUANE':'🏛️' };
    return map[(type || '').toUpperCase()] || '📋';
  }
  couleurCategorie(type?: string): string {
    const map: Record<string, string> = { 'TAXE':'#f59e0b','QUOTA':'#3b82f6','CERTIFICATION':'#10b981','VERIFICATION':'#8b5cf6','CONTROLE':'#ef4444','DOUANE':'#ec4899' };
    return map[(type || '').toUpperCase()] || '#6b7280';
  }
  getActionsSuggestionsForRegle(regle: RegleTransition): string[] {
    if (regle.modeRegle !== 'metier' || !regle.regleMetierIds?.length) return [];
    const actions = new Set<string>();
    regle.regleMetierIds.forEach(id => {
      const rm = this.reglesMetierDisponibles.find(r => r.id === id);
      const cat = rm?.categorie?.type?.toUpperCase();
      if (cat && this.actionsSuggeresParCategorie[cat]) this.actionsSuggeresParCategorie[cat].forEach(a => actions.add(a));
    });
    return Array.from(actions);
  }
  getChampsManquantsRegleMetier(r: RegleTransition): string[] {
    if (r.modeRegle !== 'metier' || !r.regleMetierIds?.length) return [];
    const champIds = new Set(this.currentChamps.map(c => c.id));
    const manquants = new Set<string>();
    r.regleMetierIds.forEach(rmId => {
      const rm = this.reglesMetierDisponibles.find(x => x.id === rmId);
      (rm?.conditions || []).forEach((c: any) => { if (c.champ && !champIds.has(c.champ)) manquants.add(c.champ); });
    });
    return Array.from(manquants);
  }

  // ── Évaluation règles ─────────────────────────────────────────
  getEvaluationResult(): { regle: RegleTransition; match: boolean } | null {
    for (const r of this.currentRegles) {
      if (!r.actif) continue;
      return { regle: r, match: this.evaluerRegle(r, this.formValues) };
    }
    return null;
  }
  private evaluerRegle(r: RegleTransition, vals: Record<string, any>): boolean {
    if (r.modeRegle === 'metier') {
      if (!r.regleMetierIds?.length) return false;
      const champIds = new Set(this.currentChamps.map(c => c.id));
      const resultats = r.regleMetierIds.map(rmId => {
        const rm = this.reglesMetierDisponibles.find(x => x.id === rmId);
        if (!rm?.conditions?.length) return false;
        return rm.conditions.every((c: any) => this.evaluerConditionSimple(c.champ, c.operateur, c.valeur, vals));
      });
      return r.logiqueCombinaison === 'OU' ? resultats.some(ok => ok) : resultats.every(ok => ok);
    }
    return this.evaluerConditionSimple(r.champId || '', r.operateur || '==', r.valeur, vals);
  }
  private evaluerConditionSimple(champ: string, operateur: string, valeur: any, vals: Record<string, any>): boolean {
    if (!champ) return false;
    const v = vals[champ];
    switch (operateur) {
      case '==': return this.norm(v) === this.norm(valeur);
      case '!=': return this.norm(v) !== this.norm(valeur);
      case '>':  return Number(v) > Number(valeur);
      case '<':  return Number(v) < Number(valeur);
      case '>=': return Number(v) >= Number(valeur);
      case '<=': return Number(v) <= Number(valeur);
      case 'contains':   return String(v ?? '').toLowerCase().includes(String(valeur ?? '').toLowerCase());
      case 'isEmpty':    return v === undefined || v === null || v === '';
      case 'isNotEmpty': return v !== undefined && v !== null && v !== '';
      default: return false;
    }
  }
  private norm(v: any): any {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '') return Number(v);
    return v;
  }

  // ── Sous-processus ────────────────────────────────────────────
  addSubprocessDirectTache(): void {
    this.currentSubprocess = { ...this.currentSubprocess, taches: [...(this.currentSubprocess.taches || []), { nom: '', type: 'HUMAINE', assignee: '', branche: null }] };
  }
  removeSubprocessDirectTache(idx: number): void {
    this.currentSubprocess = { ...this.currentSubprocess, taches: this.currentSubprocess.taches.filter((_, i) => i !== idx) };
  }

  exportBpmn(): void {
    if (!this.processus || this.taches.length === 0) return;
    const xml = this.generateBpmnXml();
    if (!xml) return;
    const nom = (this.processus.nom || 'processus').replace(/\s+/g, '_').toLowerCase();
    const filename = `${nom}_${this.processus.id}.bpmn`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
  }

  tachesSorted(): Tache[] {
    return [...this.taches].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }

  // ── SVG EDGE HELPERS ──────────────────────────────────────────
  getEdgeColor(edge: BpmnEdge): string {
    if (edge.branchType === 'oui') return '#10b981';
    if (edge.branchType === 'non') return '#ef4444';
    return '#64748b';
  }
  getEdgeMarker(edge: BpmnEdge): string {
    if (edge.branchType === 'oui') return 'url(#wf-arrow-oui)';
    if (edge.branchType === 'non') return 'url(#wf-arrow-non)';
    return 'url(#wf-arrow)';
  }
  getEdgeStrokeWidth(edge: BpmnEdge): number {
    return (edge.branchType === 'oui' || edge.branchType === 'non') ? 2.5 : 2;
  }
  getEdgeDashArray(edge: BpmnEdge): string {
    return edge.branchType === 'non' ? '7,4' : 'none';
  }

  getEdgePath(edge: BpmnEdge): { d: string; labelX: number; labelY: number } | null {
    const from = this.bpmnDiagram.elements.find(e => e.id === edge.from);
    const to   = this.bpmnDiagram.elements.find(e => e.id === edge.to);
    if (!from || !to) return null;

    const fromCx = from.x + from.width / 2;
    const fromCy = from.y + from.height / 2;
    const toCx   = to.x + to.width / 2;
    const toCy   = to.y + to.height / 2;

    if (edge.routing === 'down-loop') {
      const fromBotY = from.y + from.height;
      const toBotY   = to.y + to.height;
      const pathY    = Math.max(fromBotY, toBotY) + 90;
      return { d: `M ${fromCx},${fromBotY} L ${fromCx},${pathY} L ${toCx},${pathY} L ${toCx},${toBotY}`,
               labelX: (fromCx + toCx) / 2, labelY: pathY + 12 };
    }
    if (edge.routing === 'oui-jump') {
      const jumpIdx = edge.jumpIndex ?? 0;
      const peakY   = Math.min(from.y, to.y) - (50 + jumpIdx * 26);
      return { d: `M ${fromCx},${from.y} L ${fromCx},${peakY} L ${toCx},${peakY} L ${toCx},${to.y}`,
               labelX: (fromCx + toCx) / 2, labelY: peakY - 8 };
    }

    const x1 = from.x + from.width, y1 = fromCy;
    const x2 = to.x, y2 = toCy;
    if (Math.abs(y1 - y2) < 5) {
      return { d: `M ${x1},${y1} L ${x2},${y2}`, labelX: (x1 + x2) / 2, labelY: y1 - 10 };
    }
    const midX = (x1 + x2) / 2;
    return { d: `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`,
             labelX: midX + 4, labelY: (y1 + y2) / 2 };
  }

  getDiamondPoints(x: number, y: number, w: number, h: number): string {
    const cx = x + w / 2, cy = y + h / 2;
    return `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
  }

  getTaskStroke(t?: Tache): string {
    if (!t) return '#d1d5db';
    if (t.statut === 'TERMINE') return '#10b981';
    if (t.statut === 'EN_COURS') return '#06b6d4';
    return '#d1d5db';
  }

  truncate(s: string, max: number): string {
    if (!s) return '';
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  getRegles(t: Tache): RegleTransition[] {
    try {
      if (!t.formData) return [];
      return (JSON.parse(t.formData).regles || []).filter((r: RegleTransition) => r.actif !== false);
    } catch { return []; }
  }

  getSubprocessDirect(tache: Tache): SubprocessDirect | null {
    try {
      const data = JSON.parse(tache.formData || '{}');
      const sp = data.subprocess as SubprocessDirect;
      return sp?.actif && (sp?.taches?.length ?? 0) > 0 ? sp : null;
    } catch { return null; }
  }

  getOuiOrdres(regle: RegleTransition): number[] {
    if (regle.tacheOuiOrdres && regle.tacheOuiOrdres.length > 0)
      return regle.tacheOuiOrdres.filter(o => o > 0);
    if (regle.tacheOuiOrdre && regle.tacheOuiOrdre > 0)
      return [regle.tacheOuiOrdre];
    return [];
  }

  // ── BUILD DIAGRAM ─────────────────────────────────────────────
  buildBpmnDiagram(): void {
    const elements: BpmnElement[] = [];
    const edges: BpmnEdge[] = [];
    const sorted = this.tachesSorted();
    const { EVT_R, TASK_W, TASK_H, GW_SIZE, H_GAP, LANE_TOP_Y } = {
      EVT_R: this.EVT_R, TASK_W: this.TASK_W, TASK_H: this.TASK_H,
      GW_SIZE: this.GW_SIZE, H_GAP: this.H_GAP, LANE_TOP_Y: this.LANE_TOP_Y
    };

    let x = 40;
    const startId = 'start';
    elements.push({ type: 'startEvent', id: startId, x, y: LANE_TOP_Y - EVT_R, width: EVT_R * 2, height: EVT_R * 2, label: 'Début', lane: 0 });
    let prevId = startId;
    x += EVT_R * 2 + H_GAP;

    const ordreToTaskId = new Map<number, string>();
    const ordreToGwId   = new Map<number, string>();
    const SP_TASK_W = 130, SP_TASK_H = 56, SP_V_GAP = 80;
    const pendingSpTasks: { spIds: string[]; tIdx: number }[] = [];
    const pendingNonSpTasks: { lastSpId: string; tIdx: number }[] = [];
    const gwToLastOuiSpId = new Map<string, string>();
    const gwToLastNonSpId = new Map<string, string>();
    let skipNextMainEdge = false;

    sorted.forEach((t, tIdx) => {
      const taskId = 'task_' + t.id;
      elements.push({ type: 'task', id: taskId, x, y: LANE_TOP_Y - TASK_H / 2, width: TASK_W, height: TASK_H, label: t.nom, sublabel: t.type, status: t.statut, tache: t, isCorrection: false, lane: 0 });
      ordreToTaskId.set(t.ordre ?? 0, taskId);

      if (!skipNextMainEdge) {
        const effectivePrev = gwToLastOuiSpId.get(prevId) ?? prevId;
        edges.push({ id: `e_${effectivePrev}_${taskId}`, from: effectivePrev, to: taskId, branchType: 'normal', routing: 'straight' });
      }
      skipNextMainEdge = false;
      prevId = taskId;
      x += TASK_W + H_GAP;

      const sp = this.getSubprocessDirect(t);
      const spIds: string[] = [];
      const regles = this.getRegles(t);

      if (regles.length > 0) {
        const gwId = 'gw_' + t.id;
        const regle = regles[0];
        elements.push({ type: 'gateway', id: gwId, x, y: LANE_TOP_Y - GW_SIZE / 2, width: GW_SIZE, height: GW_SIZE, label: regle.nom || 'Condition', question: regle.nom || 'Condition ?', sourceTache: t, lane: 0 });
        ordreToGwId.set(t.ordre ?? 0, gwId);
        edges.push({ id: `e_${prevId}_${gwId}`, from: prevId, to: gwId, branchType: 'normal', routing: 'straight' });
        prevId = gwId;
        x += GW_SIZE + H_GAP;

        const spTaches = sp ? sp.taches : [];
        const ouiSpTaches   = spTaches.filter(st => st.branche === 'OUI');
        const nonSpTaches   = spTaches.filter(st => st.branche === 'NON');
        const neutralTaches = spTaches.filter(st => !st.branche);
        const spX = x;

        if (ouiSpTaches.length > 0) {
          let prevSp = gwId;
          ouiSpTaches.forEach((st, i) => {
            const spY = LANE_TOP_Y - TASK_H - 70 - i * (SP_TASK_H + 24);
            const spId = `sp_task_${t.id}_oui_${i}`;
            elements.push({ type: 'task', id: spId, x: spX, y: spY, width: SP_TASK_W, height: SP_TASK_H, label: st.nom || `Sous-tâche OUI ${i + 1}`, sublabel: st.type, lane: 1 });
            edges.push({ id: `e_${prevSp}_${spId}`, from: prevSp, to: spId, label: i === 0 ? 'Oui' : undefined, branchType: 'oui', routing: 'straight' });
            prevSp = spId;
          });
          gwToLastOuiSpId.set(gwId, prevSp);
        }
        if (nonSpTaches.length > 0) {
          let prevSp = gwId;
          nonSpTaches.forEach((st, i) => {
            const spY = LANE_TOP_Y + TASK_H / 2 + 60 + i * (SP_TASK_H + 24);
            const spId = `sp_task_${t.id}_non_${i}`;
            elements.push({ type: 'task', id: spId, x: spX, y: spY, width: SP_TASK_W, height: SP_TASK_H, label: st.nom || `Sous-tâche NON ${i + 1}`, sublabel: st.type, lane: 1 });
            edges.push({ id: `e_${prevSp}_${spId}`, from: prevSp, to: spId, label: i === 0 ? 'Non' : undefined, branchType: 'non', routing: 'straight' });
            prevSp = spId;
          });
          gwToLastNonSpId.set(gwId, prevSp);
          pendingNonSpTasks.push({ lastSpId: prevSp, tIdx });
        }
        if (neutralTaches.length > 0) {
          const N = neutralTaches.length;
          neutralTaches.forEach((st, i) => {
            const subY = LANE_TOP_Y + (i - (N - 1) / 2) * SP_V_GAP - SP_TASK_H / 2;
            const spId = `sp_task_${t.id}_${i}`;
            elements.push({ type: 'task', id: spId, x: spX, y: subY, width: SP_TASK_W, height: SP_TASK_H, label: st.nom || `Sous-tâche ${i + 1}`, sublabel: st.type, lane: 1 });
            edges.push({ id: `e_${gwId}_${spId}`, from: gwId, to: spId, branchType: 'oui', routing: 'straight' });
            spIds.push(spId);
          });
          pendingSpTasks.push({ spIds: [...spIds], tIdx });
        }
        if (ouiSpTaches.length > 0 || nonSpTaches.length > 0 || neutralTaches.length > 0) x += SP_TASK_W + H_GAP;
      } else if (sp && sp.taches.length > 0) {
        const N = sp.taches.length;
        for (let i = 0; i < N; i++) {
          const subY = LANE_TOP_Y + (i - (N - 1) / 2) * SP_V_GAP - SP_TASK_H / 2;
          const spId = `sp_task_${t.id}_${i}`;
          elements.push({ type: 'task', id: spId, x, y: subY, width: SP_TASK_W, height: SP_TASK_H, label: sp.taches[i].nom || `Sous-tâche ${i + 1}`, sublabel: sp.taches[i].type, lane: 1 });
          edges.push({ id: `e_${prevId}_${spId}`, from: prevId, to: spId, branchType: 'oui', routing: 'straight' });
          spIds.push(spId);
        }
        x += SP_TASK_W + H_GAP;
        pendingSpTasks.push({ spIds: [...spIds], tIdx });
        skipNextMainEdge = true;
      }
    });

    const endId = 'end';
    elements.push({ type: 'endEvent', id: endId, x, y: LANE_TOP_Y - EVT_R, width: EVT_R * 2, height: EVT_R * 2, label: 'Fin', lane: 0 });

    pendingSpTasks.forEach(({ spIds, tIdx }) => {
      const nextT = sorted[tIdx + 1];
      const nextId = nextT ? `task_${nextT.id}` : endId;
      spIds.forEach(spId => edges.push({ id: `e_${spId}_${nextId}`, from: spId, to: nextId, branchType: 'normal', routing: 'straight' }));
    });

    const effectiveLastPrev = gwToLastOuiSpId.get(prevId) ?? prevId;
    const lastIsGateway = prevId.startsWith('gw_') && !gwToLastOuiSpId.has(prevId);
    edges.push({ id: `e_${effectiveLastPrev}_${endId}`, from: effectiveLastPrev, to: endId, label: lastIsGateway ? 'Oui' : undefined, branchType: lastIsGateway ? 'oui' : 'normal', routing: 'straight' });

    edges.forEach(e => {
      if (e.from.startsWith('gw_') && (e.to.startsWith('task_') || e.to === endId) && e.branchType !== 'oui' && e.branchType !== 'non') {
        e.label = 'Oui'; e.branchType = 'oui';
      }
    });

    sorted.forEach(t => {
      this.getRegles(t).forEach(regle => {
        const gwId = ordreToGwId.get(t.ordre ?? 0);
        if (!gwId) return;
        const cibles = this.getOuiOrdres(regle);
        const lastOuiSpId = gwToLastOuiSpId.get(gwId);
        if (lastOuiSpId) {
          if (cibles.length === 0) return;
          const oldIdx = edges.findIndex(e => e.from === lastOuiSpId);
          if (oldIdx >= 0) edges.splice(oldIdx, 1);
          cibles.forEach((ordreCible, idx) => {
            const cibleId = ordreToTaskId.get(ordreCible);
            if (cibleId) edges.push({ id: `e_oui_sp_${lastOuiSpId}_${cibleId}_${idx}`, from: lastOuiSpId, to: cibleId, label: cibles.length > 1 ? `Oui #${idx + 1}` : undefined, branchType: 'oui', routing: 'straight' });
          });
          return;
        }
        if (cibles.length === 0) return;
        const nextInOrder = sorted.find(tt => (tt.ordre ?? 0) > (t.ordre ?? 0));
        if (cibles.length === 1) {
          if (nextInOrder && nextInOrder.ordre === cibles[0]) return;
          const cibleId = ordreToTaskId.get(cibles[0]);
          if (cibleId) {
            const oldIdx = edges.findIndex(e => e.from === gwId && e.branchType === 'oui');
            if (oldIdx >= 0) edges.splice(oldIdx, 1);
            edges.push({ id: `e_oui_${gwId}_${cibleId}`, from: gwId, to: cibleId, label: 'Oui', branchType: 'oui', routing: 'oui-jump', jumpIndex: 0 });
          }
          return;
        }
        const oldIdx = edges.findIndex(e => e.from === gwId && e.branchType === 'oui');
        if (oldIdx >= 0) edges.splice(oldIdx, 1);
        cibles.forEach((ordreCible, idx) => {
          const cibleId = ordreToTaskId.get(ordreCible);
          if (cibleId) edges.push({ id: `e_oui_multi_${gwId}_${cibleId}_${idx}`, from: gwId, to: cibleId, label: `Oui #${idx + 1}`, branchType: 'oui', routing: 'oui-jump', jumpIndex: idx });
        });
      });
    });

    sorted.forEach(t => {
      this.getRegles(t).forEach(regle => {
        const gwId = ordreToGwId.get(t.ordre ?? 0);
        if (!gwId || !regle.tacheSinonOrdre || regle.tacheSinonOrdre <= 0) return;
        const cibleId = ordreToTaskId.get(regle.tacheSinonOrdre);
        if (!cibleId) return;
        const lastNonSpId = gwToLastNonSpId.get(gwId);
        if (lastNonSpId) {
          edges.push({ id: `e_non_sp_${lastNonSpId}_${cibleId}`, from: lastNonSpId, to: cibleId, branchType: 'non', routing: 'straight' });
        } else {
          edges.push({ id: `e_non_${gwId}_${cibleId}`, from: gwId, to: cibleId, label: 'Non', branchType: 'non', routing: 'down-loop', isLoopBack: regle.tacheSinonOrdre < (t.ordre ?? 0) });
        }
      });
    });

    pendingNonSpTasks.forEach(({ lastSpId, tIdx }) => {
      const regle = this.getRegles(sorted[tIdx])?.[0];
      if (regle?.tacheSinonOrdre && regle.tacheSinonOrdre > 0) return;
      const nextT = sorted[tIdx + 1];
      const targetId = nextT ? `task_${nextT.id}` : endId;
      edges.push({ id: `e_non_sp_${lastSpId}_${targetId}`, from: lastSpId, to: targetId, branchType: 'non', routing: 'straight' });
    });

    const hasBranchesNon = edges.some(e => e.branchType === 'non');
    const hasJumps = edges.some(e => e.routing === 'oui-jump');
    const maxJumpIdx = Math.max(0, ...edges.filter(e => e.routing === 'oui-jump').map(e => e.jumpIndex ?? 0));
    const totalW = Math.max(x + EVT_R * 2 + 80, 900);
    const jumpTopSpace = hasJumps ? (80 + maxJumpIdx * 28) : 0;
    const loopSpace = hasBranchesNon ? this.LANE_BOT_OFFSET + 50 : 0;

    const spElements = elements.filter(e => e.lane === 1);
    const spTopY = spElements.length > 0 ? Math.min(...spElements.map(e => e.y)) : LANE_TOP_Y;
    const spBotY = spElements.length > 0 ? Math.max(...spElements.map(e => e.y + e.height)) : LANE_TOP_Y;
    const spTopExtra = spTopY < LANE_TOP_Y ? LANE_TOP_Y - spTopY + 30 : 0;
    const spBotExtra = spBotY > LANE_TOP_Y + TASK_H ? spBotY - (LANE_TOP_Y + TASK_H) + 30 : 0;
    const topExtra = Math.max(jumpTopSpace, spTopExtra);
    const botExtra = Math.max(loopSpace, spBotExtra);
    const baseH = LANE_TOP_Y + TASK_H + 50;
    const totalH = baseH + botExtra + (topExtra > LANE_TOP_Y ? topExtra - LANE_TOP_Y : 0);

    this.bpmnDiagram = { elements, edges, viewWidth: totalW, viewHeight: Math.max(totalH, 350) };
  }

  // ── EXPORT BPMN XML ───────────────────────────────────────────
  generateBpmnXml(): string | null {
    if (!this.processus || this.taches.length === 0) return null;
    const sorted = this.tachesSorted();
    const processId = `Process_${this.processus.id}`;
    const processName = (this.processus.nom || 'Processus').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c] || c));
    const TASK_W = 100, TASK_H = 80, GW_SIZE = 50, EVT_R = 18, H_GAP = 60, Y_CENTER = 280;
    let curX = 40;

    const nodes: any[] = [];
    nodes.push({ kind: 'start', id: 'StartEvent_1', x: curX, y: Y_CENTER - EVT_R, w: EVT_R * 2, h: EVT_R * 2, label: 'Début' });
    curX += EVT_R * 2 + H_GAP;

    sorted.forEach(t => {
      nodes.push({ kind: 'task', id: `Task_${t.id}`, x: curX, y: Y_CENTER - TASK_H / 2, w: TASK_W, h: TASK_H, label: t.nom, tache: t, regles: this.getRegles(t) });
      curX += TASK_W + H_GAP;
      const regles = this.getRegles(t);
      if (regles.length > 0) {
        const gwId = `Gateway_${t.id}`;
        nodes.push({ kind: 'gateway', id: gwId, x: curX, y: Y_CENTER - GW_SIZE / 2, w: GW_SIZE, h: GW_SIZE, label: regles[0].nom || 'Condition', regles });
        curX += GW_SIZE + H_GAP;
      }
    });
    nodes.push({ kind: 'end', id: 'EndEvent_1', x: curX, y: Y_CENTER - EVT_R, w: EVT_R * 2, h: EVT_R * 2, label: 'Fin' });

    const flows: any[] = [];
    const mainFlow = nodes.filter((n: any) => !n.isSpTask);
    for (let i = 0; i < mainFlow.length - 1; i++) {
      const cur = mainFlow[i], nxt = mainFlow[i + 1];
      if (cur.kind === 'gateway' && cur.regles?.length) {
        const regle = cur.regles[0];
        const cibles = this.getOuiOrdres(regle);
        if (cibles.length === 0) {
          flows.push({ id: `Flow_OUI_${cur.id}`, from: cur.id, to: nxt.id, name: `✓ ${regle.nom || 'OUI'}` });
        } else {
          cibles.forEach((ordreCible: number, idx: number) => {
            const cible = sorted.find(t => t.ordre === ordreCible);
            flows.push({ id: `Flow_OUI_${cur.id}_${idx}`, from: cur.id, to: cible ? `Task_${cible.id}` : nxt.id, name: `✓ OUI` });
          });
        }
        if (regle.tacheSinonOrdre && regle.tacheSinonOrdre > 0) {
          const cibleAlt = sorted.find(t => t.ordre === regle.tacheSinonOrdre);
          flows.push({ id: `Flow_NON_${cur.id}`, from: cur.id, to: cibleAlt ? `Task_${cibleAlt.id}` : 'EndEvent_1', name: '✗ SINON' });
        }
      } else if (cur.kind !== 'gateway') {
        flows.push({ id: `Flow_${cur.id}_${nxt.id}`, from: cur.id, to: nxt.id });
      }
    }

    const esc = (s: string) => (s || '').replace(/[<>&"]/g, (c: string) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c] || c));
    const bpmnElements = nodes.map((n: any) => {
      const inF  = flows.filter((f: any) => f.to   === n.id).map((f: any) => `<bpmn:incoming>${f.id}</bpmn:incoming>`).join('');
      const outF = flows.filter((f: any) => f.from === n.id).map((f: any) => `<bpmn:outgoing>${f.id}</bpmn:outgoing>`).join('');
      switch (n.kind) {
        case 'start':   return `    <bpmn:startEvent id="${n.id}" name="${esc(n.label)}">${outF}</bpmn:startEvent>`;
        case 'end':     return `    <bpmn:endEvent id="${n.id}" name="${esc(n.label)}">${inF}</bpmn:endEvent>`;
        case 'gateway': return `    <bpmn:exclusiveGateway id="${n.id}" name="${esc(n.label)}" gatewayDirection="Diverging">${inF}${outF}</bpmn:exclusiveGateway>`;
        case 'task': {
          const t = n.tache!;
          const tt = t.type === 'HUMAINE' ? 'bpmn:userTask' : 'bpmn:serviceTask';
          const aa = t.assignee ? ` camunda:assignee="${esc(t.assignee)}"` : '';
          return `    <${tt} id="${n.id}" name="${esc(t.nom)}"${aa}>${inF}${outF}</${tt}>`;
        }
        default: return '';
      }
    }).join('\n');

    const flowsXml = flows.map((f: any) =>
      `    <bpmn:sequenceFlow id="${f.id}"${f.name ? ` name="${esc(f.name)}"` : ''} sourceRef="${f.from}" targetRef="${f.to}" />`
    ).join('\n');

    const shapes = nodes.map((n: any) =>
      `      <bpmndi:BPMNShape id="${n.id}_di" bpmnElement="${n.id}"${n.kind === 'gateway' ? ' isMarkerVisible="true"' : ''}><dc:Bounds x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" /></bpmndi:BPMNShape>`
    ).join('\n');

    const edgesXml = flows.map((f: any) => {
      const fn = nodes.find((n: any) => n.id === f.from);
      const tn = nodes.find((n: any) => n.id === f.to);
      if (!fn || !tn) return '';
      const wp = `<di:waypoint x="${fn.x + fn.w}" y="${fn.y + fn.h / 2}" /><di:waypoint x="${tn.x}" y="${tn.y + tn.h / 2}" />`;
      return `      <bpmndi:BPMNEdge id="${f.id}_di" bpmnElement="${f.id}">${wp}</bpmndi:BPMNEdge>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn"
  exporter="ProcessusManager" exporterVersion="4.0">
  <bpmn:process id="${processId}" name="${processName}" isExecutable="true">
${bpmnElements}
${flowsXml}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">
${shapes}
${edgesXml}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }
}
