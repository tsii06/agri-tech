import { Link } from "react-router-dom";
import { useUserContext } from "../../context/useContextt";
import {
  useExpeditionsIDs,
  useExpeditionsUnAUn,
} from "../../hooks/queries/useExpeditions";
import Skeleton from "react-loading-skeleton";
import { useState } from "react";

// Nbr de recoltes par chargement
const NBR_ITEMS_PAR_PAGE = 9;

export default function ListeExpeditions() {
  const { roles, account } = useUserContext();

  // Recuperation de tab listes des ids commandes recoltes
  const { data: expeditionsIDs } = useExpeditionsIDs();

  // Nbr de recoltes par tranche
  const [expeditionsToShow, setExpeditionsToShow] =
    useState(NBR_ITEMS_PAR_PAGE);
  const idsToFetch = expeditionsIDs?.slice(0, expeditionsToShow) || [];

  // Utilisation cache pour la liste des commandes recoltes.
  const expeditionsUnAUn = useExpeditionsUnAUn(idsToFetch, roles, account);

  // Charger 9 de plus
  const chargerPlus = (plus = NBR_ITEMS_PAR_PAGE) => {
    setExpeditionsToShow((prev) =>
      Math.min(prev + plus, expeditionsIDs?.length)
    );
  };

  // Check si on peut charger plus
  const hasMore = expeditionsToShow < expeditionsIDs?.length;

  const expeditionsFiltres = expeditionsUnAUn.filter((q) => {
    const expedition = q.data;

    // Ne pas filtrer si pas encore charger
    if (q.isLoading || q.isRefetching) return true;

    // Ne pas garder les commandes qui n'apartient pas a l'user si user est collecteur
    if (expedition.isProprietaire && !expedition.isProprietaire) return false;

    return true;
  });

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2>Expéditions</h2>
      </div>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Référence</th>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th>Certifiée</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expeditionsFiltres.map((q, index) => {
              const e = q.data;

              // Skeleton si chargement de donnee
              if (q.isLoading || q.isRefetching)
                return (
                  <tr key={index}>
                    <td colSpan={7} className="p-0 m-0">
                      <Skeleton width={"100%"} height={"100%"} />
                    </td>
                  </tr>
                );

              // Afficher expedition
              return (
                <tr key={`${e.id}-${index}`}>
                  <td>{e.id}</td>
                  <td>{e.ref || "-"}</td>
                  <td>{e.nomProduit || "-"}</td>
                  <td>{e.quantite}</td>
                  <td>{e.prix}</td>
                  <td>{e.certifier ? "Oui" : "Non"}</td>
                  <td>
                    <Link
                      className="btn btn-sm btn-outline-primary"
                      to={`/exportateur-details-expedition/${e.ref}`}
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              );
            })}
            {expeditionsFiltres.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  Aucune expédition
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Btn pour charger plus de recoltes */}
        {hasMore && (
          <div className="text-center mt-3">
            <button
              className="btn btn-outline-success"
              onClick={() => chargerPlus()}
            >
              Charger plus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
