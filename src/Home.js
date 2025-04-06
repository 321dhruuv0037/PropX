import React from "react";
import "./css/HomePage.css"; // add styles here

const developers = [
  {
    name: "Advay Gujar",
    image: "./images/Advay.webp", // Place your image in public/images/
  },
  {
    name: "Aditya Kareer",
    image: "./images/Aditya.webp",
  },
  {
    name: "Srujana Makarande",
    image: "./images/Srujana.webp",
  },
  {
    name: "Dhruuv Naik",
    image: "./images/Dhruuv.webp",
  },
];

const HomePage = () => {
  return (
    <div className="homepage-container">
      <section className="intro-section">
        <h1>Welcome to PropX: Property Exchange Portal</h1>
        <p>
          In today’s world, property transactions often suffer from a lack of transparency, delayed verifications, and fraudulent listings. Our decentralized solution leverages blockchain technology to ensure secure, tamper-proof property records, reduce intermediaries, and bring efficiency to the real estate sector. Whether you're a buyer or seller, our platform simplifies the process by making property listings trustworthy, verifiable, and easy to manage.
        </p>
      </section>

      <section className="developers-section">
        <h2>Meet the Developers</h2>
        <div className="developer-cards">
          {developers.map((dev, index) => (
            <div className="developer-card" key={index}>
              <img src={dev.image} alt={dev.name} />
              <h3>{dev.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
