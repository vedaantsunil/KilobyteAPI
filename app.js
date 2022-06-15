const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
const bodyParser = require('body-parser');
//const formidable = require('express-formidable');
const Joi = require('joi');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { order, users , delivery , item} = require('./schema.js')
const auth = require('./auth');
const admin = require('./admin');
const customer = require('./customer');
const deliver = require('./delivery');





//app.use(formidable());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/Kilobyte',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });


const db = mongoose.connection;
db.once("open", function ()
{
    console.log("db connected")
});

const joischema = Joi.object({
    name: Joi.string().min(3).required(),
    number: Joi.number().min(99999999).max(9999999999).required(), //assuming 10 digit phone numbers in India
    email:Joi.string().min(4).email()
   
});

const joischemaregister = Joi.object({
    name: Joi.string().min(3).required(),
    password: Joi.string().min(6).required(),
    number:Joi.number().min(1000000000).max(9999999999).required(),
    isAdmin: Joi.boolean(),
    isCustomer: Joi.boolean(),
    isDelivery: Joi.boolean(),
    DID: Joi.boolean()

    
});


//1. FIRST WE REGISTER THE AUTHORITY WHICH CAN DO CRUD OPERATIONS

app.post('/register', async (req, res) => {
    const { error } = joischemaregister.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Check if this users already exisits
    let Users = await users.findOne({ number: req.body.number });
    if (Users) {
        return res.status(400).send('users already exists!');
    } else {
        // Insert the new usersif they do not exist yet
        Users= new users
({
            name: req.body.name,
            number: req.body.number,
            password: req.body.password,
            isAdmin: req.body.isAdmin,
            isCustomer: req.body.isCustomer,   
            isDelivery: req.body.isDelivery,   
        });
        const salt = await bcrypt.genSalt(10);
        Users.password = await bcrypt.hash(Users.password, salt);
        await Users.save();

        res.send(Users._id);
    }
});

//2.LOGGING IN WITH REGISTERED user AND GETTING JWT AUTHENTICATED

app.post('/login', async (req, res) => {

    const logg = Joi.object({
    password: Joi.string().min(6).required(),
    number:Joi.number().min(1000000000).max(9999999999).required()
});

    const { error } = logg.validate(req.body);
    if (error) {
        return res.status(400).send('Number must be valid');
    }

    //  find the users by their phone number
    let Users = await users.findOne({ number: req.body.number });
    if (!Users) {
        return res.status(401).send('No account with this number');
    }

    // Then validate the Credentials in MongoDB match
    const validPassword = await bcrypt.compare(req.body.password, Users.password);
    if (!validPassword) {
        return res.status(401).send('Incorrect number or password.');
    }

   // const token = jwt.sign({_id: users.id, isAdmin: users.isAdmin}, 'JWTprivatekey')
    const token = Users.generateAuthToken();
    res.header('x-auth-token', token).send(Users.id);
});

// anyone authenticated can add an item inside our item inventory

app.post('/additem',auth, async (req, res) => {
    
    const itemschema = Joi.object({
    name: Joi.string().min(2).required(),
        category: Joi.string().min(2).required(),
    price: Joi.number(),
    address: Joi.string()
});
    
    
    const { error } = itemschema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Check if this item already exisits
    let Item = await item.findOne({ number: req.body.number });
    if (Item) {
        return res.status(400).send('item already exisits!, try updating item instead');
    } else {
        
        Item = new item({
            name: req.body.name,
            category: req.body.category,
            price: req.body.price,
            address: req.body.address
        });
         
        await Item.save();

        res.send(Item._id);
    }
});

//the customer adds to cart his required products from the item inventory
app.post('/addtocart', [auth,customer], async function (req, res) {

    const cartschema = Joi.object({
    name: Joi.string().min(2).required(),
    quantity: Joi.number().min(1).required(),
    orderedby: Joi.number(),
    status: Joi.string()
});

    try {
        const { error } = cartschema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }
        const x = new order({

            items: {
                name: req.body.name,
                quantity: req.body.quantity,
            },
            orderedby: req.body.orderedby,
            status: req.body.status

        })
        const y = await item.findOne({ name: req.body.name })
        const add = y.address[0];

        x.address = add;
        x.save();
        res.send("successfully added to cart")
    }
    catch (err) {
        console.log(err);
    }
})

//only admin can see orders placed by customers, who then assigns it to delivery person
app.get('/seeorders', [auth, admin], async function (req, res) {
    
    const x = await order.find({});
    res.send(x);
})

app.post('/assigndelivery', [auth,admin], async function (req, res) {

    
    try{
    const del = await users.findOne({ DIDfree: true, isDelivery: true });
    const delId = del._id;
    const orderedby = req.body.orderedby
        const x = await order.findOne({ orderedby: req.body.orderedby })
        const addr = x.address;


    let deliv = new delivery ({ 
        deliveryid: delId,
        orderedby: orderedby,
        address: addr
    })

    deliv.save();
        
    res.send(deliv._id)
    }
    catch(err) {
        console.log(err);
    }
   
})

app.get('/me',auth,  async function (req, res) {
    const Users = await users.findById(req.Users._id).select('-password')
    res.send(Users);
})
//delivery person can change the status of the delivery of the item

app.put('/changestatus/:id', [auth, deliver], async function (req, res) {
    let status = req.body.status
    let did = req.params.id
    
    let x = await delivery.findOneAndUpdate({ deliveryid: did, status: status }) 
    x.status= status
    x.save();
    res.send('status updated')
})




app.listen(port, function (req, res) {
    console.log("app listening on port 3000");
 })


