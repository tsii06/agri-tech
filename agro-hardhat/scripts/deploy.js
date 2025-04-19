const { ethers } = require("hardhat");

async function main() {
    console.log("Début du déploiement des contrats...\n");

    // Récupération des comptes
    const [deployer, collecteur, exportateur, transporteur, producteur, certificateur] = await ethers.getSigners();
    console.log("Compte déployeur:", deployer.address);









    // 1. Déploiement du contrat ProducteurEnPhaseCulture
    console.log("\nDéploiement du contrat ProducteurEnPhaseCulture...");
    // deploy producteur
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
    const ColExp = await ethers.getContractFactory("CollecteurExportateur");
    const colExp = await ColExp.deploy(await proProxy.getAddress());
    await colExp.waitForDeployment();
    const colExpAddress = await colExp.getAddress();

    // Deploye le proxy du collecteurExportateur
    const colProxy = await ProxyContrat.deploy(colExpAddress);
    await colProxy.waitForDeployment();






    // 3. Déploiement du contrat CollecteurProducteur
    console.log("\nDéploiement du contrat CollecteurProducteur...");
    const CollecteurProducteur = await ethers.getContractFactory("CollecteurProducteur");
    const collecteurProducteur = await CollecteurProducteur.deploy(colProxy, proProxy);
    await collecteurProducteur.waitForDeployment();
    const colProAddress = await collecteurProducteur.getAddress();

    // Deploye le proxy du collecteurExportateur
    const colProProxy = await ProxyContrat.deploy(colProAddress);
    await colProProxy.waitForDeployment();












    // 3. Interagisser avec les proxy
    const proProxyContrat = await ethers.getContractAt("contracts/ProducteurEnPhaseCulture.sol:ProducteurEnPhaseCulture", await proProxy.getAddress());

    const colExpProxyContrat = await ethers.getContractAt("CollecteurExportateur", await colProxy.getAddress());
    const colProProxyContrat = await ethers.getContractAt("CollecteurProducteur", await colProProxy.getAddress());

    const proProxyAddr = await proProxyContrat.getAddress();
    const colExpProxyAddr = await colExpProxyContrat.getAddress();
    const colProProxyAddr = await colProProxyContrat.getAddress();

    // definie l'adresse de CollecteurExportateur dans Recolte
    await colProProxyContrat.setModuleProducteur(proProxyAddr);
    await colProProxyContrat.setModuleCE(colExpProxyAddr);
    // donner l'addresse du proxy Prod.
    await colExpProxyContrat.setProducteurEnPhaseCulture(proProxyAddr);

    // Résumé des adresses des contrats
    console.log("\n=== Résumé des adresses des contrats ===");

    console.log("ProducteurProxy :", proProxyAddr);
    console.log("CollecteurExportateurProxy :", colExpProxyAddr);
    console.log("CollecteurProducteurProxy :", colProProxyAddr);












    // 4. Configuration initiale pour les tests
    console.log("\nConfiguration initiale des contrats...");
    await proProxyContrat.enregistrerActeur(producteur.address, 0);
    await proProxyContrat.enregistrerActeur(collecteur.address, 3);
    await proProxyContrat.enregistrerActeur(certificateur.address, 2);

    // creer des parcelles
    await proProxyContrat.connect(producteur).creerParcelle(
        "bon",
        "sur brulis",
        "109.232",
        "47.233",
        "12/12/25",
        "certificate"
    );
    await proProxyContrat.connect(producteur).creerParcelle(
        "bon",
        "sur brulis",
        "155.232",
        "434.233",
        "12/12/25",
        "certificate"
    );

    // faire recolte
    await colProProxyContrat.connect(producteur).ajoutRecolte(1, 100, 10000, "12/12/2025", "Girofle");
    await colProProxyContrat.connect(producteur).ajoutRecolte(2, 100, 10000, "12/12/2025", "Café");

    // certifier les recoltes
    await colProProxyContrat.connect(certificateur).certifieRecolte(1, "cert-1001");
    await colProProxyContrat.connect(certificateur).certifieRecolte(2, "cert-1002");

    // passer commandes sur les recoltes
    await colProProxyContrat.connect(collecteur).passerCommandeVersProducteur(1, 5);
    await colProProxyContrat.connect(collecteur).passerCommandeVersProducteur(2, 8);
    await colProProxyContrat.connect(collecteur).passerCommandeVersProducteur(2, 10);
    await colProProxyContrat.connect(collecteur).passerCommandeVersProducteur(2, 12);

    // payer une commande
    await colProProxyContrat.connect(collecteur).effectuerPaiementVersProducteur(1, 50000, 0);

    console.log("✓ Configuration initiale terminée");

    console.log("\nDéploiement terminé avec succès!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur lors du déploiement:", error);
        process.exit(1);
    });
