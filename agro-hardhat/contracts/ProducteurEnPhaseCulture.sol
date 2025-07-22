// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";

contract ProducteurEnPhaseCulture {
    GestionnaireActeurs public gestionnaireActeurs;
    mapping(uint32 => StructLib.Parcelle) public parcelles;
    uint32 public compteurParcelles;
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
        parcelles[compteurParcelles].ipfs = _ipfs;
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