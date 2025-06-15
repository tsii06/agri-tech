const { ethers } = require('hardhat');

async function main() {
    const acteursContrat = await ethers.getContractAt("CollecteurExportateur", "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853");

    console.log(await acteursContrat.getCommande(2));
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});