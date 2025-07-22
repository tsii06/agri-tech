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
    function creerParcelle(string memory _ipfs) public seulementProducteur seulementActeurAutorise {
        compteurParcelles++;
        parcelles[compteurParcelles].id = compteurParcelles;
        parcelles[compteurParcelles].producteur = msg.sender;
        parcelles[compteurParcelles].metadaIpfs = _ipfs;
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

    // corrige l'erreur eth_call
    receive() external payable {}
    fallback() external payable {}
}