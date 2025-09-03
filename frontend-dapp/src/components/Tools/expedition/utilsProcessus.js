import {
  getCommandeProduit,
  getConditionTransportCE,
  getLotProduitEnrichi,
} from "../../../utils/collecteurExporatateur";
import {
  getCommandeRecolte,
  getConditionTransportPC,
  getRecolte,
} from "../../../utils/contrat/collecteurProducteur";
import { getParcelle } from "../../../utils/contrat/producteur";

const INTERVAL_HORIZONTAL = 200;
const INTERVAL_VERTICAL = 200;

/**
 *
 * @param {object} _expedition
 * @returns {object} nodes et edges
 */
const creerNodesProcessus = async (_expedition) => {
  let nodesFinal = [];
  let edgesFinal = [];

  let positionInitial = { x: 0, y: 0 };
  const edgeBase = {
    markerEnd: { type: "arrowclosed", width: 30, height: 30, color: "black" },
    style: { stroke: "black" },
  };

  // Creer node pour l'expedition.
  const nodeExpedition = {
    id: `expedition-${_expedition.id}`,
    type: "expeditionNode",
    position: { ...positionInitial },
    data: { ..._expedition, label: _expedition.ref },
  };
  nodesFinal = [...nodesFinal, nodeExpedition];

  // Creer node pour les conditions transport : collecteur -> exportateur
  positionInitial.x -= INTERVAL_HORIZONTAL;
  for (let id of _expedition.idCommandeProduit) {
    const condition = await getConditionTransportCE(id);
    const nodeCondition = {
      id: `conditionCE-${condition.id}`,
      type: "custom",
      position: { ...positionInitial },
      data: { ...condition, label: condition.hashMerkle.slice(0, 6) },
    };
    nodesFinal = [...nodesFinal, nodeCondition];
    // creation edge
    const edge = {
      ...edgeBase,
      id: `conditionExpedition${_expedition.id}-${condition.id}`,
      source: nodeCondition.id,
      target: `expedition-${_expedition.id}`,
    };
    edgesFinal = [...edgesFinal, edge];
    positionInitial.y += INTERVAL_VERTICAL;
  }

  // Creer node pour les lots produits
  positionInitial.x -= INTERVAL_HORIZONTAL;
  positionInitial.y = 0;
  let idLotProduits = [];
  for (let id of _expedition.idCommandeProduit) {
    const { idLotProduit } = await getCommandeProduit(id);
    idLotProduits.push(idLotProduit);
    const lotProduit = await getLotProduitEnrichi(idLotProduit);
    const nodeLotProduit = {
      id: `lotProduit-${lotProduit.id}`,
      type: "custom",
      position: { ...positionInitial },
      data: { ...lotProduit, label: lotProduit.hashMerkle.slice(0, 6) },
    };
    nodesFinal = [...nodesFinal, nodeLotProduit];
    // creation edge
    const edge = {
      ...edgeBase,
      id: `lotProduitCondition${id}-${lotProduit.id}`,
      source: nodeLotProduit.id,
      target: `conditionCE-${id}`,
    };
    edgesFinal = [...edgesFinal, edge];
    positionInitial.y += INTERVAL_VERTICAL;
  }

  // Creer node pour les conditions transport : producteur -> collecteur
  positionInitial.x -= INTERVAL_HORIZONTAL;
  positionInitial.y = 0;
  let _idCommandesRecoltes = [];
  for (let id of idLotProduits) {
    const lotProduit = await getLotProduitEnrichi(id);
    for (let idC of lotProduit.idCommandeRecoltes) {
      const condition = await getConditionTransportPC(idC);
      _idCommandesRecoltes.push(idC);
      const nodeCondition = {
        id: `conditionPC-${condition.id}`,
        type: "custom",
        position: { ...positionInitial },
        data: { ...condition, label: condition.hashMerkle.slice(0, 6) },
      };
      nodesFinal = [...nodesFinal, nodeCondition];
      // creation edge
      const edge = {
        ...edgeBase,
        id: `conditionLotProduit${id}-${condition.id}`,
        source: nodeCondition.id,
        target: `lotProduit-${id}`,
      };
      edgesFinal = [...edgesFinal, edge];
      positionInitial.y += INTERVAL_VERTICAL;
    }
  }

  // Creer node pour les recoltes
  positionInitial.x -= INTERVAL_HORIZONTAL;
  positionInitial.y = 0;
  let idRecoltes = [];
  for (let id of _idCommandesRecoltes) {
    const { idRecolte } = await getCommandeRecolte(id);
    idRecoltes.push(idRecolte);
    const recolte = await getRecolte(idRecolte);
    const nodeRecolte = {
      id: `recolte-${recolte.id}`,
      type: "custom",
      position: { ...positionInitial },
      data: { ...recolte, label: recolte.hashMerkle.slice(0, 6) },
    };
    nodesFinal = [...nodesFinal, nodeRecolte];
    const edge = {
      ...edgeBase,
      id: `recolteCondition${id}-${recolte.id}`,
      source: nodeRecolte.id,
      target: `conditionPC-${id}`,
    };
    edgesFinal = [...edgesFinal, edge];
    positionInitial.y += INTERVAL_VERTICAL;
  }

  // Creer node pour parcelles
  positionInitial.x -= INTERVAL_HORIZONTAL;
  positionInitial.y = 0;
  for (let id of idRecoltes) {
    const { idParcelle } = await getRecolte(id);
    for (let idP of idParcelle) {
      const parcelle = await getParcelle(idP);
      const nodeParcelle = {
        id: `parcelle-${parcelle.id}`,
        type: "custom",
        position: { ...positionInitial },
        data: { ...parcelle, label: parcelle.hashMerkle.slice(0, 6) },
      };
      nodesFinal = [...nodesFinal, nodeParcelle];
      const edge = {
        ...edgeBase,
        id: `parcelleRecolte${id}-${parcelle.id}`,
        source: nodeParcelle.id,
        target: `recolte-${id}`,
      };
      edgesFinal = [...edgesFinal, edge];
      positionInitial.y += INTERVAL_VERTICAL;
    }
  }

  // SUPPRIMER LES DOUBLANTS
  nodesFinal = nodesFinal.filter(
    (node, index, self) => index === self.findIndex((n) => n.id === node.id)
  );
  edgesFinal = edgesFinal.filter(
    (node, index, self) => index === self.findIndex((n) => n.id === node.id)
  );

  return { nodesFinal, edgesFinal };
};

export default creerNodesProcessus;
