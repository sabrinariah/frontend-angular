import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';

import { AppComponent } from './app/app.component';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { EditUserComponent } from './app/features/users/edit-user';

// ✅ MODULES
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// 🔐 sécurité
import { KeycloakService } from './app/core/services/keycloak.service';
import { AuthGuardService } from './app/core/guards/auth.guard';
import { TokenInterceptor } from './app/core/interceptors/token.interceptor';

// 🔹 composants
import { LoginComponent } from './app/login/login';
import { DashboardComponent } from './app/features/dashboard/dashboard.component';
import { UsersComponent } from './app/features/users/users.component';
import { CreateUserComponent } from './app/features/users/create-user/create-user';
import { UserDetailComponent } from './app/features/users/user-detail/user-detail';
import { ProcessusListComponent } from './app/features/processus/processus-list.component';
import { ProcessusFormComponent } from './app/features/processus/processus-form.component';
import { TachesListComponent } from './app/features/taches/taches-list';
import { ProcessusModifierComponent } from './app/features/processus/processus-modifier.component';
import { RegleMetierComponent } from './app/components/regle/regle';

// 🔥 CAMUNDA
import { BpmnViewerComponent } from './app/components/bpmn-viewer/bpmn-viewer';
import { RegisterComponent } from './app/register/register';

// 🆕 IMPORT / EXPORT
import { ImportComponent } from './app/pages/import/import';
import { ExportComponent } from './app/pages/export.component';
import { ImportExportComponent } from './app/pages/import-export.component';

// ════════════════════════════════════════════════════════════════
// 🔐 CONSTANTES DES RÔLES — UNE SEULE SOURCE DE VÉRITÉ
// ════════════════════════════════════════════════════════════════
const ROLE_SUPER_ADMIN = 'SuperAdmin';
const ROLE_GEST_PROCESSUS = 'Gestionnaire des processus metier';
const ROLE_GEST_REGLES = 'Gestionnaire des règles métier'; // ✅ Avec accents corrects (comme Keycloak)

// Groupes de rôles réutilisables
const ROLES_ADMIN_ONLY = [ROLE_SUPER_ADMIN];

const ROLES_PROCESSUS = [
  ROLE_SUPER_ADMIN,
  ROLE_GEST_PROCESSUS
];

const ROLES_REGLES = [
  ROLE_SUPER_ADMIN,
  ROLE_GEST_PROCESSUS,  // ✅ Le gest. processus a aussi accès aux règles
  ROLE_GEST_REGLES
];

const ROLES_IMPORT_EXPORT = [
  ROLE_SUPER_ADMIN,
  ROLE_GEST_PROCESSUS,
  ROLE_GEST_REGLES  // ✅ Les 2 gestionnaires + admin
];

// ====================== ROUTES ======================
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // 📊 DASHBOARD — accessible à tous les connectés
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuardService]
  },

  // ⚙️ RÈGLES MÉTIER
  {
    path: 'regles',
    component: RegleMetierComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_REGLES }
  },

  // 🔥 CAMUNDA - BPMN Viewer
  {
    path: 'bpmn-viewer/:processDefinitionId',
    component: BpmnViewerComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_PROCESSUS }
  },

  // 🆕 IMPORT / EXPORT (accessible aux 2 gestionnaires + admin)
  {
    path: 'import',
    component: ImportComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_IMPORT_EXPORT }
  },
  {
    path: 'export',
    component: ExportComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_IMPORT_EXPORT }
  },
  {
    path: 'import-export',
    component: ImportExportComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_IMPORT_EXPORT }
  },

  // 👤 USERS — SuperAdmin uniquement
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_ADMIN_ONLY }
  },
  {
    path: 'users/:username',
    component: UserDetailComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_ADMIN_ONLY }
  },
  {
    path: 'create-user',
    component: CreateUserComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_ADMIN_ONLY }
  },
  {
    path: 'users/edit/:username',
    component: EditUserComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_ADMIN_ONLY }
  },

  // ⚙️ PROCESSUS — SuperAdmin + Gestionnaire processus
  {
    path: 'processus',
    component: ProcessusListComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_PROCESSUS }
  },
  {
    path: 'processus/new',
    component: ProcessusFormComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_PROCESSUS }
  },
  {
    path: 'processus/:id/edit',
    component: ProcessusModifierComponent,
    canActivate: [AuthGuardService],
    data: { roles: ROLES_PROCESSUS }
  },

  // 📋 TÂCHES (accessible à tous les connectés)
  {
    path: 'taches-list',
    component: TachesListComponent,
    canActivate: [AuthGuardService]
  },

  { path: '**', redirectTo: 'dashboard' }
];

// ====================== BOOTSTRAP ======================
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),

    // 🌐 HTTP
    provideHttpClient(withInterceptorsFromDi()),

    // ✅ Angular modules
    importProvidersFrom(
      FormsModule,
      CommonModule,
      RouterModule
    ),

    // 🔐 sécurité
    KeycloakService,
    AuthGuardService,

    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ]
})
.then(appRef => {
  const keycloakService = appRef.injector.get(KeycloakService);

  keycloakService.init()
    .then(authenticated => {
      console.log('✅ Keycloak initialisé, connecté ?', authenticated);
    })
    .catch(err => {
      console.error('❌ Erreur init Keycloak:', err);
    });
})
.catch(err => console.error('❌ Erreur bootstrap:', err));