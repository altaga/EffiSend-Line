// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.30;

interface IYieldFarm {
    // -------- Core --------
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function emergencyWithdraw() external;
    function withdrawRewards(uint256 minExpected) external;

    // -------- Views --------
    function getDeposited(address user) external view returns (uint256);
    function getPendingRewards(address user) external view returns (uint256);

    // -------- Admin --------
    function setRewardRate(uint256 _rate) external;
    function pause() external;
    function unpause() external;
    function sweep(address to, uint256 amount) external;

    // -------- State --------
    function desToken() external view returns (address);
    function rewardRate() external view returns (uint256);
    function totalDeposited() external view returns (uint256);
}
