const { expect } = require("chai");
const { ethers } = require("hardhat");

// Adresse zéro en dur pour compatibilité
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

describe("ProducteurEnPhaseCulture - Contrat délégué", function () {
  let GestionnaireActeurs, ProducteurEnPhaseCulture;
  let gestionnaire, producteurEnPhaseCulture;
  let admin, producteur, autreProducteur;

  beforeEach(async function () {
    [admin, producteur, autreProducteur] = await ethers.getSigners();

    // Déployer le gestionnaire d'acteurs
    GestionnaireActeurs = await ethers.getContractFactory("GestionnaireActeurs");
    gestionnaire = await GestionnaireActeurs.deploy(admin.address, ADDRESS_ZERO);
    await gestionnaire.deployed();

    // Enregistrer un producteur
    await gestionnaire.connect(admin).enregistrerActeur(
      producteur.address,
      0, // Role.Producteur
      0, // TypeEntite.Individu
      "Nom Producteur",
      "CIN123",
      "Adresse",
      "email@email.com",
      "0340000000"
    );

    // Déployer ProducteurEnPhaseCulture
    ProducteurEnPhaseCulture = await ethers.getContractFactory("ProducteurEnPhaseCulture");
    producteurEnPhaseCulture = await ProducteurEnPhaseCulture.deploy(gestionnaire.address);
    await producteurEnPhaseCulture.deployed();

    // Ajouter le contrat ProducteurEnPhaseCulture comme contrat délégué au producteur
    await gestionnaire.connect(admin).ajouterContratDelegue(producteur.address, producteurEnPhaseCulture.address);
  });

  it("Un producteur avec le contrat délégué peut créer une parcelle", async function () {
    await expect(
      producteurEnPhaseCulture.connect(producteur).creerParcelle(
        "Qualité", "Méthode", "Lat", "Long", "2024-01-01", "Certif"
      )
    ).to.not.be.reverted;
  });

  it("Un producteur sans le contrat délégué ne peut pas créer de parcelle", async function () {
    // Retirer le contrat délégué
    await gestionnaire.connect(admin).retirerContratDelegue(producteur.address, producteurEnPhaseCulture.address);

    await expect(
      producteurEnPhaseCulture.connect(producteur).creerParcelle(
        "Qualité", "Méthode", "Lat", "Long", "2024-01-01", "Certif"
      )
    ).to.be.revertedWith("Non autorise: contrat non delegue");
  });

  it("Un autre producteur sans délégation ne peut pas créer de parcelle", async function () {
    await gestionnaire.connect(admin).enregistrerActeur(
      autreProducteur.address,
      0, // Role.Producteur
      0, // TypeEntite.Individu
      "Autre Producteur",
      "CIN456",
      "Adresse2",
      "autre@email.com",
      "0340000001"
    );
    await expect(
      producteurEnPhaseCulture.connect(autreProducteur).creerParcelle(
        "Qualité", "Méthode", "Lat", "Long", "2024-01-01", "Certif"
      )
    ).to.be.revertedWith("Non autorise: contrat non delegue");
  });
}); 