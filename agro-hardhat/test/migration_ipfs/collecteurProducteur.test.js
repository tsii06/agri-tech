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
        await collecteurProducteur.connect(producteur).ajoutRecolte([1,2], 10, 100, "askldvowierfoaishdfasdf");
        const recolte = await collecteurProducteur.getRecolte(1);
        expect(recolte).to.include(BigInt(10));
    });
    
    it("ajout hashMerkle Recolte", async () => {
        await collecteurProducteur.connect(producteur).ajoutRecolte([1,2], 10, 100, "askldvowierfoaishdfasdf");
        await collecteurProducteur.ajoutHashMerkleRecolte(1, "123456");
        const recolte = await collecteurProducteur.getRecolte(1);
        expect(recolte.hashMerkle).to.equal("123456");
    });
});