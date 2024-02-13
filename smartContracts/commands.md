run local blockchain
    npx hardhat node

deploy
    npx hardhat run --network localhost ./scripts/deploy.ts

console
    npx hardhat console --network localhost

check localDeployed contract
    const token2 = await ethers.getContractAt("Token","0x5FbDB2315678afecb367f032d93F642f64180aa3")
    await token2.address
    await token2.name()    

    ethers.utils.formatEther(balance.toString())