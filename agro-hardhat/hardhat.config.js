require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    }
  },

  // pour l'optimisation de la compilation
  setting: {
    optimizer: {
      enable: true,
      runs: 1000
    }
  }
};
