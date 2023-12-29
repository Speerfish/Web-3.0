//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol';

// security against transactions for multiple requests

import 'hardhat/console.sol';

contract KBGallery is ReentrancyGuard {
    using Counters for Counters.Counter;

    /* 
    number of items minting
    number of transactions (totalTransactions) (totalItemsSold)
    number of unsold items (currentInventory) 
    track total number of items (tokenID)
    arrays need to know length - aid in tracking arrays 
    */

    Counters.Counter private _tokenIds;
    Counters.Counter private _tokensSold;

    /* 
    determine owner of the contract
    1. owner of contract opts out of all fees but gas to mint - testing
    2. charge a listing fee - done
    3. charge 2.0% gallery sales fee - done
    4. add the future sales change of ownership original creator's default royalty 15% - done
    5. add the future sales change of ownership original creator's royalty user set% - done
    6. add url link for collection information to minting form above description - done
    7. restrict minting function to a list of preapproved wallets (Open Zeppelin permissions ?) - number one in queue
    8. add listing categories [mint form] (metadata - keywords ?) - number two in queue (stretch goal)
        music, video, digital - art, digital - collage, animation, meme, book, mashup
        sports - hockey, baseball, basketball, softball, soccer, tennis, lacrosse, football
    9. add auction feature [menu or mint form?] (class example ?) - number three in queue (super stretch goal)
    10. launch
    */

    address payable owner;
    
    // deploying to matic so the API is the same as ether but the value is different
    // both are 18 decimal
    // 0.045 is in the cents not dollars
    // 2% of price for the gallerySalesCommissionFee

    uint256 listingPrice = 0.045 ether;

    // default royalty
    uint256 _setDefaultRoyalty = 1500;
    uint256 _setTokenRoyalty = 2000;

    constructor() {
        // set the owner
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, 'Not Yours.');
        _;
    }

    // structs can act like objects

    struct MarketToken {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    // tokenID return which MarketToken - fetch which one it is

    mapping(uint256 => MarketToken) private idToMarketToken;

    // listen to events from front end applications 

    event MarketTokenMinted(
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    // get the listing price

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // two functions to interact with contract
    // 1. create a market item to put it up for sale 
    // 2. create a market sale for buying and selling between parties

    function maketMarketItem(
        address nftContract,
        uint tokenId,
        uint price       
    )

    public payable nonReentrant {
        // nonReentrant is a modifier to prevent reentry attack

    require(price > 0, 'Price must be at least one wei');
    require(msg.value == listingPrice, 'Price must be equal to listing price');

    _tokenIds.increment();
    uint itemId = _tokenIds.current();

    // putting item (NFT) up for sale - bool - no owner
    idToMarketToken[itemId] = MarketToken(
        itemId,
        nftContract,
        tokenId,
        payable(msg.sender),
        payable(address(0)),
        price,
        false
    );

    // NFT transaction
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    emit MarketTokenMinted(
        itemId,
        nftContract,
        tokenId,
        msg.sender,
        address(0),
        price,
        false
    );
    }
    
    
    // listing fee waiver for gallery owner aka smart contract
    event themFees(
        uint256 gallerySalesCommissionFeeDiscount
    );

    // function to conduct transactions and market sales
    function createMarketSale(
        address nftContract,
        uint itemId)
    public payable nonReentrant{
        uint price = idToMarketToken[itemId].price;
        uint tokenId = idToMarketToken[itemId].tokenId;
        uint256 gallerySalesCommissionFee = idToMarketToken[itemId].price / 200;
        uint gallerySalesCommissionFeeDiscount = 0;
        require(msg.value == price, 'Please submit the asking price in order to continue');
        
        // transfer the amount to the seller
        idToMarketToken[itemId].seller.transfer(msg.value);
        
        // transfer the token from contract address to the buyer
        IERC721(nftContract).transferFrom(address(this),msg.sender, tokenId);
        idToMarketToken[itemId].owner = payable(msg.sender);
        idToMarketToken[itemId].sold =true;
        _tokensSold.increment();

        payable(owner).transfer(listingPrice * gallerySalesCommissionFeeDiscount);
        payable(owner).transfer(gallerySalesCommissionFee * gallerySalesCommissionFeeDiscount);
    }

    // function to fetchMarketItems - minting, buying, and selling
    // return the number of unsold items

    function fetchMarketTokens() public view returns(MarketToken[] memory) {
        uint itemCount = _tokenIds.current();
        uint unsoldItemCount = _tokenIds.current() - _tokensSold.current();
        uint currentIndex = 0;

        // looping over the number of items created (if number has not been sold populate the array)
        MarketToken[] memory items = new MarketToken[](unsoldItemCount);
        for(uint i = 0; i < itemCount; i++){
            if(idToMarketToken[i + 1].owner == address(0)) {
                uint currentId = i + 1;
                MarketToken storage currentItem = idToMarketToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

        // return nfts that the user has purchased

        function fetchMyNFTs() public view returns (MarketToken[] memory) {
            uint totalItemCount = _tokenIds.current();
            // a 2nd counter for each individual user
            uint itemCount = 0;
            uint currentIndex = 0;

            for(uint i = 0; i < totalItemCount; i++) {
                if(idToMarketToken[i + 1].owner == msg.sender) {
                    itemCount += 1;
                }
            }

            // 2nd loop to loop through the amount you have purchased with itemcount 
            // check to see if the owner address = msg.sender 

            MarketToken[] memory items = new MarketToken[] (itemCount);
            for(uint i = 0; i < totalItemCount; i++) {
                if(idToMarketToken[i+1].owner == msg.sender) {
                    uint currentId = idToMarketToken[i+1].itemId;
                    // current array
                    MarketToken storage currentItem = idToMarketToken[currentId];
                    items[currentIndex] = currentItem;
                    currentIndex += 1;

                }
            } 
            return items;
        }

    // function for returning an array of minted nfts
    function fetchItemsCreated() public view returns(MarketToken[] memory) {
          // instead of .owner it will be the .seller
         uint totalItemCount = _tokenIds.current();
         uint itemCount = 0;
         uint currentIndex = 0;

      for(uint i = 0; i < totalItemCount; i++) {
                if(idToMarketToken[i + 1].seller == msg.sender) {
                    itemCount += 1;
                }
            }

            // second loop to loop through the amount you have purchased with itemcount
            // check to see if the owner address is equal to msg.sender

            MarketToken[] memory items = new MarketToken[](itemCount);
            for(uint i = 0; i < totalItemCount; i++) {
                if(idToMarketToken[i +1].seller == msg.sender) {
                    uint currentId = idToMarketToken[i + 1].itemId;
                    MarketToken storage currentItem = idToMarketToken[currentId];
                    items[currentIndex] = currentItem;
                    currentIndex += 1;
                }
        }
        return items;
    }

}
