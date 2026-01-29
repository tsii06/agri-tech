// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";
import "./CollecteurExportateur.sol";

contract ExportateurClient {
    mapping(uint32 => StructLib.Expedition) public expeditions;
    mapping(string => uint32) private referenceToIdExpedition; // Ajout d'un mapping pour associer les références des expeditions à leurs identifiants
    uint32 public compteurExpeditions;
    // limite le nombre d'appel a la fonction initialiser a 1
    bool private initialised;
    GestionnaireActeurs public gestionnaireActeurs;
    CollecteurExportateur public collecteurExportateur;

    /* Modificateurs d'accès */
    modifier seulementCollecteur() {
        require(
            gestionnaireActeurs.estActeurAvecRole(
                msg.sender,
                StructLib.Role.Collecteur
            ),
            "Non autorise: seulement Collecteur"
        );
        _;
    }
    modifier seulementExportateur() {
        require(
            gestionnaireActeurs.estActeurAvecRole(
                msg.sender,
                StructLib.Role.Exportateur
            ),
            "Non autorise: seulement Exportateur"
        );
        _;
    }
    modifier seulementTransporteur() {
        require(
            gestionnaireActeurs.estActeurAvecRole(
                msg.sender,
                StructLib.Role.Transporteur
            ),
            "Non autorise: seulement Transporteur"
        );
        _;
    }
    modifier seulementActeurAutorise() {
        require(
            gestionnaireActeurs.aContratDelegue(msg.sender, address(this)),
            "Non autorise: contrat non delegue"
        );
        _;
    }
    modifier seulementCertificateur() {
        require(
            gestionnaireActeurs.estActeurAvecRole(
                msg.sender,
                StructLib.Role.Certificateur
            ),
            "Non autorise: seulement Certificateur"
        );
        _;
    }

    /**
    Les evenements
     */
    event AjouterExpedition(
        address indexed exportateur,
        uint32 idArticle,
        uint32 quantite,
        uint32 prix,
        bytes32 indexed rootMerkle,
        string ref
    );
    event CertifierExpedition(
        address indexed certificateur,
        uint32 idArticle,
        string cidCertificat
    );

    /* Fonction d'initialisation */
    function initialiser(
        address _gestionnaireActeurs,
        address payable _collecteurExportateur
    ) public {
        require(!initialised, "Contrat deja initialiser !");
        gestionnaireActeurs = GestionnaireActeurs(_gestionnaireActeurs);
        collecteurExportateur = CollecteurExportateur(_collecteurExportateur);
        initialised = true;
    }

    // ==================================== Articles =========================================================
    /**
     * Ajoute un article à la commande
     */
    function ajouterExpedition(
        uint32[] memory _idCommandeProduits,
        uint32 _prix,
        string memory _cid,
        bytes32 _rootMerkle
    ) public seulementExportateur seulementActeurAutorise {
        uint32 _quantite = 0;
        for (uint i = 0; i < _idCommandeProduits.length; i++) {
            StructLib.CommandeProduit memory commande = collecteurExportateur
                .getCommande(_idCommandeProduits[i]);
            _quantite += commande.quantite;
            require(commande.payer, "Commande non payer.");
            require(
                commande.exportateur == msg.sender,
                "Vous n'est pas proprietaire."
            );
            require(!commande.enregistre, "commande deja enregistrer.");
        }

        compteurExpeditions++;

        // Pour ne plus utiliser les commandes deja enregistrer
        for (uint32 i = 0; i < _idCommandeProduits.length; i++) {
            collecteurExportateur.enregistrerCommande(
                _idCommandeProduits[i],
                true
            );
        }

        string memory ref = genererNumeroReference();
        expeditions[compteurExpeditions] = StructLib.Expedition(
            compteurExpeditions,
            ref,
            _idCommandeProduits,
            _quantite,
            _prix,
            msg.sender,
            _cid,
            _rootMerkle,
            false,
            ""
        );

        // Mise à jour du mapping
        referenceToIdExpedition[ref] = compteurExpeditions;

        emit AjouterExpedition(msg.sender, compteurExpeditions, _quantite, _prix, _rootMerkle, ref);
    }

    function certifierExpedition(
        uint32 _idExpedition,
        string memory _cidCertificat
    ) public seulementCertificateur {
        if (_idExpedition > compteurExpeditions) revert();
        if (expeditions[_idExpedition].certifier) revert();

        expeditions[_idExpedition].certifier = true;
        expeditions[_idExpedition].cidCertificat = _cidCertificat;

        emit CertifierExpedition(msg.sender, _idExpedition, _cidCertificat);
    }

    // Met à jour le prix d'un article
    function setPriceArticle(
        uint32 _idExpedition,
        uint32 _prix
    ) public seulementExportateur seulementActeurAutorise {
        require(_idExpedition <= compteurExpeditions, "Id incorrect");
        require(
            expeditions[_idExpedition].exportateur == msg.sender,
            "Vous n'etes pas proprietaire de cette article"
        );
        expeditions[_idExpedition].prix = _prix;
    }

    // Fonction pour générer un numéro de référence alphanumérique unique pour les articles
    function genererNumeroReference() internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "EXP-",
                    uint2str(block.timestamp),
                    uint2str(compteurExpeditions)
                )
            );
    }

    // Fonction utilitaire pour convertir uint en string
    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - (_i / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // Pour enlever les erreurs eth_call
    fallback() external payable {}
    receive() external payable {}

    // ------------------------------------- Setter ----------------------------------------------------
    function setGestionnaireActeurs(address _addr) public {
        gestionnaireActeurs = GestionnaireActeurs(_addr);
    }
    function setCollecteurExportateur(address payable _addr) public {
        collecteurExportateur = CollecteurExportateur(_addr);
    }
    // -------------------------------------- Getter ----------------------------------------------------
    function getExpedition(
        uint32 id
    ) public view returns (StructLib.Expedition memory) {
        return expeditions[id];
    }
    function getExpeditionByReference(
        string memory _reference
    ) public view returns (StructLib.Expedition memory) {
        uint32 idExpedition = referenceToIdExpedition[_reference];
        require(idExpedition != 0, "Reference invalide ou article inexistant.");
        return expeditions[idExpedition];
    }
    function getCompteurArticles() public view returns (uint32) {
        return compteurExpeditions;
    }
}
