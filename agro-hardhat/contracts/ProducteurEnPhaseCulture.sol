// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";





contract ProducteurEnPhaseCulture {

    mapping(address => StructLib.Acteur) public acteurs;
    mapping(uint32 => StructLib.Paiement) public paiements;
    uint32 public compteurPaiements;

    IRecolte private moduleRecolte;
    IParcelle private moduleParcelle;

    // ======================================== modificateur ==================================================
    modifier seulementProducteur() {
        require(acteurs[msg.sender].role == StructLib.Role.Producteur, "Non autorise: seulement Producteur");
        _;
    }
    modifier seulementFournisseur() {
        require(acteurs[msg.sender].role == StructLib.Role.Fournisseur, "Non autorise: seulement Fournisseur");
        _;
    }
    modifier seulementCertificateur() {
        require(acteurs[msg.sender].role == StructLib.Role.Certificateur, "Non autorise: seulement Certificateur");
        _;
    }
    modifier seulementCollecteur() {
        require(acteurs[msg.sender].role == StructLib.Role.Collecteur, "Non autorise: seulement Collecteur");
        _;
    }
    modifier seulementAuditeur() {
        require(acteurs[msg.sender].role == StructLib.Role.Auditeur, "Non autorise: seulement Auditeur");
        _;
    }
    modifier seulementTransporteur() {
        require(acteurs[msg.sender].role == StructLib.Role.Transporteur, "Non autorise: seulement Transporteur");
        _;
    }








    // ======================================== constructor ==================================================
    constructor(address _recolte, address _parcelle) {
        moduleRecolte = IRecolte(_recolte);
        moduleParcelle = IParcelle(_parcelle);
    }




    /*
    setter pour les interfaces recolte et parcelle
    pour donner les address des interfaces depuis le contrat proxy de Producteur
    */
    function setAddrRecolte(address _addr) public {
        moduleRecolte = IRecolte(_addr);
    }
    function setAddrParcelle(address _addr) public {
        moduleParcelle = IParcelle(_addr);
    }











    function enregistrerActeur(address _acteur, StructLib.Role _role) public {
        acteurs[_acteur] = StructLib.Acteur(_acteur, _role);
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

        moduleParcelle.creerParcelle(_qualiteSemence, _methodeCulture, _latitude, _longitude, _dateRecolte, _certificatPhytosanitaire);
        
    }


    // Pour recuperer les tableaux dynamiques de parcelle
    function getPhotos(uint32 idParcelle) public view returns (string[] memory) {
        return moduleParcelle.getPhotos(idParcelle);
    }
    function getIntrants(uint32 idParcelle) public view returns (StructLib.Intrant[] memory) {
        return moduleParcelle.getIntrants(idParcelle);
    }
    function getInspections(uint32 idParcelle) public view returns (StructLib.Inspection[] memory) {
        return moduleParcelle.getInspections(idParcelle);
    }
    function getConditions(uint32 idParcelle) public view returns (StructLib.EnregistrementCondition[] memory) {
        return moduleParcelle.getConditions(idParcelle);
    }



    function mettreAJourEtape(uint32 _idParcelle, StructLib.Etape _etape) public seulementProducteur {
        moduleParcelle.mettreAJourEtape(_idParcelle, _etape);
    }
    function appliquerControlePhytosanitaire(uint32 _idParcelle, bool _passe) public seulementCertificateur {

        moduleParcelle.appliquerControlePhytosanitaire(_idParcelle, _passe);
    }

    function ajouterPhoto(uint32 _idParcelle, string memory _urlPhoto) public seulementProducteur {

        moduleParcelle.ajouterPhoto(_idParcelle, _urlPhoto);
    }

    function ajouterIntrant(uint32 _idParcelle, string memory _nom, uint32 _quantite) public seulementFournisseur {
        
        moduleParcelle.ajouterIntrant(_idParcelle, _nom, _quantite);
    }

    function validerIntrant(uint32 _idParcelle, string memory _nom, bool _valide) public seulementCertificateur {
        
        moduleParcelle.validerIntrant(_idParcelle, _nom, _valide);
    }

    function ajouterInspection(uint32 _idParcelle, string memory _rapport) public seulementAuditeur {

        moduleParcelle.ajouterInspection(_idParcelle, _rapport);
    }

    function obtenirInformationsParcelle(uint32 _idParcelle) public view returns (
        string memory qualiteSemence,
        string memory methodeCulture,
        string memory latitude,
        string memory longitude,
        string memory dateRecolte,
        string memory certificatPhytosanitaire
    ) {

        return moduleParcelle.obtenirInformationsParcelle(_idParcelle);
    }

    // ====================================== Recolte =========================================================
    function ajoutRecolte(uint32 _idParcelle, uint32 _quantite, uint32 _prix, string memory _dateRecolte) public seulementProducteur {

        moduleRecolte.ajoutRecolte(_idParcelle, _quantite, _prix, _dateRecolte);
    }
    function certifieRecolte(uint32 _idRecolte, string memory _certificat) public seulementCertificateur {

        moduleRecolte.certifieRecolte(_idRecolte, _certificat);
    }

    // ====================================== Commande =========================================================
    function passerCommandeVersProducteur(uint32 _idRecolte, uint32 _quantite) public seulementCollecteur {

        moduleRecolte.passerCommandeVersProducteur(_idRecolte, _quantite);
    }

    // function enregistrerCondition(uint32 _idParcelle, string memory _temperature, string memory _humidite) public seulementTransporteur {
    //     compteurConditions++;
    //     parcelles[_idParcelle].conditions.push(StructLib.EnregistrementCondition(compteurConditions, _temperature, _humidite, block.timestamp));
    // }


    // function effectuerPaiementVersProducteur(uint32 _idParcelle, uint32 _montant, StructLib.ModePaiement _mode) public payable seulementCollecteur {
    //     compteurPaiements++;
    //     paiements[_idParcelle] = StructLib.Paiement(compteurPaiements, msg.sender, _montant, _mode, block.timestamp);
    // }


    // corrige l'erreur eth_call
    receive() external payable {}
    fallback() external payable {}

    // ====================================== getter ==========================================================
    function getActeur(address addr) public view returns(StructLib.Acteur memory) {
        return acteurs[addr];
    }


    // pour les parcelles
    function getParcelle(uint32 id) public view returns(StructLib.Parcelle memory) {
        return moduleParcelle.getParcelle(id);
    }
    function getCompteurParcelle() public view returns(uint32) {
        return moduleParcelle.getCompteurParcelle();
    }
    function getCompteurInspection() public view returns(uint32) {
        return moduleParcelle.getCompteurInspection();
    }


    // pour les recoltes
    function getRecolte(uint32 _idRecolte) public view returns (StructLib.Recolte memory) {
        return moduleRecolte.getRecolte(_idRecolte);
    }
    function getCompteurRecoltes() public view returns (uint32) {
        return moduleRecolte.getCompteurRecoltes();


    // pour les commandes
    }
    function getCommande(uint32 _idRecolte) public view returns (StructLib.Commande memory) {
        return moduleRecolte.getCommande(_idRecolte);
    }
    function getCompteurCommandes() public view returns (uint32) {
        return moduleRecolte.getCompteurCommandes();
    }



    function getPaiement(uint32 id) public view returns(StructLib.Paiement memory) {
        return paiements[id];
    }
    // function getCompteurCondition() public view returns(uint32) {
    //     return compteurConditions;
    // }
    function getCompteurPaiement() public view returns(uint32) {
        return compteurPaiements;
    }
}




interface IRecolte {

    function ajoutRecolte(uint32 _idParcelle, uint32 _quantite, uint32 _prix, string memory _dateRecolte) external;
    function certifieRecolte(uint32 _idRecolte, string memory _certificat) external;
    function getRecolte(uint32 _idRecolte) external view returns (StructLib.Recolte memory);
    function getCompteurRecoltes() external view returns (uint32);
    function passerCommandeVersProducteur(uint32 _idRecolte, uint32 _quantite) external;
    function getCommande(uint32 _id) external view returns (StructLib.Commande memory);
    function getCompteurCommandes() external view returns (uint32);
}



interface IParcelle {

    function creerParcelle(
        string memory _qualiteSemence,
        string memory _methodeCulture,
        string memory _latitude,
        string memory _longitude,
        string memory _dateRecolte,
        string memory _certificatPhytosanitaire
        ) external;
    function obtenirInformationsParcelle(uint32 _idParcelle) external view returns (
        string memory qualiteSemence,
        string memory methodeCulture,
        string memory latitude,
        string memory longitude,
        string memory dateRecolte,
        string memory certificatPhytosanitaire
        );
    function appliquerControlePhytosanitaire(uint32 _idParcelle, bool _passe) external;
    function validerIntrant(uint32 _idParcelle, string memory _nom, bool _valide) external;
    function getPhotos(uint32 idParcelle) external view returns (string[] memory); 
    function getIntrants(uint32 idParcelle) external view returns (StructLib.Intrant[] memory);
    function getInspections(uint32 idParcelle) external view returns (StructLib.Inspection[] memory);
    function getConditions(uint32 idParcelle) external view returns (StructLib.EnregistrementCondition[] memory);
    function mettreAJourEtape(uint32 _idParcelle, StructLib.Etape _etape) external;
    function ajouterPhoto(uint32 _idParcelle, string memory _urlPhoto) external;
    function ajouterIntrant(uint32 _idParcelle, string memory _nom, uint32 _quantite) external;
    function ajouterInspection(uint32 _idParcelle, string memory _rapport) external;
    function getParcelle(uint32 id) external view returns(StructLib.Parcelle memory);
    function getCompteurParcelle() external view returns(uint32);
    function getCompteurInspection() external view returns(uint32);
}