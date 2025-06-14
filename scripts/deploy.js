// ... existing code ...
// Après avoir enregistré le producteur, déléguer le contrat ProducteurEnPhaseCulture
await gestionnaireActeurs.connect(admin).ajouterContratDelegue(
  adresseDuProducteur, // Remplace par la variable contenant l'adresse du producteur
  adresseDuContratProducteurEnPhaseCulture // Remplace par la variable contenant l'adresse du contrat ProducteurEnPhaseCulture
);
// ... existing code ...
// Ensuite, tu peux appeler creerParcelle sans erreur 