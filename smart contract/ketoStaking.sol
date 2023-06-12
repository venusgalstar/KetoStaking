// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract realSwap is Ownable {

    using SafeMath for uint256;

    uint8 pauseContract = 0;
    ERC20 realToken;
    address realTokenAddress;
    uint256 apr;
    uint256 yearSecond = 31536000;

    address devWallet = 0xE3E7f26a22f5227cDaa643Bc9aE458b3114301D1;

    mapping(address=>uint256) stakingStatus;
    mapping(address=>uint256) claimTimestamp;
    mapping(address=>uint256) rewardStatus;

    uint256 totalStaked;
    uint256 totalReward;

    event Received(address, uint);
    event Fallback(address, uint);
    event SetContractStatus(address addr, uint256 pauseValue);
    event WithdrawAll(address addr, uint256 token, uint256 native);
    event Staked(address, uint256);
    event Claimed(address, uint256);
    event Unstaked(address, uint256);
    event ChangeRealTokenAddress(address, address);
    
    constructor() 
    {          
        realTokenAddress = address(0xD09E5aef492DbBe11A74c5d1B20e3e0d19653374);
        realToken = ERC20(realTokenAddress);
        apr = 3626640000;
        totalStaked = 0;
    }
    
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    fallback() external payable { 
        emit Fallback(msg.sender, msg.value);
    }

    function getContractStatus() public view returns (uint8) {
        return pauseContract;
    }

    function setContractStatus(uint8 _newPauseContract) external onlyOwner {
        pauseContract = _newPauseContract;
        emit SetContractStatus(msg.sender, _newPauseContract);
    }

    function getRealTokenAddress() public view returns(address){
        return realTokenAddress;
    }

    function setRealTokenAddress(address _addr) external onlyOwner {
        require(pauseContract == 0, "Contract Paused");
        realTokenAddress = _addr;
        realToken = ERC20(realTokenAddress);
        emit ChangeRealTokenAddress(msg.sender, realTokenAddress);
    }

    function getAprRate() external view returns(uint256){
        return apr;
    }

    function setAprRate(uint256 _newAprRate) external onlyOwner{
        apr = _newAprRate;
    }

    function stake(uint256 _amount) external{        
        require(pauseContract == 0, "Contract Paused");
        
        realToken.transferFrom(msg.sender, address(this), _amount);
        
        if( claimTimestamp[msg.sender] != 0 ){
            rewardStatus[msg.sender] += stakingStatus[msg.sender] * apr * (block.timestamp - claimTimestamp[msg.sender]) / yearSecond;
        }
        
        stakingStatus[msg.sender] += _amount;
        claimTimestamp[msg.sender] = block.timestamp;
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount);
    }

    function claim() external{
        require(stakingStatus[msg.sender] != 0, "No staked!");

        uint256 reward = rewardStatus[msg.sender];
        reward += stakingStatus[msg.sender] * apr * (block.timestamp - claimTimestamp[msg.sender]) / yearSecond;
        realToken.transfer(msg.sender, reward);
        claimTimestamp[msg.sender] = block.timestamp;
        rewardStatus[msg.sender] = 0;

        emit Claimed(msg.sender, reward);
    }

    function unstake() external{
        require(stakingStatus[msg.sender] != 0, "No staked!");
        
        uint256 reward = rewardStatus[msg.sender];
        uint256 staked = stakingStatus[msg.sender];
        reward += stakingStatus[msg.sender] * apr * (block.timestamp - claimTimestamp[msg.sender]) / yearSecond;
        reward += staked;

        realToken.transfer(msg.sender, reward);
        claimTimestamp[msg.sender] = 0;
        rewardStatus[msg.sender] = 0;
        stakingStatus[msg.sender] = 0;

        emit Unstaked(msg.sender, staked);
    }

    function getStatus(address user) public view returns(uint256 stakedAmount, uint256 rewardAmount, uint256 lastClaim) {    
        stakedAmount = stakingStatus[user];
        rewardAmount = rewardStatus[user];
        lastClaim = claimTimestamp[user];
    }

    function withdrawAll(address _addr) external onlyOwner{
        uint256 balance = ERC20(_addr).balanceOf(address(this));
        if(balance > 0) {
            ERC20(_addr).transfer(msg.sender, balance);
        }
        address payable mine = payable(msg.sender);
        if(address(this).balance > 0) {
            mine.transfer(address(this).balance);
        }
        emit WithdrawAll(msg.sender, balance, address(this).balance);
    }
}

