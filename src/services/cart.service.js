const httpStatus = require("http-status");
const { Cart, Product, User } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");


/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const cart = await Cart.findOne({ email: user.email });
  if (!cart)
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  let cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    try {
      cart = await Cart.create({ email: user.email, cartItems: [] });
    } catch (error) {
      console.log("error while creating the cart", error);
      throw new ApiError(500, "User Cart Creation Failed");
    }
  }
  if(cart==null) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR,"User does not have a cart")
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(400, "Product doesn't exist in database");

  cart.cartItems.map((item) => {
    if (item.product._id == productId)
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product already in cart. Use the cart sidebar to update or remove product from cart"
      );
  });
  cart.cartItems = [...cart.cartItems, { product, quantity }];
  try {
    await cart.save();
    // console.log("saved cart successfully", cart);
    return cart;
  } catch (error) {
    console.log("error while saving the cart", error);
    throw new ApiError(500,"Adding product failed")
  }
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(400, "Product doesn't exist in database");

  let cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );
  }

  let updateCartItems = cart.cartItems;
  for (let i = 0; i < updateCartItems.length; i++) {
    if (updateCartItems[i].product._id == productId) {
      updateCartItems[i].quantity = quantity;
      cart.cartItems = updateCartItems;
      try {
        await cart.save();
        // console.log("updated cart successfully", cart)
        return cart;
      } catch (error) {
        throw new ApiError(500, "Internal server error");

        // console.log("error while updating the cart", error)
      }
    }
  }
  throw new ApiError(400, "Product not in cart");
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  let cart = await Cart.findOne({ email: user.email });

  if (!cart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart.");
  }
  for (let i = 0; i < cart.cartItems.length; i++) {
    if (cart.cartItems[i].product._id == productId) {
      cart.cartItems.splice(i, 1);
      try {
        await cart.save();
        // console.log("deleted cart sucessfully", cart);
        return;
      } catch (error) {
        console.log("error while deleting item from the cart", error);
      }
    }
  }
  throw new ApiError(400, "Product not in cart");
};


const checkout=async(user)=>{
  let cart=await Cart.findOne({email:user.email});
  if(!cart) throw new ApiError(httpStatus.NOT_FOUND,"User does not have a cart");

  if(cart.cartItems.length===0) throw new ApiError(httpStatus.BAD_REQUEST,"Empty cart");

  const hasSetNonDefaultAddress=await user.hasSetNonDefaultAddress();
  if(!hasSetNonDefaultAddress) throw new ApiError(httpStatus.BAD_REQUEST,"Address not set");

  let cartCost=0;
  for(let i=0;i<cart.cartItems.length;i++){
    cartCost+=cart.cartItems[i].product.cost*cart.cartItems[i].quantity
  }
  console.log(cartCost, user.walletMoney)
  if(cartCost>user.walletMoney) throw new ApiError(httpStatus.BAD_REQUEST,"Wallet balance is not sufficient");

  cart.cartItems=[];
  user.walletMoney-=cartCost;

  try {
    await cart.save();
  } catch (error) {
    console.log("error while deleting item from the cart", error);
  }

  try {
    await user.save();
  } catch (error) {
    console.log("error while deleting item from the cart", error);
  }
}
module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
