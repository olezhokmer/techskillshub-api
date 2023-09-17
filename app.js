const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const app = express();
const cors = require('cors');
const Product = require('./models/product.model');
const User = require('./models/user.model');
const Category = require('./models/category.model');
const Transaction = require('./models/transaction.model');

const productFilterSchema = require('./dto/getProductsSchema');
const registerSchema = require('./dto/registerSchema');
const loginSchema = require('./dto/loginSchema');
const transactionSchema = require('./dto/transactionSchema');
const authMiddleware = require('./middleware/auth');

const httpStatus = require('http-status');

const mongoErrors = require('./enums/mongoErrors');
const { mapProduct, mapCategory, mapUser, mapTransaction, mapTransactionProduct } = require('./utils/mapper');

dotenv.config();

const secret = process.env.tokenSecret;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.post('/products', async (req, res) => {
  const { error, value } = productFilterSchema.validate(req.body);

  if (error) {
    const [ errorMessage ] = error.details;

    return res.status(httpStatus.BAD_REQUEST).json({ errorMessage });
  }
  const { categories, lowestPrice, highestPrice } = value;

  const filter = {};

  if (categories.length) {
    filter.categoryId = { $in: categories };
  }

  if (lowestPrice && highestPrice) {
    filter.currentPrice = { $gte: lowestPrice, $lte: highestPrice };
  }

  const products = await Product.aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryInfo"
      }
    },
    {
      $unwind: "$categoryInfo"
    },
    {
      $match: filter
    },
  ]);

  const mappedProducts = products.map((product) => mapProduct(product));

  res.status(httpStatus.OK).json({ products: mappedProducts });
});

app.get('/categories', async (req, res) => {
  const allCategories = await Category.find();

  const mapped = allCategories.map((category) => mapCategory(category));

  res.status(httpStatus.OK).json({ categories: mapped });
}) 

app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(new mongoose.Types.ObjectId(id));

  const mapped = mapProduct(product);

  res.status(httpStatus.OK).json({ product: mapped });
});

app.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);

  if (error) {
    const [ errorMessage ] = error.details;

    return res.status(httpStatus.BAD_REQUEST).json({ errorMessage });
  }

  try {
    const userToSave = new User(value);
    const user = await userToSave.save();
    const mapped = mapUser(user);
    const token = jwt.sign(mapped, secret);

    return res.status(httpStatus.OK).json({ user: mapped, token });
  } catch (error) {
    if (error.code === mongoErrors.duplication) {
      return res.status(httpStatus.BAD_REQUEST).json({ errorMessage: 'User already exists.' });
    }
  }
});

app.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    const [ errorMessage ] = error.details;

    return res.status(httpStatus.BAD_REQUEST).json({ errorMessage });
  }
  const { email, password } = value;

  const user = await User.findOne({
    email,
    password,
  });

  if (!user) {
    return res.status(httpStatus.BAD_REQUEST).json({ errorMessage: 'Wrong credentials provided.' });
  }

  const mapped = mapUser(user);
  const token = jwt.sign(mapped, secret);

  return res.status(httpStatus.OK).json({ user: mapped, token });
});

app.post('/transaction', authMiddleware, async (req, res) => {
  const { error, value } = transactionSchema.validate(req.body);

  if (error) {
    const [ errorMessage ] = error.details;

    return res.status(httpStatus.BAD_REQUEST).json({ errorMessage });
  }

  const products = await Product.find({ _id: { $in: value.productIds } });

  if (!products.length) {
    return res.status(httpStatus.BAD_REQUEST).json({ errorMessage: 'No products in a card.' });
  }

  const productIds = products.map((product) => product._id);

  const transaction = new Transaction({
    userId: req.user?._id,
    productIds: productIds,
  });

  const savedTransaction = await transaction.save();
  const mapped = mapTransaction(savedTransaction);
  const token = jwt.sign(mapped, secret);

  return res.status(httpStatus.OK).json({ token });
});

app.get('/transaction/:token', authMiddleware, async (req, res) => {
  const { token } = req.params;
  let jwtPayload;

  try {
    jwtPayload = jwt.verify(token, secret);
  } catch (error) {
    return res.status(httpStatus.UNAUTHORIZED).json({ errorMessage: 'Wrong transaction token.' });
  }

  const transactionId = new mongoose.Types.ObjectId(jwtPayload.id);

  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return res.status(httpStatus.NOT_FOUND).json({ errorMessage: 'Transaction does not exist.' });
  }

  const products = await Product.find({ _id: { $in: transaction.productIds } });

  const mapped = products.map((product) => mapTransactionProduct(product));

  return res.status(httpStatus.OK).json({ products: mapped });
});

app.listen(process.env.PORT);

