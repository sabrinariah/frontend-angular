# TODO - Sous-processus dans Processus List

- [ ] 1) Inspecter le modèle RegleTransition et les endroits où les champs cibleType/subprocessOuiId sont utilisés.
- [ ] 2) Mettre à jour l’interface RegleTransition (ajouter champs subprocessSinonId et éventuellement sous-processus texte) pour être cohérent.
- [ ] 3) Ajouter dans le template (processus-list.component.ts inline) le choix de cible pour Branche OUI / NON : Tâche (actuel) vs Subprocess.
- [ ] 4) Implémenter la logique de sauvegarde/chargement des champs subprocess dans formData.regles.
- [ ] 5) Adapter buildBpmnDiagram() et generateBpmnXml() pour exporter correctement un sous-processus (au minimum : créer un nœud/label subprocess).
- [ ] 6) Mettre à jour les helpers d’évaluation et l’UI de preview (si nécessaire).
- [ ] 7) Vérifier compilation Angular et faire un test manuel (ouvrir popup, définir règle -> sauvegarder -> réouvrir -> exporter).

