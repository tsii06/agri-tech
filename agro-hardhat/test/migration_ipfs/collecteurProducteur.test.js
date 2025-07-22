const { ethers } = require('hardhat');
const { expect } = require('chai');
const initializer = require('../initializer');

describe("CollecteurProducteur", () => {
    let collecteurProducteur;
    let producteur;
    
    beforeEach(async () => {
        let prod;
        ({collecteurProducteur, producteur, producteurEnPhaseCulture:prod} = await initializer());
        // creation des parcelles
        await prod.connect(producteur).creerParcelle("gngn");
        await prod.connect(producteur).creerParcelle("codecode");
    });

    it("ajout de recolte", async () => {
        await collecteurProducteur.connect(producteur).ajoutRecolte([1,2], 10, 100, "dateRecolte", "nomProduit");
        const recolte = await collecteurProducteur.getRecolte(1);
        expect(recolte).to.include(BigInt(10));
    });
});