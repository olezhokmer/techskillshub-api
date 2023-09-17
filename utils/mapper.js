function mapProduct(product) {
  if (!product) return;

  return {
    id: product._id.toString(),
    name: product.name,
    price: product.price,
    description: product.description,
    images: product.images,
    discount: product.discount,
    currentPrice: product.currentPrice,
  };
}

function mapCategory(category) {
  if (!category) return;

  return {
    id: category._id.toString(),
    name: category.name,
  };
}

function mapUser(user) {
  if (!user) return;

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

module.exports = {
  mapProduct,
  mapCategory,
  mapUser,
};
