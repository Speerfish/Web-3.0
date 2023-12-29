import '../styles/globals.css'
import './app.css'
import Link from 'next/link'

function KoldbluhdedNFTMarketplace({Component, pageProps}) {
  return (
    <div>
     <nav className='border-b p-12' style={{backgroundColor:'skyblue'}}>
        <p className='text-4x1 font-bold text-white'>Koldbluhded Gallery</p>
        <div className='flex mr-4 justify-center'> 
          <Link href='/'>
            <a className='mr-4'> 
             Main Gallery 
            </a>
          </Link>
            <Link href='/mint-item'>
            <a className='mr-6'> 
              Mint NFTs
            </a>
          </Link>
            <Link href='/my-nfts'>
            <a className='mr-6'> 
              My NFTs 
            </a>
          </Link>
            <Link href='/account-dashboard'>
            <a className='mr-6'> 
              My Account
            </a>
          </Link>
        </div>
      </nav>
      <Component {...pageProps} />
    </div>
  )
}

export default KoldbluhdedNFTMarketplace