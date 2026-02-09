export function filtrerParcelleData(_data) {
  const dataFiltree = _data.map((el) => {
    const { producteur, inspections, intrants, isProprietaire, photos, timestamp, cid, ...cleanEl } = el;
    return cleanEl;
  });
  return dataFiltree;
}

export function filtrerRecolteData(_data) {
  const dataFiltree = _data.map((el) => {
    const { isProprietaire, prix, prixUnit, producteur, quantite, ...cleanEl } = el;
    return cleanEl;
  });
  return dataFiltree;
}

export function filtrerLotProduitData(_data) {
  const dataFiltree = _data.map((el) => {
    const { collecteur, prixUnit, quantite, ...cleanEl } = el;
    return cleanEl;
  });
  return dataFiltree;
}