const { ethers } = require("hardhat");

async function main() {
    const [signer] = await ethers.getSigners();
    const nonce = await ethers.provider.getTransactionCount(signer.address, "pending");
    console.log(`Nonce actuel pour ${signer.address} :`, nonce);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
