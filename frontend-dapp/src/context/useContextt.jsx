import React, { createContext, useContext, useState, useEffect } from 'react';
import { getContract } from '../utils/contract';
import { ethers } from 'ethers';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [role, setRole] = useState(null);
    const [account, setAccount] = useState(null);

    const verifeActeur = async (userAddress) => {
        try {
            const contract = await getContract();
            const acteur = await contract.getActeur(userAddress);
            
            if (acteur.addr !== ethers.ZeroAddress) {
                const roleNumber = Number(acteur.role);
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
    }, []);

    return (
        <UserContext.Provider value={{ role, setRole, account, verifeActeur }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};