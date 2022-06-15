const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');




const itemschema = new Schema({

    name: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },
    address: [{
        type: String,
    }],
    price: {
    type: String
    }

})

const Userschema = new Schema({
    name: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: true,
        minlength: 10,
        //maxlength: 11,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 300
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isDelivery: {
        type: Boolean,
        default: false

    },
    isCustomer: {
        type: Boolean,
        default: true

    },
    AID: {
        type: Number
        
    },
    CID: {
        type: Number
        

    },
    DID: {
        type: Number
        
    },

    DIDfree: {
        type: Boolean,
        default: true
    }


})

const orderschema = new Schema({ 

    items: [{
        name: {
        type: String,
        },
        quantity: {
            type: String
        }
    }], 
    orderedby: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['created','assigned','delivered']
    },
    address: {type: String}

})

const deliveryschema = new Schema({
    
    deliveryid: {
        type: String,
    },
    status: {
        type: String,
        enum: ['created', 'reachedStore', 'enRoute', 'delivered', 'canceled'],
        default: 'created'
    },
    orderedby: {
        type: Number
    },
    address: {
     type: String
    }

})


Userschema.methods.generateAuthToken = function () {
const token = jwt.sign({_id: this.id, isAdmin: this.isAdmin, isCustomer: this.isCustomer, isDelivery: this.isDelivery}, 'JWTprivatekey')
    return token;
}


const item = mongoose.model('item', itemschema);
const users = mongoose.model('users', Userschema);
const order = mongoose.model('order', orderschema);
const delivery = mongoose.model('delivery', deliveryschema);




module.exports = { item, users, order, delivery};