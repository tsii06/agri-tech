// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";
import "./gestionnaireActeurs.sol";

contract CollecteurExportateur {
    // ------------------------- Attributs --------------------------------------------------------------
    mapping(uint32 => StructLib.Produit) public produits;
    mapping(uint32 => StructLib.LotProduit) public lotProduits;
    mapping(uint32 => StructLib.EnregistrementCondition) public conditions;
    mapping(uint32 => StructLib.Paiement) public paiements;
    // Pour stocker tous les commandes du contrat
    mapping (uint32 => StructLib.CommandeProduit) public commandes;
    uint32 public compteurCommandes;
    uint32 public compteurProduits;
    uint32 public compteurLotProduits;
    // limite le nombre d'appel a la fonction initialiser a 1
    bool private initialised;

    GestionnaireActeurs public gestionnaireActeurs;
    // ------------------------- Fin Attributs ----------------------------------------------------------

    event ProduitAjoute(uint32 indexed idProduit, uint32 quantite, uint32 idRecolte);
    event ProduitValide(uint32 indexed idProduit, bool valide);
    event PaiementEffectue(uint32 indexed idProduit, uint32 idPaiement, address payeur, uint32 montant, StructLib.ModePaiement mode);
    event ConditionEnregistree(uint32 indexed idProduit, string cid, uint timestamp);
    event StatutTransportMisAJour(uint32 indexed idProduit, StructLib.StatutTransport statut);
    // Evenement produit lorsqu une commande est passer
    event CommandePasser(address indexed exportateur, uint32 idProduit);
    event AjoutLotProduit(address indexed collecteur, uint32 idLotProduit, uint32 quantite, uint32 prix);
    event StatusCommandeMisAJour(uint32 indexed idCommande, StructLib.StatutProduit status);

    modifier seulementCollecteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Collecteur), "Non autorise: seulement Collecteur");
        _;
    }
    modifier seulementExportateur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Exportateur), "Non autorise: seulement Exportateur");
        _;
    }
    modifier seulementTransporteur() {
        require(gestionnaireActeurs.estActeurAvecRole(msg.sender, StructLib.Role.Transporteur), "Non autorise: seulement Transporteur");
        _;
    }

    function initialiser(address _gestionnaireActeurs) public {
        if (initialised) revert();
        gestionnaireActeurs = GestionnaireActeurs(_gestionnaireActeurs);
        initialised = true;
    }

    // ==================================== Produit =========================================================
    function ajouterProduit(uint32 _idCommandeRecolte, uint32 _idRecolte, uint32 _quantite, address _collecteur) public {
        compteurProduits++;

        produits[compteurProduits] = StructLib.Produit(compteurProduits, _idRecolte, _idCommandeRecolte, _quantite, _collecteur, false);

        emit ProduitAjoute(compteurProduits, _quantite, _idRecolte);
    }

    function ajouterLotProduit(uint32[] memory _idProduits, string memory _cid, uint32 _prix) public seulementCollecteur {
        uint32[] memory _idRecoltes = new uint32[](_idProduits.length);
        uint32[] memory _idCommandeRecoltes = new uint32[](_idProduits.length);
        uint32 _quantite = 0;
        for(uint32 i=0 ; i<_idProduits.length ; i++) {
            if (_idProduits[i] > compteurProduits) revert();
            StructLib.Produit memory produit = produits[_idProduits[i]];
            _idRecoltes[i] = produit.idRecolte;
            _idCommandeRecoltes[i] = produit.idCommandeRecolte;
            _quantite += produit.quantite;
            if (produit.collecteur != msg.sender) revert();
            if (produit.enregistre) revert();
        }
        compteurLotProduits++;

        // calcule du hashMerkle
        bytes32 hashMerkle = keccak256(abi.encodePacked(
            _cid,
            msg.sender,
            block.timestamp,
            _idRecoltes,
            _idCommandeRecoltes
        ));
        
        for(uint32 i=0 ; i<_idProduits.length ; i++) {
            produits[_idProduits[i]].enregistre = true;
        }
        lotProduits[compteurLotProduits] = StructLib.LotProduit(compteurLotProduits, _idRecoltes, _idCommandeRecoltes, _quantite, _prix, msg.sender, _cid, hashMerkle);

        emit AjoutLotProduit(msg.sender, compteurLotProduits, _quantite, _prix);
    }
    
    function setPriceProduit(uint32 _idLotProduit, uint32 _prix) public seulementCollecteur {
        if (_idLotProduit > compteurLotProduits) revert();
        if (lotProduits[_idLotProduit].collecteur != msg.sender) revert();
        lotProduits[_idLotProduit].prix = _prix;
    }

    // Modifie la fonction qui passe une commande
    function passerCommande(uint32 _idLotProduit, uint32 _quantite) public seulementExportateur {
        // la quantite ne doit pas etre superieur au quantite de produit enregistrer.
        if (_quantite > lotProduits[_idLotProduit].quantite) revert();

        uint32 _prix = _quantite * lotProduits[_idLotProduit].prix;
        // la quantite de produit doit etre diminuer.
        uint32 temp = lotProduits[_idLotProduit].quantite - _quantite;
        lotProduits[_idLotProduit].quantite = temp;

        compteurCommandes++;
        commandes[compteurCommandes] = StructLib.CommandeProduit(compteurCommandes, _idLotProduit, _quantite, _prix, false, StructLib.StatutTransport.EnCours, lotProduits[_idLotProduit].collecteur, msg.sender, StructLib.StatutProduit.EnAttente, false, false, address(0));

        // pour la gestion multirole
        if (lotProduits[_idLotProduit].collecteur == msg.sender) {
            // mettre la commande comme deja livrer
            commandes[compteurCommandes].statutTransport = StructLib.StatutTransport.Livre;
            // mettre la commande comme valide
            commandes[compteurCommandes].statutProduit = StructLib.StatutProduit.Valide;
            // mettre la commande comme deja payee
            commandes[compteurCommandes].payer = true;
        }

        emit CommandePasser(msg.sender, _idLotProduit);
    }
    function choisirTransporteurCommandeProduit(uint32 idCommande, address transporteur) public seulementExportateur {
        if (idCommande > compteurCommandes) revert();
        if (commandes[idCommande].exportateur != msg.sender) revert();
        commandes[idCommande].transporteur = transporteur;
    }

    function effectuerPaiement(uint32 _idCommande, uint32 _montant, StructLib.ModePaiement _mode) public payable seulementExportateur {
        StructLib.LotProduit memory _lotProduit = lotProduits[commandes[_idCommande].idLotProduit];
        if (_montant != commandes[_idCommande].prix) revert();
        if (commandes[_idCommande].payer) revert();
        if (commandes[_idCommande].statutProduit != StructLib.StatutProduit.Valide) revert();

        // definit la commande comme deja payee
        commandes[_idCommande].payer = true;

        // idcommande et idpaiement est la meme
        paiements[_idCommande] = StructLib.Paiement(_idCommande, msg.sender, commandes[_idCommande].collecteur, _montant, _mode, block.timestamp, "");
        emit PaiementEffectue(_lotProduit.id, _idCommande, msg.sender, _montant, _mode);
    }

    function enregistrerCondition(uint32 _idCommande, string memory _cid) public seulementTransporteur {
        if (_idCommande > compteurCommandes) revert();
        if (commandes[_idCommande].enregistrerCondition) revert();
        if (commandes[_idCommande].transporteur != msg.sender) revert();

        // calcule hashMerkle
        bytes32 hashMerkle = keccak256(abi.encodePacked(
            _idCommande,
            _cid,
            msg.sender,
            block.timestamp
        ));

        commandes[_idCommande].enregistrerCondition = true;
        conditions[_idCommande] = StructLib.EnregistrementCondition(_idCommande, _cid, block.timestamp, hashMerkle);
        emit ConditionEnregistree(_idCommande, _cid, block.timestamp);
    }

    function mettreAJourStatutTransport(uint32 _idCommande, StructLib.StatutTransport _statut) public seulementTransporteur {
        if (_idCommande > compteurCommandes) revert();
        if (commandes[_idCommande].transporteur != msg.sender) revert();
        
        commandes[_idCommande].statutTransport = _statut;
        emit StatutTransportMisAJour(_idCommande, _statut);
    }

    function mettreAJourStatutCommande(uint32 _idCommande, StructLib.StatutProduit _status) public seulementExportateur {
        if (commandes[_idCommande].statutTransport != StructLib.StatutTransport.Livre) revert();
        commandes[_idCommande].statutProduit = _status;
        emit StatusCommandeMisAJour(_idCommande, _status);
    }

    function enregistrerCommande(uint32 _idCommande, bool _enregistre) public {
        require(_idCommande <= compteurCommandes, "La commande n'existe pas.");
        commandes[_idCommande].enregistre = _enregistre;
    }

    // Pour enlever les erreurs eth_call
    fallback() external payable {}
    receive() external payable {}

    // ------------------------------------- Setter ----------------------------------------------------
    function setGestionnaireActeurs(address _addr) public {
        gestionnaireActeurs = GestionnaireActeurs(_addr);
    }
    // ------------------------------------- Fin Setter -------------------------------------------------

    // -------------------------------------- Getter ----------------------------------------------------

    function getProduit(uint32 id) public view returns(StructLib.Produit memory) {
        return produits[id];
    }
    function getLotProduit(uint32 id) public view returns(StructLib.LotProduit memory) {
        return lotProduits[id];
    }
    function getCondition(uint32 id) public view returns(StructLib.EnregistrementCondition memory) {
        return conditions[id];
    }
    function getPaiement(uint32 id) public view returns(StructLib.Paiement memory) {
        return paiements[id];
    }
    function getCommande(uint32 id) public view returns(StructLib.CommandeProduit memory) {
        return commandes[id];
    }

    function getCompteurCommande() public view returns(uint32) {
        return compteurCommandes;
    }
    function getCompteurProduit() public view returns(uint32) {
        return compteurProduits;
    }
    function getCompteurPaiement() public view returns(uint32) {
        return compteurCommandes;
    }
    function getCompteurCondition() public view returns(uint32) {
        return compteurCommandes;
    }
    // -------------------------------------- Fin Getter ------------------------------------------------
}