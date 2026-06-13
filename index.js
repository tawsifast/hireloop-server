const express = require('express')
const dotenv= require('dotenv');
dotenv.config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const companyCollection = db.collection("companies");
    const userCollection = db.collection("user");
    const applicationCollection = db.collection("applications");
    const planCollection = db.collection("plans")
    const subscriptionCollection = db.collection("subscriptions")

    app.get("/user", async(req, res)=>{
      const cursor = userCollection.find().skip(6);
      const result = await cursor.toArray();
      res.json(result);
    })

    // subscription 
    app.post("/subscriptions", async( req, res)=>{
      const data = req.body;
      const subInfo = {
        ...data,
        createdAt: new Date()
      }
      const result = await subscriptionCollection.insertOne(subInfo);
      // update the user plan information
      const filter = {email : data.email};
      const updateDocument = {
          $set : {
            plan : data.planId
          },
      }
      const updatedResult = await userCollection.updateOne(filter, updateDocument);
      res.json(updatedResult)
    })

    app.get("/jobs", async(req, res)=>{
        const query = {};
        if(req.query.companyId){
            query.companyId = req.query.companyId;
        }
        if(req.query.status){
            query.status = req.query.status;
        }
        const cursor = jobCollection.find(query).skip(6);
        const result = await cursor.toArray();
        res.json(result);
    });

    app.post("/applications", async(req, res)=>{
      const application = req.body;
      const newApplication = {
        ...application,
        createdAt : new Date()
      };
      const result = await applicationCollection.insertOne(newApplication);
      res.json(result);
    });

    // application related apis 
    app.get("/applications", async(req, res)=>{
      const query = {};
      if(req.query.applicantId){
        query.applicantId = req.query.applicantId
      }
      if(req.query.jobId){
        query.jobId = req.query.jobId
       }
       const cursor = applicationCollection.find(query);
       const result = await cursor.toArray();
       res.json(result);
    })

    // plans 
    app.get("/plans", async(req, res)=>{
      const query = {};
      if(req.query.plan_id){
        query.id = req.query.plan_id
      }
      const plan = await planCollection.findOne(query);
      res.json(plan);
    })

    app.get("/jobs/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await jobCollection.findOne(query);
      res.json(result);
    })

    app.post("/jobs", async(req, res)=>{
        const job = req.body;
        const newJob = {
          ...job,
          createdAt: new Date()
        }
        const result = await jobCollection.insertOne(newJob);
        res.json(result);
    });

    
    // app.get("/companies", async(req, res)=>{
    //   const cursor = companyCollection.find();
    //   const result = await cursor.toArray();
    //   res.json(result);
    // });

    // Ineffecient way og join/aggreation
    app.get("/companies", async(req, res)=>{
      const cursor = companyCollection.find();
      const companies = await cursor.toArray();
      for(const company of companies){
        const filter = {companyId : company._id.toString()}
        const jobCount = await jobCollection.countDocuments(filter);
        company.jobCount = jobCount;
      }
      res.json(companies);
    })
    // effecient way og join/aggreation
    app.get("/companies2", async(req, res)=>{
     const pipeline = [
            {
              $skip: 5
            }
          ];
      const cursor = companyCollection.aggregate(pipeline);
      const result = await cursor.toArray();
      res.json(result);
    })

    app.get("/stats", async(req, res)=>{
      const pipeline = [
        {
          $group: {
            _id : '$type',
            count : {
              $sum : 1
            }
          }
        },
        {
          $project : {
            jobType : "$_id",
            _id : 0,
            count : 1,
          }
        },
        { 
          $sort : {
              count : -1
          }
        }
      ]
      const cursor = jobCollection.aggregate(pipeline);
      const result = await cursor.toArray();
      res.json(result);
    })
    // company related apis 
    app.post("/companies", async( req, res)=>{
      const company = req.body;
      const newCompany = {
          ...company,
          createdAt: new Date()
        }
      const result = await companyCollection.insertOne(newCompany);
      res.json(result);
    })

    app.get("/my/companies", async ( req, res)=>{
      const query = {};
      if(req.query.recruiterId){
        query.recruiterId = req.query.recruiterId
      };
      const result = await companyCollection.findOne(query);
      console.log(result,"rsl");
      res.json(result || {});
    });

    app.patch("/companies/:id", async(req, res)=>{
      const {id} = req.params;
      const updatedCompany = req.body;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        // $set: updatedCompany sob change korar khetre
        $set: {
          status: updatedCompany.status
        }
      };
      const result = await companyCollection.updateOne(filter, updatedDoc);
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