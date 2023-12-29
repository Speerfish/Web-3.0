import {ethers} from 'ethers'
import {useState} from 'react'
import Web3Modal from 'web3modal'
import {create as ipfsHttpClient} from 'ipfs-http-client'
import {nftaddress, nftmarketaddress} from '../config'
import NFT from '../artifacts/contracts/NFT.sol//NFT.json'
import {useRouter} from 'next/router'
import KBGallery from '../artifacts/contracts/KBGallery.sol//KBGallery.json'

// in this component we conigure the IPFS to host our NFT data
// file storage

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

export default function MintItem() {
    const [fileUrl, setFileUrl] = useState(null)
    const [formInput, UpdateFormInput] = useState({price: '', name: '', royalty: '',
    description:'' , website:''})
    const router = useRouter()

    // function to call when files are updated from the form - we can add our
    // HFT images - IPFS

    async function onChange(e) {
        const file = e.target.files[0]
        try {
        const added = await client.add(
            file, {
                progress: (prog) => console.log(`received: ${prog}`)
            }
        )
        const url = `https://ipfs.infura.io/ipfs/${added.path}`
        setFileUrl(url)
        } catch (error) {
            console.log('Error uploading file:' , error)
        }
    }

    async function creeateMarket() {
        const {name, description, price, royalty, website} = formInput
        if(!name || !description || !price || !royalty || !website || !fileUrl) return
        // upload to IPFS 
        const data = JSON.stringify({
            name, description, royalty, website, image: fileUrl
        })
        try {
        const added = await client.add(data)
        const url = `https://ipfs.infura.io/ipfs/${added.path}`
        // call a function that creates a sale and passes through the url
        createSale(url)
        } catch (error) {
            console.log('Error uploading file:' , error)
        }
    }

    async function createSale(url) {
        // create the items and list them in the gallery
        const web3Modal = new Web3Modal()
            const connection = await web3Modal.connect()
            const provider = new ethers.providers.Web3Provider(connection)
            const signer = provider.getSigner()

            // we want to create the token
            let contract = new ethers.Contract(nftaddress, NFT.abi, signer)
            let transaction = await contract.mintToken(url)
            let tx = await transaction.wait()
            let event = tx.events[0]
            let value = event.args[2]
            let tokenId = value.toNumber()
            const price = ethers.utils.parseUnits(formInput.price, 'ether')
            const royalty = value.toNumber()

        // list item for sale in the gallery
        contract = new ethers.Contract(nftmarketaddress, KBGallery.abi, signer)
        let listingPrice = await contract.getListingPrice()
        listingPrice = listingPrice.toString()

        transaction = await contract.maketMarketItem(nftaddress, tokenId, price, royalty, {value: listingPrice})
        await transaction.wait()
        router.push('./')
    }

    return (
        <div className='flex-mi2 justify-center'>
            <div className='w-1-2 flex flex-col pb-12'>
                <input 
                placeholder='NFT Name'
                className='mt-2 border rounded p-4'
                onChange={ e => UpdateFormInput({...formInput, name: e.target.value})}
                />
                <input 
                placeholder='NFT Description'
                className='mt-2 border rounded p-4'
                onChange={ e => UpdateFormInput({...formInput, description: e.target.value})}
                />
                <input 
                placeholder='NFT Weblink'
                className='mt-2 border rounded p-4'
                onChange={ e => UpdateFormInput({...formInput, website: e.target.value})}
                />
                <input 
                placeholder='NFT Price in ETH'
                className='mt-2 border rounded p-4'
                onChange={ e => UpdateFormInput({...formInput, price: e.target.value})}
                />
                <input 
                placeholder='NFT Royalty in ETH'
                className='mt-2 border rounded p-4'
                onChange={ e => UpdateFormInput({...formInput, royalty: e.target.value})}
                />
                <input 
                type='file'
                name='Asset' 
                className='mt-4'
                onChange={onChange}
                /> {
                fileUrl && (
                    <img className='rounded mt-4' width='350px' src={fileUrl} alt=''/>
                )}
                <button onClick={creeateMarket}
                className='font-bold mt-4 bg-skyblue-500 text-white rounded p-4 shadow-lg'
                >
                Mint NFT
                </button>
            </div>
        </div>
    )

}