import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getGestionnaireActeursContract } from "../../utils/contract";
import { User, LogOut, Wallet, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export const getRoleName = (roleNumber) => {
  const roles = {
    0: "PRODUCTEUR",
    1: "FOURNISSEUR",
    2: "CERTIFICATEUR",
    3: "COLLECTEUR",
    4: "AUDITEUR",
    5: "TRANSPORTEUR",
    6: "EXPORTATEUR",
    7: "ADMINISTRATEUR",
  };
  return roles[roleNumber] || "INCONNU";
};

function Header({ state, setAccount, setRole, setState }) {
  const [account, setAccountLocal] = useState(null);
  const [role, setRoleLocal] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const verifierConnexionInitiale = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAccountLocal(accounts[0]);
          setAccount && setAccount(accounts[0]);
          await verifierActeur(accounts[0]);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de la connexion initiale:",
          error
        );
      }
    }
  };

  const connectWallet = async () => {
    sessionStorage.removeItem("madtx-logout");
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccountLocal(userAddress);
        setAccount && setAccount(userAddress);
        await verifierActeur(userAddress);
        setState({}); // render UserProvider
      } catch (error) {
        console.error("Erreur de connexion:", error);
        alert("Erreur lors de la connexion au wallet");
      }
    } else {
      alert("Installe Metamask !");
    }
  };

  const changerCompte = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts[0]) {
          setAccountLocal(accounts[0]);
          setAccount && setAccount(accounts[0]);
          await verifierActeur(accounts[0]);
        }
        setState({}); // render UserProvider
      } catch (error) {
        console.error("Erreur lors du changement de compte:", error);
        alert("Erreur lors du changement de compte");
      }
    }
  };

  const deconnecterWallet = () => {
    setAccountLocal(null);
    setRoleLocal(null);
    setAccount && setAccount(null);
    setRole && setRole(null);
    sessionStorage.setItem("madtx-logout", "1");
    window.location.href = "/";
  };

  const verifierActeur = async (userAddress) => {
    try {
      const contract = await getGestionnaireActeursContract();
      const details = await contract.getDetailsActeur(userAddress);
      if (details && details[0]) {
        const roleNumber = Number(details[1]);
        setRoleLocal(roleNumber);
        setRole && setRole(roleNumber);
      } else {
        setRoleLocal(null);
        setRole && setRole(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'acteur :", error);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("madtx-logout") === "1") return;
    verifierConnexionInitiale();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccountLocal(accounts[0]);
          setAccount && setAccount(accounts[0]);
          verifierActeur(accounts[0]);
        } else {
          setAccountLocal(null);
          setRoleLocal(null);
          setAccount && setAccount(null);
          setRole && setRole(null);
        }
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", () => {});
        window.ethereum.removeListener("chainChanged", () => {});
      }
    };
  }, [state]);

  return (
    <header className="bg-white shadow-sm madtx-header">
      <nav className="navbar navbar-expand-md navbar-light bg-white">
        <div className="container">
          {/* Titre cliquable */}
          <Link
            to="/"
            className="navbar-brand project-title fw-bold"
            style={{ color: "#2c6a2e" }}
          >
            MadTX
          </Link>
          {/* Bouton hamburger */}
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          {/* Menu responsive */}
          <div
            className={`collapse navbar-collapse${menuOpen ? " show" : ""}`}
            id="mainNavbar"
          >
            <ul className="navbar-nav me-auto mb-2 mb-md-0">
              <li className="nav-item">
                <Link
                  to="/dashboard"
                  className="nav-link fw-semibold"
                  style={{ color: "#4e944f" }}
                >
                  Dashboard
                </Link>
              </li>
            </ul>
            <div
              className="d-flex flex-wrap gap-2 justify-content-end align-items-center"
              style={{ minWidth: 0 }}
            >
              {account ? (
                <>
                  <span
                    className="badge madtx-badge px-3 py-1 d-flex align-items-center gap-1 text-truncate"
                    style={{ maxWidth: 120 }}
                  >
                    <User size={16} /> {getRoleName(role)}
                  </span>
                  <span
                    className="fw-medium text-muted d-flex align-items-center gap-1 text-truncate"
                    style={{ maxWidth: 120 }}
                  >
                    <User size={16} />{" "}
                    {`${account.substring(0, 6)}...${account.substring(
                      account.length - 4
                    )}`}
                  </span>
                  <div
                    className="status-indicator"
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background:
                        role !== null
                          ? "var(--madtx-green)"
                          : "var(--madtx-brown)",
                      marginLeft: 8,
                    }}
                  ></div>
                  <button
                    onClick={async () => await changerCompte()}
                    className="btn btn-success btn-sm d-flex align-items-center gap-1 flex-shrink-0"
                  >
                    <RefreshCw size={16} /> Changer
                  </button>
                  <button
                    onClick={deconnecterWallet}
                    className="btn btn-warning btn-sm d-flex align-items-center gap-1 flex-shrink-0"
                  >
                    <LogOut size={16} /> Déconnecter
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  className="btn btn-primary d-flex align-items-center gap-2 btn-sm"
                >
                  <Wallet size={18} /> Connecter Wallet
                </button>
              )}
              <Link
                to="/espace-client"
                className="btn btn-outline-success btn-sm fw-semibold"
              >
                Espace Client
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
