import Order from "../../models/Order.js";
import User from "../../models/User.js";
import orderStatus from "../../models/enums/orderStatus.js";
import userRoles from "../../models/enums/userRoles.js";


export const getHome = async (req, res) => {
    try {
        const deliveryId = req.session.user.id;

        const orders = await Order.find({ "delivery.userId": deliveryId })
            .sort({ createdAt: -1 })
            .lean();

        const ordersView = orders.map(order => ({
            ...order,
            productCount: order.items.length,
            // Formateo de fecha para el diseño de la card
            dateDisplay: new Date(order.createdAt).toLocaleDateString('es-DO', {
                day: 'numeric', month: 'short'
            }),
            timeDisplay: new Date(order.createdAt).toLocaleTimeString('es-DO', {
                hour: '2-digit', minute: '2-digit'
            })
        }));

        res.render("delivery/home", {
            layout: "delivery-layout",
            pageTitle: "Home del Repartidor",
            orders: ordersView,
            hasOrders: ordersView.length > 0,
            user: req.session.user
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
            order,
            isInProgress: order.status === orderStatus.IN_PROGRESS,
            formattedDate: new Date(order.createdAt).toLocaleString('es-DO'),
            user: req.session.user
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
            return res.render("delivery/order-detail", {
                layout: "delivery-layout",
                order,
                isPending: true,
                error: "Pedido no encontrado.",
                user: req.session.user
            });
        }

        if (!order || order.delivery.userId.toString() !== req.session.user.id) {
            return res.redirect("/delivery");
        }

        const deliver = await User.findById(req.session.user.id);

        if (!deliver) {
            return res.redirect("/delivery");
        }

        order.status = orderStatus.COMPLETED;
        order.completedAt = new Date();
        deliver.isBusy = false;

        Promise.all([
            await order.save(),
            await deliver.save(),
        ]);

        res.redirect("/delivery");

    } catch (error) {
        console.error("Error en el proceso de asignación:", error);
        res.redirect("/delivery");
    }
};