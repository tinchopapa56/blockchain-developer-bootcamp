import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.9", //"0.8.17",
  networks: {
    localhost: {},
    // rinkeby: {
    //   url: "https://rinkeby.infura.io/v3/YOUR_INFURA_PROJECT_ID",
    //   accounts: ["YOUR_PRIVATE_KEY"]
    // },
    // mainnet: {
    //   url: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
    //   accounts: ["YOUR_PRIVATE_KEY"]
    // }
  }
};

export default config;
