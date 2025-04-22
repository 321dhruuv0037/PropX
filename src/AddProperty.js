import React, { useState, useEffect } from "react";
import "./css/AddProperty.css";

const AddProperty = ({ account, contract, web3 }) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [ethRate, setEthRate] = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [location, setLocation] = useState("");
  const [size, setSize] = useState("");
  const [propertyPaper, setPropertyPaper] = useState("");
  const [ethValue, setEthValue] = useState("");

  useEffect(() => {
    fetchEthInrRate();
  }, []);

  const fetchEthInrRate = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr"
      );
      const data = await response.json();
      setEthRate(data.ethereum.inr);
    } catch (error) {
      console.error("Failed to fetch ETH-INR rate:", error);
      setEthRate(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!account || !contract) {
      setModalMessage("Wallet not connected or contract not loaded.");
      setIsSuccess(false);
      setShowModal(true);
      return;
    }
    if (!/\d/.test(size)) {
      setModalMessage("Please enter a valid size (must include digits).");
      setIsSuccess(false);
      setShowModal(true);
      setLoading(false);
      return;
    }
    if (!propertyPaper.startsWith("http")) {
      setModalMessage("Please enter a valid document URL.");
      setIsSuccess(false);
      setShowModal(true);
      setLoading(false);
      return;
    }
    try {
      const priceInEth = price / ethRate;
      const priceInWei = web3.utils.toWei(priceInEth.toString(), "ether");
      await contract.methods
        .registerProperty(name, location, size, propertyPaper, priceInWei)
        .send({ from: account });
      setModalMessage("Property added successfully!");
      setIsSuccess(true);
      setShowModal(true);
      setName("");
      setPrice("");
    } catch (error) {
      console.error("Error adding property:", error);
      setModalMessage("Failed to add property.");
      setIsSuccess(false);
      setShowModal(true);
    } finally {
      setShowModal(true);
      setLoading(false);
    }
  };

  const handlePriceChange = (e) => {
    const inr = e.target.value;
    setPrice(inr);
    if (!isNaN(inr) && inr !== "") {
      const eth = parseFloat(inr) / ethRate;
      setEthValue(eth.toFixed(6));
    } else {
      setEthValue("");
    }
  };

  return (
    <div className="container">
      <h2>Register Property</h2>
      {ethRate && (
        <p className="eth-rate">₹1 ≈ {(1 / ethRate).toFixed(8)} ETH</p>
      )}

      <form className="form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Property Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          name="location"
          placeholder="Location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          name="size"
          placeholder="Size (e.g., 1200 sqft)"
          required
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
        <input
          name="propertyPaper"
          placeholder="Property Paper (Document URL)"
          required
          value={propertyPaper}
          onChange={(e) => setPropertyPaper(e.target.value)}
        />
        <input
          name="price"
          placeholder="Price in INR"
          required
          type="number"
          value={price}
          // onChange={(e) => setPrice(e.target.value)}
          onChange={handlePriceChange}
        />
        {ethValue && (
          <p className="text-sm text-gray-500">≈ {ethValue} ETH</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      {/* Modal */}
      {showModal && (
        <div className={`modal ${isSuccess ? "success" : "error"}`}>
          <div className="modal-content">
            <p>{modalMessage}</p>
            <button
              onClick={() => {
                setShowModal(false);
                if (isSuccess) {
                  setName("");
                  setLocation("");
                  setSize("");
                  setPropertyPaper("");
                  setPrice("");
                }
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

export default AddProperty;
