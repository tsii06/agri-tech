const { ethers } = require('hardhat');
const { expect } = require('chai');
const initializer = require('../initializer');

describe("Producteur en Phase Culture", () => {
    let producteurEnPhaseCulture;
    let producteur;
    
    beforeEach(async () => {
        ({producteurEnPhaseCulture, producteur} = await initializer());
    });

    it("creation parcelle.", async () => {
        await producteurEnPhaseCulture.connect(producteur).creerParcelle("gngng");
        const parcelle = await producteurEnPhaseCulture.getParcelle(1);
        expect(parcelle).to.include(producteur.address);
    });
    
    it("ajouter le hash pour l'arbre de merkle", async () => {
        await producteurEnPhaseCulture.connect(producteur).creerParcelle("gngng");
        await producteurEnPhaseCulture.ajoutHashMerkleParcelle(1, "codecode");
        const parcelle = await producteurEnPhaseCulture.getParcelle(1);
        expect(parcelle).to.include("codecode");
    });
});