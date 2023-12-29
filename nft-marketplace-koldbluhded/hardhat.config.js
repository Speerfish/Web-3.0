require("@nomiclabs/hardhat-waffle");
const projectID ='1201a5ea5ac44317b25e5cac314b79ff'
const fs = require('fs')
const keyData = fs.readFileSync('./fu-n-keyzy.txt', {
  encoding:'utf-8', flag:'r'
})

module.exports = {
  defaultNetwork: 'hardhat',
  networks:{
    hardhat:{
      chainID: 1337 // standard config
    },
    mumbai:{
      url:`https://polygon-mumbai.infura.io/v3/${projectID}`,
      accounts:[keyData]
    },
    mainnet: {
      url:`https://mainnet.infura.io/v3/${projectID}`,
      accounts:[keyData]
    }
  },

  solidity:{
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
