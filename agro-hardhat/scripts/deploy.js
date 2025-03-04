const { ethers } = require("hardhat");

async function main() {
    const [onwer, collecteur, exportateur, transporteur, producteur] = await ethers.getSigners();

    // deployer un ProducteurEnPhaseCulture
    const ProCult = await ethers.getContractFactory("contracts/ProducteurEnPhaseCulture.sol:ProducteurEnPhaseCulture");
    const proCult = await ProCult.deploy();
    await proCult.waitForDeployment();
    // deployer un CollecteurExportateurContrat
    const ColExp = await ethers.getContractFactory("CollecteurExportateurContrat");
    const colExp = await ColExp.deploy(proCult.getAddress());
    await colExp.waitForDeployment();

    // enrgistrer producteur dans proCult
    await proCult.enregistrerActeur(producteur.address, 0);
    // creer parcelle
    await proCult.connect(producteur).creerParcelle("bon", "sur brulis", "latitude", "longitude", "nomProduit", "12/12/25", "certificate");

    console.log("le deployer : ", onwer.address);
    console.log('adresse du contrat proCult : ',await colExp.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
