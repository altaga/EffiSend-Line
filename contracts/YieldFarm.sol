// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.30;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for DeSmondToken
interface IDeSmondToken {
    function mint(address to, uint256 amount) external;
    function grantMinterRole(address account) external;
    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);
}

/**
 * @title YieldFarm
 * @notice Deposit KAIA to farm DES rewards.
 */
contract YieldFarm is ReentrancyGuard, Pausable, Ownable {
    IDeSmondToken public immutable desToken;

    uint256 public rewardRate; // DES per second per 1e18 KAIA
    uint256 public constant SCALING = 1e18;
    uint256 public constant MAX_REWARD_RATE = 1e20; // Safety cap
    uint256 public totalDeposited;

    struct UserInfo {
        uint256 kaiaDeposited;
        uint256 reward;
        uint256 lastUpdate;
    }
    mapping(address => UserInfo) public users;

    // ---------------- Events ----------------
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);
    event RewardsWithdrawn(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    event Swept(address indexed to, uint256 amount);

    // ---------------- Constructor ----------------
    constructor(
        IDeSmondToken _desToken,
        uint256 _rewardRate
    ) payable Ownable(msg.sender) {
        require(address(_desToken) != address(0), "Zero token");
        require(_rewardRate <= MAX_REWARD_RATE, "Reward too high");
        desToken = _desToken;
        rewardRate = _rewardRate;
    }

    // ---------------- Core Functions ----------------

    receive() external payable {
        _deposit(msg.sender, msg.value);
    }

    function deposit() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Cannot deposit 0");
        _deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot withdraw 0");
        _updateRewards(msg.sender);

        UserInfo storage user = users[msg.sender];
        require(user.kaiaDeposited >= amount, "Not enough deposited");

        user.kaiaDeposited -= amount;
        totalDeposited -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function emergencyWithdraw() external nonReentrant whenPaused {
        UserInfo storage user = users[msg.sender];
        uint256 amount = user.kaiaDeposited;
        require(amount > 0, "Nothing deposited");

        // Reset user without touching rewards
        user.kaiaDeposited = 0;
        user.reward = 0;
        totalDeposited -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit EmergencyWithdraw(msg.sender, amount);
    }

    function withdrawRewards(uint256 minExpected) external nonReentrant {
        _updateRewards(msg.sender);

        UserInfo storage user = users[msg.sender];
        require(user.reward >= minExpected, "Slippage");

        uint256 reward = user.reward;
        user.reward = 0;

        desToken.mint(msg.sender, reward);
        emit RewardsWithdrawn(msg.sender, reward);
    }

    // ---------------- Internal Logic ----------------

    function _deposit(address user, uint256 amount) internal {
        _updateRewards(user);
        users[user].kaiaDeposited += amount;
        totalDeposited += amount;
        emit Deposited(user, amount);
    }

    function _updateRewards(address account) private {
        UserInfo storage user = users[account];
        uint256 lastUpdate = user.lastUpdate;
        uint256 deposited = user.kaiaDeposited;

        if (deposited > 0 && rewardRate > 0 && lastUpdate > 0) {
            uint256 timeElapsed = block.timestamp - lastUpdate;
            uint256 newReward = (timeElapsed * deposited * rewardRate) / SCALING;
            user.reward += newReward;
        }

        user.lastUpdate = block.timestamp;
    }

    // ---------------- Admin Functions ----------------

    function setRewardRate(uint256 _rate) external onlyOwner {
        require(_rate <= MAX_REWARD_RATE, "Reward too high");
        rewardRate = _rate;
        emit RewardRateUpdated(_rate);
    }

    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    function sweep(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        require(address(this).balance >= amount, "Not enough balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");

        emit Swept(to, amount);
    }

    // ---------------- Views ----------------

    function getDeposited(address user) external view returns (uint256) {
        return users[user].kaiaDeposited;
    }

    function getPendingRewards(address user) external view returns (uint256) {
        UserInfo storage u = users[user];
        uint256 lastUpdate = u.lastUpdate;
        if (u.kaiaDeposited == 0 || rewardRate == 0 || lastUpdate == 0) {
            return u.reward;
        }

        uint256 timeElapsed = block.timestamp - lastUpdate;
        uint256 newReward = (timeElapsed * u.kaiaDeposited * rewardRate) / SCALING;
        return u.reward + newReward;
    }
}
