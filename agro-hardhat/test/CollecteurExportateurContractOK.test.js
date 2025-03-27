const { ethers } = require('hardhat');
const { expect } = require('chai');

describe("CollecteurExportateurContractOK", function () {
    let Contrat, contrat;
    let addr0, addr1, addr2, addr3;
    // pour le contrat ProducteurEnPhaseCulture
    let Pepc, pepc;
    let prod, idParcelle;
    let producteur, collecteur, certificateur;

    this.beforeEach(async function () {
        [addr0, addr1, addr2, addr3] = await ethers.getSigners();
        
        // deployer Parcellle
        const Parcelle = await ethers.getContractFactory("ParcelleContrat");
        const parcelle = await Parcelle.deploy();
        await parcelle.waitForDeployment();

        // deployer Recolte
        const Recolte = await ethers.getContractFactory("RecolteContrat");
        recolteContrat = await Recolte.deploy(await parcelle.getAddress());
        await recolteContrat.waitForDeployment();

        // deployer ProducteurEnPhaseCulture
        Pepc = await ethers.getContractFactory("contracts/ProducteurEnPhaseCulture.sol:ProducteurEnPhaseCulture");
        pepc = await Pepc.deploy(await recolteContrat.getAddress(), await parcelle.getAddress());
        await pepc.waitForDeployment();


        // deployer CollecteurExportateurContractOK
        Contrat = await ethers.getContractFactory("CollecteurExportateurContrat");
        contrat = await Contrat.deploy(await pepc.getAddress());
        await contrat.waitForDeployment();

        // donner l'adresse de CE a Recolte pour l'ajout automatique de produit
        await recolteContrat.setAddrCE(await contrat.getAddress());

        // enregistrer un producteur
        await pepc.enregistrerActeur(addr0.address, 0);
        producteur = addr0;
        // creer parcelle
        await pepc.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "12/12/25", "certificate");
        // declarer recolte
        await pepc.connect(producteur).ajoutRecolte(1, 10, 100, "12/12/12", "girofle");
        // certifie la recolte
        await pepc.enregistrerActeur(addr2.address, 2);
        certificateur = addr2;
        await pepc.connect(certificateur).certifieRecolte(1, "CERT-1010");

        // enregistrer un collecteur
        await pepc.enregistrerActeur(addr1.address, 3);
        collecteur = addr1;
        // passer une commande vers producteurs
        await pepc.connect(collecteur).passerCommandeVersProducteur(1, 9);
        // payer la commande vers producteur
        await pepc.connect(collecteur).effectuerPaiementVersProducteur(1, 900, 0);
    });









    // describe("enregistrerActeur()", function () {
    //     it("L'evenement ActeurEnregistre a ete bien emis.", async function () {
    //         expect(await contrat.enregistrerActeur(addr1, 0)) // enregistrer un acteur.
    //             .to.emit(await contrat, "ActeurEnregistre") // verifie si l'evenement a ete bien emis.
    //             .withArgs(addr1, 0); // verifie si les argument de l'evenement est bien corrrecte.
    //     })

    //     it("L'acteur a ete bien enregistre.", async function () {
    //         await contrat.enregistrerActeur(addr1, 0); // enregistre un acteur.
    //         const acteur = await contrat.acteurs(addr1); // recupere un acteur avec un key addr1.
    //         expect(acteur.addr).to.equal(addr1);
    //         expect(acteur.role).to.equal(0);
    //     })
    // });


    // describe("ajouterProduit()", function () {
    //     let collecteur;
    //     this.beforeEach(async function () {
    //        await contrat.enregistrerActeur(addr0, 0);
    //        collecteur = addr0; 
    //     });

    //     it("Verifie si l'evenemet ProduitAjoute a ete bien emis", async function () {
    //         expect(await contrat.connect(collecteur).ajouterProduit(idParcelle, 10, 10))
    //             .to.emit(contrat, "ProduitAjoute");
    //     })

    //     it("Verifie si le produit a bien ete enregistre", async function () {
    //         await contrat.connect(collecteur).ajouterProduit(idParcelle, 10, 10);
    //         const produit = await contrat.produits(await contrat.compteurProduits());
    //         expect(produit.nom).to.equal("nomProduit");
    //         expect(produit.prix).to.equal(10);
    //         expect(produit.quantite).to.equal(10);
    //     })
    // });


    // describe("passerCommande()", function () {
    //     let collecteur, exportateur,idProduit;
    //     this.beforeEach(async function () {
    //         // enregistrer collecteur
    //         await contrat.enregistrerActeur(addr0, 0);
    //         collecteur = addr0; 
    //         // enregistrer exportateur
    //         await contrat.enregistrerActeur(addr1, 1);
    //         exportateur = addr1; 
    //         // enregistrer produit
    //         await contrat.connect(collecteur).ajouterProduit(idParcelle, 10, 10);
    //         idProduit = await contrat.compteurProduits();
    //     });

    //     it("Verifie si l'evenemet CommandePasser a ete bien emis", async function () {
    //         expect(await contrat.connect(exportateur).passerCommande(idProduit, 10))
    //             .to.emit(contrat, "CommandePasser")
    //             .withArgs(exportateur, idProduit);
    //     })

    //     it("Verifie si la commande a bien ete enregistre", async function () {
    //         await contrat.connect(exportateur).passerCommande(idProduit, 10);
    //         const commande = await contrat.commandes(await contrat.compteurCommandes());
    //         expect(commande.idProduit).to.equal(idProduit);
    //         expect(commande.quantite).to.equal(10);
    //     })
    // });


    // describe("validerProduit()", function () {
    //     let collecteur, exportateur,idProduit;
    //     this.beforeEach(async function () {
    //         // enregistrer collecteur
    //         await contrat.enregistrerActeur(addr0, 0);
    //         collecteur = addr0; 
    //         // enregistrer exportateur
    //         await contrat.enregistrerActeur(addr1, 1);
    //         exportateur = addr1; 
    //         // enregistrer produit
    //         await contrat.connect(collecteur).ajouterProduit(idParcelle, 10, 10);
    //         idProduit = await contrat.compteurProduits();
    //     });

    //     it("Verifie si l'evenemet ProduitValide a ete bien emis", async function () {
    //         expect(await contrat.connect(exportateur).validerProduit(idProduit, true))
    //             .to.emit(contrat, "ProduitValide")
    //             .withArgs(idProduit, true);
    //     })

    //     it("Verifie si le produit a bien ete valider", async function () {
    //         await contrat.connect(exportateur).validerProduit(idProduit, true);
    //         const produit = await contrat.produits(idProduit);
    //         expect(produit.statut).to.equal(1);
    //     })
    // });


    // describe("effectuerPaiement()", function () {
    //     let collecteur, exportateur,idCommande;
    //     this.beforeEach(async function () {
    //         // enregistrer collecteur
    //         await contrat.enregistrerActeur(addr0, 0);
    //         collecteur = addr0; 
    //         // enregistrer exportateur
    //         await contrat.enregistrerActeur(addr1, 1);
    //         exportateur = addr1; 
    //         // enregistrer produit
    //         await contrat.connect(collecteur).ajouterProduit(idParcelle, 10, 10);
    //         // valider produit
    //         await contrat.connect(exportateur).validerProduit(await contrat.compteurProduits(), true);
    //         // enregistre commande
    //         await contrat.connect(exportateur).passerCommande(await contrat.compteurProduits(), 10);
    //         idCommande = await contrat.compteurCommandes();
    //     });

    //     it("Verifie si l'evenemet PaiementEffectue a ete bien emis", async function () {
    //         expect(await contrat.connect(exportateur).effectuerPaiement(idCommande, 1000, 0, {value:100}))
    //             .to.emit(contrat, "PaiementEffectue");
    //     })

    //     it("Verifie si le payement a ete enregistrer", async function () {
    //         await contrat.connect(exportateur).effectuerPaiement(idCommande, 1000, 0, {value:100});
    //         const paiement = await contrat.paiements(await contrat.compteurPaiements());
    //         expect(paiement.montant).to.equal(1000);
    //     })
    // });


    // describe("enregistrerCondition()", function () {
    //     let collecteur, transporteur, idProduit;
    //     this.beforeEach(async function () {
    //         // enregistrer collecteur
    //         await contrat.enregistrerActeur(addr0, 0);
    //         collecteur = addr0; 
    //         // enregistrer transporteur
    //         await contrat.enregistrerActeur(addr1, 2);
    //         transporteur = addr1; 
    //         // enregistrer produit
    //         await contrat.connect(collecteur).ajouterProduit(idParcelle, 10, 10);
    //         idProduit = await contrat.compteurProduits();
    //     });

    //     it("Verifie si l'evenemet ConditionEnregistree a ete bien", async function () {
    //         expect(await contrat.connect(transporteur).enregistrerCondition(idProduit, "temperature", "humidite"))
    //             .to.emit(contrat, "ConditionEnregistree");
    //     })

    //     it("Verifie si le condition a ete enregistrer", async function () {
    //         await contrat.connect(transporteur).enregistrerCondition(idProduit, "temperature", "humidite")
    //         const condition = await contrat.conditions(await contrat.compteurConditions());
    //         expect(condition.temperature).to.equal("temperature");
    //         expect(condition.humidite).to.equal("humidite");
    //     })
    // });


    // describe("mettreAJourStatutTransport()", function () {
    //     let collecteur, exportateur,transporteur,idCommande;
    //     this.beforeEach(async function () {
    //         // enregistrer collecteur
    //         await contrat.enregistrerActeur(addr0, 0);
    //         collecteur = addr0; 
    //         // enregistrer exportateur
    //         await contrat.enregistrerActeur(addr1, 1);
    //         exportateur = addr1; 
    //         // enregistrer transporteur
    //         await contrat.enregistrerActeur(addr2, 2);
    //         transporteur = addr2; 
    //         // enregistrer produit
    //         await contrat.connect(collecteur).ajouterProduit(idParcelle, 10, 10);
    //         // valider produit
    //         await contrat.connect(exportateur).validerProduit(await contrat.compteurProduits(), true);
    //         // enregistre commande
    //         await contrat.connect(exportateur).passerCommande(await contrat.compteurProduits(), 10);
    //         idCommande = await contrat.compteurCommandes();
    //     });

    //     it("Verifie si l'evenemet StatutTransportMisAJour a ete bien", async function () {
    //         expect(await contrat.connect(transporteur).mettreAJourStatutTransport(idCommande, 1))
    //             .to.emit(contrat, "StatutTransportMisAJour")
    //             .withArgs(idCommande, 1);
    //     })

    //     it("Verifie si le statut transport a ete vraiment mise a jour", async function () {
    //         await contrat.connect(transporteur).mettreAJourStatutTransport(idCommande, 1);
    //         const commande = await contrat.commandes(idCommande);
    //         expect(commande.statutTransport).to.equal(1);
    //     })
    // });



    describe("Produit", function () {

        it("changer le prix d'un produit par un collecteur", async function () {

            // changer le prix du premier produit
            await contrat.connect(collecteur).setPriceProduit(1, 50);
            // recuperer le produit
            const produit = await contrat.produits(1);

            expect(produit.prixUnit).to.equal(50);
        });
    });
});