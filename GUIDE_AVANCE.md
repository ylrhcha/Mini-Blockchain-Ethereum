# 📚 Guide Avancé - Mini-Blockchain Ethereum

## Table des matières

1. [Concepts Avancés](#concepts-avancés)
2. [Cas d'Usage](#cas-dusage)
3. [Bonnes Pratiques](#bonnes-pratiques)
4. [Optimisations](#optimisations)
5. [Troubleshooting](#troubleshooting)

---

## 🎯 Concepts Avancés

### 1. Comprendre les Snapshots

Les snapshots permettent de capturer l'état du token à un moment spécifique :

```javascript
// Créer un snapshot
const snapshotId = await token.snapshot();

// Consulter le balance au snapshot
const balance = await token.balanceOfAt(addr1, snapshotId);

// Vérifier le supply au snapshot
const supply = await token.totalSupplyAt(snapshotId);
```

**Cas d'usage** :
- Système de vote (snapshot avant le vote)
- Audits historiques
- Distribution de dividendes
- Récupération de droits

### 2. Système de Validateurs Avancé

#### Ajouter un Validateur

```javascript
const stake = ethers.utils.parseEther("1");
await validators.connect(addr1).addValidator({ value: stake });

const validator = await validators.getValidator(addr1.address);
console.log("Validateur :", validator);
// {
//   addr: '0x...',
//   stake: 1000000000000000000,
//   blocksProposed: 0,
//   blocksValidated: 0,
//   active: true,
//   joinedAt: 1234567890,
//   rewards: 0
// }
```

#### Proposer et Finaliser un Bloc

```javascript
// 1. Proposer un bloc
const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block_data"));
await validators.connect(addr1).proposeBlock(blockHash, 10);

// 2. Vérifier le bloc
const block = await validators.getProposedBlock(0);
console.log("Bloc proposé :", block);

// 3. Finaliser le bloc (seulement propriétaire)
await validators.finalizeBlock(0);

// 4. Réclamer les récompenses
await validators.connect(addr1).claimRewards();
```

#### Consulter les Statistiques

```javascript
const [
  totalValidators,
  activeValidators,
  totalStake,
  proposedBlocks,
  finalizedBlocks
] = await validators.getNetworkStats();

console.log(`Réseau:`);
console.log(`  Total: ${totalValidators}`);
console.log(`  Actifs: ${activeValidators}`);
console.log(`  Stake total: ${ethers.utils.formatEther(totalStake)} ETH`);
console.log(`  Blocs proposés: ${proposedBlocks}`);
console.log(`  Blocs finalisés: ${finalizedBlocks}`);
```

### 3. Système de Blacklist

```javascript
// Ajouter à la blacklist
await token.addToBlacklist(addr1.address);

// Vérifier si blacklistée
const isBlocked = await token.isBlacklisted(addr1.address);

// Retirer de la blacklist
await token.removeFromBlacklist(addr1.address);
```

**Important** : Les adresses blacklistées ne peuvent pas :
- Envoyer de tokens
- Recevoir de tokens
- Participer aux transfers

### 4. Gestion de la Pause

```javascript
// Mettre en pause tous les transferts
await token.pause();

// Reprendre les transferts
await token.unpause();
```

---

## 💡 Cas d'Utilisation

### Cas 1 : Système de Gouvernance

```javascript
// Étape 1 : Créer un snapshot avant le vote
await token.snapshot();

// Étape 2 : Compter les votes basés sur le snapshot
const voterBalance = await token.balanceOfAt(voter, snapshotId);

// Étape 3 : Valider les votes
if (voterBalance > 0) {
  // Voter peut participer
}
```

### Cas 2 : Distribution de Récompenses

```javascript
// Étape 1 : Ajouter validateurs
for (let i = 0; i < 5; i++) {
  await validators.connect(signers[i]).addValidator({ value: ethers.utils.parseEther("1") });
}

// Étape 2 : Proposer des blocs
for (let i = 0; i < 10; i++) {
  const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`block_${i}`));
  await validators.connect(signers[i % 5]).proposeBlock(blockHash, Math.random() * 100);
}

// Étape 3 : Finaliser les blocs
for (let i = 0; i < 10; i++) {
  await validators.finalizeBlock(i);
}

// Étape 4 : Distribuer les récompenses
for (let i = 0; i < 5; i++) {
  await validators.connect(signers[i]).claimRewards();
}
```

### Cas 3 : Audit de Sécurité

```javascript
// Prendre un snapshot pour audit
const auditSnapshot = await token.snapshot();

// Vérifier les balances historiques
for (let account of addressesToAudit) {
  const balance = await token.balanceOfAt(account, auditSnapshot);
  console.log(`${account}: ${ethers.utils.formatEther(balance)} BCT`);
}

// Vérifier le supply
const supplyAtAudit = await token.totalSupplyAt(auditSnapshot);
console.log(`Supply au moment de l'audit: ${ethers.utils.formatEther(supplyAtAudit)} BCT`);
```

### Cas 4 : Maintenance de Sécurité

```javascript
// Mettre les tokens en pause pendant une mise à jour
await token.pause();

// Effectuer la maintenance
console.log("Maintenance en cours...");

// Reprendre le service
await token.unpause();
```

---

## ✅ Bonnes Pratiques

### 1. Gestion des Erreurs

```javascript
try {
  const tx = await validators.connect(addr1).addValidator({ value: stake });
  const receipt = await tx.wait();
  console.log("Validateur ajouté :", addr1.address);
} catch (error) {
  if (error.message.includes("Already a validator")) {
    console.error("Erreur : Adresse déjà validateur");
  } else if (error.message.includes("Stake must be")) {
    console.error("Erreur : Stake insuffisant");
  } else {
    console.error("Erreur inconnue :", error);
  }
}
```

### 2. Vérifications avant Déploiement

```javascript
// Vérifier les paramètres
async function validateDeployment() {
  // Vérifier le supply
  const supply = await token.totalSupply();
  if (supply === 0) throw new Error("Supply invalide");

  // Vérifier le propriétaire
  const owner = await token.owner();
  if (owner === ethers.constants.AddressZero) throw new Error("Propriétaire invalide");

  // Vérifier que le contrat a reçu les tokens
  const contractBalance = await token.balanceOf(deployer.address);
  if (contractBalance === 0) throw new Error("Balance incorrecte");

  console.log("✅ Toutes les vérifications sont passées");
}
```

### 3. Gestion des Gas

```javascript
// Estimer le gas avant d'envoyer
const estimatedGas = await token.estimateGas.transfer(addr1.address, amount);
console.log("Gas estimé :", estimatedGas.toString());

// Envoyer avec limite de gas personnalisée
const tx = await token.transfer(addr1.address, amount, { gasLimit: estimatedGas });
const receipt = await tx.wait();
console.log("Gas utilisé :", receipt.gasUsed.toString());
```

### 4. Tests Exhaustifs

```javascript
describe("Scénario Réaliste", function () {
  it("Should handle multiple operations", async function () {
    // 1. Ajouter validateurs
    const validators = [addr1, addr2, addr3];
    for (const v of validators) {
      await system.connect(v).addValidator({ value: ethers.utils.parseEther("1") });
    }

    // 2. Proposer des blocs
    for (let i = 0; i < 10; i++) {
      const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`block_${i}`));
      await system.connect(validators[i % 3]).proposeBlock(blockHash, 10);
    }

    // 3. Finaliser les blocs
    for (let i = 0; i < 10; i++) {
      await system.finalizeBlock(i);
    }

    // 4. Vérifier les récompenses
    for (const v of validators) {
      const validator = await system.getValidator(v.address);
      expect(validator.rewards).to.be.gt(0);
    }
  });
});
```

---

## ⚡ Optimisations

### 1. Réduction de la Consommation de Gas

```solidity
// ❌ Inefficace
for (uint256 i = 0; i < validators.length; i++) {
  total += validators[i].stake;
}

// ✅ Efficace
uint256 total = 0;
uint256 len = validators.length;
for (uint256 i = 0; i < len; i++) {
  total += validators[i].stake;
}
```

### 2. Utilisation de Mappings au lieu de Arrays

```solidity
// Pour les recherches fréquentes
mapping(address => Validator) public validatorMap;
mapping(address => uint256) public validatorIndex;

// Permet des lookups en O(1) au lieu de O(n)
```

### 3. Batch Operations

```javascript
// Ajouter plusieurs validateurs en une seule transaction
const addValidatorsTx = await Promise.all([
  validators.connect(addr1).addValidator({ value: ethers.utils.parseEther("1") }),
  validators.connect(addr2).addValidator({ value: ethers.utils.parseEther("1") }),
  validators.connect(addr3).addValidator({ value: ethers.utils.parseEther("1") })
]);
```

---

## 🔧 Troubleshooting

### Problème 1 : "Stake must be at least 1 ETH"

**Cause** : Le montant envoyé est inférieur à 1 ETH

**Solution** :
```javascript
// ❌ Incorrect
await validators.connect(addr1).addValidator({ value: ethers.utils.parseEther("0.5") });

// ✅ Correct
await validators.connect(addr1).addValidator({ value: ethers.utils.parseEther("1") });
```

### Problème 2 : "Already a validator"

**Cause** : L'adresse est déjà un validateur

**Solution** :
```javascript
// Vérifier d'abord
const validator = await validators.getValidator(addr1.address);
if (validator.active) {
  // Utiliser addStake au lieu de addValidator
  await validators.connect(addr1).addStake({ value: ethers.utils.parseEther("1") });
} else {
  // Ou ajouter comme nouveau validateur
  await validators.connect(addr1).addValidator({ value: ethers.utils.parseEther("1") });
}
```

### Problème 3 : "Transfer failed"

**Cause** : Le contrat n'a pas assez d'ETH pour envoyer les récompenses

**Solution** :
```javascript
// Vérifier le balance du contrat
const contractBalance = await ethers.provider.getBalance(validators.address);
console.log("Balance du contrat :", ethers.utils.formatEther(contractBalance));

// Envoyer des ETH au contrat si nécessaire
if (contractBalance.lt(ethers.utils.parseEther("1"))) {
  await owner.sendTransaction({
    to: validators.address,
    value: ethers.utils.parseEther("10")
  });
}
```

### Problème 4 : "Pausable: paused"

**Cause** : Le token est en pause

**Solution** :
```javascript
// Vérifier l'état
const isPaused = await token.paused();
if (isPaused) {
  // Reprendre si vous êtes propriétaire
  await token.unpause();
}
```

---

## 📈 Métriques de Performance

### 1. Consommation de Gas

| Opération | Gas Estimé |
|-----------|-----------|
| addValidator() | ~75,000 |
| proposeBlock() | ~45,000 |
| finalizeBlock() | ~50,000 |
| transfer() | ~65,000 |
| snapshot() | ~30,000 |

### 2. Temps de Confirmation

- **Hardhat**: Immédiat (local)
- **Testnet**: 10-30 secondes
- **Mainnet**: 15-300 secondes

### 3. Coûts

À Gwei 50 (mainnet):
- addValidator: ~3.75 USD
- transfer: ~3.25 USD

---

## 🔐 Sécurité Avancée

### 1. Vérification de Signatures

```javascript
const message = ethers.utils.hashMessage("blockchain-tp");
const signature = await signer.signMessage("blockchain-tp");
const recoveredAddress = ethers.utils.recoverAddress(message, signature);
console.log("Adresse récupérée :", recoveredAddress);
```

### 2. Contrôle d'Accès

```javascript
// Utiliser des modifiers pour contrôler l'accès
modifier onlyValidator(address addr) {
  require(isValidator(addr), "Only validators");
  _;
}

// Utiliser OpenZeppelin AccessControl pour plus de flexibilité
```

### 3. Gestion des Erreurs

```javascript
// Utiliser des custom errors pour économiser du gas
error InsufficientStake();
error AlreadyValidator();

function addValidator() external payable {
  if (msg.value < MINIMUM_STAKE) revert InsufficientStake();
  if (stakes[msg.sender] > 0) revert AlreadyValidator();
  // ...
}
```

---

## 📚 Ressources Supplémentaires

- [OpenZeppelin Docs](https://docs.openzeppelin.com/)
- [Hardhat Guide](https://hardhat.org/docs)
- [Solidity Best Practices](https://docs.soliditylang.org/en/latest/style-guide.html)
- [Ethereum Gas Station](https://ethgasstation.info/)

---

Bon apprentissage avancé ! 🚀
