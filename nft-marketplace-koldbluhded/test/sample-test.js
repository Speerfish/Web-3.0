const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KBGallery", function () {
  it("Should mint and trade NFTs", async function () {
    
    // test to receive contract addresses
    const Market = await ethers.getContractFactory('KBGallery')
    const market = await Market.deploy()
    await market.deployed()
    const marketAddress = market.address 

    const NFT = await ethers.getContractFactory('NFT')
    const nft = await NFT.deploy(marketAddress)
    await nft.deployed()
    const nftContractAddress = nft.address

    // test to receive listing price and auction price
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    const auctionPrice = ethers.utils.parseUnits('100' , 'ether')

    // test for minting
    await nft.mintToken('https-g1')
    await nft.mintToken('https-g2')

    await market.maketMarketItem(nftContractAddress, 1, auctionPrice, {value: listingPrice})
    await market.maketMarketItem(nftContractAddress, 2, auctionPrice, {value: listingPrice})

    // test for different addresses from different users - test accounts
    // return an array of however many addresses
    const [_, buyerAddress] = await ethers.getSigners()

    // create a market sale with address, id and price
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, {
      value: auctionPrice
    })

    let items = await market.fetchMarketTokens()

    items = await Promise.all(items.map(async i => {
      // get the uri of the value

      const tokenURI = await nft.tokenURI(i.tokenId)
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenURI
      }
      return item;
    }))

    // test out all the items
    console.log('items', items)

  });
});
