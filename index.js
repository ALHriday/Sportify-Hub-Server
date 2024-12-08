require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5500;
const app = express();

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${pass}@cluster0.lgngp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const db = client.db("sportifyHub");
        const productCollection = db.collection("products");

        app.post('/products', async (req, res) => {
            const data = req.body;
            const p = await productCollection.insertOne(data);
            res.send(p);
        });
        app.get('/products', async (req, res) => {
            const products = productCollection.find();
            const filter = await products.toArray();
            res.send(filter);        
        });
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product);
        });
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateProduct = req.body;
            const product = {
                $set: {
                    pName: updateProduct.pName,
                    price: updateProduct.price,
                    category: updateProduct.category,
                    rating: updateProduct.rating,
                    stockStatus: updateProduct.stockStatus,
                    batWithExtraGrip: updateProduct.batWithExtraGrip,
                    processingTime: updateProduct.processingTime,
                    photoURL: updateProduct.photoURL
                }
            }
            const result = await productCollection.updateOne(filter, product, options);
            res.send(result); 
        });

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const product = await productCollection.deleteOne(query);
            res.send(product);
        });
        

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', async (req, res) => {
    res.send('Sportify-Hub-Server');
});

app.listen(port, function () {
    console.log(`Server is running Successful at Port: ${port}`);
});
