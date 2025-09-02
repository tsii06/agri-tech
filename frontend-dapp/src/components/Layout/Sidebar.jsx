import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ROLE_LABELS = {
  0: "Producteur",
  1: "Fournisseur",
  2: "Certificateur",
  3: "Collecteur",
  4: "Auditeur",
  5: "Transporteur",
  6: "Exportateur",
  7: "Administration"
};

const ROLE_LINKS = {
  0: [
    { to: "/mes-parcelles", text: "Mes Parcelles" },
    { to: "/creer-parcelle", text: "Nouvelle Parcelle" },
    { to: "/liste-recolte", text: "Mes récoltes" }
  ],
  1: [
    { to: "/mes-parcelles", text: "Gérer les Intrants" }
  ],
  2: [
    { to: "/mes-parcelles", text: "Validation des intrants" },
    { to: "/liste-recolte", text: "Contrôle Phytosanitaire Recolte" }
  ],
  3: [
    { to: "/liste-recolte", text: "Passer commande" },
    { to: "/liste-collecteur-commande", text: "Mes commandes" },
    { to: "/liste-produits", text: "Stock" },
    { to: "/liste-lot-produits", text: "Lots de produits" },
    { to: "/liste-acteurs-role", text: "Liste des Producteurs" }
  ],
  4: [
    { to: "/mes-parcelles", text: "Inspections" }
  ],
  5: [
    { to: "/transport", text: "Gestion des transports" }
  ],
  6: [
    { to: "/liste-recolte", text: "Recoltes" },
    { to: "/liste-lot-produits", text: "Passer commande" },
    { to: "/mes-commandes-exportateur", text: "Mes commandes" },
    { to: "/stock-exportateur", text: "Stock" },
    { to: "/expeditions", text: "Expéditions" },
    { to: "/liste-acteurs-role", text: "Liste des Collecteurs" },
  ]
};


function Sidebar({ account, roles, getLinkIcon }) {
  const [openGroups, setOpenGroups] = useState({});
  const navigator = useNavigate();

  if (!account || !roles || roles.length === 0) return null;

  const handleToggle = (role) => {
    setOpenGroups(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  return (

      <div className="position-sticky">
        <ul className="nav flex-column px-3">
          {roles.map(role => (
            <li key={role} className="nav-item mb-2">
              {role === 7 ? (
                <div
                  className="d-flex align-items-center justify-content-between"
                  style={{ cursor: "pointer", fontWeight: 600, color: "#4e944f" }}
                  onClick={() => {
                    handleToggle(role);
                    navigator("/admin");
                  }}
                >
                  <span>{ROLE_LABELS[role]}</span>
                  {/* <span>{openGroups[role] ? "▼" : "►"}</span> */}
                </div>
              ) : (
                <div
                  className="d-flex align-items-center justify-content-between"
                  style={{ cursor: "pointer", fontWeight: 600, color: "#4e944f" }}
                  onClick={() => handleToggle(role)}
                >
                  <span>{ROLE_LABELS[role]}</span>
                  <span>{openGroups[role] ? "▼" : "►"}</span>
                </div>
              )}
              <ul
                className="list-unstyled ps-3"
                style={{
                  display: openGroups[role] ? "block" : "none",
                  marginTop: 6,
                  marginBottom: 0
                }}
              >
                {(ROLE_LINKS[role] || []).map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="nav-link d-flex align-items-center gap-2 py-2 rounded"
                      style={{ color: "#333" }}
                    >
                      {getLinkIcon && getLinkIcon(link.text)}
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    // </nav>
  );
}

export default Sidebar; 