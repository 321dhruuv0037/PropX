// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RERA {
    struct Property {
        uint256 id;
        string name;
        string location;
        string size;
        string propertyPaper; // IPFS hash or PDF URL
        address owner;
        uint256 price;
        bool isRegistered;
        bool isForSale;
    }

    struct Buyer {
        uint256 id;
        string name;
        address buyerAddress;
        uint256[] propertyIds;
    }

    uint256 public propertyCounter;
    uint256 public buyerCounter;

    mapping(uint256 => Property) public properties;
    mapping(uint256 => Buyer) public buyers;

    event PropertyRegistered(
        uint256 id,
        string name,
        address owner,
        uint256 price,
        string location,
        string size,
        string propertyPaper
    );

    event BuyerRegistered(uint256 id, string name, address buyerAddress);
    event PropertySold(uint256 id, address buyer);
    event PropertyAvailabilityChanged(uint256 id, bool isForSale);

    function registerProperty(
        string memory _name,
        string memory _location,
        string memory _size,
        string memory _propertyPaper,
        uint256 _price
    ) public {
        propertyCounter++;
        properties[propertyCounter] = Property({
            id: propertyCounter,
            name: _name,
            location: _location,
            size: _size,
            propertyPaper: _propertyPaper,
            owner: msg.sender,
            price: _price,
            isRegistered: true,
            isForSale: false
        });

        emit PropertyRegistered(
            propertyCounter,
            _name,
            msg.sender,
            _price,
            _location,
            _size,
            _propertyPaper
        );
    }

    function registerBuyer(string memory _name) public {
        buyerCounter++;
        buyers[buyerCounter] = Buyer({
            id: buyerCounter,
            name: _name,
            buyerAddress: msg.sender,
            propertyIds: new uint256[](0) 
        });

        emit BuyerRegistered(buyerCounter, _name, msg.sender);
    }

    function changeAvailability(uint256 _propertyId, bool _isForSale) public {
        Property storage property = properties[_propertyId];
        require(property.owner == msg.sender, "Only owner can update availability");
        property.isForSale = _isForSale;

        emit PropertyAvailabilityChanged(_propertyId, _isForSale);
    }

    function buyProperty(uint256 _propertyId) public payable {
        Property storage property = properties[_propertyId];

        require(property.isRegistered, "Property not registered");
        require(property.isForSale, "Property not for sale");
        require(msg.value >= property.price, "Insufficient funds");

        address previousOwner = property.owner;
        property.owner = msg.sender;
        property.isForSale = false;

        // Transfer ownership record to buyer
        for (uint256 i = 1; i <= buyerCounter; i++) {
            if (buyers[i].buyerAddress == msg.sender) {
                buyers[i].propertyIds.push(_propertyId);
                break;
            }
        }

        // Transfer ETH to previous owner
        payable(previousOwner).transfer(property.price);

        emit PropertySold(_propertyId, msg.sender);
    }

    function getPropertyDetails(uint256 _propertyId) public view returns (Property memory) {
        return properties[_propertyId];
    }

    function getBuyerDetails(uint256 _buyerId) public view returns (Buyer memory) {
        return buyers[_buyerId];
    }
}
