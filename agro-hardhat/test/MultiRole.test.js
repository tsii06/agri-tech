const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GestionnaireActeurs - Multi-rôles", function () {
  let gestionnaire;
  let admin, user;

  const ROLE = {
    Producteur: 0,
    Collecteur: 1,
    Exportateur: 2,
    Certificateur: 3,
    Auditeur: 4,
    Transporteur: 5,
    Administration: 6,
  };

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();

    const GestionnaireFactory = await ethers.getContractFactory("GestionnaireActeurs");
    gestionnaire = await GestionnaireFactory.deploy(admin.address, ethers.ZeroAddress);
    await gestionnaire.waitForDeployment();

    // Enregistrement initial avec le rôle Producteur
    await gestionnaire.connect(admin).enregistrerActeur(
      user.address,
      ROLE.Producteur,
      0, // TypeEntite.Individu
      "Multi Role User",
      "CIN0001",
      "Adresse X",
      "mail@test.com",
      "0340000000"
    );
  });

  it("✅ Un acteur enregistré a bien son rôle initial", async function () {
    const isProducteur = await gestionnaire.estActeurAvecRole(user.address, ROLE.Producteur);
    expect(isProducteur).to.be.true;
  });

  it("✅ Un administrateur peut ajouter un rôle secondaire à un acteur existant", async function () {
    await gestionnaire.connect(admin).ajouterRole(user.address, ROLE.Collecteur);
    const isCollecteur = await gestionnaire.estActeurAvecRole(user.address, ROLE.Collecteur);
    expect(isCollecteur).to.be.true;
  });

  it("❌ Un rôle déjà attribué ne peut pas être ajouté une seconde fois", async function () {
    await expect(
      gestionnaire.connect(admin).ajouterRole(user.address, ROLE.Producteur)
    ).to.be.revertedWith("Role deja attribue");
  });

  it("✅ La fonction getRoles retourne tous les rôles attribués à un acteur", async function () {
    await gestionnaire.connect(admin).ajouterRole(user.address, ROLE.Collecteur);
    await gestionnaire.connect(admin).ajouterRole(user.address, ROLE.Transporteur);

    const roles = await gestionnaire.getRoles(user.address);
    const rolesAsInts = roles.map(r => parseInt(r));

    expect(rolesAsInts).to.include.members([
      ROLE.Producteur,
      ROLE.Collecteur,
      ROLE.Transporteur
    ]);
    expect(rolesAsInts.length).to.equal(3);
  });

  it("✅ Un acteur inactif n’est plus considéré comme valide même s’il a un rôle", async function () {
    await gestionnaire.connect(admin).desactiverActeur(user.address);
    const isStillProducteur = await gestionnaire.estActeurAvecRole(user.address, ROLE.Producteur);
    expect(isStillProducteur).to.be.false;
  });
});
