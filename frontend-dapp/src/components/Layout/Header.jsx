import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getGestionnaireActeursContract } from "../../utils/contract";
import {
  Menu,
  User,
  LogOut,
  Wallet,
  RefreshCw,
} from "lucide-react";

export const getRoleName = (roleNumber) => {
  const roles = {
    0: "PRODUCTEUR",
    1: "FOURNISSEUR",
    2: "CERTIFICATEUR",
    3: "COLLECTEUR",
    4: "AUDITEUR",
    5: "TRANSPORTEUR",
    6: "EXPORTATEUR"
  };
  return roles[roleNumber] || "INCONNU";
};

function Header({ state, setAccount, setRole }) {
  const [account, setAccountLocal] = useState(null);
  const [role, setRoleLocal] = useState(null);

  const verifierConnexionInitiale = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        if (accounts.length > 0) {
          setAccountLocal(accounts[0]);
          setAccount && setAccount(accounts[0]);
          await verifierActeur(accounts[0]);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la connexion initiale:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        setAccountLocal(userAddress);
        setAccount && setAccount(userAddress);
        await verifierActeur(userAddress);
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
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        if (accounts[0]) {
          setAccountLocal(accounts[0]);
          setAccount && setAccount(accounts[0]);
          await verifierActeur(accounts[0]);
        }
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
      <div className="container d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-primary d-md-none"
            style={{ padding: 6, borderRadius: 6 }}
            aria-label="Ouvrir le menu"
            // Le bouton menu peut ouvrir la sidebar si besoin, à gérer dans App
          >
            <Menu size={24} />
          </button>
          <h2 className="project-title mb-0" style={{ color: "rgb(44 106 46 / var(--tw-text-opacity,1))" }}>MadTX</h2>
        </div>
        <nav className="navbar navbar-expand-lg navbar-light bg-white py-3 px-4 d-flex justify-content-between">
          <div className="collapse navbar-collapse show" id="navbarNav">
            {account ? (
              <div className="d-flex align-items-center gap-3">
                <span className="badge madtx-badge px-3 py-1 d-flex align-items-center gap-1">
                  <User size={16} /> {getRoleName(role)}
                </span>
                <span className="fw-medium text-muted d-flex align-items-center gap-1">
                  <User size={16} /> {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </span>
                <div className="status-indicator" style={{ width: 12, height: 12, borderRadius: '50%', background: role !== null ? 'var(--madtx-green)' : 'var(--madtx-brown)', marginLeft: 8 }}></div>
                <button onClick={changerCompte} className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                  <RefreshCw size={16} /> Changer
                </button>
                <button onClick={deconnecterWallet} className="btn btn-warning btn-sm d-flex align-items-center gap-1">
                  <LogOut size={16} /> Déconnecter
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} className="btn btn-primary d-flex align-items-center gap-2">
                <Wallet size={18} /> Connecter Wallet
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;

