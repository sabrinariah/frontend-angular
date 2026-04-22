import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { Processus } from '../../models/processus.model';

@Component({
  selector: 'app-processus-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule], // <-- ajout RouterModule
  templateUrl: './processus-form.component.html',
  styleUrls: ['./processus-form.component.css']
})
export class ProcessusFormComponent {

  processusForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private processusService: ProcessusService // <-- injection du service
  ) {
    this.processusForm = this.fb.group({
      nom: ['', Validators.required],
      typeProcessus: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required]
    });
  }

  submitForm() {
    if (this.processusForm.valid) {
      const nouveauProcessus: Processus = this.processusForm.value;

      // Appel backend pour créer le processus
      this.processusService.create(nouveauProcessus).subscribe({
        next: (data) => {
          console.log('Processus ajouté avec succès:', data);
          alert('Processus ajouté ✅');
          this.router.navigate(['/processus']); // redirection vers la liste
        },
        error: (err) => {
          console.error('Erreur lors de l’ajout:', err);
          alert('Impossible d’ajouter le processus ❌');
        }
      });

    } else {
      alert('Veuillez remplir tous les champs correctement.');
    }
  }
}