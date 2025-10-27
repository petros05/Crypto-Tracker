import React, { useState } from "react";
import Header from "./Header";
import LoadingSpinner from "./LoadingSpinner";


function Exchanges() {
    const [loading, setLoading] = useState(false);
    setLoading(false)
    
    return (
    <div>
      <Header />
      
      <div className="main">
        <h2 className="main-title">Today's Cryptocurrency Prices by Papit</h2>
        <div className="table-container">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <table className="coins-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>1h</th>
                  <th>24h</th>
                  <th>7d</th>
                  <th>Volume(24h)</th>
                  <th>Market Cap</th>
                  <th>Circulating Supply</th>
                </tr>
              </thead>
              <tbody>
                {/* {coins.map((item) => ( */}
                  <tr
                    key={1}
                    style={{ cursor: "pointer" }}
                   >
                    <td>1</td>
                    <td className="name-column">Name</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                    <td>1</td>
                  </tr>
                {/* ))} */}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Exchanges