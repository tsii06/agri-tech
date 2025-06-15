const { ethers } = require('hardhat');

async function main() {
    const acteursContrat = await ethers.getContractAt("GestionnaireActeurs", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

    console.log(await acteursContrat.getActeursByRole(7));
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});