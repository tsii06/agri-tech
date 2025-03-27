// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";




contract RecolteContrat {

    // ================================ variable d'etat ==============================================
    mapping(uint32 => StructLib.Recolte) public recoltes;
    uint32 public compteurRecoltes;
    // pour les commandes
    mapping(uint32 => StructLib.Paiement) public paiements;
    uint32 public compteurPaiements;
    mapping(uint32 => StructLib.Commande) public commandes;
    uint32 public compteurCommandes;

    IParcelle private moduleParcelle;






    // ================================== constructor =================================================
    constructor(address _parcelle) {
        moduleParcelle = IParcelle(_parcelle);
    }








    /*
    ici les fonctions pour les recoltes
    */
    function ajoutRecolte(uint32 _idParcelle, uint32 _quantite, uint32 _prix, string memory _dateRecolte, address _sender) public {

        StructLib.Parcelle memory parcelle = moduleParcelle.getParcelle(_idParcelle);
        require(_idParcelle <= moduleParcelle.getCompteurParcelle(), "Parcelle non existant");
        require(parcelle.producteur == _sender, "Vous n'etes pas proprietaire de ce parcellle");

        compteurRecoltes++;
        recoltes[compteurRecoltes] = StructLib.Recolte(compteurRecoltes, _idParcelle, _quantite, _prix, false, "", _dateRecolte, _sender);
    }
    function certifieRecolte(uint32 _idRecolte, string memory _certificat) public {

        require(_idRecolte <= compteurRecoltes, "Recolte non existant");
        require(bytes(_certificat).length != 0, "Certificat vide");

        recoltes[_idRecolte].certifie = true;
        recoltes[_idRecolte].certificatPhytosanitaire = _certificat;
    }









    /*
    ici les fonctions pour les commandes
    */
    function passerCommandeVersProducteur(uint32 _idRecolte, uint32 _quantite, address _sender) public {

        StructLib.Recolte memory recolte = recoltes[_idRecolte];
        require(recolte.certifie, "Recolte non certifie");
        require(_idRecolte <= compteurRecoltes, "Recolte non existant");
        require(_quantite <= recolte.quantite, "Quantite trop grand par rapport au quantite disponible");

        // diminuer la quantite disponible dans la recolte.
        recoltes[_idRecolte].quantite -= _quantite;

        compteurCommandes++;
        uint32 _prix = recolte.prix * _quantite;
        commandes[compteurCommandes] = StructLib.Commande(compteurCommandes, _idRecolte, _quantite, _prix, false, StructLib.StatutTransport.EnCours, recolte.producteur, _sender);
    }










    // ====================================== getter et setter =============================================
    /*
    ici les getters pour les recoltes
    */
    function getRecolte(uint32 _idRecolte) public view returns (StructLib.Recolte memory) {
        return recoltes[_idRecolte];
    }
    function getCompteurRecoltes() public view returns (uint32) {
        return compteurRecoltes;



    /*
    ici les getters pour les commandes
    */
    }
    function getCommande(uint32 _id) public view returns (StructLib.Commande memory) {
        return commandes[_id];
    }
    function getCompteurCommandes() public view returns (uint32) {
        return compteurCommandes;
    }


}



interface IParcelle {

    function getCompteurParcelle() external view returns(uint32);
    function getParcelle(uint32 id) external view returns(StructLib.Parcelle memory);
}