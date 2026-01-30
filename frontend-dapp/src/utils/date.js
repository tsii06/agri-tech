export const timestampToDate = (timestamp) => {
  const date = new Date(timestamp * 1000);

  const formatted = date.toLocaleString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatted;
};
