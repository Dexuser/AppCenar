import Product from "../../models/Product.js";
import {
  getEmptyCart,
  getClientCart,
  getCartForCommerce,
  buildOrderItem,
  persistCart,
  getCurrentUrl,
} from "./clientHelpers.js";

export async function postAddProductToCart(req, res) {
  const { commerceId, productId } = req.params;
  const returnTo = getCurrentUrl(req, `/client/catalog/${commerceId}`);

  try {
    const product = await Product.findOne({
      _id: productId,
      commerceId,
      isActive: true,
    }).lean();

    if (!product) {
      req.flash("errors", "El producto seleccionado no existe.");
      return res.redirect(returnTo);
    }

    let cart = getClientCart(req);

    if (cart.commerceId && cart.commerceId !== commerceId) {
      cart = getEmptyCart(commerceId);
      req.flash(
        "success",
        "Se inició un nuevo pedido porque solo puedes pedir a un comercio por vez."
      );
    }

    if (!cart.commerceId) {
      cart.commerceId = commerceId;
    }

    const alreadyInCart = cart.items.some(
      (item) => item.productId.toString() === productId
    );

    if (!alreadyInCart) {
      cart.items.push(buildOrderItem(product));
      await persistCart(req, cart);
      req.flash("success", "Producto agregado a tu pedido.");
      return res.redirect(returnTo);
    }

    req.flash("success", "Ese producto ya está agregado a tu pedido.");
    return res.redirect(returnTo);
  } catch (error) {
    console.error("Error al agregar producto al carrito:", error);
    req.flash("errors", "No se pudo agregar el producto al pedido.");
    res.redirect(returnTo);
  }
}

export async function postRemoveProductFromCart(req, res) {
  const { commerceId, productId } = req.params;
  const returnTo = getCurrentUrl(req, `/client/catalog/${commerceId}`);

  try {
    const cart = getCartForCommerce(req, commerceId);
    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await persistCart(req, cart);

    req.flash("success", "Producto removido del pedido.");
    return res.redirect(returnTo);
  } catch (error) {
    console.error("Error al remover producto del carrito:", error);
    req.flash("errors", "No se pudo remover el producto del pedido.");
    res.redirect(returnTo);
  }
}
