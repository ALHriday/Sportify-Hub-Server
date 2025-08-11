require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5500;
const app = express();

app.use(cors({
    origin: ['https://sportify-hub-web.netlify.app', 'http://localhost:5173'],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

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


const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).send({ message: 'unAuthorized Access' });
    }

    try {
        jwt.verify(token, process.env.PrivateKey, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: 'unAuthorized access' });
            }
            req.userInfo = decoded;
            next();
        })
    } catch (error) {
        console.error("JWT verification failed:", error.message);
    }
}

async function run() {
    try {
        const db = client.db("sportifyHub");
        const productCollection = db.collection("products");
        const cartItemCollection = db.collection("cartData");

        app.post('/jwt', (req, res) => {
            const userInfo = req.body;
            const token = jwt.sign(userInfo, process.env.PrivateKey, { expiresIn: '1h' });

            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });
            res.send({ Success: true });
        })

        app.post('/logOut', (req, res) => {
            res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' });
            res.send({ Success: true });
        })

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

        app.get('/myEquipment', verifyToken, async (req, res) => {
            const { email } = req.query;

            if (req.userInfo.userInfo !== email) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const equipments = await productCollection.find({ email }).toArray();
            res.send(equipments);
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

        app.post('/cartItem', async (req, res) => {
            const data = req.body;
            const p = await cartItemCollection.insertOne(data);
            res.send(p);
        });

        app.get('/cartItem', async (req, res) => {
            const { pName } = req.query;

            try {
                if (pName) {
                    const queryData = await cartItemCollection.find({ pName }).toArray();
                    res.send(queryData);
                } else {
                    const p = await cartItemCollection.find().toArray();
                    res.send(p);
                }
            } catch (error) {
                res.status(401).send({ message: error.message });
            }
        });

        app.get('/cartItem/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const data = await cartItemCollection.findOne(query);
            res.send(data);
        })
        app.delete('/cartItem/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const deleteItem = await cartItemCollection.deleteOne(query);
            res.send(deleteItem);
        })

        app.get('/cartItem/:userEmail', async (req, res) => {
            const userEmail = req.params.userEmail;
            const products = await cartItemCollection.find({ userEmail }).toArray();
            res.send(products);
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
