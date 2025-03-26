// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ProducteurEnPhaseCulture.sol";



contract ParcelleContrat {

	// ================================ variable d'etat ==============================================
	enum Role { Producteur, Fournisseur, Certificateur, Collecteur, Auditeur, Transporteur, Exportateur }
    enum Etape { PreCulture, Culture, Recolte, Transport }
    enum ModePaiement { VirementBancaire, Cash, MobileMoney }

    struct Acteur {
        address addr;
        Role role;
    }

    struct Intrant {
        string nom;
        uint32 quantite;
        bool valide;
    }

    struct Inspection {
        uint32 id;
        address auditeur;
        string rapport;
        uint timestamp;
    }

    struct EnregistrementCondition {
        uint32 id;
        string temperature;
        string humidite;
        uint timestamp;
    }

    struct Parcelle {
        uint32 id;
        address producteur;
        string qualiteSemence;
        string methodeCulture;
        bool certifie;
        Etape etape;
        string latitude;
        string longitude;
        string[] photos;
        Intrant[] intrants;
        Inspection[] inspections;
        EnregistrementCondition[] conditions;
        string dateRecolte;
        string certificatPhytosanitaire;
    }

    struct Paiement {
        uint32 id;
        address payeur;
        uint32 montant;
        ModePaiement mode;
        uint timestamp;
    }

    // ajout de struct recolte
    struct Recolte {
        uint32 id;
        uint32 idParcelle;
        uint32 quantite;
        uint32 prix;
        bool certifie;
        string certificatPhytosanitaire;
    }


    // ------------------------- Attributs --------------------------------------------------------------
    mapping(address => Acteur) public acteurs;
    mapping(uint32 => Parcelle) public parcelles;
    mapping(uint32 => Paiement) public paiements;
    uint32 public compteurParcelles;
    uint32 public compteurInspections;
    uint32 public compteurConditions;
    uint32 public compteurPaiements;
    mapping(uint32 => Recolte) public recoltes;
    uint32 public compteurRecoltes;
	// ===============================================================================================


	function creerParcelle(
        string memory _qualiteSemence,
        string memory _methodeCulture,
        string memory _latitude,
        string memory _longitude,
        string memory _dateRecolte,
        string memory _certificatPhytosanitaire
    ) public {

		compteurParcelles++;
		// Ceci permet de ne pas specifier de valeur pour l'initialisation des tableaux dynamiques de struct et ainsi d'eviter un UnimplementedFeatureError
        parcelles[compteurParcelles].id = compteurParcelles;
        parcelles[compteurParcelles].producteur = msg.sender;
        parcelles[compteurParcelles].qualiteSemence = _qualiteSemence;
        parcelles[compteurParcelles].methodeCulture = _methodeCulture;
        parcelles[compteurParcelles].certifie = false;
        parcelles[compteurParcelles].etape = Etape.PreCulture;
        parcelles[compteurParcelles].latitude = _latitude;
        parcelles[compteurParcelles].longitude = _longitude;
        parcelles[compteurParcelles].dateRecolte = _dateRecolte;
        parcelles[compteurParcelles].certificatPhytosanitaire = _certificatPhytosanitaire;
    }
    function appliquerControlePhytosanitaire(uint32 _idParcelle, bool _passe) public {
        require(parcelles[_idParcelle].etape == Etape.Culture, "Pas en etape de culture");
        parcelles[_idParcelle].certifie = _passe;
    }
    function validerIntrant(uint32 _idParcelle, string memory _nom, bool _valide) public {
        for (uint32 i = 0; i < parcelles[_idParcelle].intrants.length; i++) {
            if (keccak256(abi.encodePacked(parcelles[_idParcelle].intrants[i].nom)) == keccak256(abi.encodePacked(_nom))) {
                parcelles[_idParcelle].intrants[i].valide = _valide;
                break;
            }
        }
    }
}