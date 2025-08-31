// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;



library StructLib {

	enum Role { 
        Producteur, // 0
        Fournisseur, // 1
        Certificateur, // 2
        Collecteur, // 3
        Auditeur, // 4
        Transporteur, // 5
        Exportateur, // 6
        Administration //7
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
        EnCours, // 0
        Livre // 1
    }
    enum StatutProduit { 
        EnAttente, // 0
        Valide, // 1
        Rejete // 2
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
        bytes32 hashMerkle;
    }

    struct Parcelle {
        uint32 id;
        address producteur;
        string cid; // CID IPFS pour les photos et détails complets
        bytes32 hashMerkle;
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
        bytes32 hashMerkle;
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
        bool enregistrerCondition;
        address transporteur;
    }

    struct Produit {
        uint32 id;
        uint32 idRecolte;
        uint32 idCommandeRecolte;
        uint32 quantite;
        address collecteur;
        bool enregistre;
    }

    struct LotProduit {
        uint32 id;
        uint32[] idRecolte;
        uint32[] idCommandeRecoltes; // pour retrouver les conditions de transports
        uint32 quantite;
        uint32 prix;
        address collecteur;
        string cid;
        bytes32 hashMerkle;
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
        bool enregistre;
        bool enregistrerCondition;
        address transporteur;
    }

    struct Article {
        uint32 id;
        string ref;
        uint32[] idLotProduit;
        uint32 quantite;
        uint32 prix;
        address exportateur;
        string cid;
        string hashMerkle;
    }
    
}