// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Validators
 * @dev Implémentation d'un système de validateurs pour la blockchain
 * @notice Ce contrat gère les validateurs, leurs stakes et la création de blocs
 */
contract Validators {
    
    // ============ Types & Enums ============
    
    /// @dev Structure d'un validateur
    struct Validator {
        address addr;
        uint256 stake;
        uint256 blocksProposed;
        uint256 blocksValidated;
        bool active;
        uint256 joinedAt;
        uint256 rewards;
    }
    
    /// @dev Structure d'un bloc proposé
    struct ProposedBlock {
        address proposer;
        uint256 timestamp;
        uint256 blockNumber;
        bytes32 blockHash;
        uint256 transactions;
        bool finalized;
    }
    
    // ============ State Variables ============
    
    /// @dev Tableau des validateurs
    Validator[] public validators;
    
    /// @dev Mapping address -> index dans le tableau
    mapping(address => uint256) public validatorIndex;
    
    /// @dev Mapping address -> stake
    mapping(address => uint256) public stakes;
    
    /// @dev Tableau des blocs proposés
    ProposedBlock[] public proposedBlocks;
    
    /// @dev Nombre minimum de stake requis
    uint256 public constant MINIMUM_STAKE = 1 ether;
    
    /// @dev Reward par bloc validé
    uint256 public rewardPerBlock = 0.01 ether;
    
    /// @dev Propriétaire du contrat
    address public owner;
    
    /// @dev Nombre total de blocs finalisés
    uint256 public finalizedBlocksCount;
    
    // ============ Events ============
    
    /// @dev Émis quand un validateur est ajouté
    event ValidatorAdded(
        address indexed validator,
        uint256 stake,
        uint256 timestamp
    );
    
    /// @dev Émis quand un bloc est proposé
    event BlockProposed(
        address indexed proposer,
        uint256 blockNumber,
        uint256 transactions,
        uint256 timestamp
    );
    
    /// @dev Émis quand un bloc est finalisé
    event BlockFinalized(
        address indexed proposer,
        uint256 blockNumber,
        uint256 timestamp
    );
    
    /// @dev Émis quand un validateur reçoit une récompense
    event RewardDistributed(
        address indexed validator,
        uint256 amount,
        uint256 timestamp
    );
    
    /// @dev Émis quand un validateur est retiré
    event ValidatorRemoved(
        address indexed validator,
        uint256 stake,
        uint256 timestamp
    );
    
    /// @dev Émis quand un validateur se retire
    event ValidatorWithdrawn(
        address indexed validator,
        uint256 stake,
        uint256 timestamp
    );
    
    // ============ Modifiers ============
    
    /// @dev Vérifie que l'appelant est le propriétaire
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @dev Vérifie que l'adresse est un validateur actif
    modifier onlyValidator(address addr) {
        uint256 index = validatorIndex[addr];
        require(
            index < validators.length && validators[index].addr == addr && validators[index].active,
            "Address is not an active validator"
        );
        _;
    }
    
    /// @dev Vérifie que le stake est suffisant
    modifier sufficientStake() {
        require(msg.value >= MINIMUM_STAKE, "Stake must be at least 1 ETH");
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @dev Initialise le contrat
     */
    constructor() {
        owner = msg.sender;
        finalizedBlocksCount = 0;
    }
    
    // ============ Validator Management ============
    
    /**
     * @dev Ajoute un nouveau validateur
     * @notice Le validateur doit envoyer au moins 1 ETH comme stake
     */
    function addValidator() external payable sufficientStake {
        require(stakes[msg.sender] == 0, "Already a validator");
        
        Validator memory newValidator = Validator({
            addr: msg.sender,
            stake: msg.value,
            blocksProposed: 0,
            blocksValidated: 0,
            active: true,
            joinedAt: block.timestamp,
            rewards: 0
        });
        
        validatorIndex[msg.sender] = validators.length;
        validators.push(newValidator);
        stakes[msg.sender] = msg.value;
        
        emit ValidatorAdded(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Ajoute plus de stake à un validateur existant
     */
    function addStake() external payable {
        require(msg.value > 0, "Stake must be greater than 0");
        require(stakes[msg.sender] > 0, "Not a validator");
        
        uint256 index = validatorIndex[msg.sender];
        validators[index].stake += msg.value;
        stakes[msg.sender] += msg.value;
        
        emit ValidatorAdded(msg.sender, msg.value, block.timestamp);
    }
    
    /**
     * @dev Retire un validateur du système
     * @param validator L'adresse du validateur à retirer
     * @notice Seulement le propriétaire peut appeler cette fonction
     */
    function removeValidator(address validator) external onlyOwner {
        uint256 index = validatorIndex[validator];
        require(index < validators.length, "Validator not found");
        require(validators[index].addr == validator, "Invalid validator");
        
        Validator storage v = validators[index];
        require(v.active, "Validator already inactive");
        
        uint256 stake = v.stake;
        v.active = false;
        stakes[validator] = 0;
        
        // Transférer le stake
        (bool success, ) = validator.call{value: stake}("");
        require(success, "Transfer failed");
        
        emit ValidatorRemoved(validator, stake, block.timestamp);
    }
    
    /**
     * @dev Permet à un validateur de se retirer
     */
    function withdrawValidator() external onlyValidator(msg.sender) {
        uint256 index = validatorIndex[msg.sender];
        Validator storage v = validators[index];
        
        uint256 stake = v.stake;
        uint256 rewards = v.rewards;
        uint256 totalAmount = stake + rewards;
        
        v.active = false;
        v.stake = 0;
        v.rewards = 0;
        stakes[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: totalAmount}("");
        require(success, "Transfer failed");
        
        emit ValidatorWithdrawn(msg.sender, stake, block.timestamp);
    }
    
    // ============ Block Management ============
    
    /**
     * @dev Propose un nouveau bloc
     * @param blockHash Le hash du bloc
     * @param transactions Le nombre de transactions
     */
    function proposeBlock(bytes32 blockHash, uint256 transactions) 
        external 
        onlyValidator(msg.sender) 
    {
        uint256 index = validatorIndex[msg.sender];
        Validator storage v = validators[index];
        
        ProposedBlock memory newBlock = ProposedBlock({
            proposer: msg.sender,
            timestamp: block.timestamp,
            blockNumber: proposedBlocks.length,
            blockHash: blockHash,
            transactions: transactions,
            finalized: false
        });
        
        proposedBlocks.push(newBlock);
        v.blocksProposed++;
        
        emit BlockProposed(
            msg.sender,
            newBlock.blockNumber,
            transactions,
            block.timestamp
        );
    }
    
    /**
     * @dev Finalise un bloc proposé
     * @param blockNumber Le numéro du bloc à finaliser
     * @notice Seulement le propriétaire peut appeler cette fonction
     */
    function finalizeBlock(uint256 blockNumber) external onlyOwner {
        require(blockNumber < proposedBlocks.length, "Block does not exist");
        
        ProposedBlock storage block_struct = proposedBlocks[blockNumber];
        require(!block_struct.finalized, "Block already finalized");
        
        block_struct.finalized = true;
        finalizedBlocksCount++;
        
        // Distribuer les récompenses
        uint256 index = validatorIndex[block_struct.proposer];
        if (index < validators.length) {
            validators[index].blocksValidated++;
            validators[index].rewards += rewardPerBlock;
            
            emit RewardDistributed(
                block_struct.proposer,
                rewardPerBlock,
                block.timestamp
            );
        }
        
        emit BlockFinalized(block_struct.proposer, blockNumber, block.timestamp);
    }
    
    /**
     * @dev Retire les récompenses d'un validateur
     */
    function claimRewards() external onlyValidator(msg.sender) {
        uint256 index = validatorIndex[msg.sender];
        Validator storage v = validators[index];
        
        require(v.rewards > 0, "No rewards to claim");
        
        uint256 rewards = v.rewards;
        v.rewards = 0;
        
        (bool success, ) = msg.sender.call{value: rewards}("");
        require(success, "Reward transfer failed");
        
        emit RewardDistributed(msg.sender, rewards, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Retourne le nombre de validateurs
     */
    function getValidatorCount() external view returns (uint256) {
        return validators.length;
    }
    
    /**
     * @dev Retourne les informations d'un validateur
     */
    function getValidator(address addr) external view returns (Validator memory) {
        uint256 index = validatorIndex[addr];
        require(index < validators.length, "Validator not found");
        return validators[index];
    }
    
    /**
     * @dev Retourne le nombre de blocs proposés
     */
    function getProposedBlocksCount() external view returns (uint256) {
        return proposedBlocks.length;
    }
    
    /**
     * @dev Retourne les informations d'un bloc proposé
     */
    function getProposedBlock(uint256 blockNumber) external view returns (ProposedBlock memory) {
        require(blockNumber < proposedBlocks.length, "Block does not exist");
        return proposedBlocks[blockNumber];
    }
    
    /**
     * @dev Retourne le stake total du réseau
     */
    function getTotalStake() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i].active) {
                total += validators[i].stake;
            }
        }
        return total;
    }
    
    /**
     * @dev Retourne la liste des validateurs actifs
     */
    function getActiveValidators() external view returns (Validator[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i].active) {
                activeCount++;
            }
        }
        
        Validator[] memory activeValidators = new Validator[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i].active) {
                activeValidators[index] = validators[i];
                index++;
            }
        }
        return activeValidators;
    }
    
    /**
     * @dev Retourne les statistiques du réseau
     */
    function getNetworkStats() external view returns (
        uint256 totalValidators,
        uint256 activeValidators,
        uint256 totalStake,
        uint256 proposedBlocks,
        uint256 finalizedBlocks
    ) {
        uint256 active = 0;
        uint256 total = 0;
        
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i].active) {
                active++;
                total += validators[i].stake;
            }
        }
        
        return (
            validators.length,
            active,
            total,
            proposedBlocks.length,
            finalizedBlocksCount
        );
    }
    
    // ============ Admin Functions ============
    
    /**
     * @dev Change la récompense par bloc
     */
    function setRewardPerBlock(uint256 newReward) external onlyOwner {
        rewardPerBlock = newReward;
    }
    
    /**
     * @dev Transfère la propriété du contrat
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
    
    // ============ Receive Function ============
    
    /// @dev Permet de recevoir des ETH
    receive() external payable {}
}
