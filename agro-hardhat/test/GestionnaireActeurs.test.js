const { ethers } = require('hardhat');
const { expect } = require('chai');

// Enumération StructLib.Role (copiée ici pour faciliter les tests)
const Role = {
    Producteur: 0,
    Collecteur: 1,
    Cooperative: 2,
    CentreTraitement: 3,
    Exportateur: 4,
    OrganismeCertification: 5,
    Auditeur: 6,
    TransporteurRoutier: 7,
    TransporteurMaritime: 8,
    TransporteurAerien: 9,
    AdministrationPublique: 10,
    ConsommateurFinal: 11,
    Autre: 12
};

// Enumération TypeEntite (copiée ici pour faciliter les tests)
const TypeEntite = {
    Individu: 0,
    Organisation: 1
};


describe("GestionnaireActeurs", function() {

	let ContratFactory, GestionnaireActeurs;
	let owner, addr0, addr1, addr2, addr3, addr4, addr5; // addr0 sera l'admin initial, addr1 le proxy
    const initialOffChainHash = "QmTestHash123";
    const modifiedOffChainHash = "QmNewTestHash456";

	beforeEach(async function() {
		[owner, addr0, addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();

		ContratFactory = await ethers.getContractFactory("GestionnaireActeurs");
		// addr0 est l'admin initial, addr1 est une adresse placeholder pour proxyAddress
		GestionnaireActeurs = await ContratFactory.deploy(addr0.address, addr1.address);
		await GestionnaireActeurs.waitForDeployment();
	});


	describe("ajouterAdministrateur()", function() {
		
		it("Administrateur bien ajouter", async function() {
			await GestionnaireActeurs.connect(addr0).ajouterAdministrateur(addr1.address);
			const success = await GestionnaireActeurs.administrateurs(addr1.address);
			expect(success).to.equal(true);
		});

		it("seulementAdministrateur", async function() {
			const tx = GestionnaireActeurs.connect(addr1).ajouterAdministrateur(addr2.address);
			await expect(tx).to.be.revertedWith("Non autorise: seulement Administrateur");
		});
	});


	describe("retirerAdministrateur()", function() {
		it("Administrateur bien retirer", async function() {
			await GestionnaireActeurs.connect(addr0).ajouterAdministrateur(addr1.address);
			await GestionnaireActeurs.connect(addr0).retirerAdministrateur(addr1.address);
			const success = await GestionnaireActeurs.administrateurs(addr1.address);
			expect(success).to.equal(false);
		});
	});


	describe("enregistrerActeur()", function() {
		it("Acteur bien enregistrer et event emis", async function() {
			const tx = await GestionnaireActeurs.connect(addr0).enregistrerActeur(
				addr1.address,
				Role.Producteur,
		        TypeEntite.Individu,
		        initialOffChainHash
			);
			const acteur = await GestionnaireActeurs.acteurs(addr1.address);
			expect(acteur.offChainDetailsHash).to.equal(initialOffChainHash);
            expect(acteur.idBlockchain).to.match(/^MG-\d+-\d+$/); // Format check for idBlockchain

            // Check event
            // We use a predicate for idBlockchain because it's generated and includes a timestamp
            await expect(tx)
                .to.emit(GestionnaireActeurs, "ActeurEnregistre")
                .withArgs(addr1.address, (id) => id.startsWith("MG-") && id.split('-').length === 3, Role.Producteur, initialOffChainHash, (ts) => ts > 0);
		});
	});


	describe("Gestion d'un acteur", function() {
		beforeEach(async function() {
			await GestionnaireActeurs.connect(addr0).enregistrerActeur(
				addr1.address,
				Role.Producteur,
		        TypeEntite.Individu,
		        initialOffChainHash
			);
		});

		describe("modifierActeur()", function() {
			it("Acteur bien modifier et event emis", async function() {
				const tx = await GestionnaireActeurs.connect(addr0).modifierActeur(
			        addr1.address,
			        modifiedOffChainHash
		        );
				const acteur = await GestionnaireActeurs.acteurs(addr1.address);
				expect(acteur.offChainDetailsHash).to.equal(modifiedOffChainHash);

                // Check event
                const acteurDetails = await GestionnaireActeurs.getDetailsActeur(addr1.address);
                await expect(tx)
                    .to.emit(GestionnaireActeurs, "ActeurModifie")
                    .withArgs(addr1.address, acteurDetails.idBlockchain, Role.Producteur, modifiedOffChainHash, (ts) => ts > 0);
			});

			it("Le modifier acteurExiste", async function() {
				const tx = GestionnaireActeurs.connect(addr0).modifierActeur(
			        addr2.address,
			        modifiedOffChainHash
		        );
				await expect(tx).to.be.revertedWith("Acteur inexistant");
			});
		});

		describe("desactiverActeur()", function() {
			it("Acteur bien desactiver", async function() {
				await GestionnaireActeurs.connect(addr0).desactiverActeur(addr1.address);
				const acteur = await GestionnaireActeurs.acteurs(addr1.address);
				expect(acteur.actif).to.equal(false);
			});

			it("Le modifier acteurActif", async function() {
				await GestionnaireActeurs.connect(addr0).desactiverActeur(addr1.address);
				const tx = GestionnaireActeurs.connect(addr0).desactiverActeur(addr1.address);
				await expect(tx).to.be.revertedWith("Acteur inactif");
			});
		});

		describe("activerActeur()", function() {
			it("Acteur bien activer", async function() {
				await GestionnaireActeurs.connect(addr0).desactiverActeur(addr1.address);
				await GestionnaireActeurs.connect(addr0).activerActeur(addr1.address);
				const acteur = await GestionnaireActeurs.acteurs(addr1.address);
				expect(acteur.actif).to.equal(true);
			});
		});

		describe("getDetailsActeur()", function() {
			it("Information recues", async function() {
				const [
					idBlockchain,
		            role,
		            actif,
		            typeEntite,
		            dateEnregistrement,
		            contratsDelegues,
                    offChainDetailsHash
				] = await GestionnaireActeurs.getDetailsActeur(addr1.address);

				expect(offChainDetailsHash).to.equal(initialOffChainHash);
                expect(role).to.equal(Role.Producteur);
                expect(actif).to.equal(true);
			});
		});

		describe("ajouterContratDelegue()", function() {
			it("Adresse contrat ajouter", async function() {
				await GestionnaireActeurs.connect(addr0).ajouterContratDelegue(addr1.address, addr3.address);
				const details = await GestionnaireActeurs.getDetailsActeur(addr1.address);
				expect(details.contratsDelegues[0]).to.equal(addr3.address);
			});
		});

		describe("retirerContratDelegue()", function() {
            beforeEach(async function() {
                // Ajoute addr2 et addr3 comme contrats délégués à addr1
                await GestionnaireActeurs.connect(addr0).ajouterContratDelegue(addr1.address, addr2.address);
                await GestionnaireActeurs.connect(addr0).ajouterContratDelegue(addr1.address, addr3.address);
            });

			it("Retirer un contrat delegue (pas le dernier)", async function() {
				await GestionnaireActeurs.connect(addr0).retirerContratDelegue(addr1.address, addr2.address);
				const details = await GestionnaireActeurs.getDetailsActeur(addr1.address);
				expect(details.contratsDelegues.length).to.equal(1);
				expect(details.contratsDelegues[0]).to.equal(addr3.address); // addr3 était le dernier, il remplace addr2
			});

            it("Retirer le dernier contrat delegue ajoute", async function() {
                await GestionnaireActeurs.connect(addr0).retirerContratDelegue(addr1.address, addr3.address);
                const details = await GestionnaireActeurs.getDetailsActeur(addr1.address);
                expect(details.contratsDelegues.length).to.equal(1);
                expect(details.contratsDelegues[0]).to.equal(addr2.address);
            });

            it("Retirer tous les contrats delegues un par un", async function() {
                await GestionnaireActeurs.connect(addr0).retirerContratDelegue(addr1.address, addr2.address);
                await GestionnaireActeurs.connect(addr0).retirerContratDelegue(addr1.address, addr3.address);
                const details = await GestionnaireActeurs.getDetailsActeur(addr1.address);
                expect(details.contratsDelegues.length).to.equal(0);
            });

            it("Retirer d'un tableau a un seul element", async function() {
                // D'abord, retirer un pour qu'il ne reste que addr2
                await GestionnaireActeurs.connect(addr0).retirerContratDelegue(addr1.address, addr3.address);
                let details = await GestionnaireActeurs.getDetailsActeur(addr1.address);
                expect(details.contratsDelegues.length).to.equal(1);

                // Retirer le dernier element
                await GestionnaireActeurs.connect(addr0).retirerContratDelegue(addr1.address, addr2.address);
                details = await GestionnaireActeurs.getDetailsActeur(addr1.address);
                expect(details.contratsDelegues.length).to.equal(0);
            });

            it("Tenter de retirer un contrat non delegue", async function() {
                const tx = GestionnaireActeurs.connect(addr0).retirerContratDelegue(addr1.address, addr4.address);
                await expect(tx).to.be.revertedWith("Contrat non trouve");
            });
		});

		describe("estActeurAvecRole()", function() {
			it("Role verifier", async function() {
				const bool = await GestionnaireActeurs.estActeurAvecRole(addr1.address, Role.Producteur);
				expect(bool).to.equal(true);
			});
		});

		describe("getActeursByRole()", function() {
			it("Acteurs par role recuperer", async function() {
				const producteurs = await GestionnaireActeurs.getActeursByRole(Role.Producteur);
				expect(producteurs[0]).to.equal(addr1.address);
			});
		});

		describe("getAdresseParIdBlockchain()", function() {
			it("Adresse recuperer par idBlockchain", async function() {
				const acteur = await GestionnaireActeurs.acteurs(addr1.address);
				const addrActeur = await GestionnaireActeurs.getAdresseParIdBlockchain(acteur.idBlockchain);
				expect(addrActeur).to.equal(addr1.address);
			});
		});
	});

    describe("getActeursByRolePaginated()", function() {
        const hash1 = "QmHashP1";
        const hash2 = "QmHashP2";
        const hash3 = "QmHashP3";
        const hash4 = "QmHashP4";
        const hashC1 = "QmHashC1";

        beforeEach(async function() {
            // Enregistrer 4 Producteurs (Role.Producteur = 0)
            await GestionnaireActeurs.connect(addr0).enregistrerActeur(addr1.address, Role.Producteur, TypeEntite.Individu, hash1);
            await GestionnaireActeurs.connect(addr0).enregistrerActeur(addr2.address, Role.Producteur, TypeEntite.Organisation, hash2);
            await GestionnaireActeurs.connect(addr0).enregistrerActeur(addr3.address, Role.Producteur, TypeEntite.Individu, hash3);
            await GestionnaireActeurs.connect(addr0).enregistrerActeur(addr4.address, Role.Producteur, TypeEntite.Organisation, hash4);
            // Enregistrer 1 Collecteur (Role.Collecteur = 1, mais on utilise 3 selon la description precedente, ajustons Role enum si besoin)
            // En supposant que le test initial voulait dire Role.CentreTraitement (3) comme Collecteur
            await GestionnaireActeurs.connect(addr0).enregistrerActeur(addr5.address, Role.CentreTraitement, TypeEntite.Individu, hashC1);
        });

        it("should return the first page of producteurs correctly", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.Producteur, 0, 2);
            expect(totalCount).to.equal(4);
            expect(page.length).to.equal(2);
            expect(page[0]).to.equal(addr1.address);
            expect(page[1]).to.equal(addr2.address);
        });

        it("should return the second page of producteurs correctly", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.Producteur, 2, 2);
            expect(totalCount).to.equal(4);
            expect(page.length).to.equal(2);
            expect(page[0]).to.equal(addr3.address);
            expect(page[1]).to.equal(addr4.address);
        });

        it("should handle pageSize larger than remaining items", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.Producteur, 3, 2);
            expect(totalCount).to.equal(4);
            expect(page.length).to.equal(1);
            expect(page[0]).to.equal(addr4.address);
        });

        it("should handle pageSize larger than total items", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.Producteur, 0, 10);
            expect(totalCount).to.equal(4);
            expect(page.length).to.equal(4);
            expect(page[0]).to.equal(addr1.address);
            expect(page[3]).to.equal(addr4.address);
        });

        it("should return an empty page if startIndex is at the end of the list (equal to totalCount)", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.Producteur, 4, 2);
            expect(totalCount).to.equal(4);
            expect(page.length).to.equal(0);
        });

        it("should revert if startIndex is strictly out of bounds (> totalCount)", async function() {
            // totalCount is 4 for Producteur. startIndex 5 is out of bounds.
            await expect(GestionnaireActeurs.getActeursByRolePaginated(Role.Producteur, 5, 2))
                .to.be.revertedWith("Start index out of bounds");
        });

        it("should revert for pageSize 0", async function() {
            await expect(GestionnaireActeurs.getActeursByRolePaginated(Role.Producteur, 0, 0))
                .to.be.revertedWith("Page size must be positive");
        });

        it("should return empty page and correct totalCount for a role with no actors", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.Exportateur, 0, 2); // Role.Exportateur (4)
            expect(totalCount).to.equal(0);
            expect(page.length).to.equal(0);
        });

        it("should return correctly when startIndex is 0 and totalCount is 0 (role with no actors)", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.Auditeur, 0, 2); // Role.Auditeur (6)
            expect(totalCount).to.equal(0);
            expect(page.length).to.equal(0);
        });

        it("should retrieve collecteurs correctly (Role.CentreTraitement)", async function() {
            const { page, totalCount } = await GestionnaireActeurs.getActeursByRolePaginated(Role.CentreTraitement, 0, 2);
            expect(totalCount).to.equal(1);
            expect(page.length).to.equal(1);
            expect(page[0]).to.equal(addr5.address);
        });
    });
});