import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProcessusService } from '../../core/services/processus.service';

@Component({
  selector: 'app-start-process',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './start-process.html'
})
export class StartProcessComponent {

  formData = {
    client: '',
    montant: 0
  };

  constructor(private service: ProcessusService) {}

  // ✅ méthode appelée par le bouton
  demarrerProcess() {
    console.log('🔥 CLICK');

    this.service.demarrerProcessus(this.formData).subscribe({
      next: (res) => {
        console.log('✅ SUCCESS', res);
        alert('Processus démarré');
      },
      error: (err) => {
        console.error('❌ ERROR', err);
      }
    });
  }
}