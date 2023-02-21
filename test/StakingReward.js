const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { describe } = require("mocha");
require("@nomicfoundation/hardhat-chai-matchers");
const { BigNumber } = require("ethers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Staking Tokens", () => {
  async function deployFixture(){
    const[owner,account1,account2]=await ethers.getSigners();

    const ST=await ethers.getContractFactory("StakingToken",owner);
    const st=await ST.deploy();
    await st.deployed();

    const RT=await ethers.getContractFactory("RewardToken",owner);
    const rt=await RT.deploy();
    await rt.deployed();

    const StakingReward=await ethers.getContractFactory("StakingRewards",owner);
    const Stakingreward=await StakingReward.deploy(st.address,rt.address);
    await Stakingreward.deployed();

    return {owner,account1,account2,st,rt,Stakingreward}
  }

  describe("Check contract initialisation of staking contract",async()=>{
    it("should have correct address of staking and reward contract address",async()=>{
       const {owner,account1,account2,st,rt,Stakingreward}=await loadFixture(deployFixture);

       expect(await Stakingreward.owner()).to.be.equal(owner.address);
       expect(await Stakingreward.stakingToken()).to.be.equal(st.address);
       expect(await Stakingreward.rewardsToken()).to.be.equal(rt.address);
    })
  });

  describe("Check for staking contract reward initialisation",async()=>{
    it("Should allow Owner to set reward duration and reward rate",async()=>{
      const {owner,account1,account2,st,rt,Stakingreward}=await loadFixture(deployFixture);

      const duration=10000;//assume 10000 seconds
      const rewardTokens=10000;

      await Stakingreward.setRewardsDuration(duration);
      expect(await Stakingreward.duration()).to.be.equal(duration);

      await rt.connect(owner).mint(Stakingreward.address,rewardTokens);

      await Stakingreward.notifyRewardAmount(rewardTokens);
      let expectedRewardRate=rewardTokens/duration;
      expect(await Stakingreward.rewardRate()).to.be.equal(expectedRewardRate);
      expect(await Stakingreward.finishAt()).to.be.equal(await time.latest()+duration);
      expect(await Stakingreward.updatedAt()).to.be.equal(await time.latest());
    })

    it("Should allow Owner to increase  reward rate ",async()=>{
      const {owner,account1,account2,st,rt,Stakingreward}=await loadFixture(deployFixture);

      const duration=10000;//assume 10000 seconds
      const rewardTokens=10000;

      await Stakingreward.setRewardsDuration(duration);
      expect(await Stakingreward.duration()).to.be.equal(duration);

      await rt.connect(owner).mint(Stakingreward.address,rewardTokens);

      await Stakingreward.notifyRewardAmount(rewardTokens);
      let expectedRewardRate=rewardTokens/duration;
      expect(await Stakingreward.rewardRate()).to.be.equal(expectedRewardRate);
      expect(await Stakingreward.finishAt()).to.be.equal(await time.latest()+duration);
      expect(await Stakingreward.updatedAt()).to.be.equal(await time.latest());

      //Increase reward by 10000
      const rewardTokensIncreased=10000;
      await rt.connect(owner).mint(Stakingreward.address,rewardTokensIncreased);
      await Stakingreward.notifyRewardAmount(rewardTokensIncreased);

      let expectedRewardRateUpdated=(rewardTokens+rewardTokensIncreased)/duration;
      expect(await Stakingreward.finishAt()).to.be.equal(await time.latest()+duration);
      expect(await Stakingreward.updatedAt()).to.be.equal(await time.latest());
    })
  })

  describe("Check for staking functionality", async()=>{
    it(" should let users  to stake Staking Tokens", async()=>{
      const {owner,account1,account2,st,rt,Stakingreward}=await loadFixture(deployFixture);

      const duration=10000;//assume 10000 seconds
      const rewardTokens=10000;

      await Stakingreward.setRewardsDuration(duration);
      expect(await Stakingreward.duration()).to.be.equal(duration);

      await rt.connect(owner).mint(Stakingreward.address,rewardTokens);

      await Stakingreward.notifyRewardAmount(rewardTokens);
      const StakeTokencount=100;
      await st.connect(account1).mint(account1.address,StakeTokencount);
      await st.connect(account1).approve(Stakingreward.address,StakeTokencount);
      await Stakingreward.connect(account1).stake(StakeTokencount);
      expect(await Stakingreward.balanceOf(account1.address)).to.be.equal(StakeTokencount)
    })
    it(" should let multiple users  to stake Staking Tokens", async()=>{
      const {owner,account1,account2,st,rt,Stakingreward}=await loadFixture(deployFixture);

      const duration=10000;//assume 10000 seconds
      const rewardTokens=10000;

      await Stakingreward.setRewardsDuration(duration);
      expect(await Stakingreward.duration()).to.be.equal(duration);

      await rt.connect(owner).mint(Stakingreward.address,rewardTokens);

      await Stakingreward.notifyRewardAmount(rewardTokens);
      const StakeTokencount=100;
      await st.connect(account1).mint(account1.address,StakeTokencount);
      await st.connect(account1).approve(Stakingreward.address,StakeTokencount);
      await Stakingreward.connect(account1).stake(StakeTokencount);
      expect(await Stakingreward.balanceOf(account1.address)).to.be.equal(StakeTokencount);

      const StakeTokencount2=200;
      await st.connect(account2).mint(account2.address,StakeTokencount2);
      await st.connect(account2).approve(Stakingreward.address,StakeTokencount2);
      await Stakingreward.connect(account2).stake(StakeTokencount2);
      expect(await Stakingreward.balanceOf(account2.address)).to.be.equal(StakeTokencount2);
    })
  })
  describe("Users should be able to Claim their rewards",async()=>{
    it("Should credit users with their rewardTokens",async()=>{
      const {owner,account1,account2,st,rt,Stakingreward}=await loadFixture(deployFixture);

      const duration=10000;//assume 10000 seconds
      const rewardTokens=10000;
  
      await Stakingreward.setRewardsDuration(duration);
      expect(await Stakingreward.duration()).to.be.equal(duration);
  
      await rt.connect(owner).mint(Stakingreward.address,rewardTokens);
  
      await Stakingreward.notifyRewardAmount(rewardTokens);
      const StakeTokencount=100;
      await st.connect(account1).mint(account1.address,StakeTokencount);
      await st.connect(account1).approve(Stakingreward.address,StakeTokencount);
      await Stakingreward.connect(account1).stake(StakeTokencount);
  
      let now=await time.latest();
      await time.increaseTo(now+100);
      let rewardsearned=await Stakingreward.earned(account1.address);
      //Adding 1 here because of the time gap between the read of earned value and getReward function
      rewardsearned=BigNumber.from(rewardsearned).add(1);
      await Stakingreward.connect(account1).getReward();
      expect(await rt.balanceOf(account1.address)).to.be.equal(rewardsearned);
    })
    })
    describe("Users should be able to Withdraw their Staked Tokens", async () => {
      it("Should let users withdraw their Tokens",async()=>{
        const {owner,account1,account2,st,rt,Stakingreward}=await loadFixture(deployFixture);

        const duration=10000;//assume 10000 seconds
        const rewardTokens=10000;
    
        await Stakingreward.setRewardsDuration(duration);
        expect(await Stakingreward.duration()).to.be.equal(duration);
    
        await rt.connect(owner).mint(Stakingreward.address,rewardTokens);
    
        await Stakingreward.notifyRewardAmount(rewardTokens);
        const StakeTokencount=100;
        await st.connect(account1).mint(account1.address,StakeTokencount);
        await st.connect(account1).approve(Stakingreward.address,StakeTokencount);
        await Stakingreward.connect(account1).stake(StakeTokencount);
    
        let now=await time.latest();
        await time.increaseTo(now+100);

        expect(await st.balanceOf(account1.address)).to.be.equal(0);
        await Stakingreward.connect(account1).withdraw(StakeTokencount);
         expect(await st.balanceOf(account1.address)).to.be.equal(StakeTokencount);
  
      })
    })
})
