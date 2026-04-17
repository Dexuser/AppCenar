import Category from "../../models/Category.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import {
  getFavoriteIds,
  normalizeAssetPath,
  formatMoney,
  getCartForCommerce,
  buildCartSummary,
} from "./clientHelpers.js";

export async function getCatalog(req, res) {
  const { commerceId } = req.params;

  try {
    const commerce = await User.findOne({
      _id: commerceId,
      role: UserRoles.COMMERCE,
      isActive: true,
    })
      .populate("commerceTypeId")
      .lean();

    if (!commerce) {
      req.flash("errors", "El comercio solicitado no existe.");
      return res.redirect("/client");
    }

    const commerceType = commerce.commerceTypeId || {
      _id: "",
      title: "Comercio",
    };

    const [favoriteIds, categories, products] = await Promise.all([
      getFavoriteIds(req.session.user.id),
      Category.find({ commerceId }).sort({ name: 1 }).lean(),
      Product.find({ commerceId, isActive: true }).sort({ name: 1 }).lean(),
    ]);

    const cartSummary = buildCartSummary(getCartForCommerce(req, commerceId));
    const itemsInCart = new Set(
      cartSummary.items.map((item) => item.productId.toString())
    );

    const groupedCategories = categories
      .map((category) => ({
        ...category,
        products: products
          .filter(
            (product) => product.categoryId.toString() === category._id.toString()
          )
          .map((product) => ({
            ...product,
            image: normalizeAssetPath(product.image),
            formattedPrice: formatMoney(product.price),
            inCart: itemsInCart.has(product._id.toString()),
          })),
      }))
      .filter((category) => category.products.length > 0);

    res.render("client/catalog", {
      layout: "client-layout",
      pageTitle: "Catálogo del comercio",
      commerce: {
        ...commerce,
        commerceTypeId: commerceType,
        commerceLogo: normalizeAssetPath(commerce.commerceLogo),
        isFavorite: favoriteIds.has(commerce._id.toString()),
      },
      categories: groupedCategories,
      hasCategories: groupedCategories.length > 0,
      cart: cartSummary,
      currentUrl: req.originalUrl,
      backUrl: commerceType._id ? `/client/commerces/${commerceType._id}` : "/client",
      checkoutUrl: `/client/catalog/${commerceId}/checkout`,
    });
  } catch (error) {
    console.error("Error al cargar el catálogo del comercio:", error);
    req.flash("errors", "No se pudo cargar el catálogo del comercio.");
    res.redirect("/client");
  }
}
