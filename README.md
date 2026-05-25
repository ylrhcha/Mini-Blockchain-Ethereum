# TP : Mini-Blockchain Ethereum 🚀

Développement d'une blockchain locale avec Hardhat, Smart Contracts ERC-20 et système de validateurs.

## 📚 Table des matières

- [Objectifs](#objectifs)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Architecture](#architecture)
- [Utilisation](#utilisation)
- [Tests](#tests)
- [Documentation](#documentation)
- [Ressources](#ressources)

## 🎯 Objectifs

Ce TP vous permet de :

✅ Comprendre l'architecture d'une blockchain Ethereum  
✅ Mettre en place un réseau Ethereum local  
✅ Développer des smart contracts en Solidity  
✅ Implémenter un système de validateurs  
✅ Déployer un token ERC-20  
✅ Automatiser les tests et le déploiement  
✅ Rédiger une documentation professionnelle  

## 📋 Prérequis

| Technologie | Version | Vérification |
|-------------|---------|-------------|
| Node.js | v18.0+ | `node --version` |
| npm | v8.0+ | `npm --version` |
| Git | Dernière | `git --version` |

## 🔧 Installation

### 1. Cloner ou créer le projet

```bash
mkdir blockchain-tp
cd blockchain-tp
npm init -y
```

### 2. Installer Hardhat

```bash
npm install --save-dev hardhat
npx hardhat
```
Sélectionnez : **Create a JavaScript project**

### 3. Installer les dépendances

```bash
npm install @openzeppelin/contracts
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install --save-dev chai ethers
```

### 4. Vérifier l'installation

```bash
npx hardhat compile
npx hardhat test
```

## 🏗️ Architecture

### Structure du projet

```
blockchain-tp/
├── contracts/
│   ├── MyToken.sol          # Token ERC-20
│   └── Validators.sol       # Système de validateurs
├── scripts/
│   └── deploy.js            # Script de déploiement
├── test/
│   └── Token.test.js        # Tests unitaires
├── artifacts/               # Fichiers compilés
├── .github/
│   └── workflows/
│       └── test.yml         # Pipeline CI/CD
├── hardhat.config.js        # Configuration Hardhat
├── package.json             # Dépendances npm
└── README.md                # Cette documentation
```

### Diagramme d'architecture

```
┌─────────────────────────────────────────────┐
│         Réseau Ethereum Local (Hardhat)     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐    │
│  │   MyToken    │      │ Validators   │    │
│  │   (ERC-20)   │      │  (Système)   │    │
│  └──────────────┘      └──────────────┘    │
│                                             │
│  - Supply: 1,000,000 BCT                    │
│  - Transfer, Approve, TransferFrom          │
│  - Stake, Propose Blocks                    │
│                                             │
└─────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────┐
│         Tests Automatisés (Hardhat)         │
├─────────────────────────────────────────────┤
│  - Déploiement des contrats                 │
│  - Interactions avec les contrats           │
│  - Vérification des événements              │
│  - Tests de gas                             │
└─────────────────────────────────────────────┘
```

## 💻 Utilisation

### Compiler les smart contracts

```bash
npx hardhat compile
```

**Résultat** : Génère les fichiers ABI dans `artifacts/`

### Lancer les tests

```bash
npx hardhat test
```

**Résultat attendu** :
```
  MyToken
    ✓ Should have initial supply
    ✓ Should transfer tokens
    ✓ Should approve tokens

  Validators
    ✓ Should add validator with stake
    ✓ Should propose block if validator
    ✓ Should get validator count

  6 passing (215ms)
```

### Déployer localement

```bash
# Terminal 1 : Lancer le nœud
npx hardhat node

# Terminal 2 : Déployer
npx hardhat run scripts/deploy.js --network localhost
```

### Comptes de test

Le nœud Hardhat génère 20 comptes de test avec 10,000 ETH chacun :

```
Account #0: 0x1234...5678 (10,000 ETH)
Account #1: 0x2345...6789 (10,000 ETH)
...
```

## 🧪 Tests

### Exécuter les tests

```bash
npm test
```

### Couvrir les tests

```bash
npm run coverage
```

### Structure des tests

```javascript
describe("MyToken", function () {
  let token;
  let owner;

  beforeEach(async function () {
    // Setup avant chaque test
  });

  it("Should have initial supply", async function () {
    // Test spécifique
  });
});
```

## 📖 Documentation

### Smart Contracts

#### MyToken.sol (ERC-20)

```solidity
contract MyToken is ERC20 {
    constructor() ERC20("BlockchainToken", "BCT") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
```

**Fonctionnalités** :
- `transfer(to, amount)` : Transférer des tokens
- `approve(spender, amount)` : Approuver une dépense
- `balanceOf(account)` : Consulter le solde

#### Validators.sol

```solidity
contract Validators {
    struct Validator {
        address addr;
        uint256 stake;
        bool active;
    }
    
    function addValidator() external payable { ... }
    function proposeBlock() external { ... }
}
```

**Fonctionnalités** :
- `addValidator()` : Ajouter un validateur avec stake
- `proposeBlock()` : Proposer un nouveau bloc
- `getValidatorCount()` : Consulter le nombre de validateurs

### API Hardhat

| Fonction | Description |
|----------|-------------|
| `ethers.getContractFactory()` | Récupérer le contrat |
| `contract.deploy()` | Déployer le contrat |
| `contract.deployed()` | Attendre la confirmation |
| `ethers.getSigners()` | Récupérer les comptes |
| `contract.functionName()` | Appeler une fonction |
| `expect(...).to.equal()` | Assertion de test |

## 🚀 CI/CD avec GitHub Actions

Créez `.github/workflows/test.yml` :

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm test
```

## 📊 Résultats Attendus

### Compilation
```
✓ MyToken compiled successfully
✓ Validators compiled successfully
2 contracts compiled
```

### Tests
```
6 passing (215ms)
Gas Usage: 456,789 gas
```

### Déploiement
```
✓ Token déployé à : 0x1234567890...
✓ Validators déployé à : 0x0987654321...
```

## 🔗 Ressources

### Documentation Officielle
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Documentation](https://ethereum.org/developers)

### Outils
- [Remix IDE](https://remix.ethereum.org/)
- [Etherscan](https://etherscan.io/)
- [MetaMask](https://metamask.io/)

### Tutoriels
- [Build a Blockchain](https://hardhat.org/tutorial/building-on-hardhat)
- [Smart Contracts 101](https://ethereum.org/en/developers/docs/smart-contracts/)

## ✅ Checklist de Soumission

- [ ] Code source sur GitHub
- [ ] README.md complété
- [ ] Tous les tests passent
- [ ] Documentation Solidity générée
- [ ] Schéma d'architecture fourni
- [ ] Rapport de test inclus

## 📝 Notation

| Critère | Points |
|---------|--------|
| Réseau Ethereum fonctionnel | 20 |
| Smart Contracts implémentés | 30 |
| Tests automatisés | 25 |
| Documentation | 25 |
| **TOTAL** | **100** |

## 👨‍💼 Auteur

**Étudiant** : [Votre nom]  
**Date** : [Date]  
**Classe** : [Classe]  

## 📄 License

MIT © 2024

---

**Bonne chance et bon apprentissage ! 🎉**
