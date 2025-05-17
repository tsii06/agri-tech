import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGestionnaireActeursContract } from '../utils/contract';
import { ethers } from 'ethers';

const UserContext = createContext();

export const UserProvider = ({ children,state }) => {
    const [role, setRole] = useState(null);
    const [account, setAccount] = useState("");

    const verifeActeur = async (userAddress) => {
        try {
            const contract = await getGestionnaireActeursContract();
            const details = await contract.getDetailsActeur(userAddress);
            if (details && details[0]) {
                const roleNumber = Number(details[1]);
                setRole(roleNumber);
            } else {
                setRole(null);
            }
        } catch (error) {
            console.error("Erreur lors de la vérification de l'acteur :", error);
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

    return (
        <UserContext.Provider value={{ role, setRole, account, verifeActeur }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};