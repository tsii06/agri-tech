import { getGestionnaireActeursContract } from "../contract";

const contrat = await getGestionnaireActeursContract();

/**
 * 
 * @param {string} _address 
 * @returns {object}
 */
export const getActeur = async (_address) => {
    try {
        const acteurOnChain = await contrat.getDetailsActeur(_address);
        // convertir en array
        const roles = acteurOnChain.roles.map(r => Number(r));
        let acteurComplet = {
            idBlockchain: acteurOnChain.idBlockchain.toString(),
            nom: acteurOnChain.nom.toString(),
            nifOuCin: acteurOnChain.nifOuCin.toString(),
            adresseOfficielle: acteurOnChain.adresseOfficielle.toString(),
            email: acteurOnChain.email.toString(),
            telephone: acteurOnChain.telephone.toString(),
            roles: roles,
            typeEntite: Number(acteurOnChain.typeEntite)
        };
        return acteurComplet;
    } catch (error) {
        console.error("Recuperation acteur : ", error);
        return;
    }
};