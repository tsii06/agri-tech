// frontend-dapp/src/utils/ipfs.js
const IPFS_GATEWAY_PREFIX = "https://ipfs.io/ipfs/"; // Using a public gateway

export async function fetchFromIPFS(ipfsHash) {
  if (!ipfsHash || ipfsHash.trim() === "") {
    console.warn("IPFS hash is empty or invalid.");
    return null;
  }
  try {
    const url = `${IPFS_GATEWAY_PREFIX}${ipfsHash}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch from IPFS: ${response.status} ${response.statusText} for hash ${ipfsHash}`);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching or parsing IPFS data for hash ${ipfsHash}:`, error);
    return null;
  }
}
