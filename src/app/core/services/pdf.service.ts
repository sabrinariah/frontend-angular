import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  private apiUrl = 'http://localhost:8081/api/process';

  constructor(private http: HttpClient) {}

  downloadPdf(processInstanceId: string) {

    this.http.get(
      `${this.apiUrl}/pdf/${processInstanceId}`,
      {
        responseType: 'blob'
      }
    ).subscribe((blob: Blob) => {

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;

      a.download = 'rapport-processus.pdf';

      a.click();

      window.URL.revokeObjectURL(url);
    });
  }
}