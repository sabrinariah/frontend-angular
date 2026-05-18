/**
 * Catalogue de règles métier prédéfinies.
 * Permet de pré-remplir le formulaire de RegleMetierComponent en 1 clic.
 *
 * À utiliser dans RegleMetierComponent via un bouton "📋 Charger un template"
 */

export interface RegleTemplate {
  code: string;
  nom: string;
  action: string;
  categorie: string;  // Code de la catégorie (ex: "CAT_IMPORT")
  phase: string;       // Phase BPMN pour le regroupement
  conditions: ConditionTemplate[];
}

export interface ConditionTemplate {
  champ: string;
  operateur: '==' | '!=' | '>' | '<' | '>=' | '<=';
  valeur: string | number | boolean;
}

export const REGLES_TEMPLATES: RegleTemplate[] = [

  // ============= IMPORT — DÉCLARATION =============
  {
    code: 'VALID_DECLARATION_IMPORT',
    nom: 'Validation déclaration d\'importation',
    action: 'Autoriser passage à l\'analyse de risque',
    categorie: 'CAT_IMPORT',
    phase: '📘 Import - Déclaration',
    conditions: [
      { champ: 'numeroDeclaration', operateur: '!=', valeur: '' },
      { champ: 'dateDeclaration', operateur: '!=', valeur: '' },
      { champ: 'importateur', operateur: '!=', valeur: '' }
    ]
  },
  {
    code: 'VALID_BESC_IMPORT',
    nom: 'BESC obligatoire pour importation',
    action: 'Bloquer sans BESC valide',
    categorie: 'CAT_IMPORT',
    phase: '📘 Import - Déclaration',
    conditions: [
      { champ: 'numeroBESC', operateur: '!=', valeur: '' }
    ]
  },
  {
    code: 'VALID_FACTURE_IMPORT',
    nom: 'Facture commerciale présente',
    action: 'Vérifier la présence d\'une facture',
    categorie: 'CAT_IMPORT',
    phase: '📘 Import - Déclaration',
    conditions: [
      { champ: 'numeroFacture', operateur: '!=', valeur: '' },
      { champ: 'valeurCAF', operateur: '>', valeur: 0 }
    ]
  },

  // ============= IMPORT — ANALYSE DE RISQUE =============
  {
    code: 'RISK_CIRCUIT_VERT',
    nom: 'Circuit vert — risque faible',
    action: 'Autoriser passage rapide sans contrôle',
    categorie: 'CAT_RISK',
    phase: '🟠 Import - Risque',
    conditions: [
      { champ: 'scoreRisque', operateur: '<=', valeur: 30 }
    ]
  },
  {
    code: 'RISK_CIRCUIT_ORANGE',
    nom: 'Circuit orange — contrôle documentaire',
    action: 'Déclencher contrôle documentaire',
    categorie: 'CAT_RISK',
    phase: '🟠 Import - Risque',
    conditions: [
      { champ: 'scoreRisque', operateur: '>', valeur: 30 },
      { champ: 'scoreRisque', operateur: '<=', valeur: 60 }
    ]
  },
  {
    code: 'RISK_CIRCUIT_ROUGE',
    nom: 'Circuit rouge — inspection physique',
    action: 'Déclencher inspection physique obligatoire',
    categorie: 'CAT_RISK',
    phase: '🟠 Import - Risque',
    conditions: [
      { champ: 'scoreRisque', operateur: '>', valeur: 60 }
    ]
  },
  {
    code: 'RISK_MARCHANDISE_DANGEREUSE',
    nom: 'Marchandise dangereuse — circuit rouge forcé',
    action: 'Forcer le circuit rouge',
    categorie: 'CAT_RISK',
    phase: '🟠 Import - Risque',
    conditions: [
      { champ: 'marchandiseDangereuse', operateur: '==', valeur: true }
    ]
  },

  // ============= IMPORT — TAXES =============
  {
    code: 'TAX_UEMOA',
    nom: 'Taux préférentiel UEMOA (5%)',
    action: 'Appliquer 5% de droits de douane',
    categorie: 'CAT_TAX',
    phase: '🟢 Import - Taxes',
    conditions: [
      { champ: 'paysOrigine', operateur: '==', valeur: 'SENEGAL' }
    ]
  },
  {
    code: 'TAX_CEDEAO',
    nom: 'Taux CEDEAO (10%)',
    action: 'Appliquer 10% de droits de douane',
    categorie: 'CAT_TAX',
    phase: '🟢 Import - Taxes',
    conditions: [
      { champ: 'paysOrigine', operateur: '==', valeur: 'GHANA' }
    ]
  },
  {
    code: 'TAX_STANDARD_IMPORT',
    nom: 'Droits standards importation (20%)',
    action: 'Appliquer 20% par défaut',
    categorie: 'CAT_TAX',
    phase: '🟢 Import - Taxes',
    conditions: [
      { champ: 'valeurCAF', operateur: '>', valeur: 0 }
    ]
  },
  {
    code: 'TAX_TVA_18',
    nom: 'TVA 18% applicable',
    action: 'Appliquer TVA de 18% sur (CAF + droits)',
    categorie: 'CAT_TAX',
    phase: '🟢 Import - Taxes',
    conditions: [
      { champ: 'valeurCAF', operateur: '>', valeur: 0 },
      { champ: 'droitsDouane', operateur: '>=', valeur: 0 }
    ]
  },

  // ============= IMPORT — CONTRÔLE =============
  {
    code: 'CONTROLE_DOCUMENTAIRE_CONFORME',
    nom: 'Contrôle documentaire conforme',
    action: 'Valider et passer au BAE',
    categorie: 'CAT_CONTROLE',
    phase: '🔴 Import - Contrôle',
    conditions: [
      { champ: 'controleConforme', operateur: '==', valeur: true },
      { champ: 'decisionCircuit', operateur: '==', valeur: 'ORANGE' }
    ]
  },
  {
    code: 'INSPECTION_PHYSIQUE_CONFORME',
    nom: 'Inspection physique conforme',
    action: 'Valider après inspection',
    categorie: 'CAT_CONTROLE',
    phase: '🔴 Import - Contrôle',
    conditions: [
      { champ: 'controleConforme', operateur: '==', valeur: true },
      { champ: 'decisionCircuit', operateur: '==', valeur: 'ROUGE' }
    ]
  },

  // ============= IMPORT — BAE =============
  {
    code: 'BAE_PAIEMENT_CONFIRME',
    nom: 'Paiement confirmé pour BAE',
    action: 'Vérifier le paiement',
    categorie: 'CAT_BAE',
    phase: '🟣 Import - BAE',
    conditions: [
      { champ: 'paiementConfirme', operateur: '==', valeur: true }
    ]
  },
  {
    code: 'BAE_TOUTES_CONDITIONS',
    nom: 'Toutes conditions BAE remplies',
    action: 'Émettre le BAE',
    categorie: 'CAT_BAE',
    phase: '🟣 Import - BAE',
    conditions: [
      { champ: 'paiementConfirme', operateur: '==', valeur: true },
      { champ: 'marchandiseConforme', operateur: '==', valeur: true },
      { champ: 'controleConforme', operateur: '==', valeur: true }
    ]
  },
  {
    code: 'BAE_MARCHANDISE_CONFORME',
    nom: 'Marchandise conforme à la déclaration',
    action: 'Confirmer la conformité',
    categorie: 'CAT_BAE',
    phase: '🟣 Import - BAE',
    conditions: [
      { champ: 'marchandiseConforme', operateur: '==', valeur: true }
    ]
  },

  // ============= EXPORT — DÉCLARATION =============
  {
    code: 'VALID_DECLARATION_EXPORT',
    nom: 'Validation déclaration d\'exportation',
    action: 'Autoriser passage à l\'analyse de risque export',
    categorie: 'CAT_EXPORT',
    phase: '📗 Export - Déclaration',
    conditions: [
      { champ: 'numeroDeclaration', operateur: '!=', valeur: '' },
      { champ: 'exportateur', operateur: '!=', valeur: '' },
      { champ: 'paysDestination', operateur: '!=', valeur: '' }
    ]
  },
  {
    code: 'VALID_EXPORTATEUR_AGREE',
    nom: 'Exportateur agréé et en règle',
    action: 'Réduire le score de risque',
    categorie: 'CAT_EXPORT',
    phase: '📗 Export - Déclaration',
    conditions: [
      { champ: 'exportateurAgree', operateur: '==', valeur: true },
      { champ: 'exportateurEnRegle', operateur: '==', valeur: true }
    ]
  },

  // ============= EXPORT — DROITS DE SORTIE =============
  {
    code: 'TAX_EXPORT_MINIERE',
    nom: 'Droits sortie marchandise minière (3% FOB)',
    action: 'Appliquer 3% sur la valeur FOB',
    categorie: 'CAT_TAX',
    phase: '💰 Export - Taxes',
    conditions: [
      { champ: 'typeMarchandise', operateur: '==', valeur: 'MINIERE' },
      { champ: 'valeurFOB', operateur: '>', valeur: 0 }
    ]
  },
  {
    code: 'TAX_EXPORT_BOIS',
    nom: 'Droits sortie bois (5% FOB) + CITES',
    action: 'Appliquer 5% sur valeur FOB',
    categorie: 'CAT_TAX',
    phase: '💰 Export - Taxes',
    conditions: [
      { champ: 'typeMarchandise', operateur: '==', valeur: 'BOIS' },
      { champ: 'valeurFOB', operateur: '>', valeur: 0 },
      { champ: 'certificatCITES', operateur: '==', valeur: true }
    ]
  },
  {
    code: 'TAX_EXPORT_AGRICOLE',
    nom: 'Droits sortie produits agricoles (1.5% FOB)',
    action: 'Appliquer 1.5% sur valeur FOB',
    categorie: 'CAT_TAX',
    phase: '💰 Export - Taxes',
    conditions: [
      { champ: 'typeMarchandise', operateur: '==', valeur: 'AGRICOLE' },
      { champ: 'valeurFOB', operateur: '>', valeur: 0 }
    ]
  },
  {
    code: 'TAX_REDEVANCE_TONNE',
    nom: 'Redevance par tonne (1000 XAF/T)',
    action: 'Appliquer redevance proportionnelle au poids',
    categorie: 'CAT_TAX',
    phase: '💰 Export - Taxes',
    conditions: [
      { champ: 'poidsKg', operateur: '>', valeur: 0 }
    ]
  },

  // ============= EXPORT — EMBARQUEMENT =============
  {
    code: 'EMBARQUE_PAIEMENT',
    nom: 'Paiement confirmé pour embarquement',
    action: 'Autoriser embarquement',
    categorie: 'CAT_BAE',
    phase: '🚢 Export - Embarquement',
    conditions: [
      { champ: 'paiementConfirme', operateur: '==', valeur: true }
    ]
  },
  {
    code: 'EMBARQUE_BON',
    nom: 'Bon à embarquer + BESC présents',
    action: 'Délivrer l\'autorisation d\'embarquement',
    categorie: 'CAT_BAE',
    phase: '🚢 Export - Embarquement',
    conditions: [
      { champ: 'numeroBonAEmbarquer', operateur: '!=', valeur: '' },
      { champ: 'numeroBESC', operateur: '!=', valeur: '' },
      { champ: 'paiementConfirme', operateur: '==', valeur: true }
    ]
  },
  {
    code: 'EMBARQUE_VALEUR_ELEVEE',
    nom: 'Embarquement valeur élevée (>50M XAF)',
    action: 'Exiger validation hiérarchique',
    categorie: 'CAT_BAE',
    phase: '🚢 Export - Embarquement',
    conditions: [
      { champ: 'valeurFOB', operateur: '>', valeur: 50000000 },
      { champ: 'validationHierarchique', operateur: '==', valeur: true }
    ]
  }
];

/** Récupère les phases uniques pour grouper l'affichage */
export const REGLE_PHASES = [...new Set(REGLES_TEMPLATES.map(r => r.phase))];

/** Filtre les templates par phase */
export function getTemplatesByPhase(phase: string): RegleTemplate[] {
  return REGLES_TEMPLATES.filter(t => t.phase === phase);
}