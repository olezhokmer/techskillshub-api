const Joi = require('joi');
const mongoose = require('mongoose');

const transactionSchema = Joi.object({
  productIds: Joi.array().items(Joi.string().length(24).hex()).required()
}, (value) => {
  const productIds = value.productIds.map(id => new mongoose.Types.ObjectId(id));
  return { ...value, productIds };
});

module.exports = transactionSchema;