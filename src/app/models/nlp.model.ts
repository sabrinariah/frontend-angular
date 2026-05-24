import { Condition } from './condition.model';

export interface NlpRegleDto {
  code: string;
  nom: string;
  action: string;
  categorieType: string;
  conditions: Condition[];
}

export interface NlpConversionResult {
  regle: NlpRegleDto;
  drl: string;
  confidence: number;
  ambiguites: string[];
  phraseOriginale: string;
}

export interface NlpConversionRequest {
  phrase: string;
}
