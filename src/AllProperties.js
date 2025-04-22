import React, { useEffect, useState } from "react";
import Web3 from "web3";
import "./css/AllProperties.css";

const AllProperties = ({ account, contract, web3 }) => {
  const [properties, setProperties] = useState([]);
  const [ethRate, setEthRate] = useState(null);
  const [search, setSearch] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editPropertyPaper, setEditPropertyPaper] = useState("");
  const [editPriceINR, setEditPriceINR] = useState("");
  // const [ethRate, setethRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleEditClick = (property) => {
    if (!ethRate || ethRate === 0) {
      setModal({
        show: true,
        message: "Unable to fetch ETH conversion rate. Please try again later!",
        success: false,
      });
      return;
    }
    if (!property.isForSale) {
      setEditPropertyId(property.id);
      setEditName(property.name);
      setEditLocation(property.location);
      setEditSize(property.size);
      setEditPropertyPaper(property.propertyPaper);
      const priceInINR = Web3.utils.fromWei(property.price, "ether") * ethRate;
      setEditPriceINR(priceInINR.toFixed(2)); // Format to 2 decimal places
      setIsEditing(true);
    }
  };

  const handleCloseWindow = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!ethRate || ethRate === 0) {
      setModal({
        show: true,
        message: "Unable to fetch ETH conversion rate. Please try again later!",
        success: false,
      });
      return;
    }
    const priceInETH = Web3.utils.toWei(
      (editPriceINR / ethRate).toString(),
      "ether"
    );
    try {
      // Call the smart contract edit function
      await contract.methods
        .editProperty(
          editPropertyId,
          editName,
          editLocation,
          editSize,
          editPropertyPaper,
          priceInETH
        )
        .send({ from: account });

      setIsEditing(false); // Close window
      setModal({
        show: true,
        message: "Property edited successfully!",
        success: true,
      });
      window.location.reload();
    } catch (error) {
      setModal({
        show: true,
        message: "Error editing property!",
        success: false,
      });
    }
  };

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

  // const fetchEthInrRate = async () => {
  //   const res = await fetch(
  //     "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
  //   );
  //   const data = await res.json();
  //   setEthRate(data.ethereum.inr);
  // };

  const fetchEthInrRate = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
      );
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setEthRate(data?.ethereum?.inr || null);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching ETH-INR rate:", error.message);
      setEthRate(null);
      setIsLoading(false);
    }
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
    (p) =>
      p.isForSale &&
      p.isVerified &&
      p.owner.toLowerCase() !== account.toLowerCase()
  );

  const filteredAvailableProperties = availableProperties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
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
      {isEditing && (
        <div className="overlay">
          <div className="edit-window">
            <h3>Edit Property</h3>
            <form onSubmit={handleEditSubmit}>
              <label>
                Name:
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </label>
              <label>
                Location:
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </label>
              <label>
                Size:
                <input
                  type="text"
                  value={editSize}
                  onChange={(e) => setEditSize(e.target.value)}
                />
              </label>
              <label>
                Price (INR):
                <input
                  type="number"
                  value={editPriceINR}
                  onChange={(e) => setEditPriceINR(e.target.value)}
                  min="0"
                />
              </label>
              <label>
                Property Paper (URL):
                <input
                  type="text"
                  value={editPropertyPaper}
                  onChange={(e) => setEditPropertyPaper(e.target.value)}
                />
              </label>
              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  Save Changes
                </button>
                <button type="button" onClick={handleCloseWindow}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            {/* <p>
              <strong>Price:</strong>{" "}
              {Web3.utils.fromWei(property.price.toString(), "ether")} ETH
            </p> */}
            <p>
              <strong>Price:</strong>{" "}
              {Web3.utils.fromWei(property.price.toString(), "ether")} ETH{" "}
              {ethRate === null ? (
                <span className="text-sm text-gray-400">
                  {" "}
                  (INR not available)
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  (₹
                  {(
                    Web3.utils.fromWei(property.price.toString(), "ether") *
                    ethRate
                  ).toFixed(2)}
                  )
                </span>
              )}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {property.isForSale && property.isVerified
                ? "Available for Purchase"
                : property.isForSale && !property.isVerified
                ? "Pending Verification"
                : "Not for Sale"}
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
            {!property.isForSale && (
              <button onClick={() => handleEditClick(property)}>Edit</button>
            )}
          </div>
        ))}
      </div>

      <h2>Available to Buy</h2>
      <input
        type="text"
        // className="search-bar border p-2 rounded mb-4 w-full md:w-1/2"
        className="search-bar"
        placeholder="Search by name or location"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="property-list">
        {availableProperties.length === 0 && (
          <p>No properties available for purchase.</p>
        )}
        {filteredAvailableProperties.map((property) => (
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
              {Web3.utils.fromWei(property.price.toString(), "ether")} ETH{" "}
              {ethRate === null ? (
                <span className="text-sm text-gray-400">
                  {" "}
                  (INR not available)
                </span>
              ) : (
                <span className="text-sm text-gray-500">
                  (₹
                  {(
                    Web3.utils.fromWei(property.price.toString(), "ether") *
                    ethRate
                  ).toFixed(2)}
                  )
                </span>
              )}
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
