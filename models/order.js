const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const itemSchema = require('./itemSchema');

const lineItemSchema = new Schema({
    // Set qty to 1 when new item pushed into lineItems
    qty: { type: Number, default: 1 },
    item: itemSchema
}, {
    timestamps: true,
    // Add this to ensure virtuals are serialized
    toJSON: { virtuals: true }
});

// Add an extPrice to the line item
lineItemSchema.virtual('extPrice').get(function () {
// the 'this' keyword is bound to the lineItem subdocument
return this.qty * this.item.price;
});

const orderSchema = new Schema({
    // An order belongs to a user
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    // Makes sense to embed an order's line items
    lineItems: [lineItemSchema],
    // A user's unpaid order is their "cart"
    isPaid: { type: Boolean, default: false },
}, {
    timestamps: true,
    // Serialize those virtuals!
    toJSON: { virtuals: true }
});

// Add the following helpful virtuals to order documents
orderSchema.virtual('orderTotal').get(function () {
    return this.lineItems.reduce((total, item) => total + item.extPrice, 0);
});

orderSchema.virtual('totalQty').get(function () {
    return this.lineItems.reduce((total, item) => total + item.qty, 0);
});

orderSchema.virtual('orderId').get(function () {
    return this.id.slice(-6).toUpperCase();
});

// statics are callable on the model, not an instance (document)
orderSchema.statics.getCart = function(userId) {
    // 'this' is bound to the model (don't use an arrow function)
    // return the promise that resolves to a cart (the user's unpaid order)
    return this.findOneAndUpdate(
      // query object
      { user: userId, isPaid: false },
      // update document - provides values when inserting new order... in the case the order (cart) is upserted
      { user: userId },
      // options object... upsert option creates the doc if it doesn't exist!
      { upsert: true, new: true }
    );
};

module.exports = mongoose.model('Order', orderSchema);