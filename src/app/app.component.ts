

import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { KeycloakService } from './core/services/keycloak.service';
import { NotificationService, AppNotification } from './core/services/notification.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  requiresRoles: string[];
  badge?: string;
  badgeType?: 'new' | 'count' | 'hot';
  description?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, AsyncPipe],
  template: `

  <!-- ════ SVG Icons (sprite) ════ -->
  <svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true">
    <defs>
      <symbol id="icon-dashboard" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <rect x="14" y="3" width="7" height="5" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <rect x="14" y="12" width="7" height="9" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <rect x="3" y="16" width="7" height="5" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/>
      </symbol>
      <symbol id="icon-users" viewBox="0 0 24 24">
        <circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <path d="M2 20C2 16.5 5 14 9 14C13 14 16 16.5 16 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <circle cx="17" cy="9" r="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <path d="M15 14C18 14 22 16 22 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      </symbol>
      <symbol id="icon-processes" viewBox="0 0 24 24">
        <circle cx="6" cy="6" r="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <circle cx="18" cy="6" r="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <circle cx="12" cy="18" r="2.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <path d="M8.5 6H15.5M6 8.5V11C6 12.5 7 13.5 8.5 13.5H15.5C17 13.5 18 12.5 18 11V8.5"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <path d="M12 13.5V15.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-import" viewBox="0 0 24 24">
        <path d="M12 3V15M12 15L8 11M12 15L16 11"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 19H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M4 15V19M20 15V19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-transfer" viewBox="0 0 24 24">
        <path d="M4 8H19M19 8L15 4M19 8L15 12"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 16H5M5 16L9 12M5 16L9 20"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
      <symbol id="icon-play" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <path d="M10 8.5L15 12L10 15.5V8.5Z"
              stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" fill="currentColor" fill-opacity="0.15"/>
      </symbol>
      <symbol id="icon-export" viewBox="0 0 24 24">
        <path d="M12 15V3M12 3L8 7M12 3L16 7"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 19H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M4 15V19M20 15V19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-rules" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <path d="M8 8H16M8 12H14M8 16H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-tasks" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <path d="M8 12L11 15L16 9"
              stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
      <symbol id="icon-search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </symbol>
      <symbol id="icon-ai" viewBox="0 0 24 24">
        <rect x="6" y="8" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.8" fill="none"/>
        <circle cx="9.5" cy="12" r="1" fill="currentColor"/>
        <circle cx="14.5" cy="12" r="1" fill="currentColor"/>
        <path d="M9.5 15h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M9 8V6M12 8V5M15 8V6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M6 12H4M20 12H18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </symbol>
    </defs>
  </svg>

  <div class="app-container" [class.mobile-view]="isMobile">

    <!-- Mobile overlay -->
    <div class="sidebar-overlay"
         *ngIf="isMobile && !isSidebarCollapsed"
         (click)="toggleSidebar()"></div>

    <!-- ═══ SIDEBAR ═══ -->
    <aside class="sidebar"
           [class.collapsed]="isSidebarCollapsed"
           [class.mobile-open]="!isSidebarCollapsed && isMobile"
           *ngIf="!isLoginPage()">

      <nav class="sidebar-nav" role="navigation" aria-label="Navigation principale">

        <!-- ── Brand ── -->
        <div class="sidebar-brand" (click)="navigateToDashboard()" role="button" tabindex="0">
          <div class="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="white" stroke-width="1.8" stroke-linejoin="round" fill="rgba(255,255,255,0.18)"/>
              <path d="M3 12L12 17L21 12" stroke="white" stroke-width="1.8" stroke-linejoin="round" opacity="0.7"/>
              <path d="M3 17L12 22L21 17" stroke="white" stroke-width="1.8" stroke-linejoin="round" opacity="0.4"/>
            </svg>
          </div>
          <span class="brand-name" *ngIf="!isSidebarCollapsed">ProcessFlow</span>
        </div>

        <!-- ── Search (expanded only) ── -->
        <div class="search-wrap" *ngIf="!isSidebarCollapsed">
          <div class="search-box">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <use href="#icon-search"></use>
            </svg>
            <input type="text"
                   class="search-input"
                   placeholder="Rechercher..."
                   [(ngModel)]="searchTerm"
                   (ngModelChange)="onSearch()"
                   aria-label="Rechercher dans le menu" />
            <kbd class="search-kbd" *ngIf="!searchTerm">⌘K</kbd>
          </div>
        </div>

        <!-- ── User card (expanded) ── -->
        <div class="user-card" *ngIf="!isSidebarCollapsed && keycloakService.isLoggedIn()">
          <div class="avatar-wrap">
            <div class="avatar">{{ getUserInitials() }}</div>
            <span class="online-dot"></span>
          </div>
          <div class="user-meta">
            <p class="user-name">{{ getUserName() }}</p>
            <span class="role-tag">
              <span class="role-dot"></span>
              {{ getPrimaryRole() }}
            </span>
          </div>
        </div>

        <!-- ── User avatar only (collapsed) ── -->
        <div class="avatar-collapsed" *ngIf="isSidebarCollapsed && keycloakService.isLoggedIn()">
          <div class="avatar-wrap">
            <div class="avatar">{{ getUserInitials() }}</div>
            <span class="online-dot"></span>
          </div>
        </div>

        <!-- ── Scrollable navigation ── -->
        <div class="nav-scroll">

          <!-- Général -->
          <div class="nav-group" *ngIf="filteredGeneralItems.length > 0">
            <p class="group-label" *ngIf="!isSidebarCollapsed">
              Général
            </p>
            <div class="group-divider" *ngIf="isSidebarCollapsed"></div>
            <ul class="nav-list">
              <li *ngFor="let item of filteredGeneralItems">
                <a class="nav-link"
                   [routerLink]="item.path"
                   routerLinkActive="active"
                   [routerLinkActiveOptions]="{exact: true}"
                   (click)="onMenuItemClick()"
                   [attr.data-tooltip]="isSidebarCollapsed ? item.label : null">
                  <span class="icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <use [attr.href]="'#icon-' + item.icon"></use>
                    </svg>
                  </span>
                  <span class="link-text" *ngIf="!isSidebarCollapsed">{{ item.label }}</span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Processus -->
          <div class="nav-group" *ngIf="filteredProcessItems.length > 0">
            <p class="group-label" *ngIf="!isSidebarCollapsed">
              Processus
              <span class="group-count">{{ filteredProcessItems.length }}</span>
            </p>
            <div class="group-divider" *ngIf="isSidebarCollapsed"></div>
            <ul class="nav-list">
              <li *ngFor="let item of filteredProcessItems">
                <!-- Item simple (sans enfants) -->
                <a *ngIf="!item.children?.length; else parentItem"
                   class="nav-link"
                   [routerLink]="item.path"
                   routerLinkActive="active"
                   [routerLinkActiveOptions]="{exact: true}"
                   (click)="onMenuItemClick()"
                   [attr.data-tooltip]="isSidebarCollapsed ? item.label : null">
                  <span class="icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <use [attr.href]="'#icon-' + item.icon"></use>
                    </svg>
                  </span>
                  <span class="link-text" *ngIf="!isSidebarCollapsed">{{ item.label }}</span>
                  <span *ngIf="item.badge && !isSidebarCollapsed"
                        class="badge"
                        [class.badge-new]="item.badgeType === 'new'"
                        [class.badge-count]="item.badgeType === 'count'"
                        [class.badge-hot]="item.badgeType === 'hot'">
                    {{ item.badge }}
                  </span>
                  <span *ngIf="item.badge && isSidebarCollapsed" class="badge-dot"
                        [class.badge-new]="item.badgeType === 'new'"
                        [class.badge-count]="item.badgeType === 'count'"
                        [class.badge-hot]="item.badgeType === 'hot'"></span>
                </a>
                <!-- Item parent (avec sous-menu) -->
                <ng-template #parentItem>
                  <a class="nav-link" [class.active]="isChildActive(item)"
                     (click)="toggleExpand(item.path); onMenuItemClick()"
                     [attr.data-tooltip]="isSidebarCollapsed ? item.label : null">
                    <span class="icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <use [attr.href]="'#icon-' + item.icon"></use>
                      </svg>
                    </span>
                    <span class="link-text" *ngIf="!isSidebarCollapsed">{{ item.label }}</span>
                    <span class="nav-arrow" *ngIf="!isSidebarCollapsed"
                          [class.nav-arrow-open]="isExpanded(item.path)">›</span>
                  </a>
                  <ul class="nav-sub-list" *ngIf="isExpanded(item.path) && !isSidebarCollapsed">
                    <li *ngFor="let child of item.children">
                      <a class="nav-link nav-sub-link"
                         [routerLink]="child.path"
                         routerLinkActive="active"
                         [routerLinkActiveOptions]="{exact: true}"
                         (click)="onMenuItemClick()">
                        <span class="sub-indent"></span>
                        <span class="icon-box">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <use [attr.href]="'#icon-' + child.icon"></use>
                          </svg>
                        </span>
                        <span class="link-text">{{ child.label }}</span>
                      </a>
                    </li>
                  </ul>
                </ng-template>
              </li>
            </ul>
          </div>

          <!-- No results -->
          <div class="no-results"
               *ngIf="!isSidebarCollapsed && searchTerm && filteredGeneralItems.length === 0 && filteredProcessItems.length === 0">
            <div class="no-results-icon">🔍</div>
            <p>Aucun résultat pour</p>
            <strong>"{{ searchTerm }}"</strong>
          </div>

        </div><!-- /nav-scroll -->

        <!-- ── Footer ── -->
        <div class="sidebar-footer">

          <!-- Bouton Déconnexion -->
          <button class="sidebar-logout-btn"
                  *ngIf="keycloakService.isLoggedIn()"
                  (click)="logout()"
                  [attr.data-tooltip]="isSidebarCollapsed ? 'Déconnexion' : null"
                  [attr.aria-label]="'Déconnexion'">
            <span class="icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 3H17C18.5 3 20 4.5 20 6V18C20 19.5 18.5 21 17 21H15"
                      stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M9 16L4 12M4 12L9 8M4 12H16"
                      stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="link-text" *ngIf="!isSidebarCollapsed">Déconnexion</span>
          </button>
        </div>

      </nav>
    </aside>

    <!-- ═══ RIGHT SIDE : TOPBAR + CONTENT ═══ -->
    <div class="right-pane" [class.no-sidebar]="isLoginPage()">

      <!-- ═══ TOP BAR ═══ -->
      <header class="topbar" *ngIf="!isLoginPage()">
        <!-- Collapse toggle (inside topbar) -->
        <button class="topbar-toggle"
                (click)="toggleSidebar()"
                [attr.aria-label]="(isSidebarCollapsed ? 'Ouvrir' : 'Fermer') + ' le menu'">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path [attr.d]="isSidebarCollapsed ? 'M4.5 2L8 6L4.5 10' : 'M7.5 2L4 6L7.5 10'"
                  stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- E-FORCE / ProcessFlow logo badge -->
       
        <!-- Right actions -->
        <div class="topbar-actions">

          <!-- 🔔 Cloche notifications (utilisateur connecté) -->
          <div class="notif-wrap" *ngIf="keycloakService.isLoggedIn()">
            <button class="topbar-btn notif-bell-btn"
                    (click)="toggleNotifPanel()"
                    title="Notifications"
                    aria-label="Notifications">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                      stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"
                      stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="notif-badge" *ngIf="(unreadCount$ | async) as c">
                {{ c > 9 ? '9+' : c }}
              </span>
            </button>

            <!-- Panneau déroulant -->
            <div class="notif-panel" *ngIf="notifPanelOpen">
              <!-- En-tête -->
              <div class="notif-panel-header">
                <span class="notif-panel-title">Notifications</span>
                <span class="notif-unread-chip" *ngIf="(unreadCount$ | async) as c">
                  {{ c }} non lue{{ c > 1 ? 's' : '' }}
                </span>
                <button class="notif-mark-all" (click)="notifSvc.markAllRead()" title="Tout marquer comme lu">
                  ✓ Tout lire
                </button>
              </div>

              <!-- Liste -->
              <div class="notif-list">
                <ng-container *ngIf="(notifications$ | async) as notifs">
                  <div *ngIf="notifs.length === 0" class="notif-empty">
                    <span class="notif-empty-icon">🔔</span>
                    <p>Aucune notification</p>
                  </div>
                  <div *ngFor="let n of notifs"
                       class="notif-item"
                       [class.notif-unread]="!n.read"
                       (click)="notifSvc.markRead(n.id)">
                    <div class="notif-item-icon" [class]="'notif-icon-' + n.type">
                      {{ n.icon }}
                    </div>
                    <div class="notif-item-body">
                      <p class="notif-item-title">{{ n.title }}</p>
                      <p class="notif-item-msg">{{ n.message }}</p>
                      <span class="notif-item-time">{{ n.time | date:'HH:mm · dd/MM' }}</span>
                    </div>
                    <span class="notif-dot" *ngIf="!n.read"></span>
                  </div>
                </ng-container>
              </div>

              <!-- Pied -->
              <div class="notif-panel-footer">
                <button class="notif-clear-btn" (click)="notifSvc.clear()">🗑 Tout effacer</button>
              </div>
            </div>
          </div>

          <!-- Bouton Connexion si non connecté -->
          <ng-container *ngIf="keycloakService.ready && !keycloakService.isLoggedIn()">
            <button class="topbar-btn topbar-login"
                    (click)="goToLogin()"
                    title="Connexion"
                    aria-label="Connexion">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H7C5.5 21 4 19.5 4 18V6C4 4.5 5.5 3 7 3H9"
                      stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                <path d="M15 8L20 12M20 12L15 16M20 12H8"
                      stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="btn-text">Connexion</span>
            </button>
          </ng-container>
        </div>
      </header>

      <!-- ═══ MAIN CONTENT ═══ -->
      <main class="main-content" [class.no-sidebar]="isLoginPage()">
        <router-outlet></router-outlet>
      </main>

    </div>

  </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      /* ══ Palette Pro Blue ══ */
      --primary:          #2b93fc;
      --primary-dark:     #1f89f4;
      --primary-light:    #E6F1FB;
      --primary-glow:     rgba(37, 99, 235, 0.15);

      /* Sidebar */
      --sb-bg:            #FFFFFF;
      --sb-hover:         #F0F6FF;
      --sb-active-bg:     #E6F1FB;
      --sb-divider:       #B5D4F4;
      --sb-text:          #475569;
      --sb-text-muted:    #94A3B8;
      --sb-text-active:   #0F172A;

      /* Topbar + page */
      --topbar-bg:        #FFFFFF;
      --topbar-border:    #B5D4F4;
      --bg-page:          #F8FAFC;
      --border:           #B5D4F4;

      /* Page text */
      --text-1:           #0F172A;
      --text-2:           #475569;

      /* Dimensions */
      --sidebar-w:        248px;
      --sidebar-w-col:    64px;
      --topbar-h:         56px;

      /* Radius & shadow */
      --radius-s:         8px;
      --radius-m:         10px;
      --shadow-sidebar:   1px 0 0 #B5D4F4, 4px 0 16px rgba(15,23,42,0.06);
      --shadow-md:        0 4px 16px rgba(15,23,42,0.10);

      /* Speed */
      --speed:            0.25s cubic-bezier(0.4, 0, 0.2, 1);
      --speed-fast:       0.15s ease-out;

      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ═══ Layout ═══ */
    .app-container {
      display: flex;
      height: 100vh;
      background: var(--bg-page);
      overflow: hidden;
    }
    .right-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      overflow: hidden;
    }
    .right-pane.no-sidebar { width: 100%; }

    /* ═══ Mobile overlay ═══ */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 20, 60, 0.5);
      z-index: 99;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

    /* ═══ SIDEBAR ═══ */
    .sidebar {
      width: var(--sidebar-w);
      min-width: var(--sidebar-w);
      background: var(--sb-bg);
      color: var(--sb-text);
      display: flex;
      flex-direction: column;
      transition: width var(--speed), min-width var(--speed);
      position: relative;
      z-index: 100;
      box-shadow: var(--shadow-sidebar);
    }
    .sidebar.collapsed {
      width: var(--sidebar-w-col);
      min-width: var(--sidebar-w-col);
    }

    /* ═══ Nav container ═══ */
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    /* ═══ Brand ═══ */
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 18px;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
      height: var(--topbar-h);
      border-bottom: 1px solid var(--sb-divider);
      transition: background var(--speed-fast);
    }
    .sidebar-brand:hover { background: var(--sb-hover); }
    .sidebar.collapsed .sidebar-brand { justify-content: center; padding: 0; }

    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-s);
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px var(--primary-glow);
    }
    .brand-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--sb-text-active);
      letter-spacing: -0.3px;
      white-space: nowrap;
    }

    /* ═══ Search ═══ */
    .search-wrap {
      padding: 14px 14px 8px;
      flex-shrink: 0;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: #E6F1FB;
      border: 1px solid #B5D4F4;
      border-radius: var(--radius-m);
      padding: 8px 12px;
      transition: all var(--speed-fast);
    }
    .search-box:focus-within {
      background: #fff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .search-icon { color: var(--sb-text-muted); flex-shrink: 0; margin-right: 8px; }
    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      font-family: inherit;
      color: var(--sb-text-active);
      outline: none;
      min-width: 0;
    }
    .search-input::placeholder { color: var(--sb-text-muted); }
    .search-kbd {
      font-size: 10px;
      font-family: inherit;
      font-weight: 600;
      color: var(--sb-text-muted);
      background: #E6F1FB;
      border: 1px solid #B5D4F4;
      border-radius: 4px;
      padding: 2px 5px;
      flex-shrink: 0;
    }

    /* ═══ User card ═══ */
    .user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 6px 12px 10px;
      padding: 10px 12px;
      background: #E6F1FB;
      border: 1px solid #B5D4F4;
      border-radius: var(--radius-m);
      flex-shrink: 0;
    }
    .avatar-collapsed {
      display: flex;
      justify-content: center;
      padding: 10px 0 8px;
      flex-shrink: 0;
    }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-s);
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px var(--primary-glow);
      letter-spacing: 0.3px;
    }
    .online-dot {
      position: absolute;
      bottom: -3px;
      right: -3px;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #22c55e;
      border: 2.5px solid #ffffff;
    }
    .user-meta { flex: 1; overflow: hidden; }
    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--sb-text-active);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .role-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      font-size: 10.5px;
      font-weight: 600;
      color: var(--primary-dark);
      background: var(--primary-light);
      border: 1px solid rgba(37, 99, 235, 0.2);
      padding: 2px 8px;
      border-radius: 6px;
    }
    .role-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--primary);
    }

    /* ═══ Scrollable nav ═══ */
    .nav-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 4px 10px 8px;
      scrollbar-width: thin;
      scrollbar-color: #B5D4F4 transparent;
    }
    .nav-scroll::-webkit-scrollbar { width: 4px; }
    .nav-scroll::-webkit-scrollbar-thumb {
      background: #B5D4F4;
      border-radius: 4px;
    }
    .nav-scroll::-webkit-scrollbar-thumb:hover { background: #93BDE8; }

    /* ═══ Nav group ═══ */
    .nav-group { margin-bottom: 4px; }
    .group-label {
      display: flex;
      align-items: center;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.6px;
      color: var(--sb-text-muted);
      padding: 14px 12px 5px;
    }
    .group-count {
      margin-left: auto;
      font-size: 9px;
      font-weight: 700;
      color: var(--sb-text-muted);
      background: rgba(255,255,255,0.07);
      padding: 1px 6px;
      border-radius: 8px;
      letter-spacing: 0;
    }
    .group-divider {
      height: 1px;
      background: var(--sb-divider);
      margin: 10px 8px;
    }
    .nav-list { list-style: none; }

    /* ═══ Nav link ═══ */
    .nav-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-s);
      color: var(--sb-text);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all var(--speed-fast);
      position: relative;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      margin-bottom: 2px;
    }
    .nav-link:hover {
      background: var(--sb-hover);
      color: var(--sb-text-active);
    }
    .nav-link.active {
      background: var(--sb-active-bg);
      color: var(--primary-dark);
      font-weight: 600;
    }
    .nav-link.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: var(--primary);
      border-radius: 0 3px 3px 0;
      box-shadow: 0 0 8px var(--primary-glow);
    }
    .icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      color: var(--sb-text-muted);
      transition: color var(--speed-fast);
    }
    .nav-link:hover .icon-box,
    .nav-link.active .icon-box { color: var(--primary); }
    .link-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ═══ Badges ═══ */
    .badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2.5px 7px;
      border-radius: 10px;
      flex-shrink: 0;
      letter-spacing: 0.2px;
      line-height: 1.4;
    }
    .badge-new {
      background: var(--primary-light);
      color: var(--primary-dark);
      border: 1px solid rgba(37, 99, 235, 0.25);
    }
    .badge-count {
      background: rgba(34,197,94,0.15);
      color: #4ade80;
      border: 1px solid rgba(34,197,94,0.3);
    }
    .badge-hot {
      background: rgba(239,68,68,0.15);
      color: #f87171;
      border: 1px solid rgba(239,68,68,0.3);
    }

    /* Badge dot (collapsed) */
    .badge-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 8px; height: 8px;
      border-radius: 50%;
      border: 2px solid var(--sb-bg);
    }
    .badge-dot.badge-new   { background: var(--primary); }
    .badge-dot.badge-count { background: #22c55e; }
    .badge-dot.badge-hot   { background: #ef4444; }

    /* ═══ Flèche nav parent ═══ */
    .nav-arrow {
      margin-left: auto;
      font-size: 16px;
      color: var(--sb-text-muted);
      transition: transform 0.2s ease;
      flex-shrink: 0;
      line-height: 1;
    }
    .nav-arrow-open {
      transform: rotate(90deg);
    }

    /* ═══ Sous-menu ═══ */
    .nav-sub-list {
      list-style: none;
      margin: 2px 0 4px 0;
      padding: 0;
    }
    .nav-sub-link {
      padding-left: 8px !important;
      font-size: 12.5px !important;
    }
    .sub-indent {
      width: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--sb-text-muted);
      font-size: 11px;
      padding-left: 4px;
    }
    .sub-indent::before {
      content: '└';
      color: var(--sb-divider);
    }

    /* ═══ No results ═══ */
    .no-results { text-align: center; padding: 32px 16px; color: var(--sb-text-muted); }
    .no-results-icon { font-size: 28px; margin-bottom: 8px; opacity: 0.6; }
    .no-results p { font-size: 12px; }
    .no-results strong { display: block; font-size: 13px; color: var(--sb-text); margin-top: 4px; }

    /* ═══ Tooltip (collapsed) ═══ */
    [data-tooltip] { position: relative; }
    .sidebar.collapsed [data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%);
      background: #0F172A;
      color: #fff;
      padding: 6px 10px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      z-index: 1000;
      box-shadow: var(--shadow-md);
      animation: tooltipIn 0.15s ease-out;
      pointer-events: none;
    }
    .sidebar.collapsed [data-tooltip]:hover::before {
      content: '';
      position: absolute;
      left: calc(100% + 6px);
      top: 50%;
      transform: translateY(-50%);
      border: 5px solid transparent;
      border-right-color: #0F172A;
      z-index: 1000;
      pointer-events: none;
    }
    @keyframes tooltipIn {
      from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
      to   { opacity: 1; transform: translateY(-50%) translateX(0); }
    }

    /* ═══ Carte info app ═══ */
    .app-info-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
      background: var(--primary-light);
      border: 1px solid rgba(37, 99, 235, 0.15);
      border-radius: var(--radius-s);
      flex-shrink: 0;
    }
    .app-info-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .app-info-text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .app-info-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .app-info-sub {
      font-size: 10px;
      color: var(--primary);
      font-weight: 500;
    }
    .app-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
      animation: pulse 2s ease-in-out infinite;
      flex-shrink: 0;
    }

    /* ═══ Footer ═══ */
    .sidebar-footer {
      flex-shrink: 0;
      padding: 12px 12px 16px;
      border-top: 1px solid var(--sb-divider);
    }

    /* ═══ Logout button ═══ */
    .sidebar-logout-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      margin-bottom: 10px;
      border-radius: var(--radius-s);
      border: 1px solid rgba(239,68,68,0.22);
      background: rgba(239,68,68,0.08);
      color: #fca5a5;
      font-size: 13px;
      font-family: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--speed-fast);
      white-space: nowrap;
      overflow: hidden;
      position: relative;
    }
    .sidebar-logout-btn:hover {
      background: rgba(239,68,68,0.18);
      border-color: rgba(239,68,68,0.40);
      color: #fecaca;
    }
    .sidebar-logout-btn .icon-box { color: inherit; }
    .sidebar.collapsed .sidebar-logout-btn { justify-content: center; padding: 9px 0; }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

    /* ═══ TOPBAR ═══ */
    .topbar {
      height: var(--topbar-h);
      background: var(--topbar-bg);
      border-bottom: 1px solid var(--topbar-border);
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 14px;
      flex-shrink: 0;
      z-index: 50;
      box-shadow: 0 1px 4px rgba(10,20,60,0.06);
    }

    .topbar-toggle {
      width: 32px; height: 32px;
      border-radius: var(--radius-s);
      border: 1px solid #e2e8f0;
      background: #f8fafd;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all var(--speed-fast);
      flex-shrink: 0;
    }
    .topbar-toggle:hover {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 2px 8px var(--primary-glow);
    }

    .topbar-logo {
      background: var(--primary);
      color: #fff;
      padding: 6px 14px;
      border-radius: var(--radius-s);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .topbar-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .topbar-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 14px;
      border-radius: var(--radius-s);
      border: 1px solid #e2e8f0;
      background: #f8fafd;
      color: #475569;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      font-weight: 600;
      transition: all var(--speed-fast);
    }
    .topbar-btn:hover { background: #eef2f8; color: var(--text-1); }
    .topbar-login {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
      box-shadow: 0 2px 8px var(--primary-glow);
    }
    .topbar-login:hover {
      background: var(--primary-dark);
      border-color: var(--primary-dark);
      color: #fff;
    }
    .btn-text { line-height: 1; }

    /* ═══ Main content ═══ */
    .main-content {
      flex: 1;
      overflow-y: auto;
      min-width: 0;
      background: var(--bg-page);
    }
    .main-content.no-sidebar { width: 100%; }

    /* ═══ Focus states ═══ */
    .nav-link:focus-visible,
    .topbar-btn:focus-visible,
    .topbar-toggle:focus-visible,
    .search-input:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    /* ═══ Mobile ═══ */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        top: 0; left: 0;
        height: 100%;
        transform: translateX(-100%);
        width: var(--sidebar-w) !important;
        min-width: var(--sidebar-w) !important;
        transition: transform var(--speed);
      }
      .sidebar.mobile-open { transform: translateX(0); }
      .topbar-btn .btn-text { display: none; }
      .topbar-btn { padding: 7px; }
    }

    /* ═══ Reduced motion ═══ */
    @media (prefers-reduced-motion: reduce) {
      .sidebar, .nav-link, .topbar-btn, .version-dot { transition: none; animation: none; }
    }

    /* ══════════════════════════════════════════════
       NOTIFICATION BELL + PANEL
    ══════════════════════════════════════════════ */
    .notif-wrap {
      position: relative;
    }

    .notif-bell-btn {
      width: 36px; height: 36px;
      padding: 0;
      border-radius: var(--radius-s);
      border: 1px solid #e2e8f0;
      background: #f8fafd;
      color: #475569;
      cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: all var(--speed-fast);
      position: relative;
    }
    .notif-bell-btn:hover {
      background: var(--primary-light);
      color: var(--primary-dark);
      border-color: #B5D4F4;
    }

    /* Badge rouge compteur */
    .notif-badge {
      position: absolute;
      top: -5px; right: -5px;
      min-width: 17px; height: 17px;
      border-radius: 9px;
      background: #ef4444;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #fff;
      padding: 0 3px;
      line-height: 1;
      pointer-events: none;
    }

    /* Panneau déroulant */
    .notif-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 360px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.14);
      z-index: 999;
      display: flex; flex-direction: column;
      max-height: 480px;
      overflow: hidden;
      animation: notifSlide 0.18s ease-out;
    }
    @keyframes notifSlide {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Flèche pointer */
    .notif-panel::before {
      content: '';
      position: absolute;
      top: -7px; right: 10px;
      width: 14px; height: 14px;
      background: #fff;
      border-left: 1px solid #e2e8f0;
      border-top: 1px solid #e2e8f0;
      transform: rotate(45deg);
      border-radius: 3px 0 0 0;
    }

    /* En-tête du panneau */
    .notif-panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid #f1f5f9;
      flex-shrink: 0;
    }
    .notif-panel-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .notif-unread-chip {
      font-size: 10.5px;
      font-weight: 700;
      background: #dbeafe;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 8px;
      border: 1px solid #bfdbfe;
    }
    .notif-mark-all {
      margin-left: auto;
      font-size: 11px;
      font-weight: 600;
      color: var(--primary-dark);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background var(--speed-fast);
      font-family: inherit;
    }
    .notif-mark-all:hover { background: var(--primary-light); }

    /* Liste scrollable */
    .notif-list {
      flex: 1;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
    }
    .notif-list::-webkit-scrollbar { width: 4px; }
    .notif-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

    /* Vide */
    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 36px 16px;
      color: #94a3b8;
    }
    .notif-empty-icon { font-size: 28px; opacity: 0.5; }
    .notif-empty p { font-size: 13px; font-weight: 500; }

    /* Item notification */
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid #f8fafc;
      cursor: pointer;
      transition: background var(--speed-fast);
      position: relative;
    }
    .notif-item:hover { background: #f8fafc; }
    .notif-item.notif-unread { background: #f0f6ff; }
    .notif-item.notif-unread:hover { background: #e6f0ff; }

    /* Icône colorée selon type */
    .notif-item-icon {
      width: 34px; height: 34px;
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
    }
    .notif-icon-success { background: #f0fdf4; }
    .notif-icon-info    { background: #eff6ff; }
    .notif-icon-warning { background: #fffbeb; }
    .notif-icon-danger  { background: #fef2f2; }

    /* Corps texte */
    .notif-item-body { flex: 1; min-width: 0; }
    .notif-item-title {
      font-size: 12.5px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .notif-item-msg {
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    .notif-item-time {
      font-size: 10.5px;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Point bleu non-lu */
    .notif-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--primary);
      flex-shrink: 0;
      align-self: center;
    }

    /* Pied du panneau */
    .notif-panel-footer {
      border-top: 1px solid #f1f5f9;
      padding: 10px 16px;
      flex-shrink: 0;
    }
    .notif-clear-btn {
      font-size: 12px;
      font-weight: 600;
      color: #ef4444;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background var(--speed-fast);
      font-family: inherit;
    }
    .notif-clear-btn:hover { background: #fef2f2; }

    @media (max-width: 768px) {
      .notif-panel { width: calc(100vw - 32px); right: -8px; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isMobile = false;
  searchTerm = '';
  private expandedPaths = new Set<string>();
  private destroy$ = new Subject<void>();

  /* ── Notifications ── */
  notifPanelOpen = false;
  notifications$!: Observable<AppNotification[]>;
  unreadCount$!: Observable<number>;

  private allItems: MenuItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      requiresRoles: [],
      description: 'Vue d\'ensemble'
    },
    {
      path: '/users',
      label: 'Gestion Users',
      icon: 'users',
      requiresRoles: ['SuperAdmin'],
      description: 'Administration des utilisateurs'
    },
    {
      path: '/processus',
      label: 'Gestion Processus',
      icon: 'processes',
      requiresRoles: ['SuperAdmin', 'Gestionnaire des processus metier'],
      description: 'Gérer les processus BPMN'
    },
    {
      path: '/regles',
      label: 'Règles Métier',
      icon: 'rules',
      requiresRoles: ['SuperAdmin', 'Gestionnaire des règles métier', 'Gestionnaire des processus metier'],
      children: [
        {
          path: '/nlp-ia',
          label: 'Créer avec l\'IA',
          icon: 'ai',
          requiresRoles: ['SuperAdmin', 'Gestionnaire des règles métier', 'Gestionnaire des processus metier']
        }
      ]
    },
    
  ];

  /** Dashboard only — section "Général" */
  get generalItems(): MenuItem[] {
    return this.allItems.slice(0, 1);
  }

  /** Everything else filtered by role — section "Processus" */
  get processItems(): MenuItem[] {
    return this.allItems.slice(1).filter(item =>
      item.requiresRoles.length === 0 || this.hasAnyRole(item.requiresRoles)
    );
  }

  /** Items filtrés par la recherche */
  get filteredGeneralItems(): MenuItem[] {
    if (!this.searchTerm.trim()) return this.generalItems;
    return this.generalItems.filter(item =>
      item.label.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredProcessItems(): MenuItem[] {
    if (!this.searchTerm.trim()) return this.processItems;
    return this.processItems.filter(item =>
      item.label.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  constructor(
    public keycloakService: KeycloakService,
    private router: Router,
    public notifSvc: NotificationService
  ) {
    this.notifications$ = this.notifSvc.notifications$;
    this.unreadCount$   = this.notifSvc.unreadCount$;
  }

  ngOnInit(): void {
    this.checkMobile();

    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null && !this.isMobile) {
      this.isSidebarCollapsed = saved === 'true';
    }

    this.autoExpandParent(this.router.url);

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: any) => {
      this.autoExpandParent(e.url);
      if (this.isMobile && !this.isSidebarCollapsed) {
        this.isSidebarCollapsed = true;
      }
    });
  }

  private autoExpandParent(url: string): void {
    for (const item of this.allItems) {
      if (item.children?.some(c => url === c.path || url.startsWith(c.path + '/'))) {
        this.expandedPaths.add(item.path);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleNotifPanel(): void {
    this.notifPanelOpen = !this.notifPanelOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.notifPanelOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.notif-wrap')) {
      this.notifPanelOpen = false;
    }
  }

  /** Raccourci clavier Cmd+K / Ctrl+K pour focus la recherche */
  @HostListener('window:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (this.isSidebarCollapsed) this.isSidebarCollapsed = false;
      setTimeout(() => {
        const input = document.querySelector('.search-input') as HTMLInputElement;
        input?.focus();
      }, 100);
    }
  }

  onSearch(): void {
    // Hook pour analytics ou logique avancée si besoin
  }

  getUserInitials(): string {
    return this.getUserName()
      .split(' ')
      .map(n => n[0] ?? '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getUserName(): string {
    return this.keycloakService.getUsername() || 'Utilisateur';
  }

  getPrimaryRole(): string {
    const r = this.userRoles;
    if (r.includes('SuperAdmin')) return 'Super Admin';
    if (r.includes('Gestionnaire des processus metier')) return 'Process Manager';
    if (r.includes('Gestionnaire des règles métier')) return 'Rules Manager';
    return 'Utilisateur';
  }

  get userRoles(): string[] {
    return this.keycloakService.getUserRoles() ?? [];
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.userRoles.includes(r));
  }

  logout(): void { this.keycloakService.logout(); }
  goToLogin(): void { this.router.navigate(['/login']); }
  navigateToDashboard(): void { this.router.navigate(['/dashboard']); }
  isLoginPage(): boolean { return this.router.url.includes('login'); }

  toggleExpand(path: string): void {
    if (this.expandedPaths.has(path)) {
      this.expandedPaths.delete(path);
    } else {
      this.expandedPaths.add(path);
    }
  }

  isExpanded(path: string): boolean {
    return this.expandedPaths.has(path);
  }

  isChildActive(item: MenuItem): boolean {
    return item.children?.some(c => this.router.url === c.path || this.router.url.startsWith(c.path + '/')) ?? false;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (!this.isMobile) {
      localStorage.setItem('sidebarCollapsed', String(this.isSidebarCollapsed));
    }
  }

  onMenuItemClick(): void {
    if (this.isMobile) this.isSidebarCollapsed = true;
  }
}