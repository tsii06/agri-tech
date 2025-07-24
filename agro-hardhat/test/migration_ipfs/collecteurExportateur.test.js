const { expect } = require('chai');
const { initializerWithData } = require('../initializer');

describe("CollecteurExportateur", () => {
    let collecteurExportateur;
    let collecteur;

    beforeEach(async () => {
        ({
            collecteurExportateur,
            collecteur
        } = await initializerWithData());
    });

    it("ajout de lot de produit", async () => {
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
});