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

    // Deployer le ExportateurClient
    const ExportateurClient = await ethers.getContractFactory("ExportateurClient");
    const exportateurClient = await ExportateurClient.deploy();
    await exportateurClient.waitForDeployment();
    let exportateurClientProxy = await ProxyFactory.deploy(await exportateurClient.getAddress()); // utilisation du proxy
    await exportateurClientProxy.waitForDeployment();
    exportateurClientProxy = await ethers.getContractAt("ExportateurClient", await exportateurClientProxy.getAddress()); // pour pouvoir interagisser avec le proxy en tant que ExportateurClient
    await exportateurClientProxy.initialiser(
        await gestionnaireActeursProxy.getAddress(),
        await collecteurExportateurProxy.getAddress()
    );
    console.log("ExportateurClient deployed to:", await exportateurClientProxy.getAddress());

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur lors du déploiement:", error);
        process.exit(1);
    });
