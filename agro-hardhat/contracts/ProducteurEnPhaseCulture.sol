// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";

contract ProducteurEnPhaseCulture {
    GestionnaireActeurs public gestionnaireActeurs;
    mapping(uint32 => StructLib.Parcelle) public parcelles;
    uint32 public compteurParcelles;
    uint32 public compteurInspections;
    uint32 public compteurIntrants;
    // limite le nombre d'appel a la fonction initialiser a 1
    bool private initialised;

    // ======================================== modificateur ==================================================
    modifier seulementProducteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Producteur), "Non autorise: seulement Producteur");
        _;
    }
    modifier seulementFournisseur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Fournisseur), "Non autorise: seulement Fournisseur");
        _;
    }
    modifier seulementCertificateur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Certificateur), "Non autorise: seulement Certificateur");
        _;
    }
    modifier seulementCollecteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Collecteur), "Non autorise: seulement Collecteur");
        _;
    }
    modifier seulementAuditeur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Auditeur), "Non autorise: seulement Auditeur");
        _;
    }
    modifier seulementTransporteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Transporteur), "Non autorise: seulement Transporteur");
        _;
    }
    modifier seulementActeurAutorise() {
        require(
            gestionnaireActeurs.aContratDelegue(msg.sender, address(this)),
            "Non autorise: contrat non delegue"
        );
        _;
    }

    function initialiser(address _gestionnaireActeurs) public {
        require(!initialised, "Contrat deja initialiser !");
        gestionnaireActeurs = GestionnaireActeurs(_gestionnaireActeurs);
        initialised = true;
    }

    // ====================================== Parcelle =========================================================
    function creerParcelle(
        string memory _qualiteSemence,
        string memory _methodeCulture,
        string memory _latitude,
        string memory _longitude,
        string memory _dateRecolte,
        string memory _certificatPhytosanitaire
    ) public seulementProducteur seulementActeurAutorise {
        compteurParcelles++;
        parcelles[compteurParcelles].id = compteurParcelles;
        parcelles[compteurParcelles].producteur = msg.sender;
        parcelles[compteurParcelles].qualiteSemence = _qualiteSemence;
        parcelles[compteurParcelles].methodeCulture = _methodeCulture;
        parcelles[compteurParcelles].certifie = false;
        parcelles[compteurParcelles].etape = StructLib.Etape.PreCulture;
        parcelles[compteurParcelles].latitude = _latitude;
        parcelles[compteurParcelles].longitude = _longitude;
        parcelles[compteurParcelles].dateRecolte = _dateRecolte;
        parcelles[compteurParcelles].certificatPhytosanitaire = _certificatPhytosanitaire;
    }

    function mettreAJourEtape(uint32 _idParcelle, StructLib.Etape _etape) public seulementProducteur {
        parcelles[_idParcelle].etape = _etape;
    }
    function appliquerControlePhytosanitaire(uint32 _idParcelle, bool _passe) public seulementCertificateur {
        require(parcelles[_idParcelle].etape == StructLib.Etape.Culture, "Pas en etape de culture");
        parcelles[_idParcelle].certifie = _passe;
    }

    function ajouterPhoto(uint32 _idParcelle, string memory _urlPhoto) public seulementProducteur {
        parcelles[_idParcelle].photos.push(_urlPhoto);
    }

    function ajouterIntrant(uint32 _idParcelle, string memory _nom, uint32 _quantite, string memory _categorie, address _fournisseur) public seulementFournisseur {
        compteurIntrants++;
        parcelles[_idParcelle].intrants.push(StructLib.Intrant(_nom, _quantite, false, compteurIntrants, _categorie, _fournisseur, ""));
    }

    function validerIntrant(uint32 _idParcelle, uint32 _id, bool _valide, string memory _certificatPhytosanitaire) public seulementCertificateur {
        for (uint32 i = 0; i < parcelles[_idParcelle].intrants.length; i++) {
            if (parcelles[_idParcelle].intrants[i].id == _id) {
                parcelles[_idParcelle].intrants[i].valide = _valide;
                parcelles[_idParcelle].intrants[i].certificatPhytosanitaire = _certificatPhytosanitaire;
                break;
            }
        }
    }

    function ajouterInspection(uint32 _idParcelle, string memory _rapport) public seulementAuditeur {
        compteurInspections++;
        parcelles[_idParcelle].inspections.push(StructLib.Inspection(compteurInspections, msg.sender, _rapport, block.timestamp));
    }

    // ====================================== getter ==========================================================

    // pour les parcelles
    function getParcelle(uint32 id) public view returns(StructLib.Parcelle memory) {
        return parcelles[id];
    }
    function getCompteurParcelle() public view returns(uint32) {
        return compteurParcelles;
    }
    function getCompteurInspection() public view returns(uint32) {
        return compteurInspections;
    }
    function getPhotos(uint32 idParcelle) public view returns (string[] memory) {
        return parcelles[idParcelle].photos;
    }
    function getIntrants(uint32 idParcelle) public view returns (StructLib.Intrant[] memory) {
        return parcelles[idParcelle].intrants;
    }
    function getInspections(uint32 idParcelle) public view returns (StructLib.Inspection[] memory) {
        return parcelles[idParcelle].inspections;
    }
    function getConditions(uint32 idParcelle) public view returns (StructLib.EnregistrementCondition[] memory) {
        return parcelles[idParcelle].conditions;
    }

    // corrige l'erreur eth_call
    receive() external payable {}
    fallback() external payable {}
}