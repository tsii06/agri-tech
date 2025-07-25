const { expect } = require('chai');
const { initializerWithData } = require('../initializer');

describe("CollecteurExportateur", () => {
    let collecteurExportateur;
    let collecteur, exportateur, transporteur;

    beforeEach(async () => {
        ({
            collecteurExportateur,
            collecteur, 
            exportateur,
            transporteur
        } = await initializerWithData());
    });

    it("ajout de lot de produit", async () => {
        // quantite : 15
        await collecteurExportateur.connect(collecteur).ajouterLotProduit([1,2], "asfiwuef", 200);
        const lot = await collecteurExportateur.lotProduits(1);
        expect(lot.prix).to.equal(200);
    });
    
    it("modifier prix du lot de produit", async () => {
        await collecteurExportateur.connect(collecteur).ajouterLotProduit([1,2], "asfiwuef", 200);
        await collecteurExportateur.connect(collecteur).setPriceProduit(1, 456);
        const lot = await collecteurExportateur.getLotProduit(1);
        expect(lot.prix).to.equal(456);
    });
    
    describe("Gestion des commandes.", () => {
        beforeEach(async () => {
            // quantite : 15
            await collecteurExportateur.connect(collecteur).ajouterLotProduit([1,2], "asfiwuef", 200);
        });

        it("Passer commande.", async () => {
            await collecteurExportateur.connect(exportateur).passerCommande(1, 10);
            const commande = await collecteurExportateur.getCommande(1);
            expect(commande.exportateur).to.equal(exportateur.address);
        });
        
        it("Mettre a jour status transport d'une commande.", async () => {
            await collecteurExportateur.connect(exportateur).passerCommande(1, 10);
            let commande = await collecteurExportateur.getCommande(1);
            expect(Number(commande.statutTransport)).to.equal(0);
            await collecteurExportateur.connect(transporteur).mettreAJourStatutTransport(1, 1);
            commande = await collecteurExportateur.getCommande(1);
            expect(Number(commande.statutTransport)).to.equal(1);
        });
        
        it("Mettre a jour status produit d'une commande.", async () => {
            await collecteurExportateur.connect(exportateur).passerCommande(1, 10);
            await collecteurExportateur.connect(transporteur).mettreAJourStatutTransport(1, 1);
            let commande = await collecteurExportateur.getCommande(1);
            expect(Number(commande.statutProduit)).to.equal(0);
            await collecteurExportateur.connect(exportateur).mettreAJourStatutCommande(1, 1);
            commande = await collecteurExportateur.getCommande(1);
            expect(Number(commande.statutProduit)).to.equal(1);
        });
        
        it("Effectuer paiement sur une commande.", async () => {
            // quantite : 10
            // prix : 2000
            await collecteurExportateur.connect(exportateur).passerCommande(1, 10);
            await collecteurExportateur.connect(transporteur).mettreAJourStatutTransport(1, 1);
            await collecteurExportateur.connect(exportateur).mettreAJourStatutCommande(1, 1);
            let commande = await collecteurExportateur.getCommande(1);
            expect(commande.payer).to.equal(false);
            await collecteurExportateur.connect(exportateur).effectuerPaiement(1, 2000, 0);
            commande = await collecteurExportateur.getCommande(1);
            expect(commande.payer).to.equal(true);
        });
    });
});