import Order from "../../models/Order.js";
import {
  normalizeAssetPath,
  formatDateShort,
  formatDateTime,
  getReadableOrderStatus,
  formatMoney,
  mapAddressForView,
} from "./clientHelpers.js";

export async function getOrders(req, res) {
  try {
    const orders = await Order.find({
      "client.userId": req.session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const ordersView = orders.map((order) => ({
      ...order,
      commerce: {
        ...order.commerce,
        logo: normalizeAssetPath(order.commerce?.logo),
      },
      statusLabel: getReadableOrderStatus(order.status),
      dateDisplay: formatDateShort(order.createdAt),
      dateTimeDisplay: formatDateTime(order.createdAt),
      productCount: order.items.length,
      formattedTotal: formatMoney(order.total),
    }));

    res.render("client/orders", {
      layout: "client-layout",
      pageTitle: "Mis pedidos",
      orders: ordersView,
      hasOrders: ordersView.length > 0,
    });
  } catch (error) {
    console.error("Error al cargar los pedidos del cliente:", error);
    req.flash("errors", "No se pudieron cargar tus pedidos.");
    res.redirect("/client");
  }
}

export async function getOrderDetail(req, res) {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).lean();

    if (!order || order.client.userId.toString() !== req.session.user.id) {
      req.flash("errors", "No se encontró el pedido solicitado.");
      return res.redirect("/client/orders");
    }

    res.render("client/order-detail", {
      layout: "client-layout",
      pageTitle: "Detalle del pedido",
      order: {
        ...order,
        commerce: {
          ...order.commerce,
          logo: normalizeAssetPath(order.commerce?.logo),
        },
        address: mapAddressForView(order.address),
        items: order.items.map((item) => ({
          ...item,
          image: normalizeAssetPath(item.image),
          formattedPrice: formatMoney(item.price),
          formattedLineTotal: formatMoney(item.lineTotal),
        })),
        statusLabel: getReadableOrderStatus(order.status),
        formattedSubtotal: formatMoney(order.subtotal),
        formattedItbisAmount: formatMoney(order.itbisAmount),
        formattedTotal: formatMoney(order.total),
      },
      formattedDate: formatDateTime(order.createdAt),
    });
  } catch (error) {
    console.error("Error al cargar el detalle del pedido:", error);
    req.flash("errors", "No se pudo cargar el detalle del pedido.");
    res.redirect("/client/orders");
  }
}
