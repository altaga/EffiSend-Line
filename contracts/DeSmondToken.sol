// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DeSmondToken (DES)
 * @notice ERC20 token with role-based minting and burning control.
 */
contract DeSmondToken is ERC20, AccessControl {
    /// @dev Role identifier for accounts allowed to mint new tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Fixed initial supply: 100 billion DES
    uint256 public constant INITIAL_SUPPLY = 100_000_000_000 * 10**18;

    // ---------------- Events ----------------

    /// @notice Emitted when a new minter role is granted
    event MinterGranted(address indexed account);

    /// @notice Emitted when a minter role is revoked
    event MinterRevoked(address indexed account);

    /// @notice Emitted when tokens are burned
    event TokensBurned(address indexed account, uint256 amount);

    // ---------------- Constructor ----------------

    constructor() ERC20("DeSmondToken", "DES") {
        // Mint the initial supply to the deployer
        _mint(msg.sender, INITIAL_SUPPLY);

        // Grant admin & minter rights to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    // ---------------- Minting ----------------

    /**
     * @dev Mint new tokens (only MINTER_ROLE can call).
     * @param to Recipient address.
     * @param amount Amount to mint.
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(to != address(0), "Mint to zero address");
        _mint(to, amount);
    }

    /**
     * @dev Grant MINTER_ROLE to an account (only admin can call).
     */
    function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Zero address");
        _grantRole(MINTER_ROLE, account);
        emit MinterGranted(account);
    }

    /**
     * @dev Revoke MINTER_ROLE from an account (only admin can call).
     */
    function revokeMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MINTER_ROLE, account);
        emit MinterRevoked(account);
    }

    // ---------------- Burning ----------------

    /**
     * @dev Burn tokens from caller's account.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from another account (only MINTER_ROLE can call).
     */
    function burnFrom(address account, uint256 amount) public onlyRole(MINTER_ROLE) {
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }
}
