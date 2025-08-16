// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



library StructLib {

	enum Role { 
        Producteur, 
        Fournisseur, 
        Certificateur, 
        Collecteur, 
        Auditeur, 
        Transporteur, 
        Exportateur, 
        Administration 
    }
    enum Etape { PreCulture, 
        Culture, 
        Recolte, 
        Transport 
    }
    enum ModePaiement { 
        VirementBancaire, 
        Cash, 
        MobileMoney
    }
    enum StatutTransport { 
        EnCours, 
        Livre 
    }
    enum StatutProduit { 
        EnAttente, 
        Valide, 
        Rejete 
    }



    struct Intrant {
        string nom;
        uint32 quantite;
        bool valide;
        uint32 id;
        string categorie;
        address fournisseur;
        string certificatPhytosanitaire;
        string cid; // CID IPFS pour les détails complets
        string hashMerkle;
    }

    struct Inspection {
        uint32 id;
        address auditeur;
        string cid; // CID IPFS pour le rapport complet
        uint timestamp;
        string hashMerkle;
    }

    struct EnregistrementCondition {
        uint32 id;
        string cid; // CID IPFS pour les conditions détaillées
        uint timestamp;
        string hashMerkle;
    }

    struct Parcelle {
        uint32 id;
        address producteur;
        string cid; // CID IPFS pour les photos et détails complets
        string hashMerkle;
        // Suppression des arrays lourds (photos, intrants, inspections) - maintenant dans IPFS
    }

    struct Paiement {
        uint32 id;
        address payeur;
        address vendeur;
        uint32 montant;
        ModePaiement mode;
        uint timestamp;
        string hashMerkle;
    }

    struct Recolte {
        uint32 id;
        uint32[] idParcelle;
        uint32 quantite;
        uint32 prixUnit;
        bool certifie;
        string certificatPhytosanitaire;
        address producteur;
        string hashMerkle;
        string cid;
    }

    struct CommandeRecolte {
        uint32 id;
        uint32 idRecolte;
        uint32 quantite;
        uint32 prix;
        bool payer;
        StatutTransport statutTransport;
        address producteur;
        address collecteur;
        StatutProduit statutRecolte;
        string hashMerkle;
    }

    struct Produit {
        uint32 id;
        uint32 idRecolte;
        uint32 quantite;
        address collecteur;
        bool enregistre;
        string hashMerkle;
    }

    struct LotProduit {
        uint32 id;
        uint32[] idRecolte;
        uint32 quantite;
        uint32 prix;
        address collecteur;
        string cid;
        string hashMerkle;
    }

    struct CommandeProduit {
        uint32 id;
        uint32 idLotProduit;
        uint32 quantite;
        uint32 prix;
        bool payer;
        StatutTransport statutTransport;
        address collecteur;
        address exportateur;
        StatutProduit statutProduit;
        string hashMerkle;
    }
    
}