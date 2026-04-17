import Address from "../../models/Address.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import OrderStatus from "../../models/enums/orderStatus.js";
import {
  getCartForCommerce,
  buildCartSummary,
  getItbisPercentage,
  buildCheckoutSummary,
  getAddressDescription,
  mapAddressForView,
  normalizeAssetPath,
  persistCart,
  getEmptyCart,
} from "./clientHelpers.js";

export async function getCheckout(req, res) {
  const { commerceId } = req.params;

  try {
    const [commerce, addresses, itbisPercentage] = await Promise.all([
      User.findOne({
        _id: commerceId,
        role: UserRoles.COMMERCE,
        isActive: true,
      }).lean(),
      Address.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean(),
      getItbisPercentage(),
    ]);

    if (!commerce) {
      req.flash("errors", "El comercio seleccionado no existe.");
      return res.redirect("/client");
    }

    const cartSummary = buildCartSummary(getCartForCommerce(req, commerceId));

    if (!cartSummary.hasItems) {
      req.flash(
        "errors",
        "Debes agregar al menos un producto antes de continuar al pedido."
      );
      return res.redirect(`/client/catalog/${commerceId}`);
    }

    const checkout = buildCheckoutSummary(cartSummary, itbisPercentage);

    res.render("client/checkout", {
      layout: "client-layout",
      pageTitle: "Confirmar pedido",
      commerce: {
        ...commerce,
        commerceLogo: normalizeAssetPath(commerce.commerceLogo),
      },
      addresses: addresses.map((address) => ({
        ...address,
        ...mapAddressForView(address),
      })),
      hasAddresses: addresses.length > 0,
      checkout,
      backUrl: `/client/catalog/${commerceId}`,
    });
  } catch (error) {
    console.error("Error al cargar el checkout:", error);
    req.flash("errors", "No se pudo cargar el paso de confirmación del pedido.");
    res.redirect(`/client/catalog/${commerceId}`);
  }
}

export async function postCheckout(req, res) {
  const { commerceId } = req.params;
  const { addressId } = req.body;

  try {
    const cartSummary = buildCartSummary(getCartForCommerce(req, commerceId));

    if (!cartSummary.hasItems) {
      req.flash("errors", "Tu pedido no tiene productos.");
      return res.redirect(`/client/catalog/${commerceId}`);
    }

    const [client, commerce, address, itbisPercentage] = await Promise.all([
      User.findById(req.session.user.id).lean(),
      User.findOne({
        _id: commerceId,
        role: UserRoles.COMMERCE,
        isActive: true,
      }).lean(),
      Address.findOne({ _id: addressId, userId: req.session.user.id }).lean(),
      getItbisPercentage(),
    ]);

    if (!client || !commerce || !address) {
      req.flash(
        "errors",
        "No se pudo crear el pedido porque falta información del cliente, comercio o dirección."
      );
      return res.redirect(`/client/catalog/${commerceId}/checkout`);
    }

    const checkout = buildCheckoutSummary(cartSummary, itbisPercentage);
    const addressDescription = getAddressDescription(address);

    await Order.create({
      items: cartSummary.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        description: item.description,
        image: normalizeAssetPath(item.image),
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      client: {
        userId: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
      },
      addressId: address._id,
      address: {
        label: address.label,
        description: addressDescription,
        street: address.street || addressDescription,
        sector: address.sector || "",
        city: address.city || "",
        reference: address.reference || "",
      },
      commerce: {
        commerceId: commerce._id,
        name: commerce.commerceName,
        logo: normalizeAssetPath(commerce.commerceLogo),
        phone: commerce.phone,
      },
      subtotal: checkout.subtotal,
      itbisPercentage: checkout.itbisPercentage,
      itbisAmount: checkout.itbisAmount,
      total: checkout.total,
      status: OrderStatus.PENDING,
    });

    await persistCart(req, getEmptyCart());

    req.flash("success", "Tu pedido fue creado correctamente.");
    return res.redirect("/client");
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    req.flash("errors", "No se pudo crear el pedido.");
    res.redirect(`/client/catalog/${commerceId}/checkout`);
  }
}
