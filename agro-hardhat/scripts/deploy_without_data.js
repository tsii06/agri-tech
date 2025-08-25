const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Début du déploiement des contrats...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const ProxyFactory = await ethers.getContractFactory("ContratProxy");

    // 1. Déployer d'abord le GestionnaireActeurs
    const GestionnaireActeurs = await ethers.getContractFactory("GestionnaireActeurs");
    const gestionnaireActeurs = await GestionnaireActeurs.deploy(); 
    await gestionnaireActeurs.waitForDeployment();
    let gestionnaireActeursProxy = await ProxyFactory.deploy(await gestionnaireActeurs.getAddress()); // utilisation du proxy
    await gestionnaireActeursProxy.waitForDeployment();
    gestionnaireActeursProxy = await ethers.getContractAt("GestionnaireActeurs", await gestionnaireActeursProxy.getAddress()); // pour pouvoir interagisser avec le proxy en tant que GestionnaireActeurs
    await gestionnaireActeursProxy.initialiser(deployer.address); // deployer.address comme admin initiale
    console.log("GestionnaireActeurs deployed to:", await gestionnaireActeursProxy.getAddress());

    // 2. Déployer le ProducteurEnPhaseCulture
    const ProducteurEnPhaseCulture = await ethers.getContractFactory("ProducteurEnPhaseCulture");
    const producteurEnPhaseCulture = await ProducteurEnPhaseCulture.deploy();
    await producteurEnPhaseCulture.waitForDeployment();
    let producteurEnPhaseCultureProxy = await ProxyFactory.deploy(await producteurEnPhaseCulture.getAddress()); // utilisation du proxy
    await producteurEnPhaseCultureProxy.waitForDeployment();
    producteurEnPhaseCultureProxy = await ethers.getContractAt("ProducteurEnPhaseCulture", await producteurEnPhaseCultureProxy.getAddress()); // pour pouvoir interagisser avec le proxy en tant que ProducteurEnPhaseCulture
    await producteurEnPhaseCultureProxy.initialiser(await gestionnaireActeursProxy.getAddress());
    console.log("ProducteurEnPhaseCulture deployed to:", await producteurEnPhaseCultureProxy.getAddress());

    // 3. Déployer le CollecteurExportateur
    const CollecteurExportateur = await ethers.getContractFactory("CollecteurExportateur");
    const collecteurExportateur = await CollecteurExportateur.deploy();
    await collecteurExportateur.waitForDeployment();
    let collecteurExportateurProxy = await ProxyFactory.deploy(await collecteurExportateur.getAddress()); // utilisation du proxy
    await collecteurExportateurProxy.waitForDeployment();
    collecteurExportateurProxy = await ethers.getContractAt("CollecteurExportateur", await collecteurExportateurProxy.getAddress()); // pour pouvoir interagisser avec le proxy en tant que CollecteurExportateur
    await collecteurExportateurProxy.initialiser(await gestionnaireActeursProxy.getAddress());
    console.log("CollecteurExportateur deployed to:", await collecteurExportateurProxy.getAddress());

    // 4. Déployer le CollecteurProducteur
    const CollecteurProducteur = await ethers.getContractFactory("CollecteurProducteur");
    const collecteurProducteur = await CollecteurProducteur.deploy();
    await collecteurProducteur.waitForDeployment();
    let collecteurProducteurProxy = await ProxyFactory.deploy(await collecteurProducteur.getAddress()); // utilisation du proxy
    await collecteurProducteurProxy.waitForDeployment();
    collecteurProducteurProxy = await ethers.getContractAt("CollecteurProducteur", await collecteurProducteurProxy.getAddress()); // pour pouvoir interagisser avec le proxy en tant que CollecteurProducteur
    await collecteurProducteurProxy.initialiser(
        await collecteurExportateurProxy.getAddress(),
        await gestionnaireActeursProxy.getAddress(),
        await producteurEnPhaseCultureProxy.getAddress()
    );
    console.log("CollecteurProducteur deployed to:", await collecteurProducteurProxy.getAddress());

    // 5. Enregistrer les acteurs dans le GestionnaireActeurs
    console.log("Enregistrement des acteurs...");
    
    // Enregistrer le déployeur comme administrateur
    await gestionnaireActeursProxy.enregistrerActeur(
        deployer.address,
        7, // Role.Administration
        0, // TypeEntite.Individu
        "Admin Principal",
        "ADMIN001",
        "Adresse Admin",
        "admin@example.com",
        "1234567890"
    );

    // Enregistrer un producteur de test
    const producteurAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Adresse de test
    await gestionnaireActeursProxy.enregistrerActeur(
        producteurAddress,
        0, // Role.Producteur
        0, // TypeEntite.Individu
        "Producteur Test",
        "PROD001",
        "Adresse Producteur",
        "producteur@example.com",
        "0987654321"
    );
    await gestionnaireActeursProxy.ajouterContratDelegue(producteurAddress, await producteurEnPhaseCultureProxy.getAddress());
    
    // Enregistrer un collecteur de test
    const collecteurAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Adresse de test
    await gestionnaireActeursProxy.enregistrerActeur(
        collecteurAddress,
        3, // Role.Collecteur
        0, // TypeEntite.Individu
        "Collecteur Test",
        "COLL001",
        "Adresse Collecteur",
        "collecteur@example.com",
        "1122334455"
    );
    await gestionnaireActeursProxy.ajouterContratDelegue(collecteurAddress, await collecteurProducteurProxy.getAddress());
    await gestionnaireActeursProxy.ajouterContratDelegue(collecteurAddress, await collecteurExportateurProxy.getAddress());
    
    // Enregistrer un exportateur de test
    const exportateurAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"; // Adresse de test
    await gestionnaireActeursProxy.enregistrerActeur(
        exportateurAddress,
        6, // Role.Exportateur
        0, // TypeEntite.Individu
        "Exportateur Test",
        "EXP001",
        "Adresse Exportateur",
        "exportateur@example.com",
        "5544332211"
    );
    await gestionnaireActeursProxy.ajouterContratDelegue(exportateurAddress, await collecteurExportateurProxy.getAddress());

    // Enregistrer un certificateur de test
    const certificateurAddress = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"; // Adresse de test
    await gestionnaireActeursProxy.enregistrerActeur(
        certificateurAddress,
        2, // Role.Certificateur
        0, // TypeEntite.Individu
        "Certificateur Test",
        "CERT001",
        "Adresse Certificateur",
        "certificateur@example.com",
        "5544332211"
    );
    await gestionnaireActeursProxy.ajouterContratDelegue(certificateurAddress, await collecteurProducteurProxy.getAddress());
    await gestionnaireActeursProxy.ajouterContratDelegue(certificateurAddress, await collecteurExportateurProxy.getAddress());

    // Enregistrer un fournisseur de test
    const fournisseurAddress = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"; // Adresse de test
    await gestionnaireActeursProxy.enregistrerActeur(
        fournisseurAddress,
        1, // Role.Fournisseur
        0, // TypeEntite.Individu
        "Fournisseur Test",
        "CERT001",
        "Adresse Fournisseur",
        "fournisseur@example.com",
        "5544332211"
    );
    await gestionnaireActeursProxy.ajouterContratDelegue(fournisseurAddress, await producteurEnPhaseCultureProxy.getAddress());

    // Enregistrer un auditeur de test
    const auditeurAddress = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"; // Adresse de test
    await gestionnaireActeursProxy.enregistrerActeur(
        auditeurAddress,
        4, // Role.Auditeur
        0, // TypeEntite.Individu
        "Auditeur Test",
        "CERT001",
        "Adresse Auditeur",
        "auditeur@example.com",
        "5544332211"
    );
    await gestionnaireActeursProxy.ajouterContratDelegue(auditeurAddress, await producteurEnPhaseCultureProxy.getAddress());

    // Enregistrer un transporteur de test
    const transporteurAddress = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788"; // Adresse de test
    await gestionnaireActeursProxy.enregistrerActeur(
        transporteurAddress,
        5, // Role.Transporteur
        0, // TypeEntite.Individu
        "Transporteur Test",
        "CERT001",
        "Adresse Transporteur",
        "transporteur@example.com",
        "5544332211"
    );
    await gestionnaireActeursProxy.ajouterContratDelegue(transporteurAddress, await collecteurProducteurProxy.getAddress());
    await gestionnaireActeursProxy.ajouterContratDelegue(transporteurAddress, await collecteurExportateurProxy.getAddress());

    console.log("Déploiement terminé avec succès!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur lors du déploiement:", error);
        process.exit(1);
    });
