const express = require('express')
const dotenv= require('dotenv');
dotenv.config();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express()
const port = 5000
app.use(cors());
app.use(express.json());



const uri =process.env.MONGODB_URI
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
   
    await client.connect();
    
    const db = client.db("hireloop_db");
    const jobCollection = db.collection("jobs");
    const companyCollection = db.collection("companies")
    ;


    app.get("/jobs", async(req, res)=>{
        const query = {};
        if(req.query.companyId){
            query.companyId = req.query.companyId;
        }
        if(req.query.status){
            query.status = req.query.status;
        }
        const cursor = jobCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
    });

    app.post("/jobs", async(req, res)=>{
        const job = req.body;
        const result = await jobCollection.insertOne(job);
        res.json(result);
    });

    // company related apis 
    app.post("/companies", async( req, res)=>{
      const company = req.body;
      const result = await companyCollection.insertOne(company);
      res.json(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})