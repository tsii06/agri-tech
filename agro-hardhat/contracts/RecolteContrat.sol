// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



contract RecolteContrat {

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
        string dateRecolte;
    }


    mapping(address => Acteur) public acteurs;
    mapping(uint32 => Parcelle) public parcelles;
    mapping(uint32 => Paiement) public paiements;
    uint32 public compteurParcelles;
    uint32 public compteurInspections;
    uint32 public compteurConditions;
    uint32 public compteurPaiements;
    mapping(uint32 => Recolte) public recoltes;
    uint32 public compteurRecoltes;

    /*
    les address des autres contrats qui interagisse avec ProducteurEnPhaseCulture
    */
    address private moduleRecolte;
    address private moduleParcelle;
    // ===============================================================================================


    function ajoutRecolte(uint32 _idParcelle, uint32 _quantite, uint32 _prix, string memory _dateRecolte) external {

        require(_idParcelle <= compteurParcelles, "Parcelle non existant");

        compteurRecoltes++;
        recoltes[compteurRecoltes] = Recolte(compteurRecoltes, _idParcelle, _quantite, _prix, false, "", _dateRecolte);
    }
    function certifieRecolte(uint32 _idRecolte, string memory _certificat) external {

        require(_idRecolte <= compteurRecoltes, "Recolte non existant");
        require(bytes(_certificat).length != 0, "Certificat vide");

        recoltes[_idRecolte].certifie = true;
        recoltes[_idRecolte].certificatPhytosanitaire = _certificat;
    }

}