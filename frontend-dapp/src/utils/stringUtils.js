export function raccourcirChaine(chaine) {
    return `${chaine.substring(0, 6)}...${chaine.substring(chaine.length - 4)}`;
}