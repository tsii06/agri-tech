export function raccourcirChaine(chaine) {
    chaine = chaine?.toString();
    return `${chaine.substring(0, 6)}...${chaine.substring(chaine.length - 4)}`;
}