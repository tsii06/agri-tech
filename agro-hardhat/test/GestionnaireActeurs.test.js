const { ethers } = require('hardhat');
const { expect } = require('chai');





describe("GestionnaireActeurs", function() {

	let ContratFactory, GestionnaireActeurs;
	let addr0, addr1, addr2, addr3;

	beforeEach(async function() {

		[addr0, addr1, addr2, addr3] = await ethers.getSigners();

		ContratFactory = await ethers.getContractFactory("GestionnaireActeurs");
		GestionnaireActeurs = await ContratFactory.deploy(addr0, addr1);
		await GestionnaireActeurs.waitForDeployment();
	});




	describe("ajouterAdministrateur()", function() {
		
		it("Administrateur bien ajouter", async function() {
			
			await GestionnaireActeurs.connect(addr0).ajouterAdministrateur(addr1);
			const success = await GestionnaireActeurs.administrateurs(addr1);

			expect(success).to.equal(true);
		});

		it("seulementAdministrateur", async function() {

			const tx = GestionnaireActeurs.connect(addr1).ajouterAdministrateur(addr2);

			await expect(tx).to.be.revertedWith("Non autorise: seulement Administrateur");
		});
	});




	describe("retirerAdministrateur()", function() {
		
		it("Administrateur bien retirer", async function() {

			// enregistrer addr1 comme admin
			await GestionnaireActeurs.ajouterAdministrateur(addr1);

			// retirer addr1 comme admin
			await GestionnaireActeurs.connect(addr0).retirerAdministrateur(addr1);
			const success = await GestionnaireActeurs.administrateurs(addr1);

			expect(success).to.equal(false);
		});
	});




	describe("enregistrerActeur()", function() {

		it("Acteur bien enregistrer", async function() {

			await GestionnaireActeurs.connect(addr0).enregistrerActeur(
				addr1,
				0,	// role : un producteur
		        0,	// type d'entite : individue
		        "Valy Ifaliana",
		        "100 000 000 000",	// CIN/NIF
		        "Lot XX Paris",
		        "xxxx@mai.com",
		        "000 00 000 00"
				);
			const acteur = await GestionnaireActeurs.acteurs(addr1);

			expect(acteur.nom).to.equal("Valy Ifaliana");
		});
	});




	describe("Gestion d'un acteur", function() {

		beforeEach(async function() {

			await GestionnaireActeurs.connect(addr0).enregistrerActeur(
				addr1,
				0,	// role : un producteur
		        0,	// type d'entite : individue
		        "Valy Ifaliana",
		        "100 000 000 000",	// CIN/NIF
		        "Lot XX Paris",
		        "xxxx@mai.com",
		        "000 00 000 00"
				);
		});


		describe("modifierActeur()", function() {

			it("Acteur bien modifier", async function() {
				
				await GestionnaireActeurs.connect(addr0).modifierActeur(
			        addr1,
			        "Cornelius",
			        "100 000 000 000",
			        "Lot unknow",
			        "common@email.com",
			        "000 00 000 00"
			        );
				const acteur = await GestionnaireActeurs.acteurs(addr1);

				expect(acteur.nom).to.equal("Cornelius");
				expect(acteur.email).to.equal("common@email.com");
			});

			it("Le modifier acteurExiste", async function() {

				const tx = GestionnaireActeurs.connect(addr0).modifierActeur(
			        addr2,
			        "Cornelius",
			        "100 000 000 000",
			        "Lot unknow",
			        "common@email.com",
			        "000 00 000 00"
			        );

				await expect(tx).to.be.revertedWith("Acteur inexistant");
			});
		});


		describe("desactiverActeur()", function() {

			it("Acteur bien desactiver", async function() {

				await GestionnaireActeurs.connect(addr0).desactiverActeur(addr1);
				const acteur = await GestionnaireActeurs.acteurs(addr1);

				expect(acteur.actif).to.equal(false);
			});

			it("Le modifier acteurActif", async function() {

				// desactive d'abord l'acteur addr1
				await GestionnaireActeurs.connect(addr0).desactiverActeur(addr1);

				// Puis on va la re-desactiver pour provoquer une erreur
				const tx = GestionnaireActeurs.connect(addr0).desactiverActeur(addr1);

				await expect(tx).to.be.revertedWith("Acteur inactif");
			});
		});


		describe("activerActeur()", function() {

			it("Acteur bien activer", async function() {

				// desactive d'abord l'acteur addr1
				await GestionnaireActeurs.connect(addr0).desactiverActeur(addr1);

				// Puis on le reactive
				await GestionnaireActeurs.connect(addr0).activerActeur(addr1);

				const actif = ( await GestionnaireActeurs.acteurs(addr1) ).actif;

				expect(actif).to.equal(true);
			});
		});


		describe("getDetailsActeur()", function() {

			it("Information recues", async function() {

				const [
					idBlockchain,
		            role,
		            actif,
		            typeEntite,
		            nom,
		            nifOuCin,
		            adresseOfficielle,
		            email,
		            telephone,
		            dateEnregistrement,
		            contratsDelegues
				] = await GestionnaireActeurs.getDetailsActeur(addr1);

				expect(nom).to.equal("Valy Ifaliana");
			});
		});


		describe("ajouterContratDelegue()", function() {

			it("Adresse contrat ajouter", async function() {

				await GestionnaireActeurs.ajouterContratDelegue(addr1, addr3);
				const [, , , , , , , , , , contratsDelegues] = await GestionnaireActeurs.getDetailsActeur(addr1);

				expect(contratsDelegues[0]).to.equal(addr3);
			});
		});


		describe("retirerContratDelegue()", function() {

			it("Adresse contrat retirer", async function() {

				// ajoute d'abord des contrats delegues
				await GestionnaireActeurs.ajouterContratDelegue(addr1, addr3);
				await GestionnaireActeurs.ajouterContratDelegue(addr1, addr2);

				// retirer un contrat delegue
				await GestionnaireActeurs.retirerContratDelegue(addr1, addr3);
				const [, , , , , , , , , , contratsDelegues] = await GestionnaireActeurs.getDetailsActeur(addr1);

				for(let i=0 ; i<contratsDelegues.length ; i++) {

					expect(contratsDelegues[i]).to.not.equal(addr3);
				}
			});
		});


		describe("estActeurAvecRole()", function() {

			it("Role verifier", async function() {

				const bool = await GestionnaireActeurs.estActeurAvecRole(addr1, 0);

				expect(bool).to.equal(true);
			});
		});


		describe("getActeursByRole()", function() {

			it("Acteurs par role recuperer", async function() {

				const producteur = await GestionnaireActeurs.getActeursByRole(0);

				expect(producteur[0]).to.equal(addr1);
			});
		});


		describe("getAdresseParIdBlockchain()", function() {

			it("Adresse recuperer par idBlockchain", async function() {

				// reuperer l'acteur
				const acteur = await GestionnaireActeurs.acteurs(addr1);

				const addrActeur = await GestionnaireActeurs.getAdresseParIdBlockchain(acteur.idBlockchain);

				expect(addrActeur).to.equal(addr1);
			});
		});
	});
});