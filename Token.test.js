// SPDX-License-Identifier: MIT
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken - ERC20 Token", function () {
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy();
    await token.deployed();

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
  });

  describe("Déploiement", function () {
    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("BlockchainToken");
      expect(await token.symbol()).to.equal("BCT");
    });

    it("Should have correct decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint initial supply to owner", async function () {
      const expectedSupply = ethers.utils.parseEther("1000000");
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(expectedSupply);
    });

    it("Should have correct total supply", async function () {
      const expectedSupply = ethers.utils.parseEther("1000000");
      expect(await token.totalSupply()).to.equal(expectedSupply);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.utils.parseEther("50");
      await token.transfer(addr1.address, transferAmount);
      
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(transferAmount);
    });

    it("Should fail if sender has insufficient balance", async function () {
      const insufficientAmount = ethers.utils.parseEther("1000001");
      await expect(
        token.transfer(addr1.address, insufficientAmount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should update balances after transfer", async function () {
      const transferAmount = ethers.utils.parseEther("100");
      
      const initialOwnerBalance = await token.balanceOf(owner.address);
      await token.transfer(addr1.address, transferAmount);
      await token.connect(addr1).transfer(addr2.address, transferAmount);
      
      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(transferAmount));
      expect(await token.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should emit Transfer event", async function () {
      const transferAmount = ethers.utils.parseEther("50");
      await expect(
        token.transfer(addr1.address, transferAmount)
      ).to.emit(token, "Transfer").withArgs(owner.address, addr1.address, transferAmount);
    });
  });

  describe("Approvals", function () {
    it("Should approve tokens for spending", async function () {
      const approveAmount = ethers.utils.parseEther("100");
      await token.approve(addr1.address, approveAmount);
      
      const allowance = await token.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(approveAmount);
    });

    it("Should emit Approval event", async function () {
      const approveAmount = ethers.utils.parseEther("100");
      await expect(
        token.approve(addr1.address, approveAmount)
      ).to.emit(token, "Approval").withArgs(owner.address, addr1.address, approveAmount);
    });

    it("Should transferFrom with approval", async function () {
      const approveAmount = ethers.utils.parseEther("100");
      await token.approve(addr1.address, approveAmount);
      
      await token.connect(addr1).transferFrom(owner.address, addr2.address, approveAmount);
      expect(await token.balanceOf(addr2.address)).to.equal(approveAmount);
    });
  });

  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const burnAmount = ethers.utils.parseEther("100");
      await token.burn(burnAmount);
      
      const expectedSupply = ethers.utils.parseEther("999900");
      expect(await token.totalSupply()).to.equal(expectedSupply);
    });

    it("Should emit Burn event", async function () {
      const burnAmount = ethers.utils.parseEther("50");
      await expect(token.burn(burnAmount)).to.emit(token, "Transfer");
    });
  });

  describe("Pause", function () {
    it("Should pause transfers", async function () {
      await token.pause();
      
      await expect(
        token.transfer(addr1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should unpause transfers", async function () {
      await token.pause();
      await token.unpause();
      
      const transferAmount = ethers.utils.parseEther("100");
      await expect(
        token.transfer(addr1.address, transferAmount)
      ).not.to.be.reverted;
    });

    it("Should only allow owner to pause", async function () {
      await expect(
        token.connect(addr1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Blacklist", function () {
    it("Should add address to blacklist", async function () {
      await token.addToBlacklist(addr1.address);
      expect(await token.isBlacklisted(addr1.address)).to.be.true;
    });

    it("Should prevent blacklisted address from transferring", async function () {
      await token.transfer(addr1.address, ethers.utils.parseEther("100"));
      await token.addToBlacklist(addr1.address);
      
      await expect(
        token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("50"))
      ).to.be.revertedWith("Sender is blacklisted");
    });

    it("Should prevent transfer to blacklisted address", async function () {
      await token.addToBlacklist(addr1.address);
      
      await expect(
        token.transfer(addr1.address, ethers.utils.parseEther("100"))
      ).to.be.revertedWith("Recipient is blacklisted");
    });

    it("Should remove address from blacklist", async function () {
      await token.addToBlacklist(addr1.address);
      await token.removeFromBlacklist(addr1.address);
      expect(await token.isBlacklisted(addr1.address)).to.be.false;
    });
  });

  describe("Snapshots", function () {
    it("Should create snapshot", async function () {
      const tx = await token.snapshot();
      expect(await token.getSnapshotCount()).to.equal(1);
    });

    it("Should track balance at snapshot", async function () {
      const transferAmount = ethers.utils.parseEther("100");
      await token.transfer(addr1.address, transferAmount);
      
      const tx = await token.snapshot();
      const receipt = await tx.wait();
      
      const balance = await token.balanceOfAt(addr1.address, 1);
      expect(balance).to.equal(transferAmount);
    });

    it("Should track supply at snapshot", async function () {
      const expectedSupply = await token.totalSupply();
      await token.snapshot();
      
      const supply = await token.totalSupplyAt(1);
      expect(supply).to.equal(expectedSupply);
    });
  });

  describe("Token Info", function () {
    it("Should return correct token info", async function () {
      const [name, symbol, decimals, supply] = await token.getTokenInfo();
      
      expect(name).to.equal("BlockchainToken");
      expect(symbol).to.equal("BCT");
      expect(decimals).to.equal(18);
      expect(supply).to.equal(ethers.utils.parseEther("1000000"));
    });
  });
});

describe("Validators - Blockchain Validators", function () {
  let validators;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;

  beforeEach(async function () {
    const Validators = await ethers.getContractFactory("Validators");
    validators = await Validators.deploy();
    await validators.deployed();

    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
  });

  describe("Validateur Management", function () {
    it("Should add a new validator", async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
      
      expect(await validators.getValidatorCount()).to.equal(1);
    });

    it("Should emit ValidatorAdded event", async function () {
      const stake = ethers.utils.parseEther("1");
      await expect(
        validators.connect(addr1).addValidator({ value: stake })
      ).to.emit(validators, "ValidatorAdded");
    });

    it("Should prevent adding validator with insufficient stake", async function () {
      const insufficientStake = ethers.utils.parseEther("0.5");
      await expect(
        validators.connect(addr1).addValidator({ value: insufficientStake })
      ).to.be.revertedWith("Stake must be at least 1 ETH");
    });

    it("Should prevent duplicate validators", async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
      
      await expect(
        validators.connect(addr1).addValidator({ value: stake })
      ).to.be.revertedWith("Already a validator");
    });

    it("Should add additional stake", async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
      
      const additionalStake = ethers.utils.parseEther("0.5");
      await validators.connect(addr1).addStake({ value: additionalStake });
      
      const validator = await validators.getValidator(addr1.address);
      expect(validator.stake).to.equal(stake.add(additionalStake));
    });
  });

  describe("Block Proposal", function () {
    beforeEach(async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
    });

    it("Should propose a block", async function () {
      const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block1"));
      const transactions = 10;
      
      await expect(
        validators.connect(addr1).proposeBlock(blockHash, transactions)
      ).to.emit(validators, "BlockProposed");
      
      expect(await validators.getProposedBlocksCount()).to.equal(1);
    });

    it("Should prevent non-validator from proposing block", async function () {
      const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block1"));
      
      await expect(
        validators.connect(addr2).proposeBlock(blockHash, 10)
      ).to.be.revertedWith("Address is not an active validator");
    });

    it("Should track proposed blocks", async function () {
      const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block1"));
      await validators.connect(addr1).proposeBlock(blockHash, 5);
      
      const block = await validators.getProposedBlock(0);
      expect(block.proposer).to.equal(addr1.address);
      expect(block.transactions).to.equal(5);
      expect(block.finalized).to.be.false;
    });
  });

  describe("Block Finalization", function () {
    beforeEach(async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
      
      const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block1"));
      await validators.connect(addr1).proposeBlock(blockHash, 10);
    });

    it("Should finalize a proposed block", async function () {
      await expect(
        validators.finalizeBlock(0)
      ).to.emit(validators, "BlockFinalized");
      
      const block = await validators.getProposedBlock(0);
      expect(block.finalized).to.be.true;
    });

    it("Should prevent finalization of non-existent block", async function () {
      await expect(
        validators.finalizeBlock(5)
      ).to.be.revertedWith("Block does not exist");
    });

    it("Should only allow owner to finalize", async function () {
      await expect(
        validators.connect(addr2).finalizeBlock(0)
      ).to.be.revertedWith("Only owner can call this function");
    });

    it("Should distribute rewards on finalization", async function () {
      await validators.finalizeBlock(0);
      
      const validator = await validators.getValidator(addr1.address);
      const rewardPerBlock = await validators.rewardPerBlock();
      expect(validator.rewards).to.equal(rewardPerBlock);
    });

    it("Should prevent double finalization", async function () {
      await validators.finalizeBlock(0);
      
      await expect(
        validators.finalizeBlock(0)
      ).to.be.revertedWith("Block already finalized");
    });
  });

  describe("Rewards", function () {
    beforeEach(async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
      
      const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block1"));
      await validators.connect(addr1).proposeBlock(blockHash, 10);
      await validators.finalizeBlock(0);
    });

    it("Should claim rewards", async function () {
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const tx = await validators.connect(addr1).claimRewards();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      const rewardPerBlock = await validators.rewardPerBlock();
      
      expect(finalBalance.add(gasUsed)).to.be.closeTo(initialBalance.add(rewardPerBlock), ethers.utils.parseEther("0.001"));
    });

    it("Should prevent claiming when no rewards", async function () {
      await validators.connect(addr1).claimRewards();
      
      await expect(
        validators.connect(addr1).claimRewards()
      ).to.be.revertedWith("No rewards to claim");
    });
  });

  describe("Network Statistics", function () {
    it("Should return network stats", async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
      await validators.connect(addr2).addValidator({ value: stake });
      
      const [totalValidators, activeValidators, totalStake, proposedBlocks, finalizedBlocks] = 
        await validators.getNetworkStats();
      
      expect(totalValidators).to.equal(2);
      expect(activeValidators).to.equal(2);
      expect(totalStake).to.equal(stake.mul(2));
      expect(proposedBlocks).to.equal(0);
      expect(finalizedBlocks).to.equal(0);
    });

    it("Should return active validators only", async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
      await validators.connect(addr2).addValidator({ value: stake });
      
      const activeValidators = await validators.getActiveValidators();
      expect(activeValidators.length).to.equal(2);
    });
  });

  describe("Validator Removal", function () {
    beforeEach(async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
    });

    it("Should remove a validator", async function () {
      await validators.removeValidator(addr1.address);
      
      const [, activeValidators] = await validators.getNetworkStats();
      expect(activeValidators).to.equal(0);
    });

    it("Should transfer stake back on removal", async function () {
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const stake = ethers.utils.parseEther("1");
      
      const tx = await validators.removeValidator(addr1.address);
      await tx.wait();
      
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.equal(initialBalance.add(stake));
    });

    it("Should only allow owner to remove", async function () {
      await expect(
        validators.connect(addr2).removeValidator(addr1.address)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Validator Withdrawal", function () {
    beforeEach(async function () {
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr1).addValidator({ value: stake });
    });

    it("Should allow validator to withdraw", async function () {
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      const stake = ethers.utils.parseEther("1");
      
      const tx = await validators.connect(addr1).withdrawValidator();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance.add(gasUsed)).to.be.closeTo(initialBalance.add(stake), ethers.utils.parseEther("0.001"));
    });
  });

  describe("Admin Functions", function () {
    it("Should set reward per block", async function () {
      const newReward = ethers.utils.parseEther("0.05");
      await validators.setRewardPerBlock(newReward);
      
      expect(await validators.rewardPerBlock()).to.equal(newReward);
    });

    it("Should transfer ownership", async function () {
      await validators.transferOwnership(addr1.address);
      
      // Vérifier que seul le nouveau propriétaire peut finaliser
      const blockHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("block1"));
      const stake = ethers.utils.parseEther("1");
      await validators.connect(addr2).addValidator({ value: stake });
      await validators.connect(addr2).proposeBlock(blockHash, 10);
      
      await expect(
        validators.finalizeBlock(0)
      ).to.be.revertedWith("Only owner can call this function");
    });
  });
});
