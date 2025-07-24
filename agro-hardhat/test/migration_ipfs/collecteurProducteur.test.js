const { ethers } = require('hardhat');
const { expect } = require('chai');
const { initializer } = require('../initializer');

describe("CollecteurProducteur", () => {
    let collecteurProducteur, collecteurExportateur;
    let producteur, collecteur, transporteur, certificateur;

    beforeEach(async () => {
        let prod;
        ({ collecteurProducteur, collecteurExportateur, producteur, producteurEnPhaseCulture: prod, transporteur, collecteur, certificateur } = await initializer());
        // creation des parcelles
        await prod.connect(producteur).creerParcelle("gngn");
        await prod.connect(producteur).creerParcelle("codecode");
    });

    it("ajout de recolte", async () => {
        await collecteurProducteur.connect(producteur).ajoutRecolte([1, 2], 10, 100, "askldvowierfoaishdfasdf");
        const recolte = await collecteurProducteur.getRecolte(1);
        expect(recolte).to.include(BigInt(10));
    });

    it("ajout hashMerkle Recolte", async () => {
        await collecteurProducteur.connect(producteur).ajoutRecolte([1, 2], 10, 100, "askldvowierfoaishdfasdf");
        await collecteurProducteur.ajoutHashMerkleRecolte(1, "123456");
        const recolte = await collecteurProducteur.getRecolte(1);
        expect(recolte.hashMerkle).to.equal("123456");
    });

    it("Effectuer paiment sur commande recolte", async () => {
        // ajout recolte
        await collecteurProducteur.connect(producteur).ajoutRecolte([1, 2], 10, 100, "askldvowierfoaishdfasdf");
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

        const produit = await collecteurExportateur.getProduit(2);
        expect(produit.quantite).to.equal(10);
    });
});