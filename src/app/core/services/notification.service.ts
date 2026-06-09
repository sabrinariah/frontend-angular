import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export type NotifType     = 'success' | 'info' | 'warning' | 'danger';
export type NotifCategory = 'regle' | 'processus' | 'tache' | 'ia' | 'user';

export interface AppNotification {
  id:       string;
  type:     NotifType;
  category: NotifCategory;
  icon:     string;
  title:    string;
  message:  string;
  time:     Date;
  read:     boolean;
}

export interface NotifyOptions {
  type:     NotifType;
  category: NotifCategory;
  icon:     string;
  title:    string;
  message:  string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _notifs$ = new BehaviorSubject<AppNotification[]>([]);

  readonly notifications$ = this._notifs$.asObservable();

  readonly unreadCount$ = this._notifs$.pipe(
    map(list => list.filter(n => !n.read).length)
  );

  notify(options: NotifyOptions): void {
    const notif: AppNotification = {
      id:       crypto.randomUUID(),
      time:     new Date(),
      read:     false,
      ...options
    };
    this._notifs$.next([notif, ...this._notifs$.getValue()].slice(0, 50));
  }

  markRead(id: string): void {
    this._notifs$.next(
      this._notifs$.getValue().map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  markAllRead(): void {
    this._notifs$.next(
      this._notifs$.getValue().map(n => ({ ...n, read: true }))
    );
  }

  clear(): void {
    this._notifs$.next([]);
  }
}
