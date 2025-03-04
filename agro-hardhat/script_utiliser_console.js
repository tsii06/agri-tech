const contrat = await ethers.getContractAt("CollecteurExportateurContrat", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

const [owner, collecteur, exportateur, transporteur] = await ethers.getSigners();

// Enregistrer un collecteur
await contrat.enregistrerActeur(collecteur.address, 0);

// Enregistrer un exportateur
await contrat.enregistrerActeur(exportateur.address, 1);

// Enregistrer un transporteur
await contrat.enregistrerActeur(transporteur.address, 2);


await contrat.connect(collecteur).ajouterProduit("Cacao", 200, 15, 1, 1717171717, "CertificatCacao123");

await contrat.connect(exportateur).validerProduit(1, true);

const produit = await contrat.produits(1);
console.log(produit.statut); // Doit afficher `1` (Validé)


await contrat.connect(exportateur).passerCommande(1, 100);
