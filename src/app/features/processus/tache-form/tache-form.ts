import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Tache } from '../../../models/tache.model';

@Component({
  selector: 'app-tache-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tache-form.html',
  styleUrls: ['./tache-form.css']
})
export class TacheFormComponent {

  @Input() tache: Tache = { nom: '', description: '' };

  @Output() save = new EventEmitter<Tache>();
  @Output() delete = new EventEmitter<Tache>();

  @ViewChild('form') form!: NgForm;

  // 🔥 AJOUT / MODIFICATION
  onSubmit() {
    if (!this.tache.nom || !this.tache.description) return;

    this.save.emit({ ...this.tache });
    this.resetForm();
  }

  // 🔥 Charger une tâche pour modification
  setTache(tache: Tache) {
    this.tache = { ...tache };

    if (this.form) {
      this.form.setValue({
        nom: this.tache.nom || '',
        description: this.tache.description || ''
      });
    }
  }

  // 🔥 Reset form
  resetForm() {
    this.tache = { nom: '', description: '' };

    if (this.form) {
      this.form.resetForm();
    }
  }

  // 🔥 DELETE
  onDelete() {
    if (this.tache.id && confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
      this.delete.emit(this.tache);
      this.resetForm();
    }
  }
  

}