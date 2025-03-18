
//const {MongoClient} = require("mongodb");
const { MongoClient, ServerApiVersion } = require('mongodb');


const uri = process.env.MONGO_URI;
const client = new MongoClient(uri,{
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
    });

async function connectDB(){
    try {
        await client.connect(); 
        console.log("connected to database")
    } catch (error) {
        console.error(error)
    }


}

function getDB() {
    return client.db("mealplanDB")
}




module.exports = { connectDB, getDB };


