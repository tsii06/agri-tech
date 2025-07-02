import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGestionnaireActeursContract } from '../utils/contract';
import { ethers } from 'ethers';

const UserContext = createContext();

export const UserProvider = ({ children, state }) => {
    const [roles, setRoles] = useState([]);
    const [isActeur, setIsActeur] = useState(false);
    const [account, setAccount] = useState("");

    const verifeActeur = async (userAddress) => {
        try {
            const contract = await getGestionnaireActeursContract();
            const rolesArray = await contract.getRoles(userAddress);

            // verifie que l'user est un acteur
            if(!rolesArray.length <= 0)
                setIsActeur(true);
            
            setRoles(rolesArray.map(r => Number(r)));
        } catch (error) {
            console.error("Erreur lors de la vérification des rôles :", error);
            setRoles([]);
            setIsActeur(false);
        }
    };

    useEffect(() => {
        const checkAccount = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    await verifeActeur(accounts[0]);
                }
            }
        };

        checkAccount();
    }, [state]);

    if(isActeur && roles.length <= 0)
        return <div className='container-fluid d-flex justify-content-center pt-5'><div className="spinner-border"></div> &nbsp; Chargement...</div>

    return (
        <UserContext.Provider value={{ roles, setRoles, account, verifeActeur }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};