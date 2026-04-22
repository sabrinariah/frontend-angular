export interface Condition {
  id?:       number;
  champ:     string;
  operateur: string;
  valeur:    string;
  // regleId retourné par le backend
  regle?:    { id: number };
}
