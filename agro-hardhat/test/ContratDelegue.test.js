const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("ProducteurEnPhaseCulture - Contrat délégué (approche modulaire)", function () {
  let GestionnaireActeurs, ProducteurEnPhaseCulture;
  let gestionnaire, producteurContrat;
  let admin, producteur, autreProducteur;

  beforeEach(async function () {
    [admin, producteur, autreProducteur] = await ethers.getSigners();

    // Déploiement de GestionnaireActeurs
    const GestionnaireActeursFactory = await ethers.getContractFactory("GestionnaireActeurs");
    gestionnaire = await GestionnaireActeursFactory.deploy(admin.address, ethers.ZeroAddress);
    await gestionnaire.waitForDeployment();

    // Enregistrement du producteur
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

    // Déploiement de ProducteurEnPhaseCulture
    const ProducteurEnPhaseCultureFactory = await ethers.getContractFactory("ProducteurEnPhaseCulture");
    producteurContrat = await ProducteurEnPhaseCultureFactory.deploy(await gestionnaire.getAddress());
    await producteurContrat.waitForDeployment();

    // Délégation du contrat au producteur
    await gestionnaire.connect(admin).ajouterContratDelegue(producteur.address, await producteurContrat.getAddress());
  });

  it("✅ Un producteur avec délégation peut créer une parcelle", async function () {
    await expect(
      producteurContrat.connect(producteur).creerParcelle(
        "Qualité", "Méthode", "Lat", "Long", "2024-01-01", "Certif"
      )
    ).to.not.be.reverted;

    const compteur = await producteurContrat.getCompteurParcelle();
    const parcelle = await producteurContrat.getParcelle(compteur);
    expect(parcelle.producteur).to.equal(producteur.address);
    expect(parcelle.qualiteSemence).to.equal("Qualité");
  });

  it("❌ Un producteur sans délégation ne peut pas créer de parcelle", async function () {
    // Supprimer la délégation
    await gestionnaire.connect(admin).retirerContratDelegue(producteur.address, await producteurContrat.getAddress());

    await expect(
      producteurContrat.connect(producteur).creerParcelle(
        "Qualité", "Méthode", "Lat", "Long", "2024-01-01", "Certif"
      )
    ).to.be.revertedWith("Non autorise: contrat non delegue");
  });

  it("❌ Un autre producteur sans délégation ne peut pas créer de parcelle", async function () {
    // Enregistrement d’un autre producteur
    await gestionnaire.connect(admin).enregistrerActeur(
      autreProducteur.address,
      0,
      0,
      "Autre Producteur",
      "CIN456",
      "Adresse2",
      "autre@email.com",
      "0340000001"
    );

    await expect(
      producteurContrat.connect(autreProducteur).creerParcelle(
        "Qualité", "Méthode", "Lat", "Long", "2024-01-01", "Certif"
      )
    ).to.be.revertedWith("Non autorise: contrat non delegue");
  });

  it("❌ Un producteur désactivé ne peut pas créer de parcelle même avec délégation", async function () {
    await gestionnaire.connect(admin).desactiverActeur(producteur.address);

    await expect(
      producteurContrat.connect(producteur).creerParcelle(
        "Qualité", "Méthode", "Lat", "Long", "2024-01-01", "Certif"
      )
    ).to.be.revertedWith("Non autorise: seulement Producteur");
  });
});
