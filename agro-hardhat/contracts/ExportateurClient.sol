// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";
import "./CollecteurExportateur.sol";

contract ExportateurClient {
    mapping(uint32 => StructLib.Article) public articles;
    uint32 public compteurArticles;
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

    /**
    Les evenements
     */
    event AjoutArticle (address indexed exportateur, uint32 idArticle, uint32 quantite, uint32 prix);

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
    function ajoutArticle(
        uint32[] memory _idCommandeProduits,
        uint32 _prix,
        string memory _cid,
        string memory _hashMerkle
    ) public seulementExportateur {
        uint32[] memory _idLotProduits = new uint32[](
            _idCommandeProduits.length
        );
        uint32 _quantite = 0;
        for (uint i = 0; i < _idCommandeProduits.length; i++) {
            StructLib.CommandeProduit memory commande = collecteurExportateur
                .getCommande(_idCommandeProduits[i]);
            _idLotProduits[i] = commande.idLotProduit;
            _quantite += commande.quantite;
            require(commande.payer, "Commande non payer.");
            require(
                commande.exportateur == msg.sender,
                "Vous n'est pas proprietaire."
            );
        }

        compteurArticles++;
        articles[compteurArticles] = StructLib.Article(
            compteurArticles,
            genererNumeroReference(),
            _idLotProduits,
            _quantite,
            _prix,
            msg.sender,
            _cid,
            _hashMerkle
        );

        emit AjoutArticle(msg.sender, compteurArticles, _quantite, _prix);
    }

    // Fonction pour générer un numéro de référence alphanumérique unique pour les articles
    function genererNumeroReference() internal returns (string memory) {
        compteurArticles += 1;
        return
            string(
                abi.encodePacked(
                    "ART",
                    uint2str(block.timestamp),
                    uint2str(compteurArticles)
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
}
