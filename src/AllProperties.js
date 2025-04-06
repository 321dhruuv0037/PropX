import React, { useEffect, useState } from "react";
import Web3 from "web3";
import "./css/AllProperties.css";

const AllProperties = ({ account, contract, web3 }) => {
  const [properties, setProperties] = useState([]);
  const [ethRate, setEthRate] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [modal, setModal] = useState({
    show: false,
    message: "",
    success: true,
  });

  const loadProperties = async () => {
    const count = await contract.methods.propertyCounter().call();
    const items = [];
    for (let i = 1; i <= count; i++) {
      const prop = await contract.methods.properties(i).call();
      items.push(prop);
    }
    setProperties(items);
  };

  const fetchEthInrRate = async () => {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
    );
    const data = await res.json();
    setEthRate(data.ethereum.inr);
  };

  useEffect(() => {
    if (contract) {
      loadProperties();
      fetchEthInrRate();
    }
  }, [contract]);

  const buyProperty = async (property) => {
    try {
      await contract.methods.buyProperty(property.id).send({
        from: account,
        value: property.price,
      });

      setModal({
        show: true,
        message: "Property bought successfully!",
        success: true,
      });
      loadProperties();
    } catch (err) {
      console.error(err);
      setModal({
        show: true,
        message: "Failed to buy property.",
        success: false,
      });
    }
  };

  const getEthEquivalent = (inr) => {
    if (!ethRate || !inr || isNaN(inr)) return null;
    return (inr / ethRate).toFixed(6);
  };

  const yourProperties = properties.filter(
    (p) => p.owner.toLowerCase() === account.toLowerCase()
  );

  const availableProperties = properties.filter(
    (p) => p.isForSale && p.owner.toLowerCase() !== account.toLowerCase()
  );

  const resaleProperty = async (propertyId, newPriceInInr) => {
    if (!ethRate || !newPriceInInr || isNaN(newPriceInInr)) {
      setModal({
        show: true,
        message: "Invalid resale price or ETH rate unavailable.",
        success: false,
      });
      return;
    }

    try {
      const eth = newPriceInInr / ethRate;
      const priceInWei = web3.utils.toWei(eth.toString(), "ether");

      await contract.methods
        .listPropertyForResale(propertyId, priceInWei)
        .send({ from: account });

      setModal({
        show: true,
        message: "Property listed for resale!",
        success: true,
      });
      loadProperties();
    } catch (err) {
      console.error(err);
      setModal({
        show: true,
        message: "Failed to list for resale.",
        success: false,
      });
    }
  };

  const changeAvailability = async (propertyId, isForSale) => {
    try {
      await contract.methods
        .changeAvailability(propertyId, isForSale)
        .send({ from: account });

      setModal({
        show: true,
        message: `Property marked as ${
          isForSale ? "for sale" : "not for sale"
        }.`,
        success: true,
      });

      loadProperties();
    } catch (err) {
      console.error(err);
      setModal({
        show: true,
        message: "Failed to update availability.",
        success: false,
      });
    }
  };

  const [resaleInput, setResaleInput] = useState({});

  if (!contract) {
    return <div>Loading contract...</div>;
  }

  return (
    <div className="container">
      <h2>Your Properties</h2>
      <div className="property-list">
        {yourProperties.length === 0 && <p>No properties owned yet.</p>}
        {yourProperties.map((property) => (
          <div className="property-card" key={property.id}>
            <h3>{property.name}</h3>
            <p>
              <strong>Location:</strong> {property.location}
            </p>
            <p>
              <strong>Size:</strong> {property.size}
            </p>
            <p>
              <strong>Price:</strong>{" "}
              {Web3.utils.fromWei(property.price.toString(), "ether")} ETH
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {property.isForSale ? "For Sale" : "Not for Sale"}
            </p>

            {property.propertyPaper && (
              <p>
                <a
                  href={property.propertyPaper}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📄 View Property Paper
                </a>
              </p>
            )}

            {property.isSold && (
              <div className="resale-section">
                <input
                  type="number"
                  placeholder="Resale price in INR"
                  value={resaleInput[property.id] || ""}
                  onChange={(e) =>
                    setResaleInput({
                      ...resaleInput,
                      [property.id]: e.target.value,
                    })
                  }
                />
                {getEthEquivalent(resaleInput[property.id]) && (
                  <p>≈ {getEthEquivalent(resaleInput[property.id])} ETH</p>
                )}
                <button
                  disabled={
                    !resaleInput[property.id] ||
                    isNaN(resaleInput[property.id]) ||
                    resaleInput[property.id] <= 0
                  }
                  onClick={() =>
                    resaleProperty(property.id, resaleInput[property.id])
                  }
                >
                  Resale
                </button>
              </div>
            )}

            <div className="availability-toggle">
              <button
                onClick={() =>
                  changeAvailability(property.id, !property.isForSale)
                }
              >
                {property.isForSale ? "Remove from Sale" : "Put Up for Sale"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h2>Available to Buy</h2>
      <div className="property-list">
        {availableProperties.length === 0 && (
          <p>No properties available for purchase.</p>
        )}
        {availableProperties.map((property) => (
          <div className="property-card" key={property.id}>
            <h3>{property.name}</h3>
            <p>
              <strong>Location:</strong> {property.location}
            </p>
            <p>
              <strong>Size:</strong> {property.size}
            </p>
            <p>
              <strong>Price:</strong>{" "}
              {Web3.utils.fromWei(property.price.toString(), "ether")} ETH
            </p>
            <p title={property.owner}>
              <strong>Owner:</strong>{" "}
              {`${property.owner.slice(0, 6)}...${property.owner.slice(-4)}`}
            </p>
            {property.propertyPaper && (
              <p>
                <a
                  href={property.propertyPaper}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📄 View Property Paper
                </a>
              </p>
            )}
            <button onClick={() => buyProperty(property)}>Buy</button>
          </div>
        ))}
      </div>

      {modal.show && (
        <div className={`modal ${modal.success ? "success" : "error"}`}>
          <div className="modal-content">
            <p>{modal.message}</p>
            <button
              onClick={() => {
                setModal({ show: false, message: "", success: true });
                setResaleInput({});
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllProperties;
