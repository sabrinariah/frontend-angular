import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProcessusService } from '../../core/services/processus.service';
import { Processus } from '../../models/processus.model';

@Component({
  selector: 'app-processus-modifier',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './processus-modifier.component.html',
  styleUrls: ['./processus-modifier.component.css']
})
export class ProcessusModifierComponent implements OnInit {

  public form!: FormGroup;
  public processusToEdit?: Processus;

  constructor(
    private fb: FormBuilder,
    private service: ProcessusService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    // ✅ FORM CORRIGÉ
    this.form = this.fb.group({
      nom: ['', Validators.required],
      typeProcessus: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      actif: [false]
    });

    // ✅ Récupération ID
    const id = this.route.snapshot.params['id'];

    if (id) {
      this.service.getById(+id).subscribe({
        next: (processus) => {
          this.processusToEdit = processus;

          // ✅ PATCH CORRIGÉ (surtout les dates)
          this.form.patchValue({
            nom: processus.nom,
            typeProcessus: processus.typeProcessus,
            dateDebut: processus.dateDebut?.split('T')[0],
            dateFin: processus.dateFin?.split('T')[0],
            actif: processus.actif
          });
        },
        error: (err) => {
          console.error('Erreur récupération du processus :', err);
          alert('Impossible de récupérer le processus.');
        }
      });
    }
  }

  saveChanges(): void {
    if (this.form.valid && this.processusToEdit?.id != null) {

      const updatedProcessus = {
        ...this.processusToEdit,
        ...this.form.value
      };

      this.service.update(this.processusToEdit.id, updatedProcessus).subscribe({
        next: () => {
          alert('Processus modifié avec succès !');
          this.router.navigate(['/processus']);
        },
        error: (err) => {
          console.error('Erreur lors de la modification :', err);
          alert('Erreur lors de la modification du processus.');
        }
      });

    } else {
      alert('Formulaire invalide ou processus non sélectionné.');
    }
  }
}