# Guide de Démarrage Rapide - Mini-Blockchain Ethereum

## 🚀 Installation en 5 minutes

### Étape 1 : Créer le projet
```bash
mkdir blockchain-tp
cd blockchain-tp
npm init -y
npm install --save-dev hardhat
npx hardhat
```
Sélectionnez : **Create a JavaScript project**

### Étape 2 : Installer les dépendances
```bash
npm install @openzeppelin/contracts
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install --save-dev chai ethers
```

### Étape 3 : Créer les fichiers du contrat

**contracts/MyToken.sol**
```solidity
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("BlockchainToken", "BCT") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
```

**contracts/Validators.sol**
```solidity
pragma solidity ^0.8.19;

contract Validators {
    struct Validator {
        address addr;
        uint256 stake;
        bool active;
    }

    Validator[] public validators;
    mapping(address => uint256) public stakes;

    event ValidatorAdded(address indexed validator, uint256 stake);
    event BlockProposed(address indexed validator, uint256 timestamp);

    function addValidator() external payable {
        require(msg.value > 0, "Stake required");
        validators.push(Validator({
            addr: msg.sender,
            stake: msg.value,
            active: true
        }));
        stakes[msg.sender] = msg.value;
        emit ValidatorAdded(msg.sender, msg.value);
    }

    function proposeBlock() external {
        require(stakes[msg.sender] > 0, "Not a validator");
        emit BlockProposed(msg.sender, block.timestamp);
    }

    function getValidatorCount() external view returns (uint256) {
        return validators.length;
    }
}
```

### Étape 4 : Créer le script de déploiement

**scripts/deploy.js**
```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Déploiement des smart contracts...");

  // Déployer MyToken
  const MyToken = await hre.ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy();
  await token.deployed();
  console.log("✅ Token déployé à :", token.address);

  // Déployer Validators
  const Validators = await hre.ethers.getContractFactory("Validators");
  const validators = await Validators.deploy();
  await validators.deployed();
  console.log("✅ Validators déployé à :", validators.address);

  // Afficher les informations
  const [owner] = await hre.ethers.getSigners();
  const balance = await token.balanceOf(owner.address);
  console.log("\n📊 Statistiques :");
  console.log("  - Propriétaire :", owner.address);
  console.log("  - Balance du token :", hre.ethers.utils.formatEther(balance), "BCT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Étape 5 : Créer les tests

**test/Token.test.js**
```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken", function () {
  let token;
  let owner;
  let addr1;

  beforeEach(async function () {
    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy();
    await token.deployed();

    [owner, addr1] = await ethers.getSigners();
  });

  it("Should have initial supply", async function () {
    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(ethers.utils.parseEther("1000000"));
  });

  it("Should transfer tokens", async function () {
    await token.transfer(addr1.address, ethers.utils.parseEther("100"));
    const balance = await token.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.utils.parseEther("100"));
  });
});

describe("Validators", function () {
  let validators;
  let owner;
  let addr1;

  beforeEach(async function () {
    const Validators = await ethers.getContractFactory("Validators");
    validators = await Validators.deploy();
    await validators.deployed();

    [owner, addr1] = await ethers.getSigners();
  });

  it("Should add validator with stake", async function () {
    const stake = ethers.utils.parseEther("1");
    await validators.addValidator({ value: stake });
    
    const count = await validators.getValidatorCount();
    expect(count).to.equal(1);
  });

  it("Should propose block if validator", async function () {
    const stake = ethers.utils.parseEther("1");
    await validators.addValidator({ value: stake });
    
    await expect(validators.proposeBlock())
      .to.emit(validators, "BlockProposed");
  });
});
```

## 🏃 Lancer le TP

### Compiler les contrats
```bash
npx hardhat compile
```

### Lancer les tests
```bash
npx hardhat test
```

### Déployer sur le réseau local
```bash
# Terminal 1 : Lancer le nœud Hardhat
npx hardhat node

# Terminal 2 : Déployer les contrats
npx hardhat run scripts/deploy.js --network localhost
```

## 📋 Commandes Utiles

| Commande | Description |
|----------|-------------|
| `npx hardhat compile` | Compile les smart contracts |
| `npx hardhat test` | Lance les tests |
| `npx hardhat run scripts/deploy.js` | Déploie les contrats |
| `npx hardhat accounts` | Liste les comptes disponibles |
| `npx hardhat node` | Lance un nœud local |

## ✅ Résultat Attendu

Après avoir lancé les tests, vous devriez voir :
```
  MyToken
    ✓ Should have initial supply (45ms)
    ✓ Should transfer tokens (52ms)
  Validators
    ✓ Should add validator with stake (48ms)
    ✓ Should propose block if validator (35ms)

  4 passing (180ms)
```

## 🎯 Objectifs Atteints

- ✅ Réseau Ethereum local configuré
- ✅ Smart Contracts déployés
- ✅ Tests automatisés en place
- ✅ Token ERC-20 fonctionnel
- ✅ Système de validateurs implémenté

Bon travail ! 🎉
