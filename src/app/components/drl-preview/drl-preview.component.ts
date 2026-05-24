import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drl-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drl-preview.component.html',
  styleUrls: ['./drl-preview.component.css']
})
export class DrlPreviewComponent implements OnChanges {

  @Input() drl = '';
  @Input() phraseOriginale = '';

  lignes: { text: string; type: string }[] = [];
  copied = false;

  ngOnChanges(): void {
    this.lignes = (this.drl || '').split('\n').map(line => ({
      text: line,
      type: this.detecterType(line)
    }));
  }

  private detecterType(ligne: string): string {
    const t = ligne.trim();
    if (!t) return 'empty';
    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return 'comment';
    if (/^(package|import)\b/.test(t)) return 'import';
    if (/^rule\b/.test(t)) return 'rule';
    if (/^(when|then|end|salience)\b/.test(t)) return 'keyword';
    if (/\$\w+\s*:/.test(ligne)) return 'variable';
    if (/^\s*(double|int|String|boolean|long)\b/.test(ligne)) return 'type';
    return 'code';
  }

  copier(): void {
    navigator.clipboard.writeText(this.drl).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }
}
