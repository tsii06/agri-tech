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

    const ProxyContrat = await ethers.getContractFactory("ContratProxy");
    // Deploye le proxy du producteurEnPhaseCulture
    const proProxy = await ProxyContrat.deploy(proCultAddress);
    await proProxy.waitForDeployment();


    // 2. Déploiement du contrat CollecteurExportateurContrat
    console.log("\nDéploiement du contrat CollecteurExportateurContrat...");
    const ColExp = await ethers.getContractFactory("CollecteurExportateurContrat");
    const colExp = await ColExp.deploy(await proProxy.getAddress());
    await colExp.waitForDeployment();
    const colExpAddress = await colExp.getAddress();

    // Deploye le proxy du collecteurExportateur
    const colProxy = await ProxyContrat.deploy(colExpAddress);
    await colProxy.waitForDeployment();


    // 3. Interagisser avec les proxy
    const proProxyContrat = await ethers.getContractAt("contracts/ProducteurEnPhaseCulture.sol:ProducteurEnPhaseCulture", await proProxy.getAddress());
    const colProxyContrat = await ethers.getContractAt("CollecteurExportateurContrat", await colProxy.getAddress());
    const proProxyAddr = await proProxyContrat.getAddress();
    const colProxyAddr = await colProxyContrat.getAddress();

    // donner l'addresse du proxy Prod.
    await colProxyContrat.setProducteurEnPhaseCultureAddress(proProxyAddr);

    // Résumé des adresses des contrats
    console.log("\n=== Résumé des adresses des contrats ===");

    console.log("ProducteurEnPhaseCulture :", proCultAddress);
    console.log("ProProxy :", proProxyAddr);

    console.log("\nCollecteurExportateurContrat :", colExpAddress);
    console.log("ColProxy :", colProxyAddr);


    // 4. Configuration initiale pour les tests
    console.log("\nConfiguration initiale des contrats...");
    await proProxyContrat.enregistrerActeur(producteur.address, 0);
    await proProxyContrat.connect(producteur).creerParcelle(
        "bon",
        "sur brulis",
        "latitude",
        "longitude",
        "girofle",
        "12/12/25",
        "certificate"
    );
    // ajouter un produit
    await colProxyContrat.enregistrerActeur(collecteur.address, 3);
    await colProxyContrat.connect(collecteur).ajouterProduit(1, 100, 100000000);
    console.log("✓ Configuration initiale terminée");

    console.log("\nDéploiement terminé avec succès!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur lors du déploiement:", error);
        process.exit(1);
    });
