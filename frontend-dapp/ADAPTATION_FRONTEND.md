# Adaptation du Frontend aux Nouvelles Structures - Agri-Tech

## Résumé des Modifications

Ce document décrit les adaptations apportées au frontend pour utiliser les nouvelles structures de contrats avec IPFS et hash Merkle.

## 1. Nouveaux Utilitaires Créés

### `ipfsUtils.js` - Gestion IPFS
- **`uploadToIPFS(file, metadata)`** - Upload générique sur IPFS
- **`uploadPhotoParcelle(file, parcelleId)`** - Upload de photos de parcelle
- **`uploadIntrant(file, intrantData)`** - Upload d'intrants
- **`uploadInspection(file, inspectionData)`** - Upload d'inspections
- **`uploadConditionTransport(file, conditionData)`** - Upload de conditions de transport
- **`uploadCertificatPhytosanitaire(file, certificatData)`** - Upload de certificats
- **`getIPFSURL(cid, gateway)`** - Génération d'URL IPFS
- **`deleteFromIPFS(fileId)`** - Suppression de fichiers IPFS
- **`uploadConsolidatedData(data, type)`** - Upload de données consolidées

### `merkleUtils.js` - Gestion des Hash Merkle
- **`calculateMerkleRoot(data)`** - Calcul du hash Merkle racine
- **`calculateParcelleMerkleHash(parcelle, photos, intrants, inspections)`** - Hash Merkle de parcelle
- **`calculateRecolteMerkleHash(recolte, parcelles)`** - Hash Merkle de récolte
- **`calculateLotProduitMerkleHash(lotProduit, recoltes)`** - Hash Merkle de lot de produits
- **`calculateCommandeMerkleHash(commande, produit)`** - Hash Merkle de commande
- **`calculatePaiementMerkleHash(paiement)`** - Hash Merkle de paiement
- **`calculateConditionMerkleHash(condition)`** - Hash Merkle de condition de transport
- **`verifyTraceabilityChain(chain)`** - Vérification de l'intégrité de la chaîne

## 2. Composants Adaptés

### `CreerParcelle.jsx` ✅
**Modifications principales :**
- Utilisation de `uploadCertificatPhytosanitaire()` pour les certificats
- Création d'objets consolidés pour IPFS
- Calcul automatique du hash Merkle initial
- Appel de `creerParcelle(cid)` au lieu des paramètres individuels
- Mise à jour du hash Merkle après création

**Nouveau workflow :**
1. Upload du certificat sur IPFS
2. Création de l'objet parcelle consolidé
3. Upload des données consolidées sur IPFS
4. Création de la parcelle avec le CID
5. Calcul et mise à jour du hash Merkle

### `PhotosParcelle.jsx` ✅
**Modifications principales :**
- Remplacement de `ajouterPhoto()` par `mettreAJourPhotosParcelle()`
- Gestion des photos via CID IPFS consolidé
- Mise à jour automatique du hash Merkle
- Affichage des photos existantes depuis IPFS

**Nouveau workflow :**
1. Upload de la nouvelle photo sur IPFS
2. Récupération des photos existantes depuis le CID de la parcelle
3. Consolidation de toutes les photos
4. Upload des données consolidées
5. Mise à jour du CID de la parcelle
6. Calcul et mise à jour du hash Merkle

### `IntrantsParcelle.jsx` ✅
**Modifications principales :**
- Remplacement de `ajouterIntrant()` par `mettreAJourIntrantsParcelle()`
- Gestion des intrants via CID IPFS consolidé
- Validation des intrants avec certificats IPFS
- Mise à jour automatique du hash Merkle

**Nouveau workflow :**
1. Création de l'objet intrant
2. Upload des données consolidées d'intrants sur IPFS
3. Mise à jour du CID de la parcelle
4. Calcul et mise à jour du hash Merkle
5. Validation avec upload de certificats

### `ListeParcelle.jsx` ✅
**Modifications principales :**
- Chargement des données IPFS consolidées pour chaque parcelle
- Fusion des données blockchain avec les données IPFS
- Affichage des statistiques (photos, intrants, inspections)
- Gestion des erreurs IPFS avec fallback

**Nouveau workflow :**
1. Récupération des parcelles depuis la blockchain
2. Chargement des données IPFS consolidées pour chaque parcelle
3. Fusion des données pour affichage complet
4. Gestion des cas où IPFS n'est pas disponible

### `ParcelleCard.jsx` ✅
**Modifications principales :**
- Affichage des nouvelles structures de données
- Badges de statut IPFS et Merkle
- Statistiques des composants de la parcelle
- Liens vers les données IPFS consolidées

**Nouvelles fonctionnalités :**
- Badge de statut (IPFS + Merkle, IPFS uniquement, Données non consolidées)
- Affichage des CID IPFS et hash Merkle
- Statistiques des photos, intrants et inspections
- Lien direct vers les données IPFS

### `FaireRecolte.jsx` ✅
**Modifications principales :**
- Création d'objets récolte consolidés pour IPFS
- Upload des données consolidées sur IPFS
- Calcul automatique du hash Merkle de la récolte
- Intégration avec la traçabilité des parcelles

**Nouveau workflow :**
1. Création de l'objet récolte consolidé
2. Upload des données consolidées sur IPFS
3. Création de la récolte avec le CID
4. Calcul et mise à jour du hash Merkle
5. Liaison avec le hash Merkle de la parcelle

### `InspectionsParcelle.jsx` ✅ **NOUVEAU**
**Fonctionnalités :**
- Gestion complète des inspections de parcelle
- Upload des rapports d'inspection sur IPFS
- Consolidation des inspections avec la parcelle
- Mise à jour automatique du hash Merkle

**Workflow :**
1. Création de l'objet inspection
2. Upload sur IPFS avec métadonnées
3. Consolidation avec inspections existantes
4. Mise à jour du CID de la parcelle
5. Calcul et mise à jour du hash Merkle

### `ListeRecolte.jsx` ✅
**Modifications principales :**
- Chargement des données IPFS consolidées pour chaque récolte
- Fusion des données blockchain avec les données IPFS
- Affichage des informations IPFS et Merkle
- Certification avec upload automatique sur IPFS

**Nouveau workflow :**
1. Récupération des récoltes depuis la blockchain
2. Chargement des données IPFS consolidées
3. Fusion des données pour affichage complet
4. Certification avec upload IPFS et mise à jour Merkle

### `AcheterRecolte.jsx` ✅
**Modifications principales :**
- Affichage des données IPFS consolidées des récoltes
- Chargement des détails de la parcelle associée
- Affichage de la traçabilité complète
- Liens vers les données IPFS

**Nouvelles fonctionnalités :**
- Badges de statut IPFS et Merkle
- Détails de la parcelle associée avec données IPFS
- Informations de traçabilité complète
- Liens directs vers les données IPFS

### `ConditionsTransport.jsx` ✅ **NOUVEAU**
**Fonctionnalités :**
- Gestion complète des conditions de transport
- Upload des conditions sur IPFS
- Consolidation des conditions avec la commande
- Enregistrement sur la blockchain avec CID

**Workflow :**
1. Création de l'objet condition de transport
2. Upload sur IPFS avec métadonnées
3. Consolidation avec conditions existantes
4. Upload des données consolidées
5. Enregistrement sur la blockchain

### `CommandeCollecteur.jsx` ✅
**Modifications principales :**
- Chargement des données IPFS consolidées pour chaque commande
- Fusion des données blockchain avec les données IPFS
- Affichage des informations IPFS et Merkle
- Gestion des commandes avec traçabilité complète

**Nouveau workflow :**
1. Récupération des commandes depuis la blockchain
2. Chargement des données IPFS consolidées
3. Fusion des données pour affichage complet
4. Gestion des actions avec traçabilité IPFS

### `LivraisonRecolte.jsx` ✅
**Modifications principales :**
- Chargement des données IPFS consolidées pour les commandes
- Affichage des informations IPFS et Merkle
- Gestion des livraisons avec conditions IPFS
- Traçabilité complète du transport

**Nouveau workflow :**
1. Récupération des commandes depuis la blockchain
2. Chargement des données IPFS consolidées
3. Gestion des livraisons avec traçabilité
4. Enregistrement des conditions de transport

### `ExpeditionProduits.jsx` ✅ **NOUVEAU**
**Fonctionnalités :**
- Gestion complète des expéditions de produits
- Enregistrement des expéditions avec traçabilité
- Gestion des documents d'expédition
- Intégration avec les données IPFS des produits

**Workflow :**
1. Chargement des détails de la commande et du produit
2. Création de l'objet expédition
3. Enregistrement sur la blockchain
4. Traçabilité complète avec IPFS

## 3. Utilisation des Nouvelles Fonctions

### Création d'une Parcelle
```javascript
// 1. Upload du certificat
const certificatUpload = await uploadCertificatPhytosanitaire(certificat, certificatData);

// 2. Création de l'objet consolidé
const parcelleConsolidee = {
  qualiteSemence: formData.qualiteSemence,
  methodeCulture: formData.methodeCulture,
  dateRecolte: formData.dateRecolte,
  location: { lat: location.lat, lng: location.lng },
  certificat: certificatUpload.cid,
  photos: [],
  intrants: [],
  inspections: [],
  timestamp: Date.now()
};

// 3. Upload des données consolidées
const parcelleUpload = await uploadConsolidatedData(parcelleConsolidee, "parcelle");

// 4. Création de la parcelle
const tx = await contract.creerParcelle(parcelleUpload.cid);

// 5. Calcul et mise à jour du hash Merkle
const hashMerkle = calculateParcelleMerkleHash(parcelle, photos, intrants, inspections);
await contract.ajoutHashMerkleParcelle(id, hashMerkle);
```

### Ajout de Photos
```javascript
// 1. Upload de la photo
const photoUpload = await uploadPhotoParcelle(file, parcelleId);

// 2. Consolidation avec photos existantes
const photosConsolidees = {
  type: 'photos-parcelle',
  parcelleId: parcelleId,
  photos: [...photosExistantes, nouvellePhoto],
  timestamp: Date.now()
};

// 3. Upload des données consolidées
const photosUpload = await uploadConsolidatedData(photosConsolidees, "photos-parcelle");

// 4. Mise à jour de la parcelle
await contract.mettreAJourPhotosParcelle(parcelleId, photosUpload.cid);

// 5. Mise à jour du hash Merkle
const hashMerkle = calculateParcelleMerkleHash(parcelle, nouvellesPhotos, intrants, inspections);
await contract.ajoutHashMerkleParcelle(parcelleId, hashMerkle);
```

### Gestion des Intrants
```javascript
// 1. Création de l'intrant
const intrantData = {
  nom: formData.nom,
  quantite: parseInt(formData.quantite),
  categorie: formData.categorie,
  fournisseur: account,
  timestamp: Date.now()
};

// 2. Consolidation avec intrants existants
const intrantsConsolides = {
  type: 'intrants-parcelle',
  parcelleId: id,
  intrants: [...intrantsExistants, nouvelIntrant],
  timestamp: Date.now()
};

// 3. Upload des données consolidées
const intrantsUpload = await uploadConsolidatedData(intrantsConsolides, "intrants-parcelle");

// 4. Mise à jour de la parcelle
await contract.mettreAJourIntrantsParcelle(id, intrantsUpload.cid);

// 5. Mise à jour du hash Merkle
const hashMerkle = calculateParcelleMerkleHash(parcelle, photos, nouveauxIntrants, inspections);
await contract.ajoutHashMerkleParcelle(id, hashMerkle);
```

### Création d'une Récolte
```javascript
// 1. Création de l'objet récolte consolidé
const recolteConsolidee = {
  type: 'recolte',
  parcelleId: parseInt(id),
  nomProduit: recolteData.nomProduit,
  quantite: parseInt(recolteData.quantite),
  prix: parseInt(recolteData.prix),
  dateRecolte: recolteData.dateRecolte,
  producteur: account,
  parcelleHashMerkle: parcelle?.hashMerkle || "",
  timestamp: Date.now(),
  version: "1.0"
};

// 2. Upload des données consolidées
const recolteUpload = await uploadConsolidatedData(recolteConsolidee, "recolte");

// 3. Création de la récolte avec le CID
const tx = await contract.ajoutRecolte(
  parseInt(id),
  parseInt(recolteData.quantite),
  parseInt(recolteData.prix),
  recolteData.dateRecolte,
  recolteData.nomProduit,
  recolteUpload.cid
);

// 4. Calcul et mise à jour du hash Merkle
const hashMerkleRecolte = calculateRecolteMerkleHash(recolte, [parcelle]);
await contract.ajoutHashMerkleRecolte(idRecolte, hashMerkleRecolte);
```

### Ajout d'une Inspection
```javascript
// 1. Création de l'objet inspection
const inspectionData = {
  parcelleId: id,
  auditeur: account,
  rapport: formData.rapport,
  observations: formData.observations,
  recommandations: formData.recommandations,
  timestamp: Date.now()
};

// 2. Upload de l'inspection sur IPFS
const inspectionUpload = await uploadInspection(selectedFile, inspectionData);

// 3. Consolidation avec inspections existantes
const inspectionsConsolidees = {
  type: 'inspections-parcelle',
  parcelleId: id,
  inspections: [...inspectionsExistantes, nouvelleInspection],
  timestamp: Date.now()
};

// 4. Upload des données consolidées
const inspectionsUpload = await uploadConsolidatedData(inspectionsConsolidees, "inspections-parcelle");

// 5. Mise à jour de la parcelle
await contract.mettreAJourInspectionsParcelle(id, inspectionsUpload.cid);

// 6. Mise à jour du hash Merkle
const hashMerkle = calculateParcelleMerkleHash(parcelle, photos, intrants, nouvellesInspections);
await contract.ajoutHashMerkleParcelle(id, hashMerkle);
```

### Enregistrement de Conditions de Transport
```javascript
// 1. Création de l'objet condition
const conditionData = {
  commandeId: id,
  transporteur: account,
  temperature: formData.temperature,
  humidite: formData.humidite,
  observations: formData.observations,
  notes: formData.notes,
  timestamp: Date.now()
};

// 2. Upload de la condition sur IPFS
const conditionUpload = await uploadConditionTransport(selectedFile, conditionData);

// 3. Consolidation avec conditions existantes
const conditionsConsolidees = {
  type: 'conditions-transport',
  commandeId: id,
  conditions: [...conditionsExistantes, nouvelleCondition],
  timestamp: Date.now()
};

// 4. Upload des données consolidées
const conditionsUpload = await uploadConsolidatedData(conditionsConsolidees, "conditions-transport");

// 5. Enregistrement sur la blockchain
await contract.enregistrerCondition(id, conditionsUpload.cid);
```

### Enregistrement d'une Expédition
```javascript
// 1. Création de l'objet expédition
const expedition = {
  commandeId: id,
  exportateur: account,
  destination: expeditionData.destination,
  transporteur: expeditionData.transporteur,
  dateExpedition: expeditionData.dateExpedition,
  numeroTracking: expeditionData.numeroTracking,
  observations: expeditionData.observations,
  documents: selectedFiles.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  })),
  timestamp: Date.now()
};

// 2. Création de l'objet consolidé
const expeditionConsolidee = {
  type: 'expedition-produit',
  commandeId: id,
  expedition: expedition,
  produit: produit,
  commande: commande,
  timestamp: Date.now(),
  version: "1.0"
};

// 3. Enregistrement sur la blockchain
await contract.enregistrerExpedition(
  id,
  expeditionData.destination,
  expeditionData.transporteur,
  expeditionData.dateExpedition,
  expeditionData.numeroTracking
);
```

## 4. Structure des Données IPFS

### Parcelle Consolidée
```json
{
  "type": "parcelle",
  "qualiteSemence": "Bio Premium",
  "methodeCulture": "Agriculture biologique",
  "dateRecolte": "2024-06-15",
  "location": {
    "lat": -18.8792,
    "lng": 47.5079
  },
  "certificat": "bafkreicertificat123",
  "photos": [
    {
      "cid": "bafkreiphoto1",
      "timestamp": 1703123456789,
      "filename": "photo1.jpg",
      "size": 1024000
    }
  ],
  "intrants": [
    {
      "cid": "bafkreintrant1",
      "nom": "Engrais Bio",
      "categorie": "engrais",
      "quantite": 50,
      "fournisseur": "0x123...",
      "valide": true,
      "certificatPhytosanitaire": "bafkreicert123"
    }
  ],
  "inspections": [
    {
      "cid": "bafkreinspection1",
      "auditeur": "0x456...",
      "timestamp": 1703123456789
    }
  ],
  "timestamp": 1703123456789,
  "version": "1.0"
}
```

### Photos Consolidées
```json
{
  "type": "photos-parcelle",
  "parcelleId": "1",
  "photos": [
    {
      "cid": "bafkreiphoto1",
      "timestamp": 1703123456789,
      "filename": "photo1.jpg",
      "size": 1024000
    }
  ],
  "timestamp": 1703123456789
}
```

### Intrants Consolidés
```json
{
  "type": "intrants-parcelle",
  "parcelleId": "1",
  "intrants": [
    {
      "cid": "bafkreintrant1",
      "nom": "Engrais Bio",
      "categorie": "engrais",
      "quantite": 50,
      "fournisseur": "0x123...",
      "valide": true,
      "certificatPhytosanitaire": "bafkreicert123",
      "timestamp": 1703123456789
    }
  ],
  "timestamp": 1703123456789
}
```

### Inspections Consolidées
```json
{
  "type": "inspections-parcelle",
  "parcelleId": "1",
  "inspections": [
    {
      "cid": "bafkreinspection1",
      "parcelleId": "1",
      "auditeur": "0x456...",
      "rapport": "Inspection de routine",
      "observations": "Parcelle en bon état",
      "recommandations": "Continuer les bonnes pratiques",
      "timestamp": 1703123456789
    }
  ],
  "timestamp": 1703123456789
}
```

### Récolte Consolidée
```json
{
  "type": "recolte",
  "parcelleId": 1,
  "nomProduit": "Vanille Bourbon",
  "quantite": 25,
  "prix": 50000,
  "dateRecolte": "2024-06-15",
  "producteur": "0x789...",
  "parcelleHashMerkle": "0xabc...",
  "timestamp": 1703123456789,
  "version": "1.0"
}
```

### Conditions de Transport Consolidées
```json
{
  "type": "conditions-transport",
  "commandeId": "1",
  "conditions": [
    {
      "cid": "bafkreicondition1",
      "commandeId": "1",
      "transporteur": "0x789...",
      "temperature": "25.5",
      "humidite": "60",
      "observations": "Conditions optimales",
      "notes": "Transport sans incident",
      "timestamp": 1703123456789
    }
  ],
  "timestamp": 1703123456789
}
```

### Expédition Consolidée
```json
{
  "type": "expedition-produit",
  "commandeId": "1",
  "expedition": {
    "commandeId": "1",
    "exportateur": "0x789...",
    "destination": "France, Paris",
    "transporteur": "Transport Express",
    "dateExpedition": "2024-06-15",
    "numeroTracking": "TRK123456789",
    "observations": "Expédition en bon état",
    "documents": [
      {
        "name": "facture.pdf",
        "size": 512000,
        "type": "application/pdf"
      }
    ],
    "timestamp": 1703123456789
  },
  "produit": {
    "id": 1,
    "nom": "Vanille Bourbon",
    "categorie": "épices"
  },
  "commande": {
    "id": 1,
    "quantite": 25,
    "prix": 50000
  },
  "timestamp": 1703123456789,
  "version": "1.0"
}
```

## 5. Avantages de l'Adaptation

### 🔒 **Tracabilité Complète**
- Tous les éléments ont des hash Merkle
- Vérification d'intégrité de la chaîne
- Historique complet des modifications

### ⚡ **Performance**
- Données consolidées sur IPFS
- Réduction des appels blockchain
- Chargement optimisé des données

### 🌐 **Scalabilité**
- Stockage décentralisé sur IPFS
- Pas de limitation de taille des données
- Réplication automatique

### 🔄 **Maintenance**
- Code plus modulaire
- Fonctions utilitaires réutilisables
- Gestion d'erreur centralisée

## 6. Composants Restants à Adapter

### Composants CollecteurProducteur
- [ ] `ListeProduits.jsx` - Affichage des produits avec données IPFS

### Composants CollecteurExportateur
- [ ] `MesCommandesExportateur.jsx` - Suivi des commandes

### Composants Admin
- [ ] `AdminRegisterActeur.jsx` - Enregistrement d'acteurs
- [ ] `AdminListeActeurs.jsx` - Liste des acteurs

## 7. Prochaines Étapes

1. **Adapter les composants restants** selon la priorité métier
2. **Implémenter la gestion des erreurs** IPFS de manière robuste
3. **Créer des composants de visualisation** des hash Merkle
4. **Ajouter des fonctionnalités de vérification** de traçabilité
5. **Optimiser le chargement** des données IPFS
6. **Créer des tests** pour valider l'intégration
7. **Implémenter la gestion des notifications** pour les mises à jour IPFS

## 8. Notes Importantes

- **Compatibilité** : Les composants existants ne fonctionnent plus avec les anciens contrats
- **IPFS** : Assurez-vous que les données sont accessibles et persistantes
- **Hash Merkle** : Doivent être calculés et mis à jour à chaque modification
- **Performance** : Les données consolidées réduisent le nombre d'appels IPFS
- **Sécurité** : Vérifiez l'intégrité des données avec les hash Merkle
- **Migration** : Prévoyez une stratégie de migration pour les données existantes
- **Tests** : Testez l'intégration IPFS avec des données de test avant la production
