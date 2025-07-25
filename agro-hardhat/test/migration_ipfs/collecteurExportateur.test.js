const { expect } = require('chai');
const { initializerWithData } = require('../initializer');

describe("CollecteurExportateur", () => {
    let collecteurExportateur;
    let collecteur, exportateur;

    beforeEach(async () => {
        ({
            collecteurExportateur,
            collecteur, 
            exportateur
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
            await collecteurExportateur.connect(collecteur).ajouterLotProduit([1,2], "asfiwuef", 200);
        });

        it("Passer commande.", async () => {
            await collecteurExportateur.connect(exportateur).passerCommande(1, 10);
            const commande = await collecteurExportateur.getCommande(1);
            expect(commande.exportateur).to.equal(exportateur.address);
        });
    });
});