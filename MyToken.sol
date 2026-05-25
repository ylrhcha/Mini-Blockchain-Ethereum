// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MyToken
 * @dev Implémentation d'un token ERC-20 avec fonctionnalités avancées
 * @notice Ce token est utilisé dans le TP Mini-Blockchain Ethereum
 */
contract MyToken is 
    ERC20, 
    ERC20Burnable, 
    ERC20Snapshot, 
    Ownable, 
    Pausable 
{
    // ============ Variables ============
    
    /// @dev Nombre total de snapshots
    uint256 private _snapshotCounter;
    
    /// @dev Mapping des adresses blacklistées
    mapping(address => bool) public blacklisted;
    
    /// @dev Événement pour le blacklist
    event AddedToBlacklist(address indexed account);
    event RemovedFromBlacklist(address indexed account);
    
    // ============ Constructor ============
    
    /**
     * @dev Initialise le contrat avec 1 million de tokens
     * @notice Le propriétaire reçoit tous les tokens initialement
     */
    constructor() ERC20("BlockchainToken", "BCT") {
        // Mint 1 million de tokens avec 18 décimales
        uint256 initialSupply = 1_000_000 * 10 ** decimals();
        _mint(msg.sender, initialSupply);
        _snapshotCounter = 0;
    }
    
    // ============ Pause Functions ============
    
    /**
     * @dev Met en pause les transferts
     * @notice Seulement le propriétaire peut appeler cette fonction
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Reprend les transferts
     * @notice Seulement le propriétaire peut appeler cette fonction
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    // ============ Snapshot Functions ============
    
    /**
     * @dev Crée un snapshot de l'état actuel du token
     * @return Le numéro du snapshot créé
     * @notice Utile pour les votes et audits
     */
    function snapshot() public onlyOwner returns (uint256) {
        _snapshotCounter++;
        _snapshot();
        return _snapshotCounter;
    }
    
    /**
     * @dev Retourne le solde d'un compte à un snapshot donné
     * @param account L'adresse du compte
     * @param snapshotId Le numéro du snapshot
     * @return Le solde du compte au moment du snapshot
     */
    function balanceOfAt(address account, uint256 snapshotId) 
        public 
        view 
        returns (uint256) 
    {
        return super.balanceOfAt(account, snapshotId);
    }
    
    /**
     * @dev Retourne le total des tokens à un snapshot donné
     * @param snapshotId Le numéro du snapshot
     * @return Le total des tokens au moment du snapshot
     */
    function totalSupplyAt(uint256 snapshotId) 
        public 
        view 
        returns (uint256) 
    {
        return super.totalSupplyAt(snapshotId);
    }
    
    // ============ Blacklist Functions ============
    
    /**
     * @dev Ajoute une adresse à la blacklist
     * @param account L'adresse à blacklister
     * @notice Seulement le propriétaire peut appeler cette fonction
     */
    function addToBlacklist(address account) public onlyOwner {
        require(account != address(0), "Cannot blacklist zero address");
        blacklisted[account] = true;
        emit AddedToBlacklist(account);
    }
    
    /**
     * @dev Retire une adresse de la blacklist
     * @param account L'adresse à retirer
     * @notice Seulement le propriétaire peut appeler cette fonction
     */
    function removeFromBlacklist(address account) public onlyOwner {
        require(account != address(0), "Cannot manage zero address");
        blacklisted[account] = false;
        emit RemovedFromBlacklist(account);
    }
    
    /**
     * @dev Vérifie si une adresse est blacklistée
     * @param account L'adresse à vérifier
     * @return true si l'adresse est blacklistée
     */
    function isBlacklisted(address account) public view returns (bool) {
        return blacklisted[account];
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Surcharge de _beforeTokenTransfer pour inclure les pauses et snapshots
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    )
        internal
        override(ERC20, ERC20Snapshot)
        whenNotPaused
    {
        require(!blacklisted[from], "Sender is blacklisted");
        require(!blacklisted[to], "Recipient is blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Surcharge de _afterTokenTransfer pour les snapshots
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    )
        internal
        override(ERC20)
    {
        super._afterTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Surcharge de _mint pour les snapshots
     */
    function _mint(address to, uint256 amount)
        internal
        override(ERC20)
    {
        super._mint(to, amount);
    }
    
    /**
     * @dev Surcharge de _burn pour les snapshots
     */
    function _burn(address account, uint256 amount)
        internal
        override(ERC20)
    {
        super._burn(account, amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @dev Retourne le nombre actuel de snapshots
     * @return Le numéro du dernier snapshot
     */
    function getSnapshotCount() public view returns (uint256) {
        return _snapshotCounter;
    }
    
    /**
     * @dev Retourne les informations du token
     * @return nom, symbole, décimales et supply total
     */
    function getTokenInfo() public view returns (
        string memory nom,
        string memory symbole,
        uint8 dec,
        uint256 supply
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply()
        );
    }
}
