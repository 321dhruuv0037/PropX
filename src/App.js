import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AddProperty from "./AddProperty";
import AllProperties from "./AllProperties";
import { contractABI, contractAddress } from "./Contract";
import Home from "./Home";
import "./css/App.css";
import Web3 from "web3";
// Dbit2025@
function App() {
  const [account, setAccount] = useState("");
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const loadWeb3 = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
  
          await window.ethereum.request({
            method: "eth_requestAccounts",
          });
  
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);
  
          const contractInstance = new web3Instance.eth.Contract(
            contractABI,
            contractAddress
          );
          setContract(contractInstance);
  
          window.ethereum.on("accountsChanged", (accounts) => {
            setAccount(accounts[0]);
          });
  
          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
        } else {
          alert("Please install MetaMask!");
        }
      } catch (error) {
        console.error("MetaMask Connection Error:", error);
        alert("Failed to connect MetaMask. Check console for details.");
      }
    };

    loadWeb3();
    window.ethereum.on("accountsChanged", (accounts) => {
      setAccount(accounts[0]);
      window.location.reload(); // reload to force refresh and resync everything
    });
    
  }, []);

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/add-property" className="nav-link">
            Add Property
          </Link>
          <Link to="/all-properties" className="nav-link">
            Buy Property
          </Link>
          <p style={{ marginLeft: "auto", marginRight: "10px", color: "#fff" }}>
            Connected: {account?.slice(0, 6)}...{account?.slice(-4)}
          </p>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/add-property"
            element={
              <AddProperty account={account} contract={contract} web3={web3} />
            }
          />
          <Route
            path="/all-properties"
            element={
              <AllProperties
                account={account}
                contract={contract}
                web3={web3}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
