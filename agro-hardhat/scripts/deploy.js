const { ethers } = require("hardhat");

async function main() {
    console.log("Début du déploiement des contrats...\n");

    // Récupération des comptes
    const [deployer, collecteur, exportateur, transporteur, producteur] = await ethers.getSigners();
    console.log("Compte déployeur:", deployer.address);

    // 1. Déploiement du contrat ProducteurEnPhaseCulture
    console.log("\nDéploiement du contrat ProducteurEnPhaseCulture...");
    const ProCult = await ethers.getContractFactory("contracts/ProducteurEnPhaseCulture.sol:ProducteurEnPhaseCulture");
    const proCult = await ProCult.deploy();
    await proCult.waitForDeployment();
    const proCultAddress = await proCult.getAddress();
    console.log("✓ ProducteurEnPhaseCulture déployé à l'adresse:", proCultAddress);

    // 2. Déploiement du contrat CollecteurExportateurContrat
    console.log("\nDéploiement du contrat CollecteurExportateurContrat...");
    const ColExp = await ethers.getContractFactory("CollecteurExportateurContrat");
    const colExp = await ColExp.deploy(proCultAddress);
    await colExp.waitForDeployment();
    const colExpAddress = await colExp.getAddress();
    console.log("✓ CollecteurExportateurContrat déployé à l'adresse:", colExpAddress);

    // 3. Configuration initiale pour les tests
    console.log("\nConfiguration initiale des contrats...");
    await proCult.enregistrerActeur(producteur.address, 0);
    await proCult.connect(producteur).creerParcelle(
        "bon",
        "sur brulis",
        "latitude",
        "longitude",
        "nomProduit",
        "12/12/25",
        "certificate"
    );
    console.log("✓ Configuration initiale terminée");

    // Résumé des adresses des contrats
    console.log("\n=== Résumé des adresses des contrats ===");
    console.log("ProducteurEnPhaseCulture:", proCultAddress);
    console.log("CollecteurExportateurContrat:", colExpAddress);
    console.log("\nDéploiement terminé avec succès!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur lors du déploiement:", error);
        process.exit(1);
    });
