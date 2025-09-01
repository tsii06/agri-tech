// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";
import "./CollecteurExportateur.sol";

contract ExportateurClient {
    mapping(uint32 => StructLib.Article) public articles;
    mapping(string => uint32) private referenceToIdArticle; // Ajout d'un mapping pour associer les références des articles à leurs identifiants
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
    event AjoutArticle(
        address indexed exportateur,
        uint32 idArticle,
        uint32 quantite,
        uint32 prix
    );
    event CertifierArticle(
        address indexed certificateur,
        uint32 idArticle,
        bytes32 cidCertificat
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
    function ajoutArticle(
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

        compteurArticles++;

        // Pour ne plus utiliser les commandes deja enregistrer
        for (uint32 i = 0; i < _idCommandeProduits.length; i++) {
            collecteurExportateur.enregistrerCommande(
                _idCommandeProduits[i],
                true,
                msg.sender
            );
        }

        string memory ref = genererNumeroReference();
        articles[compteurArticles] = StructLib.Article(
            compteurArticles,
            ref,
            _idCommandeProduits,
            _quantite,
            _prix,
            msg.sender,
            _cid,
            _rootMerkle,
            false,
            bytes32(0)
        );

        // Mise à jour du mapping
        referenceToIdArticle[ref] = compteurArticles;

        emit AjoutArticle(msg.sender, compteurArticles, _quantite, _prix);
    }

    function certifierArticle(
        uint32 _idArticle,
        bytes32 _cidCertificat
    ) public seulementCertificateur {
        if (_idArticle > compteurArticles) revert();
        if (articles[_idArticle].certifier) revert();

        articles[_idArticle].certifier = true;
        articles[_idArticle].cidCertificat = _cidCertificat;

        emit CertifierArticle(msg.sender, _idArticle, _cidCertificat);
    }

    // Met à jour le prix d'un article
    function setPriceArticle(
        uint32 _idArticle,
        uint32 _prix
    ) public seulementExportateur seulementActeurAutorise {
        require(_idArticle <= compteurArticles, "Id incorrect");
        require(
            articles[_idArticle].exportateur == msg.sender,
            "Vous n'etes pas proprietaire de cette article"
        );
        articles[_idArticle].prix = _prix;
    }

    // Fonction pour générer un numéro de référence alphanumérique unique pour les articles
    function genererNumeroReference() internal view returns (string memory) {
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

    // ------------------------------------- Setter ----------------------------------------------------
    function setGestionnaireActeurs(address _addr) public {
        gestionnaireActeurs = GestionnaireActeurs(_addr);
    }
    function setCollecteurExportateur(address payable _addr) public {
        collecteurExportateur = CollecteurExportateur(_addr);
    }
    // -------------------------------------- Getter ----------------------------------------------------
    function getArticle(
        uint32 id
    ) public view returns (StructLib.Article memory) {
        return articles[id];
    }
    function getArticleByReference(
        string memory _reference
    ) public view returns (StructLib.Article memory) {
        uint32 idArticle = referenceToIdArticle[_reference];
        require(idArticle != 0, "Reference invalide ou article inexistant.");
        return articles[idArticle];
    }
    function getCompteurArticles() public view returns (uint32) {
        return compteurArticles;
    }
}
