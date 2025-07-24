const { ethers } = require('hardhat');

const initializer = async () => {
    const [admin, producteur, collecteur, certificateur, transporteur] = await ethers.getSigners();

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
    // transporteur
    await gestionnaireActeurs.enregistrerActeur(
        transporteur.address,
        5,
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
        certificateur: certificateur,
        transporteur: transporteur,
    };
};

const initializerWithData = async () => {
    const { 
        gestionnaireActeurs,
        producteurEnPhaseCulture,
        collecteurProducteur,
        collecteurExportateur,

        admin,
        producteur,
        collecteur,
        certificateur,
        transporteur
    } = await initializer();

    // creation des parcelles
    await producteurEnPhaseCulture.connect(producteur).creerParcelle("gngn");
    await producteurEnPhaseCulture.connect(producteur).creerParcelle("codecode");

    // ajout recolte
    await collecteurProducteur.connect(producteur).ajoutRecolte([1,2], 10, 100, "askldvowierfoaishdfasdf");
    await collecteurProducteur.connect(producteur).ajoutRecolte([2], 15, 45, "askldvowierfoaishdfasdf");
    await collecteurProducteur.connect(producteur).ajoutRecolte([1], 23, 77, "askldvowierfoaishdfasdf");

    // certifier recoltes
    await collecteurProducteur.connect(certificateur).certifieRecolte(1, "asdfasdf");
    await collecteurProducteur.connect(certificateur).certifieRecolte(2, "asdfasdf");
    await collecteurProducteur.connect(certificateur).certifieRecolte(3, "asdfasdf");

    // passer commande sur des recoltes
    await collecteurProducteur.connect(collecteur).passerCommandeVersProducteur(1, 5);
    await collecteurProducteur.connect(collecteur).passerCommandeVersProducteur(2, 10);
    await collecteurProducteur.connect(collecteur).passerCommandeVersProducteur(3, 17);

    // livrer les commandes
    await collecteurProducteur.connect(transporteur).mettreAJourStatutTransport(1, 1);
    await collecteurProducteur.connect(transporteur).mettreAJourStatutTransport(2, 1);
    await collecteurProducteur.connect(transporteur).mettreAJourStatutTransport(3, 1);

    // valider les commandes
    await collecteurProducteur.connect(collecteur).validerCommandeRecolte(1, true);
    await collecteurProducteur.connect(collecteur).validerCommandeRecolte(2, true);
    await collecteurProducteur.connect(collecteur).validerCommandeRecolte(3, true);

    // payer les commandes sur les recoltes
    await collecteurProducteur.connect(collecteur).effectuerPaiementVersProducteur(1, 500, 0);
    await collecteurProducteur.connect(collecteur).effectuerPaiementVersProducteur(2, 450, 0);


    return {
        gestionnaireActeurs: gestionnaireActeurs,
        producteurEnPhaseCulture: producteurEnPhaseCulture,
        collecteurProducteur: collecteurProducteur,
        collecteurExportateur: collecteurExportateur,

        admin: admin,
        producteur: producteur,
        collecteur: collecteur,
        certificateur: certificateur,
        transporteur: transporteur,
    };
};

module.exports = {
    initializer,
    initializerWithData
};