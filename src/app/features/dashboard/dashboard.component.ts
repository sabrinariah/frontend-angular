import { Component } from '@angular/core';
import { KeycloakService } from '../../core/services/keycloak.service';

@Component({
  selector: 'app-dashboard',
  templateUrl:'./dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true
})
export class DashboardComponent {
  constructor(public keycloakService: KeycloakService) {}
}