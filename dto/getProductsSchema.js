const Joi = require('joi');
const mongoose = require('mongoose');

const productFilterSchema = Joi.object({
    categories: Joi.array().items(Joi.string().length(24).hex()).default([]),
    lowestPrice: Joi.number().min(0),
    highestPrice: Joi.number().greater(Joi.ref('lowestPrice')),
}).custom((value) => {
    const categories = value.categories.map(categoryId => new mongoose.Types.ObjectId(categoryId));
    return { ...value, categories };
});

module.exports = productFilterSchema;