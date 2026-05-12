import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './import-export.component.html',
  styleUrls: ['./import-export.component.css']
})
export class ImportExportComponent {

  constructor(private router: Router) {}

  goToImport(): void {
    this.router.navigate(['/import']);
  }

  goToExport(): void {
    this.router.navigate(['/export']);
  }
}