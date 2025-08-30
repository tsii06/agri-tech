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
        parcelles[compteurParcelles].cid = _ipfs;
        parcelles[compteurParcelles].hashMerkle = "";
    }

    function ajoutHashMerkleParcelle(uint32 _idParcelle, string memory _hash) public {
        require(_idParcelle <= compteurParcelles, "Parcelle non existant.");
        parcelles[_idParcelle].hashMerkle = _hash;
    }

    // Fonction modifiée pour utiliser CID IPFS au lieu d'ajouter des photos individuelles
    function mettreAJourPhotosParcelle(uint32 _idParcelle, string memory _cidPhotos) public seulementProducteur seulementActeurAutorise {
        require(_idParcelle <= compteurParcelles, "Parcelle non existant.");
        parcelles[_idParcelle].cid = _cidPhotos; // Met à jour le CID avec les nouvelles photos
    }

    // Fonction modifiée pour utiliser CID IPFS au lieu d'ajouter des intrants individuels
    function mettreAJourIntrantsParcelle(uint32 _idParcelle, string memory _cidIntrants) public seulementFournisseur seulementActeurAutorise {
        require(_idParcelle <= compteurParcelles, "Parcelle non existant.");
        parcelles[_idParcelle].cid = _cidIntrants;
    }

    // Fonction modifiée pour utiliser CID IPFS au lieu d'ajouter des inspections individuelles
    function mettreAJourInspectionsParcelle(uint32 _idParcelle, string memory _cidInspections) public seulementAuditeur seulementActeurAutorise {
        require(_idParcelle <= compteurParcelles, "Parcelle non existant.");
        parcelles[_idParcelle].cid = _cidInspections;
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