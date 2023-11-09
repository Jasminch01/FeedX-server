const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;

//middlewares
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin : ['https://feedx-5dab1.web.app', 'https://feedx-5dab1.firebaseapp.com/', 'https://cozy-platypus-555f05.netlify.app'],
  credentials : true
}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nkafzub.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//middlewares

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const foodCollection = client.db("FeedX").collection("foodCollection");
    const requestFoods = client.db("FeedX").collection("requestFoods");

    //
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.cookie("token", token, {
        httpOnly : true,
        secure: true,
        sameSite: 'none'
      })
      .send({ success : true });
    });

    //clear cookies
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    //get all foods data
    app.get("/foods", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });

    //get featured food data
    app.get("/featured-foods", async (req, res) => {
      const result = await foodCollection
        .find()
        .sort({ foodQuantity: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    //get single foods
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    //update single foods
    app.put("/manage/:id", async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const data = req.body;
      const updateData = {
        $set: {
          ...data,
        },
      };
      const option = { upsert: true };
      const result = await foodCollection.updateOne(id, updateData, option);
      res.send(result);
    });

    //get all requested foods
    app.get("/requested-foods", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { requstorEmail: req.query.email };
      }
      const result = await requestFoods.find(query).toArray();
      res.send(result);
    });

    //get single request food
    app.get("/requested-foods/:id", async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const result = await requestFoods.findOne(id);
      res.send(result);
    });

    //insert foods
    app.post("/foods", async (req, res) => {
      const foods = req.body;
      const result = await foodCollection.insertOne(foods);
      res.send(result);
    });

    //insert requseted foods
    app.post("/requested-foods", async (req, res) => {
      const food = req.body;
      const result = await requestFoods.insertOne(food);
      res.send(result);
    });
    //deleted requested foods
    app.delete("/requested-foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await requestFoods.deleteOne(query);
      res.send(result);
    });

    //deleted single food
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("FeedX server is running");
});

app.listen(port, (req, res) => {
  console.log(` FeedX server running port ${port} `);
});
