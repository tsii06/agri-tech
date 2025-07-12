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

    // === Données de test supplémentaires ===
    // 1. Créer des parcelles pour le producteur
    console.log("Création de parcelles pour le producteur...");
    // ajouter le contrat délégué pour le producteur
    await gestionnaireActeursProxy.ajouterContratDelegue(producteurAddress, await producteurEnPhaseCultureProxy.getAddress());
    await producteurEnPhaseCultureProxy.connect(await ethers.getSigner(producteurAddress)).creerParcelle(
        "Semence A",
        "Bio",
        "-18.8792",
        "47.5079",
        "2024-07-01",
        "CertificatPhyto-1"
    );
    await producteurEnPhaseCultureProxy.connect(await ethers.getSigner(producteurAddress)).creerParcelle(
        "Semence B",
        "Conventionnel",
        "-18.8793",
        "47.5080",
        "2024-07-02",
        "CertificatPhyto-2"
    );

    // 2. Créer des récoltes pour chaque parcelle (via CollecteurProducteur)
    console.log("Création de récoltes pour chaque parcelle...");
    // ajouter le contrat délégué pour le producteur
    await gestionnaireActeursProxy.ajouterContratDelegue(producteurAddress, await collecteurProducteurProxy.getAddress());
    await collecteurProducteurProxy.connect(await ethers.getSigner(producteurAddress)).ajoutRecolte(1, 1000, 500, "2024-07-10", "Riz Bio");
    await collecteurProducteurProxy.connect(await ethers.getSigner(producteurAddress)).ajoutRecolte(2, 800, 600, "2024-07-12", "Riz Classique");

    // 3. Certification d'une récolte (par le certificateur)
    // On suppose qu'un certificateur existe déjà (à ajouter si besoin)
    const certificateurAddress = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
    await gestionnaireActeursProxy.enregistrerActeur(
        certificateurAddress,
        2, // Role.Certificateur
        0,
        "Certificateur Test",
        "CERT001",
        "Adresse Certificateur",
        "cert@example.com",
        "6677889900"
    );
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(certificateurAddress, await collecteurProducteurProxy.getAddress());
    await collecteurProducteurProxy.connect(await ethers.getSigner(certificateurAddress)).certifieRecolte(1, "Certificat de qualité BIO");

    // 4. Création de produits à partir des récoltes (par le collecteur)
    console.log("Création de produits à partir des récoltes...");
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(collecteurAddress, await collecteurExportateurProxy.getAddress());
    await collecteurExportateurProxy.connect(await ethers.getSigner(collecteurAddress)).ajouterProduit(1, 500, 700, collecteurAddress, "Riz Bio", "2024-07-10", "CertificatPhyto-1");
    await collecteurExportateurProxy.connect(await ethers.getSigner(collecteurAddress)).ajouterProduit(2, 400, 800, collecteurAddress, "Riz Classique", "2024-07-12", "CertificatPhyto-2");

    // 5. Commande du collecteur vers producteur
    console.log("Commande du collecteur vers producteur...");
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(collecteurAddress, await collecteurProducteurProxy.getAddress());
    await collecteurProducteurProxy.connect(await ethers.getSigner(collecteurAddress)).passerCommandeVersProducteur(1, 200);

    // 6. Commande de l'exportateur vers collecteur
    console.log("Commande de l'exportateur vers collecteur...");
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(exportateurAddress, await collecteurExportateurProxy.getAddress());
    await collecteurExportateurProxy.connect(await ethers.getSigner(exportateurAddress)).passerCommande(1, 100);


    // Valider le produit (par l'exportateur)
    await collecteurExportateurProxy.connect(await ethers.getSigner(exportateurAddress)).validerProduit(1, true); // true = validé
    // 7. Paiement de l'exportateur pour une commande
    console.log("Paiement de l'exportateur...");
    // await collecteurExportateur.connect(await ethers.getSigner(exportateurAddress)).effectuerPaiement(1, 70000, 0, { value: ethers.parseEther("0.01") });

    

    // 8. Inspection d'une parcelle (par un auditeur)
    const auditeurAddress = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc";
    await gestionnaireActeursProxy.enregistrerActeur(
        auditeurAddress,
        4, // Role.Auditeur
        0,
        "Auditeur Test",
        "AUD001",
        "Adresse Auditeur",
        "auditeur@example.com",
        "4455667788"
    );
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(auditeurAddress, await producteurEnPhaseCultureProxy.getAddress());
    await producteurEnPhaseCultureProxy.connect(await ethers.getSigner(auditeurAddress)).ajouterInspection(1, "Inspection OK");
    // === Fin des données de test ===

    // === ENRICHISSEMENT DES DONNÉES DE TEST ===
    // 1. Ajouter plusieurs acteurs de chaque type
    const producteur2 = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
    const collecteur2 = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";
    const exportateur2 = "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f";
    const certificateur2 = "0xcd3B766CCDd6AE721141F452C550Ca635964ce71";
    const auditeur2 = "0x2546BcD3c84621e976D8185a91A922aE77ECEc30";
    const transporteur1 = "0x71bE63f3384f5fb98995898A86B02Fb2426c5788";
    const fournisseur1 = "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720";

    await gestionnaireActeursProxy.enregistrerActeur(producteur2, 0, 0, "Producteur Deux", "PROD002", "Adresse P2", "prod2@example.com", "1111111111");
    await gestionnaireActeursProxy.enregistrerActeur(collecteur2, 3, 0, "Collecteur Deux", "COLL002", "Adresse C2", "coll2@example.com", "2222222222");
    await gestionnaireActeursProxy.enregistrerActeur(exportateur2, 6, 0, "Exportateur Deux", "EXP002", "Adresse E2", "exp2@example.com", "3333333333");
    await gestionnaireActeursProxy.enregistrerActeur(certificateur2, 2, 0, "Certificateur Deux", "CERT002", "Adresse Cert2", "cert2@example.com", "4444444444");
    await gestionnaireActeursProxy.enregistrerActeur(auditeur2, 4, 0, "Auditeur Deux", "AUD002", "Adresse Aud2", "aud2@example.com", "5555555555");
    await gestionnaireActeursProxy.enregistrerActeur(transporteur1, 5, 0, "Transporteur Un", "TRANS001", "Adresse T1", "trans1@example.com", "6666666666");
    await gestionnaireActeursProxy.enregistrerActeur(fournisseur1, 1, 0, "Fournisseur Un", "FOUR001", "Adresse F1", "fourn1@example.com", "7777777777");

    // 2. Créer des parcelles pour chaque producteur
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(producteur2, await producteurEnPhaseCultureProxy.getAddress());
    await producteurEnPhaseCultureProxy.connect(await ethers.getSigner(producteur2)).creerParcelle(
        "Semence C", "Bio", "-18.88", "47.51", "2024-07-03", "CertificatPhyto-3"
    );
    await producteurEnPhaseCultureProxy.connect(await ethers.getSigner(producteur2)).creerParcelle(
        "Semence D", "Conventionnel", "-18.89", "47.52", "2024-07-04", "CertificatPhyto-4"
    );

    // 3. Créer des récoltes (certaines non certifiées)
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(producteur2, await collecteurProducteurProxy.getAddress());
    await collecteurProducteurProxy.connect(await ethers.getSigner(producteur2)).ajoutRecolte(3, 1200, 550, "2024-07-15", "Riz Premium"); // non certifiée
    await collecteurProducteurProxy.connect(await ethers.getSigner(producteur2)).ajoutRecolte(4, 900, 650, "2024-07-16", "Riz Standard"); // non certifiée

    // 4. Certifier une seule récolte
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(certificateur2, await collecteurProducteurProxy.getAddress());
    await collecteurProducteurProxy.connect(await ethers.getSigner(certificateur2)).certifieRecolte(3, "Certificat Premium");
    // La récolte 4 reste non certifiée

    // 5. Créer des produits (certifiés et non certifiés)
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(collecteur2, await collecteurExportateurProxy.getAddress());
    await collecteurExportateurProxy.connect(await ethers.getSigner(collecteur2)).ajouterProduit(3, 600, 900, collecteur2, "Riz Premium", "2024-07-15", "CertificatPhyto-3"); // certifié
    await collecteurExportateurProxy.connect(await ethers.getSigner(collecteur2)).ajouterProduit(4, 500, 950, collecteur2, "Riz Standard", "2024-07-16", ""); // non certifié

    // 6. Créer des commandes (payées et non payées)
    // Commande payée
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(exportateur2, await collecteurExportateurProxy.getAddress());
    await collecteurExportateurProxy.connect(await ethers.getSigner(exportateur2)).passerCommande(2, 100);
    // await collecteurExportateur.connect(await ethers.getSigner(exportateur2)).effectuerPaiement(2, 80000, 0, { value: ethers.parseEther("0.01") });
    // Commande non payée
    await collecteurExportateurProxy.connect(await ethers.getSigner(exportateur2)).passerCommande(3, 50);
    // Pas de paiement pour cette commande

    // 7. Ajouter une inspection sur une nouvelle parcelle
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(auditeur2, await producteurEnPhaseCultureProxy.getAddress());
    await producteurEnPhaseCultureProxy.connect(await ethers.getSigner(auditeur2)).ajouterInspection(3, "Inspection Premium OK");
    // 8. Ajouter un intrant par le fournisseur
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(fournisseur1, await producteurEnPhaseCultureProxy.getAddress());
    await producteurEnPhaseCultureProxy.connect(await ethers.getSigner(fournisseur1)).ajouterIntrant(3, "Engrais Bio", 20, "engrais", fournisseur1);
    // 9. Transporteur enregistre une condition de transport
    // ajouter contrat deleguer
    await gestionnaireActeursProxy.ajouterContratDelegue(transporteur1, await collecteurExportateurProxy.getAddress());
    await collecteurExportateurProxy.connect(await ethers.getSigner(transporteur1)).enregistrerCondition(2, "25C", "60%");



    // === FIN ENRICHISSEMENT ===

    console.log("Déploiement terminé avec succès!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Erreur lors du déploiement:", error);
        process.exit(1);
    });
