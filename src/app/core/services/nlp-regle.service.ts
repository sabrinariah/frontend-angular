import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { NlpConversionRequest, NlpConversionResult } from '../../models/nlp.model';

@Injectable({
  providedIn: 'root'
})
export class NlpRegleService {

  private base = 'http://localhost:8081/api/nlp';

  constructor(private http: HttpClient) {}

  convertir(phrase: string): Observable<NlpConversionResult> {
    const request: NlpConversionRequest = { phrase };
    return this.http.post<NlpConversionResult>(`${this.base}/convertir`, request);
  }
}
