import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tache } from '../../models/tache.model';

@Injectable({
  providedIn: 'root'
})
export class TacheService {
  private apiUrl = 'http://localhost:8080/api/taches'; // ton endpoint backend

  constructor(private http: HttpClient) { }

  addTache(tache: Tache): Observable<Tache> {
    return this.http.post<Tache>(this.apiUrl, tache);
  }

  getTachesByProcessus(processusId: number): Observable<Tache[]> {
    return this.http.get<Tache[]>(`${this.apiUrl}/processus/${processusId}`);
  }
  taches: any[] = [];
tache: any = {}; // tache en cours d'édition ou ajout
indexModif: number | null = null;

// Ajouter ou modifier
onSubmit() {
  if (this.tache.id != null && this.indexModif != null) {
    // Modifier
    this.taches[this.indexModif] = { ...this.tache };
  } else {
    // Ajouter
    this.taches.push({ ...this.tache, id: Date.now() });
  }
  this.tache = {};
  this.indexModif = null;
}
 deleteTache(processusId: number, tacheId: number) {
  return this.http.delete(`${this.apiUrl}/processus/${processusId}/taches/${tacheId}`);
}
updateTache(processusId: number, tacheId: number, tache: any) {
  return this.http.put(
    `http://localhost:8080/api/processus/${processusId}/taches/${tacheId}`,
    tache
  );
}} 
