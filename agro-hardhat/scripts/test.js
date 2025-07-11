const { ethers } = require('hardhat');

async function main() {
    // const factory = await ethers.getContractFactory("ProducteurEnPhaseCulture");
    // const contrat = await factory.deploy();
    // await contrat.waitForDeployment();

    // const proxy = await ethers.getContractAt("ContratProxy", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
    const proxy = await ethers.getContractAt("ProducteurEnPhaseCulture", "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
    // await proxy.updateImplementation(await contrat.getAddress());
    console.log(await proxy.getIntrants(5));

}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});