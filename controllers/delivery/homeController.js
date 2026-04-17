import Order from "../../models/Order.js";
import User from "../../models/User.js";
import orderStatus from "../../models/enums/orderStatus.js";

function getAddressDisplay(address) {
  if (!address) {
    return "";
  }

  return (
    address.description ||
    [address.street, address.sector, address.city].filter(Boolean).join(", ")
  );
}

export const getHome = async (req, res) => {
  try {
    const deliveryId = req.session.user.id;

    const orders = await Order.find({ "delivery.userId": deliveryId })
      .sort({ createdAt: -1 })
      .lean();

    const ordersView = orders.map((order) => ({
      ...order,
      productCount: order.items.length,
      commerceDisplayName: order.commerce?.name || "Comercio",
      dateDisplay: new Date(order.createdAt).toLocaleDateString("es-DO", {
        day: "numeric",
        month: "short",
      }),
      timeDisplay: new Date(order.createdAt).toLocaleTimeString("es-DO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    res.render("delivery/home", {
      layout: "delivery-layout",
      pageTitle: "Home del Repartidor",
      orders: ordersView,
      hasOrders: ordersView.length > 0,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error al cargar Home de repartidor:", error);
    res.redirect("/login");
  }
};

export const getOrderDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id).lean();

    if (!order || order.delivery.userId.toString() !== req.session.user.id) {
      return res.redirect("/delivery");
    }

    res.render("delivery/order-detail", {
      layout: "delivery-layout",
      order: {
        ...order,
        addressDisplay: getAddressDisplay(order.address),
      },
      isInProgress: order.status === orderStatus.IN_PROGRESS,
      formattedDate: new Date(order.createdAt).toLocaleString("es-DO"),
      user: req.session.user,
    });
  } catch (error) {
    console.error("Error al ver detalle del pedido:", error);
    res.redirect("/delivery");
  }
};

export const completeOrder = async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      req.flash("errors", "Pedido no encontrado.");
      return res.redirect("/delivery");
    }

    if (order.delivery.userId.toString() !== req.session.user.id) {
      return res.redirect("/delivery");
    }

    const delivery = await User.findById(req.session.user.id);

    if (!delivery) {
      return res.redirect("/delivery");
    }

    order.status = orderStatus.COMPLETED;
    order.completedAt = new Date();
    delivery.isBusy = false;

    await Promise.all([order.save(), delivery.save()]);

    res.redirect("/delivery");
  } catch (error) {
    console.error("Error en el proceso de completar entrega:", error);
    res.redirect("/delivery");
  }
};
