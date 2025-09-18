# 📦 Stockage des Intrants par Récolte dans IPFS

## 🎯 **Réponse à la question : "Sont-ils stockés dans IPFS ?"**

**OUI**, les intrants utilisés par récolte sont maintenant stockés dans IPFS avec l'amélioration implémentée !

## 📊 **Architecture de Stockage**

### 🔄 **Évolution du Système**

| Version | Stockage Intrants | Description |
|---------|------------------|-------------|
| **1.0** | 📁 Parcelles seulement | Intrants stockés dans les fichiers IPFS des parcelles |
| **2.0** | 📦 Récoltes + Parcelles | Intrants stockés AUSSI dans chaque fichier IPFS de récolte |

### 📁 **Structure IPFS - Récolte Version 2.0**

```json
{
  "type": "recolte",
  "parcelleId": 1,
  "nomProduit": "Riz Premium",
  "quantite": 1000,
  "prix": 500,
  "dateRecolte": "2024-06-01",
  "producteur": "0x1234...",
  
  // 🌿 NOUVEAUTÉ: Intrants stockés directement
  "intrantsUtilises": [
    {
      "nom": "Engrais NPK",
      "dateAjout": "2024-04-15",
      "quantite": 50,
      "unite": "kg"
    },
    {
      "nom": "Pesticide bio",
      "dateAjout": "2024-05-20",
      "quantite": 5,
      "unite": "L"
    }
  ],
  
  "dateRecoltePrecedente": "2024-03-01",
  "numeroRecolte": 2,
  "saison": {
    "nom": "Culture 2024-R2 (Parcelle 5)",
    "identifiant": "2024-R2", 
    "annee": 2024,
    "numeroRecolte": 2,
    "parcelle": 5,
    "dateDebut": "2024-03-02",
    "dateFin": "2024-06-15",
    "dureeCultureJours": 105,
    "typeSaison": "dynamique",
    "premierIntrant": null
  },
  
  "regleAssociation": {
    "appliquee": true,
    "version": "1.0",
    "description": "Intrants appliqués après récolte précédente et avant/à récolte actuelle"
  },
  
  "version": "2.0",
  "timestamp": 1718123456789
}
```

## 🔍 **Mécanisme de Récupération**

### 1️⃣ **Nouvelles Récoltes (Version 2.0)**
```javascript
// Intrants récupérés directement depuis IPFS
const recolte = await getRecolte(5);
console.log(recolte.intrantsUtilises); // 📦 Stocké dans IPFS
console.log(recolte.intrantsSource); // "IPFS_STORED"
```

### 2️⃣ **Anciennes Récoltes (Version 1.0)**
```javascript
// Fallback: calcul dynamique depuis les parcelles
const recolte = await getRecolte(1);
console.log(recolte.intrantsUtilises); // 🔄 Calculé dynamiquement
console.log(recolte.intrantsSource); // "DYNAMIC_CALC"
```

## ⚡ **Avantages du Stockage IPFS**

### 🚀 **Performance**
- ✅ **Récupération instantanée** des intrants
- ✅ **Moins d'appels** aux parcelles
- ✅ **Cache permanent** sur IPFS

### 🔒 **Traçabilité**
- ✅ **Snapshot figé** des intrants au moment de la récolte
- ✅ **Audit historique** impossible à modifier
- ✅ **Conformité réglementaire** garantie

### 📈 **Scalabilité**
- ✅ **Réduction charge réseau** pour les anciennes récoltes
- ✅ **Parallélisation** des requêtes
- ✅ **Cache distribué** via IPFS

## 🛠️ **Fonctions Clés**

### 📝 **Création avec Stockage**
```javascript
// Fonction améliorée qui stocke les intrants
await createRecolte(recolteData, parcelle);
// → Stocke automatiquement les intrants dans IPFS
```

### 📖 **Récupération Intelligente**
```javascript
// Fonction qui priorise IPFS, fallback sur calcul
const recolte = await getRecolte(idRecolte);
// → Utilise IPFS si disponible, sinon calcul dynamique
```

### 🔄 **Migration Disponible**
```javascript
// Migration des anciennes récoltes
await migrateAllRecoltes(1, 10);
// → Convertit version 1.0 → 2.0 avec stockage IPFS
```

## 🎨 **Interface Utilisateur**

### 🏷️ **Badges Informatifs**
- 📦 **Badge Bleu**: "Intrants IPFS" (stockés)
- 🔄 **Badge Gris**: "Calcul dynamique" (calculés)

### 🔍 **Logs de Debug**
```
📦 Intrants récupérés depuis IPFS pour récolte 5: {count: 3, source: 'IPFS_STORED'}
🔄 Calcul dynamique des intrants pour récolte 1 (version 1.0)
```

## 📋 **Règle d'Association Respectée**

✅ **Intrants inclus**: Appliqués APRÈS récolte précédente ET AVANT/À récolte actuelle
❌ **Intrants exclus**: Appliqués avant récolte précédente OU après récolte actuelle

## 🎯 **Conclusion**

**Les intrants sont maintenant stockés de manière permanente dans IPFS pour chaque récolte**, offrant :
- **Performance optimale**
- **Traçabilité complète** 
- **Conformité réglementaire**
- **Évolutivité future**

Le système est **rétrocompatible** et gère automatiquement les anciennes et nouvelles récoltes.