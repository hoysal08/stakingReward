
const hre = require("hardhat");

async function main() {
  const[owner]=await ethers.getSigners();

  const ST=await ethers.getContractFactory("StakingToken",owner);
  const st=await ST.deploy();
  await st.deployed();
  console.log("Staking token deployed at : "+st.address);

  const RT=await ethers.getContractFactory("RewardToken",owner);
  const rt=await RT.deploy();
  await rt.deployed();
  console.log("Reward token deployed at : "+rt.address);


  const StakingReward=await ethers.getContractFactory("StakingRewards",owner);
  const Stakingreward=await StakingReward.deploy(st.address,rt.address);
  await Stakingreward.deployed();
  console.log("StakingReward contract  deployed at : "+Stakingreward.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
