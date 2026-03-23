import React, { useEffect, useState } from "react";
import "./dashboard.css";

const Dashboard = () => {
  const [wallet, setWallet] = useState({
    openingBalance: 0,
    currentBalance: 0,
    holdBalance: 0,
  });

  // Example: Fetch from backend
  useEffect(() => {
    fetch("http://localhost:8080/api/wallet") // change to your API
      .then((res) => res.json())
      .then((data) => {
        setWallet({
          openingBalance: data.openingBalance,
          currentBalance: data.currentBalance,
          holdBalance: data.holdBalance,
        });
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Wallet Dashboard</h2>

      <div className="wallet-cards">
        <div className="card">
          <h3>Opening Balance</h3>
          <p>₹ {wallet.openingBalance}</p>
        </div>

        <div className="card">
          <h3>Current Balance</h3>
          <p>₹ {wallet.currentBalance}</p>
        </div>

        <div className="card">
          <h3>Hold Balance</h3>
          <p>₹ {wallet.holdBalance}</p>
        </div>
      </div>
    </div>
  );cd
};

export default Dashboard;