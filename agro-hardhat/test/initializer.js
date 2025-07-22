const { ethers } = require('hardhat');

const initializer = async () => {
    const [admin, producteur, collecteur, certificateur] = await ethers.getSigners();

    let contractFactory = await ethers.getContractFactory("GestionnaireActeurs");
    // GestionnaireActeurs
    const gestionnaireActeurs = await contractFactory.deploy();
    await gestionnaireActeurs.waitForDeployment();
    // ProducteurEnPhaseCulture
    contractFactory = await ethers.getContractFactory("ProducteurEnPhaseCulture");
    const producteurEnPhaseCulture = await contractFactory.deploy();
    await producteurEnPhaseCulture.waitForDeployment();
    await producteurEnPhaseCulture.initialiser(await gestionnaireActeurs.getAddress());
    // CollecteurExportateur
    contractFactory = await ethers.getContractFactory("CollecteurExportateur");
    const collecteurExportateur = await contractFactory.deploy();
    await collecteurExportateur.waitForDeployment();
    await collecteurExportateur.initialiser(await gestionnaireActeurs.getAddress());
    // CollecteurProducteur
    contractFactory = await ethers.getContractFactory("CollecteurProducteur");
    const collecteurProducteur = await contractFactory.deploy();
    await collecteurProducteur.waitForDeployment();
    await collecteurProducteur.initialiser(await collecteurExportateur.getAddress(), await gestionnaireActeurs.getAddress(), await producteurEnPhaseCulture.getAddress());
    
    // enregistrer les acteurs
    // administrateur
    await gestionnaireActeurs.initialiser(admin);
    // producteur
    await gestionnaireActeurs.enregistrerActeur(
        producteur.address,
        0,
        0,
        "Nom",
        "NifouCIN",
        "adresseOfficiel",
        "email",
        "telephone",
    );
    // collecteur
    await gestionnaireActeurs.enregistrerActeur(
        collecteur.address,
        3,
        0,
        "Nom",
        "NifouCIN",
        "adresseOfficiel",
        "email",
        "telephone",
    );
    // certificateur
    await gestionnaireActeurs.enregistrerActeur(
        certificateur.address,
        2,
        0,
        "Nom",
        "NifouCIN",
        "adresseOfficiel",
        "email",
        "telephone",
    );

    // ajout contrat delegue
    await gestionnaireActeurs.ajouterContratDelegue(producteur.address, producteurEnPhaseCulture.getAddress());
    await gestionnaireActeurs.ajouterContratDelegue(collecteur.address, collecteurProducteur.getAddress());
    await gestionnaireActeurs.ajouterContratDelegue(certificateur.address, collecteurProducteur.getAddress());
    await gestionnaireActeurs.ajouterContratDelegue(certificateur.address, collecteurExportateur.getAddress());

    return {
        gestionnaireActeurs: gestionnaireActeurs,
        producteurEnPhaseCulture: producteurEnPhaseCulture,
        collecteurProducteur: collecteurProducteur,
        collecteurExportateur: collecteurExportateur,

        admin: admin,
        producteur: producteur,
        collecteur: collecteur,
        certificateur: certificateur
    };
};

module.exports = initializer;