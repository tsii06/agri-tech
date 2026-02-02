export function enleveProducteurDeData(_data) {
  // Enlever la propriete producteur sur les recoltes.
  const dataSansProducteur = _data.map((el) => {
    const { producteur, ...cleanEl } = el;
    return cleanEl;
  });
  return dataSansProducteur;
}

export function enleveCollecteurDeData(_data) {
  // Enlever la propriete producteur sur les recoltes.
  const dataSansCollecteur = _data.map((el) => {
    const { collecteur, ...cleanEl } = el;
    return cleanEl;
  });
  return dataSansCollecteur;
}
