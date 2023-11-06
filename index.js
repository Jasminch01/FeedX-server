const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

const port = process.env.PORT || 5000;

//middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nkafzub.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = client.db("FeedX").collection("foodCollection");
    const requestFoods = client.db('FeedX').collection('requestFoods');

    app.get("/foods", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });
    app.get("/featured-foods", async (req, res) => {
      const result = await foodCollection
        .find()
        .sort({ foodQuantity : -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });
    
    app.post('/requested-foods', async(req, res) => {
      const food = req.body;
      const result = await requestFoods.insertOne(food, (insertErr) => {
        if (insertErr && insertErr.code === 11000) {
          console.log('Username already exists. Please choose a different username.');

        } else if (insertErr) {
          console.error('Error while inserting the user:', insertErr);
          
        } else {
          // User inserted successfully
          console.log('User registered successfully.');
          // You can return a success response to the user
        }
      });
      res.send(result)
      
    })
    

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
