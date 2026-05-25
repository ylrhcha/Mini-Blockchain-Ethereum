// hardhat.config.js - Configuration complète pour le TP Blockchain
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        // Optionnel : forker mainnet pour les tests avancés
        // enabled: true,
        // url: "https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY",
        // blockNumber: 17000000
      },
      allowUnlimitedContractSize: false,
      initialBaseFeePerGas: 0
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      timeout: 40000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts",
    cache: "./cache"
  },
  mocha: {
    timeout: 40000
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    coinmarketcap: "YOUR_CMC_API_KEY"
  },
  etherscan: {
    apiKey: "YOUR_ETHERSCAN_API_KEY"
  }
};
