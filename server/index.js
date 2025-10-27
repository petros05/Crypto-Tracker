import express from "express";
import cors from "cors";
import axios from "axios";
import env from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

env.config();
const app = express();
const port = 3000;
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "change_this_to_a_secure_random_string_in_production";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const CMC_BASE_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency";

app.use(cors());
app.use(express.json());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect()

// Verify authentication Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Add user info to request object
    next();
  });
};

// Format time and date for coin chart
function formatLabel(ts, days) {
  const date = new Date(ts);
  if (days === "1") {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Get all coin information from CoinMarketCap API and CoinGecko API
const getCoinInfo = async (coinName) => {
  try {
    const responseInfo = await axios.get(
      `${CMC_BASE_URL}/info?slug=${coinName}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY_2,
        },
      }
    );
    const responseQuotes = await axios.get(
      `${CMC_BASE_URL}/quotes/latest?slug=${coinName}`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY_2,
        },
      }
    );
    const resultInfo = Object.values(responseInfo.data.data)[0];
    const resultQuotes = Object.values(responseQuotes.data.data)[0];

    return {
      id: resultInfo.id,
      name: resultInfo.name,
      logo: resultInfo.logo,
      symbol: resultInfo.symbol,
      website: resultInfo.urls.website[0],
      description: resultInfo.description,
      cmc_rank: resultQuotes.cmc_rank,
      max_supply: resultQuotes.max_supply,
      circulating_supply: resultQuotes.circulating_supply,
      total_supply: resultQuotes.total_supply,
      price: resultQuotes.quote.USD.price,
      market_cap: resultQuotes.quote.USD.market_cap,
      volume_24h: resultQuotes.quote.USD.volume_24h,
      volume_change_24h: resultQuotes.quote.USD.volume_change_24h,
      percent_change_24h: resultQuotes.quote.USD.percent_change_24h,
      percent_change_1h: resultQuotes.quote.USD.percent_change_1h,
      percent_change_24h: resultQuotes.quote.USD.percent_change_24h,
      percent_change_7d: resultQuotes.quote.USD.percent_change_7d,
      percent_change_30d: resultQuotes.quote.USD.percent_change_30d,
      percent_change_90d: resultQuotes.quote.USD.percent_change_90d,
    };
  } catch (err) {
    console.log(err);
  }
};

// Get top 100 cryptocurrency from CoinMarketCap API with it's logo
const getTop100 = async () => {
  try {
    // Get top 100 coins
    const listingsResponse = await axios.get(
      `${CMC_BASE_URL}/listings/latest`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
        },
        params: { limit: 100 },
      }
    );

    const coins = listingsResponse.data.data.map((coin) => ({
      id: coin.id,
      name: coin.name,
      slug: coin.slug,
      symbol: coin.symbol,
      cmc_rank: coin.cmc_rank,
      price: coin.quote?.USD?.price,
      percent_change_1h: coin.quote?.USD?.percent_change_1h,
      percent_change_24h: coin.quote?.USD?.percent_change_24h,
      percent_change_7d: coin.quote?.USD?.percent_change_7d,
      volume_24h: coin.quote?.USD?.volume_24h,
      market_cap: coin.quote?.USD?.market_cap,
      circulating_supply: coin.circulating_supply,
    }));

    // Create slug list
    const slugs = coins.map((c) => c.slug).join(",");

    // Request logos using slug
    const infoResponse = await axios.get(`${CMC_BASE_URL}/info`, {
      headers: {
        "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
      },
      params: { slug: slugs },
    });

    const infoData = infoResponse.data.data;

    // Merge by slug instead of id
    const finalResult = coins.map((coin) => {
      // find the matching entry in infoData
      const matchedInfo = Object.values(infoData).find(
        (info) => info.slug === coin.slug
      );
      return {
        ...coin,
        logo: matchedInfo?.logo || null,
      };
    });

    return finalResult;
  } catch (err) {
    console.error(err.response?.data || err);
    return [];
  }
};

// Get all (10,000) coin from CoinMarketCap for Search functionality
let cachedCoins = [];
let lastFetchTime = 0;
const getAllCodes = async () => {
  const now = Date.now();
  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  // If we already have cached data and it's still fresh, return it
  if (cachedCoins.length > 0 && now - lastFetchTime < CACHE_DURATION) {
    return cachedCoins;
  }

  try {
    const response = await axios.get(`${CMC_BASE_URL}/map`, {
      headers: {
        "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
      },
    });

    cachedCoins = response.data.data || [];
    lastFetchTime = now;
    return cachedCoins;
  } catch (err) {
    console.error("Error fetching CoinMarketCap data:", err.message);
    throw err;
  }
};


app.get("/search", async (req, res) => {
  try {
    const query = (req.query.q || "").toLowerCase();
    const coins = await getAllCodes();

    let filtered = coins;

    // If user typed something, filter by name or symbol
    if (query) {
      filtered = coins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query)
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: "Error fetching coins" });
  }
});

app.get("/coin-api", async (req, res) => {
  try {
    const response = await getTop100();
    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data from CoinMarketCap" });
  }
});

// Get info for spesfic coin
app.get("/currency/:name", async (req, res) => {
  const coin = req.params.name;
  const days = req.query.days || "90"; // default 1 day

  try {
    // Fetch price data from CoinGecko
    const { data } = await axios.get(
      `${COINGECKO_BASE}/coins/${encodeURIComponent(coin)}/market_chart`,
      {
        params: {
          vs_currency: "usd",
          days,
        },
      }
    );

    const prices = data.prices.map(([, price]) => price);
    const timestamps = data.prices.map(([ts]) => ts);

    // Generate labels (time or date based on days)
    const maxLabels = data.prices.length;
    let labels;

    if (timestamps.length <= maxLabels) {
      labels = timestamps.map((t) => formatLabel(t, days));
    } else {
      const step = Math.ceil(timestamps.length / maxLabels);
      labels = timestamps.map((t, i) =>
        i % step === 0 ? formatLabel(t, days) : ""
      );
    }
    const allData = await getCoinInfo(coin.toLowerCase());
    res.json({ labels, prices, info: allData });
  } catch (err) {
    console.error(
      "CoinGecko fetch failed:",
      err?.response?.status,
      err?.message
    );
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});

// Sign up logic
app.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length) {
      res.status(404).json({
        status: "faild",
        message: "User already registered",
      });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(err);
        } else {
          const result = await db.query(
            "INSERT INTO users(first_name, last_name, email, password) VALUES($1, $2, $3, $4) RETURNING *",
            [firstName, lastName, email, hash]
          );
          const user = result.rows[0];

          const token = jwt.sign(
            {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            },
            JWT_SECRET,
            { expiresIn: "20d" }
          );
          res.status(201).json({
            message: "User registered successfully",
            user: {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
            },
            token,
          });
        }
      });
    }
  } catch (err) {
    console.log("Error comes from signup ", err);
  }
});

// Log in logic
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "20d" }
    );

    return res.status(200).json({
      message: "User login successfully",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.log("Error from login: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get user's favorite coins
app.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      "SELECT * FROM favorite_coin WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update existing favorite route to use authentication
app.post("/favorite/:name", authenticateToken, async (req, res) => {
  const { coinName, symbol, slug } = req.body;
  const userId = req.user.id; // Get userId from authenticated token

  try {
    const existing = await db.query(
      "SELECT * FROM favorite_coin WHERE user_id = $1 AND symbol = $2 AND slug = $3",
      [userId, symbol, slug]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Coin already added" });
    }

    const insert = await db.query(
      "INSERT INTO favorite_coin (coin_name, symbol, slug, user_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [coinName, symbol, slug, userId]
    );

    if (insert.rows.length > 0) {
      return res.status(200).json({ message: "Coin added successfully" });
    }

    return res.status(500).json({ message: "Failed to add coin" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Remove favorite coin
app.delete("/favorite/:name", authenticateToken, async (req, res) => {
  const { symbol, slug } = req.body;
  const userId = req.user.id;

  try {
    const result = await db.query(
      "DELETE FROM favorite_coin WHERE user_id = $1 AND symbol = $2 AND slug = $3",
      [userId, symbol, slug]
    );

    if (result.rowCount > 0) {
      return res.status(200).json({ message: "Coin removed successfully" });
    }

    return res.status(404).json({ message: "Coin not found in favorites" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get full data for all user's favorite coins (optimized, single API call)
app.get("/favorite", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Get all favorite coins for this user
    const favResult = await db.query(
      "SELECT * FROM favorite_coin WHERE user_id = $1",
      [userId]
    );
    const favorites = favResult.rows;
    if (!favorites.length) {
      return res.json([]);
    }

    // Build comma-separated slug list
    const slugs = favorites.map(f => f.slug).join(",");

    // Fetch all coin info in one call
    const [infoRes, quotesRes] = await Promise.all([
      axios.get(`${CMC_BASE_URL}/info`, {
        headers: { "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY_2 },
        params: { slug: slugs },
      }),
      axios.get(`${CMC_BASE_URL}/quotes/latest`, {
        headers: { "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY_2 },
        params: { slug: slugs },
      })
    ]);

    // Both responses are keyed by coin id
    const infoData = infoRes.data.data;
    const quotesData = quotesRes.data.data;

    // Merge info and quotes for each favorite
    const merged = Object.values(infoData).map(info => {
      const quote = quotesData[info.id];
      return {
        id: info.id,
        name: info.name,
        logo: info.logo,
        symbol: info.symbol,
        website: info.urls.website[0],
        description: info.description,
        cmc_rank: quote?.cmc_rank,
        max_supply: quote?.max_supply,
        circulating_supply: quote?.circulating_supply,
        total_supply: quote?.total_supply,
        price: quote?.quote?.USD?.price,
        market_cap: quote?.quote?.USD?.market_cap,
        volume_24h: quote?.quote?.USD?.volume_24h,
        volume_change_24h: quote?.quote?.USD?.volume_change_24h,
        percent_change_24h: quote?.quote?.USD?.percent_change_24h,
        percent_change_1h: quote?.quote?.USD?.percent_change_1h,
        percent_change_7d: quote?.quote?.USD?.percent_change_7d,
        percent_change_30d: quote?.quote?.USD?.percent_change_30d,
        percent_change_90d: quote?.quote?.USD?.percent_change_90d,
        slug: info.slug,
      };
    });
    res.json(merged);
  } catch (err) {
    console.error("/favorite error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`App is raning ${port}`);
});
