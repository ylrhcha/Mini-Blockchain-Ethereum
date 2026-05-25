const hre = require("hardhat");

/**
 * Script de déploiement pour la Mini-Blockchain Ethereum
 * Déploie le Token et le système de Validateurs
 */

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     🚀 Déploiement de la Mini-Blockchain Ethereum      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Obtenir les comptes de déploiement
  const [deployer] = await hre.ethers.getSigners();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("📊 Informations du Déploiement:");
  console.log(`   Compte: ${deployer.address}`);
  console.log(`   Balance: ${hre.ethers.utils.formatEther(deployerBalance)} ETH\n`);

  try {
    // ============ DÉPLOIEMENT DU TOKEN ============
    console.log("1️⃣  Déploiement du Token (MyToken)...");
    console.log("   ⏳ Compilation en cours...");

    const MyToken = await hre.ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy();
    await myToken.deployed();

    console.log(`   ✅ Token déployé à: ${myToken.address}`);

    // Vérifier les informations du token
    const [name, symbol, decimals, supply] = await myToken.getTokenInfo();
    console.log(`   📋 Informations du Token:`);
    console.log(`      - Nom: ${name}`);
    console.log(`      - Symbole: ${symbol}`);
    console.log(`      - Décimales: ${decimals}`);
    console.log(`      - Supply: ${hre.ethers.utils.formatEther(supply)} ${symbol}\n`);

    // ============ DÉPLOIEMENT DU SYSTÈME DE VALIDATEURS ============
    console.log("2️⃣  Déploiement du Système de Validateurs...");
    console.log("   ⏳ Compilation en cours...");

    const Validators = await hre.ethers.getContractFactory("Validators");
    const validators = await Validators.deploy();
    await validators.deployed();

    console.log(`   ✅ Validators déployé à: ${validators.address}`);

    const rewardPerBlock = await validators.rewardPerBlock();
    console.log(`   📋 Configuration initiale:`);
    console.log(`      - Récompense par bloc: ${hre.ethers.utils.formatEther(rewardPerBlock)} ETH`);
    console.log(`      - Propriétaire: ${deployer.address}\n`);

    // ============ VÉRIFICATIONS POST-DÉPLOIEMENT ============
    console.log("3️⃣  Vérifications Post-Déploiement...\n");

    // Vérifier le propriétaire du token
    const tokenOwner = await myToken.owner();
    console.log(`   ✓ Propriétaire du Token: ${tokenOwner}`);

    // Vérifier le balance du deployer
    const tokenBalance = await myToken.balanceOf(deployer.address);
    console.log(`   ✓ Balance du Deployer: ${hre.ethers.utils.formatEther(tokenBalance)} ${symbol}`);

    // Vérifier le propriétaire des validateurs
    const validatorsOwner = await validators.owner();
    console.log(`   ✓ Propriétaire des Validateurs: ${validatorsOwner}`);

    // Vérifier le nombre initial de validateurs
    const validatorCount = await validators.getValidatorCount();
    console.log(`   ✓ Nombre de validateurs: ${validatorCount}\n`);

    // ============ RAPPORT DE DÉPLOIEMENT ============
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║           📋 RAPPORT DE DÉPLOIEMENT                    ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`║ Token (MyToken)                                        ║`);
    console.log(`║   Adresse: ${myToken.address.substring(0, 42)}    ║`);
    console.log(`║ Système de Validateurs                                 ║`);
    console.log(`║   Adresse: ${validators.address.substring(0, 42)}    ║`);
    console.log(`║ Deployer                                               ║`);
    console.log(`║   Adresse: ${deployer.address.substring(0, 42)}    ║`);
    console.log(`║   Balance: ${hre.ethers.utils.formatEther(deployerBalance).substring(0, 10)} ETH                     ║`);
    console.log("╚════════════════════════════════════════════════════════╝\n");

    // ============ EXEMPLES D'UTILISATION ============
    console.log("💡 Exemples d'Utilisation:\n");

    console.log("1. Ajouter un validateur:");
    console.log(`   validators.connect(signer).addValidator({ value: ethers.utils.parseEther("1") })\n`);

    console.log("2. Proposer un bloc:");
    console.log(`   const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block1"));`);
    console.log(`   validators.connect(signer).proposeBlock(blockHash, 10)\n`);

    console.log("3. Finaliser un bloc:");
    console.log(`   validators.finalizeBlock(0)\n`);

    console.log("4. Transférer des tokens:");
    console.log(`   myToken.transfer(destinataire, ethers.utils.parseEther("100"))\n`);

    console.log("5. Consulter les statistiques du réseau:");
    console.log(`   const stats = await validators.getNetworkStats();`);
    console.log(`   console.log("Validateurs actifs:", stats.activeValidators);\n`);

    // ============ SAUVEGARDE DES ADRESSES ============
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: hre.network.name,
      deployer: deployer.address,
      MyToken: {
        address: myToken.address,
        name: name,
        symbol: symbol,
        decimals: decimals,
        totalSupply: hre.ethers.utils.formatEther(supply)
      },
      Validators: {
        address: validators.address,
        owner: validatorsOwner,
        rewardPerBlock: hre.ethers.utils.formatEther(rewardPerBlock),
        validatorCount: validatorCount.toString()
      }
    };

    // Afficher les informations au format JSON
    console.log("📝 Informations de Déploiement (JSON):");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    console.log("\n✨ Déploiement terminé avec succès!");

  } catch (error) {
    console.error("\n❌ Erreur lors du déploiement:");
    console.error(error);
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
