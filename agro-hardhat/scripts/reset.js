const { ethers } = require('hardhat');

async function main() {
	console.log("Reinitialisation de la blockchain locale...");
	await network.provider.send("hardhat_reset");
	console.log("Blockchain reinitialiser");
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});