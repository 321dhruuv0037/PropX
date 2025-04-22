import React, { useEffect, useState } from "react";
import Web3 from "web3";
import "./css/VerifyProperties.css";

function VerifyProperties({ contract, web3 }) {
  const [properties, setProperties] = useState([]);
  const [account, setAccount] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [modal, setModal] = useState({
    show: false,
    message: "",
    success: true,
  });
  useEffect(() => {
    const loadWeb3 = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
        } else {
          alert("Please install MetaMask!");
        }
      } catch (error) {
        console.error("MetaMask Connection Error:", error);
        alert("Failed to connect MetaMask. Check console for details.");
      }
    };

    const fetchProperties = async () => {
      try {
        const propertyCount = await contract.methods.propertyCounter().call();
        const fetchedProperties = [];
        for (let i = 1; i <= propertyCount; i++) {
          const property = await contract.methods.getPropertyDetails(i).call();
          if (!property.isVerified && property.isForSale) {
            // Only show unverified properties
            fetchedProperties.push(property);
          }
        }
        setProperties(fetchedProperties);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setModal({
          show: true,
          message: "Failed to fetch properties. Please try again later!",
          success: false,
        });
      }
    };

    loadWeb3();
    fetchProperties();
  }, [contract, web3]);

  const verifyProperty = async (propertyId) => {
    try {
      await contract.methods.verifyProperty(propertyId).send({ from: account });
      //   setShowSuccessModal(true);
      setModal({
        show: true,
        message: "Verified property!",
        success: true,
      });
      setProperties(
        properties.filter((property) => property.id !== propertyId)
      ); // Remove verified property from the list
    } catch (err) {
      console.error("Error verifying property:", err);
      setModal({
        show: true,
        message: "Failed to verify the property. Please try again later!",
        success: false,
      });
    }
  };

  return (
    <div className="verify-properties-container">
      <h2 className="heading">Verify Properties</h2>
      <div className="property-cards">
        {properties.length > 0 ? (
          properties.map((property) => (
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
                {web3.utils.fromWei(property.price, "ether")} ETH
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
              <button
                className="verify-btn"
                onClick={() => verifyProperty(property.id)}
              >
                Verify Property
              </button>
            </div>
          ))
        ) : (
          <p className="no-properties">
            No unverified properties available for verification.
          </p>
        )}
      </div>
      {modal.show && (
        <div className={`modal ${modal.success ? "success" : "error"}`}>
          <div className="modal-content">
            <p>{modal.message}</p>
            <button
              onClick={() => {
                setModal({ show: false, message: "", success: true });
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerifyProperties;
