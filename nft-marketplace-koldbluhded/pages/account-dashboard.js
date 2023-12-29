
// goal is to load user nfts and display them

import {ethers} from 'ethers'
import {useEffect, useState} from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import {nftaddress, nftmarketaddress} from '../config'

import NFT from '../artifacts/contracts/NFT.sol//NFT.json'
import KBGallery from '../artifacts/contracts/KBGallery.sol//KBGallery.json'

export default function AccountDashboard() {
    // array of nfts
  const [nfts, setNFTs] = useState([])
  const [sold, setSold] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  useEffect(()=> {
    loadNFTs()
  }, [])

  async function loadNFTs(){
    // what we want to load 
    // goal is to get the msg.sender connect to the signer to displayowner nfts

    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, KBGallery.abi, signer)
    const data = await marketContract.fetchItemsCreated()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      // we want to get the token metadata - json 
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        royalty: meta.data.royalty,
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        website: meta.data.website,
        description: meta.data.description      
      }
      return item 
    }))

    // create a filtered array of items that have been sold
    const soldItems = items.filter(i=> i.sold)
    setSold(soldItems)
    setNFTs(items)
    setLoadingState('loaded')
  }
  
  
  if(loadingState === 'loaded' && !nfts.length) return (<h1
  className='px-20 py-7 text-4x1'>You have not minted any NFTs. You can fix that while you are here....</h1>)

  return (
    <div className='p-4ad'>
    <h1 style={{fontSize:'20px' , color:'skyblue' , padding:'13px'}}>NFTs Minted</h1>
      <div className='px-4' style={{maxWidth: '300px', padding:'13px'}}>
      <div className='grid-ad grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4'>
      {
        nfts.map((nft, i)=>(
        <div key={i} className='border-ad shadow rounded-x1 overflow-hidden'>
          <img src={nft.image} alt=''/>
          <div className='p-4'>
            <p style={{height: '64px'}} className="text-3x1ad font-semibold">{
              nft.name} </p>
              <p style={{height: '68px'}} className="text-3x1 font-semibold">{
              nft.royalty} </p>
              <p style={{height: '68px'}} className="text-3x1 font-semibold"><a href="{
              nft.website}" alt=''/> </p>
              <div style={{height: '72px', overflow:'hidden'}}>
              <p className='text-gray-400'>{nft.description}</p>
              </div>
          </div>
          <div className='p-4 bg-black'>
            <p className='text-3x-1 mb-4 font-bold text-white'>{nft.price} ETH</p>
          </div>
        </div>
        ))
      }
      </div>
      </div>
    </div>
  )
}
