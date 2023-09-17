const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  images: {
    type: [String],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;