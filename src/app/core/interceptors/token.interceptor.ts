// src/app/core/interceptors/token.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KeycloakService } from '../services/keycloak.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas intercepter les appels directs à Keycloak (login, refresh token) :
    // updateToken() peut lui-même appeler cet endpoint → éviter une boucle infinie.
    if (req.url.includes('/realms/')) {
      return next.handle(req);
    }

    // 🔄 S'assurer que le token est valide (le rafraîchir si besoin)
    // avant d'attacher le header Authorization.
    return from(this.keycloakService.updateToken()).pipe(
      switchMap(() => {
        const token = this.keycloakService.getToken();

        let authReq = req;
        if (token) {
          authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`
            }
          });
        }

        return next.handle(authReq);
      })
    );
  }
}