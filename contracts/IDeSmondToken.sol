// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.30;

interface IDeSmondToken {
    // --------- Minting ---------
    function mint(address to, uint256 amount) external;
    function grantMinterRole(address account) external;
    function revokeMinterRole(address account) external;

    // --------- Burning ---------
    function burn(uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;

    // --------- Views ---------
    function MINTER_ROLE() external view returns (bytes32);
    function hasRole(bytes32 role, address account) external view returns (bool);

    // --------- Events ---------
    event MinterGranted(address indexed account);
    event MinterRevoked(address indexed account);
    event TokensBurned(address indexed account, uint256 amount);
}
