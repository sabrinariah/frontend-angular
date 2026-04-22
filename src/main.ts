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
import { DetailProcessusComponent } from './app/features/processus/processus-detail';
import { ProcessusModifierComponent } from './app/features/processus/processus-modifier.component';
import { RegleMetierComponent } from './app/components/regle/regle';
// 🔥 CAMUNDA
import { StartProcessComponent } from './app/components/start-process/start-process';
import { TaskListComponent } from './app/components/task-list/task-list';
import { BpmnViewerComponent } from './app/components/bpmn-viewer/bpmn-viewer';   // ← CORRIGÉ ICI

// 🆕 IMPORT / EXPORT
import { ImportComponent } from './app/pages/import/import';
import { ExportComponent } from './app/pages/export.component';
import { ImportExportComponent } from './app/pages/import-export.component';
// ====================== ROUTES ======================
const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'users/:username', component: UserDetailComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuardService] },
// ⚙️ REGLES METIER
{ 
  path: 'regles', 
  component: RegleMetierComponent, 
  canActivate: [AuthGuardService],
   // 🔥 optionnel
},
  // 🔥 CAMUNDA
  { path: 'start-process', component: StartProcessComponent, canActivate: [AuthGuardService] },
  { path: 'tasks', component: TaskListComponent, canActivate: [AuthGuardService] },
{ 
    path: 'bpmn-viewer/:processDefinitionId', 
    component: BpmnViewerComponent, 
    canActivate: [AuthGuardService] 
  },
  // 🆕 IMPORT / EXPORT
  { path: 'import', component: ImportComponent, canActivate: [AuthGuardService] },
  { path: 'export', component: ExportComponent, canActivate: [AuthGuardService] },
{ path: 'import-export', component: ImportExportComponent, canActivate: [AuthGuardService] },
  // 👤 USERS
  { path: 'users', component: UsersComponent, canActivate: [AuthGuardService], data: { roles: ['SuperAdmin'] } },
  { path: 'create-user', component: CreateUserComponent, canActivate: [AuthGuardService], data: { roles: ['SuperAdmin'] } },
  { path: 'users/edit/:username', component: EditUserComponent },

  // ⚙️ PROCESSUS
  { path: 'processus', component: ProcessusListComponent, canActivate: [AuthGuardService], data: { roles: ['Gestionnaire des processus metier'] } },
  { path: 'processus/new', component: ProcessusFormComponent, canActivate: [AuthGuardService], data: { roles: ['Gestionnaire des processus metier'] } },
  { path: 'processus/:id/edit', component: ProcessusModifierComponent, canActivate: [AuthGuardService], data: { roles: ['Gestionnaire des processus metier'] } },
  { path: 'processus/:id', component: DetailProcessusComponent, canActivate: [AuthGuardService], data: { roles: ['Gestionnaire des processus metier'] } },

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