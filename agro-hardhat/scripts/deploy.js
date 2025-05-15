const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    console.log("Début du déploiement des contrats...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Déployer d'abord le GestionnaireActeurs
    const GestionnaireActeurs = await ethers.getContractFactory("GestionnaireActeurs");
    const gestionnaireActeurs = await GestionnaireActeurs.deploy(deployer.address, deployer.address); // deployer.address comme proxy initial
    await gestionnaireActeurs.waitForDeployment();
    console.log("GestionnaireActeurs deployed to:", await gestionnaireActeurs.getAddress());

    // 2. Déployer le ProducteurEnPhaseCulture
    const ProducteurEnPhaseCulture = await ethers.getContractFactory("ProducteurEnPhaseCulture");
    const producteurEnPhaseCulture = await ProducteurEnPhaseCulture.deploy(await gestionnaireActeurs.getAddress());
    await producteurEnPhaseCulture.waitForDeployment();
    console.log("ProducteurEnPhaseCulture deployed to:", await producteurEnPhaseCulture.getAddress());

    // 3. Déployer le CollecteurExportateur
    const CollecteurExportateur = await ethers.getContractFactory("CollecteurExportateur");
    const collecteurExportateur = await CollecteurExportateur.deploy(await gestionnaireActeurs.getAddress());
    await collecteurExportateur.waitForDeployment();
    console.log("CollecteurExportateur deployed to:", await collecteurExportateur.getAddress());

    // 4. Déployer le CollecteurProducteur
    const CollecteurProducteur = await ethers.getContractFactory("CollecteurProducteur");
    const collecteurProducteur = await CollecteurProducteur.deploy(
        await collecteurExportateur.getAddress(),
        await gestionnaireActeurs.getAddress(),
        await producteurEnPhaseCulture.getAddress()
    );
    await collecteurProducteur.waitForDeployment();
    console.log("CollecteurProducteur deployed to:", await collecteurProducteur.getAddress());

    // 5. Enregistrer les acteurs dans le GestionnaireActeurs
    console.log("Enregistrement des acteurs...");
    
    // Enregistrer le déployeur comme administrateur
    await gestionnaireActeurs.enregistrerActeur(
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
    await gestionnaireActeurs.enregistrerActeur(
        producteurAddress,
        0, // Role.Producteur
        0, // TypeEntite.Individu
        "Producteur Test",
        "PROD001",
        "Adresse Producteur",
        "producteur@example.com",
        "0987654321"
    );

    // Enregistrer un collecteur de test
    const collecteurAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Adresse de test
    await gestionnaireActeurs.enregistrerActeur(
        collecteurAddress,
        3, // Role.Collecteur
        0, // TypeEntite.Individu
        "Collecteur Test",
        "COLL001",
        "Adresse Collecteur",
        "collecteur@example.com",
        "1122334455"
    );

    // Enregistrer un exportateur de test
    const exportateurAddress = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"; // Adresse de test
    await gestionnaireActeurs.enregistrerActeur(
        exportateurAddress,
        6, // Role.Exportateur
        0, // TypeEntite.Individu
        "Exportateur Test",
        "EXP001",
        "Adresse Exportateur",
        "exportateur@example.com",
        "5544332211"
    );

    console.log("Déploiement terminé avec succès!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur lors du déploiement:", error);
        process.exit(1);
    });
