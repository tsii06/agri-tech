// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CollecteurProducteurContratFINAL {
    enum Role { Producteur, Collecteur, Certificateur, Transporteur }
    enum Etape { PreCulture, Culture, Recolte, Transport }
    enum ModePaiement { VirementBancaire, Cash, MobileMoney }

    struct Acteur {
        address addr;
        Role role;
    }

    struct Intrant {
        string nom;
        uint quantite;
        bool valide;
    }

    struct Inspection {
        uint id;
        address auditeur;
        string rapport;
        uint timestamp;
    }

    struct EnregistrementCondition {
        uint id;
        string temperature;
        string humidite;
        uint timestamp;
    }

    struct Paiement {
        uint id;
        address payeur;
        uint montant;
        ModePaiement mode;
        uint timestamp;
    }

    struct Parcelle {
        uint id;
        address producteur;
        string qualiteSemence;
        string methodeCulture;
        bool certifie;
        Etape etape;
        string latitude;
        string longitude;
        string produit;
        string dateRecolte;
        string certificatPhytosanitaire;
        string[] photos;
        Intrant[] intrants;
        Paiement[] paiements;
        Inspection[] inspections;
        EnregistrementCondition[] conditions;
    }

    mapping(address => Acteur) public acteurs;
    mapping(uint => Parcelle) public parcelles;
    uint public compteurParcelles;
    uint public compteurInspections;
    uint public compteurConditions;
    uint public compteurPaiements;

    event ActeurEnregistre(address indexed acteur, Role role);
    event SemenceValidee(uint indexed idParcelle, string qualiteSemence);
    event MethodeCultureFixee(uint indexed idParcelle, string methodeCulture);
    event EtapeMiseAJour(uint indexed idParcelle, Etape etape);
    event ControlePhytosanitaire(uint indexed idParcelle, bool passe);
    event RecolteConfirmee(uint indexed idParcelle, bool qualiteApprouvee);
    event ParcelleCree(uint indexed idParcelle, string latitude, string longitude);
    event PhotoAjoutee(uint indexed idParcelle, string urlPhoto);
    event IntrantAjoute(uint indexed idParcelle, string nom, uint quantite);
    event IntrantValide(uint indexed idParcelle, string nom, bool valide);
    event InspectionAjoutee(uint indexed idParcelle, uint idInspection, address auditeur, string rapport, uint timestamp);
    event ConditionEnregistree(uint indexed idParcelle, uint idCondition, string temperature, string humidite, uint timestamp);
    event PaiementEnregistre(uint indexed idParcelle, uint idPaiement, address payeur, uint montant, ModePaiement mode, uint timestamp);

    modifier seulementProducteur() {
        require(acteurs[msg.sender].role == Role.Producteur, "Non autorise: seulement Producteur");
        _;
    }

    modifier seulementCollecteur() {
        require(acteurs[msg.sender].role == Role.Collecteur, "Non autorise: seulement Collecteur");
        _;
    }

    modifier seulementCertificateur() {
        require(acteurs[msg.sender].role == Role.Certificateur, "Non autorise: seulement Certificateur");
        _;
    }

    modifier seulementTransporteur() {
        require(acteurs[msg.sender].role == Role.Transporteur, "Non autorise: seulement Transporteur");
        _;
    }


    // les setters pour les tableaux dynamique du parcelle
    function getPhotos(uint _idParcelle) public view returns (string[] memory) {
        return parcelles[_idParcelle].photos;
    }
    function getIntrants(uint _idParcelle) public view returns (Intrant[] memory) {
        return parcelles[_idParcelle].intrants;
    }
    function getInspections(uint _idParcelle) public view returns (Inspection[] memory) {
        return parcelles[_idParcelle].inspections;
    }
    function getPaiements(uint _idParcelle) public view returns (Paiement[] memory) {
        return parcelles[_idParcelle].paiements;
    }
    function getConditions(uint _idParcelle) public view returns (EnregistrementCondition[] memory) {
        return parcelles[_idParcelle].conditions;
    }
    

    function enregistrerActeur(address _acteur, Role _role) public {
        acteurs[_acteur] = Acteur(_acteur, _role);
        emit ActeurEnregistre(_acteur, _role);
    }

    function creerParcelle(
        string memory _qualiteSemence,
        string memory _methodeCulture,
        string memory _latitude,
        string memory _longitude,
        string memory _produit,
        string memory _dateRecolte,
        string memory _certificatPhytosanitaire
    ) public seulementProducteur {
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
        parcelles[compteurParcelles].produit = _produit;
        parcelles[compteurParcelles].dateRecolte = _dateRecolte;
        parcelles[compteurParcelles].certificatPhytosanitaire = _certificatPhytosanitaire;

        emit SemenceValidee(compteurParcelles, _qualiteSemence);
        emit MethodeCultureFixee(compteurParcelles, _methodeCulture);
        emit ParcelleCree(compteurParcelles, _latitude, _longitude);
    }

    function mettreAJourEtape(uint _idParcelle, Etape _etape) public seulementProducteur {
        parcelles[_idParcelle].etape = _etape;
        emit EtapeMiseAJour(_idParcelle, _etape);
    }

    function appliquerControlePhytosanitaire(uint _idParcelle, bool _passe) public seulementCertificateur {
        require(parcelles[_idParcelle].etape == Etape.Culture, "Pas en etape de culture");
        parcelles[_idParcelle].certifie = _passe;
        emit ControlePhytosanitaire(_idParcelle, _passe);
    }

    function confirmerRecolte(uint _idParcelle, bool _qualiteApprouvee) public seulementCertificateur {
        require(parcelles[_idParcelle].etape == Etape.Recolte, "Pas en etape de recolte");
        emit RecolteConfirmee(_idParcelle, _qualiteApprouvee);
    }

    function ajouterPhoto(uint _idParcelle, string memory _urlPhoto) public seulementProducteur {
        parcelles[_idParcelle].photos.push(_urlPhoto);
        emit PhotoAjoutee(_idParcelle, _urlPhoto);
    }

    function ajouterIntrant(uint _idParcelle, string memory _nom, uint _quantite) public seulementCollecteur {
        parcelles[_idParcelle].intrants.push(Intrant(_nom, _quantite, false));
        emit IntrantAjoute(_idParcelle, _nom, _quantite);
    }

    function validerIntrant(uint _idParcelle, string memory _nom, bool _valide) public seulementCertificateur {
        for (uint i = 0; i < parcelles[_idParcelle].intrants.length; i++) {
            if (keccak256(abi.encodePacked(parcelles[_idParcelle].intrants[i].nom)) == keccak256(abi.encodePacked(_nom))) {
                parcelles[_idParcelle].intrants[i].valide = _valide;
                emit IntrantValide(_idParcelle, _nom, _valide);
                break;
            }
        }
    }

    function ajouterInspection(uint _idParcelle, string memory _rapport) public seulementTransporteur {
        compteurInspections++;
        parcelles[_idParcelle].inspections.push(Inspection(compteurInspections, msg.sender, _rapport, block.timestamp));
        emit InspectionAjoutee(_idParcelle, compteurInspections, msg.sender, _rapport, block.timestamp);
    }

    function enregistrerCondition(uint _idParcelle, string memory _temperature, string memory _humidite) public seulementTransporteur {
        compteurConditions++;
        parcelles[_idParcelle].conditions.push(EnregistrementCondition(compteurConditions, _temperature, _humidite, block.timestamp));
        emit ConditionEnregistree(_idParcelle, compteurConditions, _temperature, _humidite, block.timestamp);
    }

    function enregistrerPaiement(uint _idParcelle, uint _montant, ModePaiement _mode) public {
        compteurPaiements++;
        parcelles[_idParcelle].paiements.push(Paiement(compteurPaiements, msg.sender, _montant, _mode, block.timestamp));
        emit PaiementEnregistre(_idParcelle, compteurPaiements, msg.sender, _montant, _mode, block.timestamp);
    }
}