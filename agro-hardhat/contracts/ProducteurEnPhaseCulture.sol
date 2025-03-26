// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



contract ProducteurEnPhaseCulture {

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

    // ======================================== modificateur ==================================================
    modifier seulementProducteur() {
        require(acteurs[msg.sender].role == Role.Producteur, "Non autorise: seulement Producteur");
        _;
    }
    modifier seulementFournisseur() {
        require(acteurs[msg.sender].role == Role.Fournisseur, "Non autorise: seulement Fournisseur");
        _;
    }
    modifier seulementCertificateur() {
        require(acteurs[msg.sender].role == Role.Certificateur, "Non autorise: seulement Certificateur");
        _;
    }
    modifier seulementCollecteur() {
        require(acteurs[msg.sender].role == Role.Collecteur, "Non autorise: seulement Collecteur");
        _;
    }
    modifier seulementAuditeur() {
        require(acteurs[msg.sender].role == Role.Auditeur, "Non autorise: seulement Auditeur");
        _;
    }
    modifier seulementTransporteur() {
        require(acteurs[msg.sender].role == Role.Transporteur, "Non autorise: seulement Transporteur");
        _;
    }

    // ======================================== constructor ==================================================
    constructor(address _recolte, address _parcelle) {
        moduleRecolte = _recolte;
        moduleParcelle = _parcelle;
    }



    function enregistrerActeur(address _acteur, Role _role) public {
        acteurs[_acteur] = Acteur(_acteur, _role);
    }

    // ====================================== Parcelle =========================================================
    function creerParcelle(
        string memory _qualiteSemence,
        string memory _methodeCulture,
        string memory _latitude,
        string memory _longitude,
        string memory _dateRecolte,
        string memory _certificatPhytosanitaire
    ) public seulementProducteur {

        (bool success,) = moduleParcelle.delegatecall(abi.encodeWithSignature("creerParcelle(string,string,string,string,string,string)", _qualiteSemence, _methodeCulture, _latitude, _longitude, _dateRecolte, _certificatPhytosanitaire));
        require(success, "erreur delegatecall dans creeParcelle");
        
    }


    /*
    les getters pour les tableaux dynamiques d'un parcelle
    */
    function getPhotos(uint32 idParcelle) public view returns (string[] memory) {
        return parcelles[idParcelle].photos;
    }
    function getIntrants(uint32 idParcelle) public view returns (Intrant[] memory) {
        return parcelles[idParcelle].intrants;
    }
    function getInspections(uint32 idParcelle) public view returns (Inspection[] memory) {
        return parcelles[idParcelle].inspections;
    }
    function getConditions(uint32 idParcelle) public view returns (EnregistrementCondition[] memory) {
        return parcelles[idParcelle].conditions;
    }
    function mettreAJourEtape(uint32 _idParcelle, Etape _etape) public seulementProducteur {
        parcelles[_idParcelle].etape = _etape;
    }



    function appliquerControlePhytosanitaire(uint32 _idParcelle, bool _passe) public seulementCertificateur {

        (bool success,) = moduleParcelle.delegatecall(abi.encodeWithSignature("appliquerControlePhytosanitaire(uint32,uint32)", _idParcelle, _passe));
        require(success, "erreur delegatecall dans appliquerControlePhytosanitaire");
    }

    function ajouterPhoto(uint32 _idParcelle, string memory _urlPhoto) public seulementProducteur {
        parcelles[_idParcelle].photos.push(_urlPhoto);
    }

    function ajouterIntrant(uint32 _idParcelle, string memory _nom, uint32 _quantite) public seulementFournisseur {
        parcelles[_idParcelle].intrants.push(Intrant(_nom, _quantite, false));
    }

    function validerIntrant(uint32 _idParcelle, string memory _nom, bool _valide) public seulementCertificateur {
        
        (bool success,) = moduleParcelle.delegatecall(abi.encodeWithSignature("validerIntrant(uint32,string,bool)", _idParcelle, _nom, _valide));
        require(success, "erreur delegatecall dans validerIntrant");
    }

    function ajouterInspection(uint32 _idParcelle, string memory _rapport) public seulementAuditeur {

        compteurInspections++;
        parcelles[_idParcelle].inspections.push(Inspection(compteurInspections, msg.sender, _rapport, block.timestamp));
    }

    function obtenirInformationsParcelle(uint32 _idParcelle) public view returns (
        string memory qualiteSemence,
        string memory methodeCulture,
        string memory latitude,
        string memory longitude,
        string memory dateRecolte,
        string memory certificatPhytosanitaire
    ) {

        // l'idParcelle doit etre existant
        require(_idParcelle <= compteurParcelles, "Ce parcelle n'existe pas");
        Parcelle storage parcelle = parcelles[_idParcelle];
        return (
            parcelle.qualiteSemence,
            parcelle.methodeCulture,
            parcelle.latitude,
            parcelle.longitude,
            parcelle.dateRecolte,
            parcelle.certificatPhytosanitaire
        );
    }
    function enregistrerCondition(uint32 _idParcelle, string memory _temperature, string memory _humidite) public seulementTransporteur {
        compteurConditions++;
        parcelles[_idParcelle].conditions.push(EnregistrementCondition(compteurConditions, _temperature, _humidite, block.timestamp));
    }


    function effectuerPaiementVersProducteur(uint32 _idParcelle, uint32 _montant, ModePaiement _mode) public payable seulementCollecteur {
        compteurPaiements++;
        paiements[_idParcelle] = Paiement(compteurPaiements, msg.sender, _montant, _mode, block.timestamp);
    }

    // ====================================== Recolte =========================================================
    function ajoutRecolte(uint32 _idParcelle, uint32 _quantite, uint32 _prix, string memory _dateRecolte) public seulementProducteur {

        (bool success,) = moduleRecolte.delegatecall(abi.encodeWithSignature("ajoutRecolte(uint32,uint32,uint32,string)", _idParcelle, _quantite, _prix, _dateRecolte));
        require(success, "erreur delegatecall dans ajoutRecolte");
    }
    function certifieRecolte(uint32 _idRecolte, string memory _certificat) public seulementCertificateur {

        (bool success,) = moduleRecolte.delegatecall(abi.encodeWithSignature("certifieRecolte(uint32,string)", _idRecolte, _certificat));
        require(success, "erreur delegatecall dans certifieRecolte");
    }


    // corrige l'erreur eth_call
    receive() external payable {}
    fallback() external payable {}

    // ====================================== getter ==========================================================
    function getActeur(address addr) public view returns(Acteur memory) {
        return acteurs[addr];
    }
    function getParcelle(uint32 id) public view returns(Parcelle memory) {
        return parcelles[id];
    }
    function getPaiement(uint32 id) public view returns(Paiement memory) {
        return paiements[id];
    }

    function getCompteurParcelle() public view returns(uint32) {
        return compteurParcelles;
    }
    function getCompteurInspection() public view returns(uint32) {
        return compteurInspections;
    }
    function getCompteurCondition() public view returns(uint32) {
        return compteurConditions;
    }
    function getCompteurPaiement() public view returns(uint32) {
        return compteurPaiements;
    }
}