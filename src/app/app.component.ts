import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from './core/services/keycloak.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
interface MenuItem {
  path: string;
  label: string;
  icon: string;
  requiresRoles: string[];
  badge?: string;
  badgeType?: 'new' | 'count' | 'hot';
  description?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
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

      <!-- Collapse toggle -->
      <button class="sidebar-toggle"
              (click)="toggleSidebar()"
              [attr.aria-label]="(isSidebarCollapsed ? 'Ouvrir' : 'Fermer') + ' le menu'">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path [attr.d]="isSidebarCollapsed ? 'M4.5 2L8 6L4.5 10' : 'M7.5 2L4 6L7.5 10'"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <nav class="sidebar-nav" role="navigation" aria-label="Navigation principale">

        <!-- ── Brand ── -->
        <div class="sidebar-brand" (click)="navigateToDashboard()" role="button" tabindex="0">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="white" stroke-width="1.8" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/>
              <path d="M3 12L12 17L21 12" stroke="white" stroke-width="1.8" stroke-linejoin="round" opacity="0.7"/>
              <path d="M3 17L12 22L21 17" stroke="white" stroke-width="1.8" stroke-linejoin="round" opacity="0.4"/>
            </svg>
          </div>
          <div class="brand-text" *ngIf="!isSidebarCollapsed">
            <span class="brand-name">ProcessFlow</span>
            <span class="brand-tag">Enterprise</span>
          </div>
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
              <span class="group-dot"></span>
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <use [attr.href]="'#icon-' + item.icon"></use>
                    </svg>
                  </span>
                  <span class="link-text" *ngIf="!isSidebarCollapsed">{{ item.label }}</span>
                  <span class="link-arrow" *ngIf="!isSidebarCollapsed">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4.5 2L8 6L4.5 10" stroke="currentColor" stroke-width="1.8"
                            stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                </a>
              </li>
            </ul>
          </div>

          <!-- Processus -->
          <div class="nav-group" *ngIf="filteredProcessItems.length > 0">
            <p class="group-label" *ngIf="!isSidebarCollapsed">
              <span class="group-dot"></span>
              Processus
              <span class="group-count">{{ filteredProcessItems.length }}</span>
            </p>
            <div class="group-divider" *ngIf="isSidebarCollapsed"></div>
            <ul class="nav-list">
              <li *ngFor="let item of filteredProcessItems">
                <a class="nav-link"
                   [routerLink]="item.path"
                   routerLinkActive="active"
                   [routerLinkActiveOptions]="{exact: true}"
                   (click)="onMenuItemClick()"
                   [attr.data-tooltip]="isSidebarCollapsed ? item.label : null">
                  <span class="icon-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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

        <!-- ── Footer: Logout ── -->
        <div class="sidebar-footer">
          <ng-container *ngIf="keycloakService.ready">
            <ng-container *ngIf="keycloakService.isLoggedIn(); else loginTpl">
              <button class="logout-btn"
                      (click)="logout()"
                      [attr.data-tooltip]="isSidebarCollapsed ? 'Déconnexion' : null">
                <span class="btn-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3H17C18.5 3 20 4.5 20 6V18C20 19.5 18.5 21 17 21H15"
                          stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M9 16L4 12M4 12L9 8M4 12H16"
                          stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="btn-label" *ngIf="!isSidebarCollapsed">Déconnexion</span>
              </button>
            </ng-container>
            <ng-template #loginTpl>
              <button class="logout-btn login-variant"
                      (click)="goToLogin()"
                      [attr.data-tooltip]="isSidebarCollapsed ? 'Connexion' : null">
                <span class="btn-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H7C5.5 21 4 19.5 4 18V6C4 4.5 5.5 3 7 3H9"
                          stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    <path d="M15 8L20 12M20 12L15 16M20 12H8"
                          stroke="currentColor" stroke-width="1.8"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="btn-label" *ngIf="!isSidebarCollapsed">Connexion</span>
              </button>
            </ng-template>
          </ng-container>

          <!-- Version (expanded only) -->
          <div class="version-tag" *ngIf="!isSidebarCollapsed">
            <span class="version-dot"></span>
            v2.4.1 · Stable
          </div>
        </div>

      </nav>
    </aside>

    <!-- ═══ MAIN CONTENT ═══ -->
    <main class="main-content"
          [class.sidebar-collapsed]="isSidebarCollapsed"
          [class.no-sidebar]="isLoginPage()">
      <router-outlet></router-outlet>
    </main>

  </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    :host {
      /* ── Palette moderne ── */
      --bg-sidebar:       #ffffff;
      --bg-sidebar-2:     #fafbff;
      --bg-page:          #f7f8fc;
      --border:           #eaecf3;
      --border-soft:      #f0f2f8;

      /* Accent gradient */
      --accent:           #6366f1;
      --accent-2:         #8b5cf6;
      --accent-3:         #a855f7;
      --accent-bg:        #eef2ff;
      --accent-bg-2:      #f3f0ff;
      --accent-text:      #4338ca;
      --accent-border:    #c7d2fe;
      --gradient:         linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
      --gradient-soft:    linear-gradient(135deg, #eef2ff 0%, #f3f0ff 100%);

      /* Text */
      --text-1:           #0f172a;
      --text-2:           #475569;
      --text-3:           #94a3b8;
      --text-4:           #cbd5e1;

      /* States */
      --nav-hover:        #f4f5fb;
      --nav-active-bg:    var(--gradient-soft);
      --nav-active-fg:    #4338ca;
      --nav-active-bar:   var(--gradient);

      /* Sidebar */
      --sidebar-w:        264px;
      --sidebar-w-col:    72px;

      /* Radius & shadow */
      --radius-s:         8px;
      --radius-m:         12px;
      --radius-l:         16px;
      --shadow-sm:        0 1px 2px rgba(15, 23, 42, 0.04);
      --shadow-md:        0 4px 12px rgba(99, 102, 241, 0.08);
      --shadow-lg:        0 8px 24px rgba(99, 102, 241, 0.12);
      --shadow-glow:      0 0 0 4px rgba(99, 102, 241, 0.12);

      /* Speed */
      --speed:            0.3s cubic-bezier(0.4, 0, 0.2, 1);
      --speed-fast:       0.15s ease-out;

      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ═══ Layout ═══ */
    .app-container {
      display: flex;
      height: 100vh;
      background: var(--bg-page);
      overflow: hidden;
    }

    /* ═══ Mobile overlay ═══ */
    .sidebar-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      z-index: 99;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

    /* ═══ Sidebar ═══ */
    .sidebar {
      width: var(--sidebar-w);
      min-width: var(--sidebar-w);
      background: linear-gradient(180deg, var(--bg-sidebar) 0%, var(--bg-sidebar-2) 100%);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      transition: width var(--speed), min-width var(--speed);
      position: relative;
      z-index: 100;
      box-shadow: 1px 0 0 var(--border), 4px 0 24px rgba(99, 102, 241, 0.04);
    }
    .sidebar.collapsed {
      width: var(--sidebar-w-col);
      min-width: var(--sidebar-w-col);
    }

    /* ═══ Toggle button ═══ */
    .sidebar-toggle {
      position: absolute;
      top: 28px;
      right: -14px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--bg-sidebar);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-3);
      z-index: 10;
      box-shadow: var(--shadow-md);
      transition: all var(--speed-fast);
    }
    .sidebar-toggle:hover {
      background: var(--gradient);
      color: white;
      border-color: transparent;
      transform: scale(1.08);
      box-shadow: var(--shadow-lg);
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
      padding: 22px 18px 16px;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
      transition: opacity var(--speed-fast);
    }
    .sidebar-brand:hover { opacity: 0.85; }
    .brand-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-m);
      background: var(--gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-md), inset 0 1px 0 rgba(255, 255, 255, 0.25);
      position: relative;
      overflow: hidden;
    }
    .brand-icon::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3), transparent 60%);
      pointer-events: none;
    }
    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .brand-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-1);
      letter-spacing: -0.4px;
      background: var(--gradient);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-tag {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-3);
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin-top: 2px;
    }

    /* ═══ Search ═══ */
    .search-wrap {
      padding: 0 14px 12px;
      flex-shrink: 0;
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--bg-page);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-m);
      padding: 8px 12px;
      transition: all var(--speed-fast);
    }
    .search-box:focus-within {
      background: white;
      border-color: var(--accent-border);
      box-shadow: var(--shadow-glow);
    }
    .search-icon {
      color: var(--text-3);
      flex-shrink: 0;
      margin-right: 8px;
    }
    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 13px;
      font-family: inherit;
      color: var(--text-1);
      outline: none;
      min-width: 0;
    }
    .search-input::placeholder { color: var(--text-3); }
    .search-kbd {
      font-size: 10px;
      font-family: inherit;
      font-weight: 600;
      color: var(--text-3);
      background: white;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 2px 5px;
      flex-shrink: 0;
    }

    /* ═══ User card ═══ */
    .user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 14px 16px;
      padding: 12px;
      background: var(--gradient-soft);
      border: 1px solid var(--accent-border);
      border-radius: var(--radius-m);
      flex-shrink: 0;
      transition: all var(--speed-fast);
      position: relative;
      overflow: hidden;
    }
    .user-card::before {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 60px; height: 60px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%);
      pointer-events: none;
    }
    .avatar-collapsed {
      display: flex;
      justify-content: center;
      margin: 0 auto 16px;
      flex-shrink: 0;
    }
    .avatar-wrap {
      position: relative;
      flex-shrink: 0;
    }
    .avatar {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-s);
      background: var(--gradient);
      color: white;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255, 255, 255, 0.25);
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
      border: 2.5px solid var(--bg-sidebar);
      box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3);
    }
    .user-meta { flex: 1; overflow: hidden; z-index: 1; }
    .user-name {
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.2px;
    }
    .role-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 3px;
      font-size: 10.5px;
      font-weight: 600;
      color: var(--accent-text);
      background: white;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--accent-border);
    }
    .role-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    /* ═══ Scrollable nav ═══ */
    .nav-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 12px 8px;
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }
    .nav-scroll::-webkit-scrollbar { width: 4px; }
    .nav-scroll::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }
    .nav-scroll::-webkit-scrollbar-thumb:hover { background: var(--text-4); }

    /* ═══ Nav group ═══ */
    .nav-group { margin-bottom: 8px; }
    .group-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.4px;
      color: var(--text-3);
      padding: 10px 10px 6px;
    }
    .group-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--gradient);
    }
    .group-count {
      margin-left: auto;
      font-size: 10px;
      font-weight: 700;
      color: var(--text-3);
      background: var(--bg-page);
      padding: 1px 6px;
      border-radius: 8px;
      letter-spacing: 0;
    }
    .group-divider {
      height: 1px;
      background: var(--border-soft);
      margin: 10px 8px;
    }
    .nav-list { list-style: none; }

    /* ═══ Nav link ═══ */
    .nav-link {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 9px 11px;
      border-radius: var(--radius-s);
      color: var(--text-2);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      transition: all var(--speed-fast);
      position: relative;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      margin-bottom: 2px;
      letter-spacing: -0.1px;
    }
    .nav-link:hover {
      background: var(--nav-hover);
      color: var(--text-1);
      transform: translateX(2px);
    }
    .nav-link:hover .link-arrow { opacity: 1; transform: translateX(0); }
    .nav-link.active {
      background: var(--nav-active-bg);
      color: var(--nav-active-fg);
      font-weight: 600;
      box-shadow: inset 0 0 0 1px var(--accent-border);
    }
    .nav-link.active::before {
      content: '';
      position: absolute;
      left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 22px;
      background: var(--gradient);
      border-radius: 0 4px 4px 0;
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
    }
    .icon-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      color: var(--text-3);
      transition: color var(--speed-fast), transform var(--speed-fast);
    }
    .nav-link:hover .icon-box {
      color: var(--accent);
      transform: scale(1.1);
    }
    .nav-link.active .icon-box {
      color: var(--accent);
    }
    .link-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .link-arrow {
      display: flex;
      align-items: center;
      color: var(--text-3);
      opacity: 0;
      transform: translateX(-4px);
      transition: all var(--speed-fast);
    }
    .nav-link.active .link-arrow { opacity: 1; transform: translateX(0); color: var(--accent); }

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
    .badge-new   {
      background: linear-gradient(135deg, #eef2ff, #f3f0ff);
      color: #4f46e5;
      border: 1px solid #c7d2fe;
    }
    .badge-count {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #15803d;
      border: 1px solid #86efac;
    }
    .badge-hot   {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
      border: 1px solid #fcd34d;
    }

    /* Badge dot (collapsed) */
    .badge-dot {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid var(--bg-sidebar);
    }
    .badge-dot.badge-new   { background: #6366f1; }
    .badge-dot.badge-count { background: #22c55e; }
    .badge-dot.badge-hot   { background: #f59e0b; }

    /* ═══ No results ═══ */
    .no-results {
      text-align: center;
      padding: 32px 16px;
      color: var(--text-3);
    }
    .no-results-icon {
      font-size: 28px;
      margin-bottom: 8px;
      opacity: 0.7;
    }
    .no-results p {
      font-size: 12px;
      color: var(--text-3);
    }
    .no-results strong {
      display: block;
      font-size: 13px;
      color: var(--text-2);
      margin-top: 4px;
    }

    /* ═══ Tooltip (collapsed mode) ═══ */
    [data-tooltip] { position: relative; }
    .sidebar.collapsed [data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%);
      background: var(--text-1);
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      z-index: 1000;
      box-shadow: var(--shadow-lg);
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
      border-right-color: var(--text-1);
      z-index: 1000;
      pointer-events: none;
    }
    @keyframes tooltipIn {
      from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
      to { opacity: 1; transform: translateY(-50%) translateX(0); }
    }

    /* ═══ Footer ═══ */
    .sidebar-footer {
      flex-shrink: 0;
      padding: 14px 14px 18px;
      border-top: 1px solid var(--border-soft);
      background: var(--bg-sidebar-2);
    }

    /* Logout / Login button */
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 11px;
      width: 100%;
      padding: 11px 14px;
      border-radius: var(--radius-m);
      border: 1px solid #fecaca;
      background: linear-gradient(135deg, #fff5f5, #fef2f2);
      cursor: pointer;
      font-size: 13.5px;
      font-family: inherit;
      font-weight: 600;
      color: #dc2626;
      white-space: nowrap;
      overflow: hidden;
      transition: all var(--speed-fast);
      text-align: left;
      letter-spacing: -0.1px;
    }
    .logout-btn:hover {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      border-color: #fca5a5;
      color: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
    }
    .login-variant {
      background: var(--gradient);
      border-color: transparent;
      color: white;
      box-shadow: var(--shadow-md);
    }
    .login-variant:hover {
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
      color: white;
    }
    .btn-icon { display: flex; align-items: center; flex-shrink: 0; }
    .btn-label { flex: 1; }

    /* Collapsed logout */
    .sidebar.collapsed .logout-btn {
      justify-content: center;
      padding: 11px;
    }

    /* Version tag */
    .version-tag {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 12px;
      font-size: 10.5px;
      font-weight: 500;
      color: var(--text-3);
      letter-spacing: 0.3px;
    }
    .version-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* ═══ Main content ═══ */
    .main-content {
      flex: 1;
      overflow-y: auto;
      min-width: 0;
    }

    /* ═══ Focus states ═══ */
    .nav-link:focus-visible,
    .logout-btn:focus-visible,
    .sidebar-toggle:focus-visible,
    .search-input:focus-visible {
      outline: 2px solid var(--accent);
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
      .main-content { margin-left: 0 !important; }
      .sidebar-toggle { display: none; }
    }

    /* ═══ Reduced motion ═══ */
    @media (prefers-reduced-motion: reduce) {
      .sidebar, .nav-link, .logout-btn, .version-dot { transition: none; animation: none; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isSidebarCollapsed = false;
  isMobile = false;
  searchTerm = '';
  private destroy$ = new Subject<void>();

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
      path: '/import',
      label: 'Import Processus',
      icon: 'import',
      requiresRoles: ['SuperAdmin', 'Gestionnaire des processus metier'],
      description: 'Importer un dossier'
    },
    {
      path: '/import-export',
      label: 'Import / Export',
      icon: 'transfer',
      requiresRoles: ['SuperAdmin', 'Gestionnaire des processus metier'],
      badge: 'Nouveau',
      badgeType: 'new'
    },
   
    {
      path: '/export',
      label: 'Export Processus',
      icon: 'export',
      requiresRoles: ['SuperAdmin', 'Gestionnaire des processus metier']
    },
    {
      path: '/regles',
      label: 'Règles Métier',
      icon: 'rules',
      requiresRoles: ['SuperAdmin', 'Gestionnaire des réglesmetier']
    },
    {
      path: '/taches-list',
      label: 'Liste des Tâches',
      icon: 'tasks',
      requiresRoles: ['SuperAdmin', 'Gestionnaire des processus metier'],
      badge: '5',
      badgeType: 'count'
    }
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkMobile();

    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null && !this.isMobile) {
      this.isSidebarCollapsed = saved === 'true';
    }

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.isMobile && !this.isSidebarCollapsed) {
        this.isSidebarCollapsed = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
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
    return 'Admin User';
  }

  getPrimaryRole(): string {
    const r = this.userRoles;
    if (r.includes('SuperAdmin')) return 'Super Admin';
    if (r.includes('Gestionnaire des processus metier')) return 'Process Manager';
    if (r.includes('Gestionnaire des réglesmetier')) return 'Rules Manager';
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