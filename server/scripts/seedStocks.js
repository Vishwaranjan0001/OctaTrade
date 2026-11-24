import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { Stock } from "../models/Stock.js";

// Symbols are stored without the ".NS" suffix, the same way the desk shows them.
// The desk adds ".NS" itself when it asks Yahoo for a quote.
const STOCKS = [
  { symbol: "ADANIENT", name: "Adani Enterprises" },
  { symbol: "ADANIPORTS", name: "Adani Ports and SEZ" },
  { symbol: "APOLLOHOSP", name: "Apollo Hospitals Enterprise" },
  { symbol: "ASIANPAINT", name: "Asian Paints" },
  { symbol: "AXISBANK", name: "Axis Bank" },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance" },
  { symbol: "BAJAJFINSV", name: "Bajaj Finserv" },
  { symbol: "BEL", name: "Bharat Electronics" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel" },
  { symbol: "CIPLA", name: "Cipla" },
  { symbol: "COALINDIA", name: "Coal India" },
  { symbol: "DRREDDY", name: "Dr. Reddy's Laboratories" },
  { symbol: "EICHERMOT", name: "Eicher Motors" },
  { symbol: "ETERNAL", name: "Eternal" },
  { symbol: "GRASIM", name: "Grasim Industries" },
  { symbol: "HCLTECH", name: "HCL Technologies" },
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "HDFCLIFE", name: "HDFC Life Insurance" },
  { symbol: "HEROMOTOCO", name: "Hero MotoCorp" },
  { symbol: "HINDALCO", name: "Hindalco Industries" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "INDIGO", name: "InterGlobe Aviation" },
  { symbol: "INFY", name: "Infosys" },
  { symbol: "ITC", name: "ITC" },
  { symbol: "JIOFIN", name: "Jio Financial Services" },
  { symbol: "JSWSTEEL", name: "JSW Steel" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank" },
  { symbol: "LT", name: "Larsen & Toubro" },
  { symbol: "M&M", name: "Mahindra & Mahindra" },
  { symbol: "MARUTI", name: "Maruti Suzuki India" },
  { symbol: "NESTLEIND", name: "Nestle India" },
  { symbol: "NTPC", name: "NTPC" },
  { symbol: "ONGC", name: "Oil and Natural Gas Corporation" },
  { symbol: "POWERGRID", name: "Power Grid Corporation of India" },
  { symbol: "RELIANCE", name: "Reliance Industries" },
  { symbol: "SBILIFE", name: "SBI Life Insurance" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "SHRIRAMFIN", name: "Shriram Finance" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries" },
  { symbol: "TATACONSUM", name: "Tata Consumer Products" },
  { symbol: "TATAMOTORS", name: "Tata Motors" },
  { symbol: "TATASTEEL", name: "Tata Steel" },
  { symbol: "TCS", name: "Tata Consultancy Services" },
  { symbol: "TECHM", name: "Tech Mahindra" },
  { symbol: "TITAN", name: "Titan Company" },
  { symbol: "TRENT", name: "Trent" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement" },
  { symbol: "WIPRO", name: "Wipro" }
];

await connectDatabase();

// Upsert by symbol: safe to run again, and re-running fixes a changed name.
const result = await Stock.bulkWrite(
  STOCKS.map((s) => ({
    updateOne: {
      filter: { symbol: s.symbol },
      update: { $set: { name: s.name, exchange: "NSE", currency: "INR", isActive: true } },
      upsert: true
    }
  }))
);

console.log(`Seeded stocks: ${result.upsertedCount} added, ${result.modifiedCount} updated.`);
console.log(`Stocks in collection: ${await Stock.countDocuments()}`);

await mongoose.disconnect();
