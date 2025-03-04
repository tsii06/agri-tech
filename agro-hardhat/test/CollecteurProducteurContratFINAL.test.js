const { ethers } = require('hardhat');
const { expect } = require('chai');


describe("CollecteurProducteurContratFINAL", function () {
    let CoN, con;
    let addr0, addr1, addr2;
    this.beforeAll(async function () {
        // recuperer des adresses
        [addr0, addr1, addr2] = await ethers.getSigners();
        // instancier contrat
        CoN = await ethers.getContractFactory("CollecteurProducteurContratFINAL");
        // deployer contrat
        con = await CoN.deploy();
        con.waitForDeployment()
    })

    describe("enregistrerActeur()", function () {
        it("Verifie si l'event ActeurEnregistre a bien ete emis", async function () {
            await expect(con.enregistrerActeur(addr0, 0))
                .to.emit(con, "ActeurEnregistre")
                .withArgs(addr0, 0);
        })
        it("Verifie si l'acteur a bien ete enregistrer", async function () {
            await con.enregistrerActeur(addr0, 2);
            const acteur = await con.acteurs(addr0);
            expect(acteur.role).to.equal(2);
        })
    });


    describe("creerParcelle()", function () {
        let producteur;
        this.beforeEach(async function () {
            await con.enregistrerActeur(addr0, 0);
            producteur = addr0;
        })
        
        it("Verifie si l'event SemenceValidee a bien ete emis", async function () {
            await expect(await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate"))
                .to.emit(con, "SemenceValidee")
                .withArgs(await con.compteurParcelles(), "bon");
        })
        it("Verifie si l'event MethodeCultureFixee a bien ete emis", async function () {
            await expect(await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate"))
                .to.emit(con, "MethodeCultureFixee")
                .withArgs(await con.compteurParcelles(), "sur brulis");
        })
        it("Verifie si l'event ParcelleCree a bien ete emis", async function () {
            await expect(await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate"))
                .to.emit(con, "ParcelleCree")
                .withArgs(await con.compteurParcelles(), "latitude", "longitude");
        })
        it("Verifie si le parcelle a bien ete enregistrer", async function () {
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            const parcelle = await con.parcelles(await con.compteurParcelles());
            expect(parcelle.qualiteSemence).to.equal("bon");
            expect(parcelle.producteur).to.equal(addr0);
        })
    });


    describe("mettreAJourEtape()", function () {
        let producteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur
            await con.enregistrerActeur(addr0, 0);
            producteur = addr0;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
        })

        it("Verifie si l'event EtapeMiseAJour a bien ete emis", async function () {
            await expect(con.connect(producteur).mettreAJourEtape(idParcelle, 0))
                .to.emit(con, "EtapeMiseAJour")
                .withArgs(idParcelle, 0);
        })
        it("Verifie si l'etape a bien ete mise a jour", async function () {
            await con.connect(producteur).mettreAJourEtape(idParcelle, 2);
            const parcelle = await con.parcelles(idParcelle);
            expect(parcelle.etape).to.equal(2);
        })
    });


    describe("appliquerControlePhytosanitaire()", function () {
        let certificateur, producteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur et certificateur
            await con.enregistrerActeur(addr0, 0);
            await con.enregistrerActeur(addr1, 2);
            producteur = addr0;
            certificateur = addr1;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
            // mettre a jour l'etape du parcelle
            await con.connect(producteur).mettreAJourEtape(idParcelle, 1);
        }) 

        it("Verifie si l'event ControlePhytosanitaire a bien ete emis", async function () {
            await expect(con.connect(certificateur).appliquerControlePhytosanitaire(idParcelle, true))
                .to.emit(con, "ControlePhytosanitaire")
                .withArgs(idParcelle, true);
        })
        it("Verifie si le parcelle a bien ete certifier", async function () {
            await con.connect(certificateur).appliquerControlePhytosanitaire(idParcelle, true);
            const parcelle = await con.parcelles(idParcelle);
            expect(parcelle.certifie).to.equal(true);
        })
    });


    describe("confirmerRecolte()", async function () {
        let certificateur, producteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur et certificateur
            await con.enregistrerActeur(addr0, 0);
            await con.enregistrerActeur(addr1, 2);
            producteur = addr0;
            certificateur = addr1;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
            // mettre a jour l'etape du parcelle
            await con.connect(producteur).mettreAJourEtape(idParcelle, 2);
        }) 

        it("Verifie si l'event RecolteConfirmee a bien ete emis", async function () {
            await expect(con.connect(certificateur).confirmerRecolte(idParcelle, true))
                .to.emit(con, "RecolteConfirmee")
                .withArgs(idParcelle, true);
        })
        it("Verifie si la recolte a bien ete confirmer", async function () {
            await con.connect(certificateur).confirmerRecolte(idParcelle, true);
            const parcelle = await con.parcelles(idParcelle);
            expect(parcelle.etape).to.equal(2);
        })
    })


    describe("ajouterPhoto()", function () {
        let producteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur
            await con.enregistrerActeur(addr0, 0);
            producteur = addr0;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
        })

        it("Verifie si l'event PhotoAjoutee a bien ete emis", async function () {
            await expect(con.connect(producteur).ajouterPhoto(idParcelle, "photo"))
                .to.emit(con, "PhotoAjoutee")
                .withArgs(idParcelle, "photo");
        })
        it("Verifie si la photo a ete ajouter", async function () {
            await con.connect(producteur).ajouterPhoto(idParcelle, "photo");
            const photos = await con.getPhotos(idParcelle);
            expect(photos[0]).to.equal("photo");
        })
    });


    describe("ajouterIntrant()", function () {
        let producteur,collecteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur
            await con.enregistrerActeur(addr0, 0);
            await con.enregistrerActeur(addr1, 1);
            producteur = addr0;
            collecteur = addr1;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
        })

        it("Verifie si l'event IntrantAjoute a bien ete emis", async function () {
            await expect(con.connect(collecteur).ajouterIntrant(idParcelle, "nom", 10))
                .to.emit(con, "IntrantAjoute")
                .withArgs(idParcelle, "nom", 10);
        })
        it("Verifie si l'intrant a ete ajouter", async function () {
            await con.connect(collecteur).ajouterIntrant(idParcelle, "nom", 10);
            const intrants = await con.getIntrants(idParcelle);
            expect(intrants[0].nom).to.equal("nom");
            expect(intrants[0].quantite).to.equal(10);
        })
    });


    describe("validerIntrant()", async function () {
        let producteur,collecteur,certificateur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur
            await con.enregistrerActeur(addr0, 0);
            await con.enregistrerActeur(addr1, 1);
            await con.enregistrerActeur(addr2, 2);
            producteur = addr0;
            collecteur = addr1;
            certificateur = addr2;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
            // ajouter intrant
            await con.connect(collecteur).ajouterIntrant(idParcelle, "nom", 10);
        })

        it("Verifie si l'event IntrantValide a bien ete emis", async function () {
            await expect(con.connect(certificateur).validerIntrant(idParcelle, "nom", true))
                .to.emit(con, "IntrantValide")
                .withArgs(idParcelle, "nom", true);
        })
        it("Verifie si l'intrant a ete valider", async function () {
            await con.connect(certificateur).validerIntrant(idParcelle, "nom", true);
            const intrants = await con.getIntrants(idParcelle);
            expect(intrants[0].valide).to.equal(true);
        })
    })


    describe("ajouterInspection()", function () {
        let producteur,transporteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur
            await con.enregistrerActeur(addr0, 0);
            await con.enregistrerActeur(addr1, 3);
            producteur = addr0;
            transporteur = addr1;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
        })

        it("Verifie si l'event InspectionAjoutee a bien ete emis", async function () {
            await expect(con.connect(transporteur).ajouterInspection(idParcelle, "rapport"))
                .to.emit(con, "InspectionAjoutee");
        })
        it("Verifie si l'inspection a ete ajouter", async function () {
            await con.connect(transporteur).ajouterInspection(idParcelle, "rapport");
            const inspections = await con.getInspections(idParcelle);
            expect(inspections[0].auditeur).to.equal(transporteur);
            expect(inspections[0].rapport).to.equal("rapport");
        })
    });


    describe("enregistrerCondition()", function () {
        let producteur,transporteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur
            await con.enregistrerActeur(addr0, 0);
            await con.enregistrerActeur(addr1, 3);
            producteur = addr0;
            transporteur = addr1;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
        })

        it("Verifie si l'event ConditionEnregistree a bien ete emis", async function () {
            await expect(con.connect(transporteur).enregistrerCondition(idParcelle, "temperature", "humidite"))
                .to.emit(con, "ConditionEnregistree");
        })
        it("Verifie si l'enregistrement a bien ete enregistrer", async function () {
            await con.connect(transporteur).enregistrerCondition(idParcelle, "temperature", "humidite");
            const conditions = await con.getConditions(idParcelle);
            expect(conditions[0].temperature).to.equal("temperature");
            expect(conditions[0].humidite).to.equal("humidite");
        })
    });


    describe("enregistrerPaiement()", function () {
        let producteur, idParcelle;
        this.beforeEach(async function () {
            // enregistrer producteur
            await con.enregistrerActeur(addr0, 0);
            producteur = addr0;
            // enregistrer parcelle
            await con.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");
            idParcelle = await con.compteurParcelles();
        })

        it("Verifie si l'event PaiementEnregistre a bien ete emis", async function () {
            await expect(con.enregistrerPaiement(idParcelle, 1000, 0))
                .to.emit(con, "PaiementEnregistre");
        })
        it("Verifie si le paiement a bien ete enregistrer", async function () {
            await con.enregistrerPaiement(idParcelle, 1000, 0);
            const paiements = await con.getPaiements(idParcelle);
            expect(paiements[0].montant).to.equal(1000);
            expect(paiements[0].mode).to.equal(0);
        })
    });
});