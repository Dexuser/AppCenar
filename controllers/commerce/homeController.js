import Order from "../../models/Order.js";
import User from "../../models/User.js";
import orderStatus from "../../models/enums/orderStatus.js";
import userRoles from "../../models/enums/userRoles.js";


export const getHome = async (req, res) => {
    try {
        const commerceId = req.session.user.id;

        const orders = await Order.find({ "commerce.commerceId": commerceId })
            .sort({ createdAt: -1 })
            .lean();


        const ordersView = orders.map(order => ({
            ...order,
            productCount: order.products.length,
            // Formateo de fecha para el diseño de la card
            dateDisplay: new Date(order.createdAt).toLocaleDateString('es-DO', {
                day: 'numeric', month: 'short'
            }),
            timeDisplay: new Date(order.createdAt).toLocaleTimeString('es-DO', {
                hour: '2-digit', minute: '2-digit'
            })
        }));

        res.render("commerce/home", {
            layout: "commerce-layout",
            pageTitle: "Home del Comercio",
            orders: ordersView,
            hasOrders: ordersView.length > 0,
            user: req.session.user
        });
    } catch (error) {
        console.error("Error al cargar Home de comercio:", error);
        res.redirect("/login");
    }
};

export const getOrderDetail = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findById(id).lean();

        if (!order || order.commerce.commerceId.toString() !== req.session.user.id) {
            return res.redirect("/commerce");
        }

        res.render("commerce/order-detail", {
            layout: "commerce-layout",
            order,
            isPending: order.state === orderStatus.PENDING,
            formattedDate: new Date(order.createdAt).toLocaleString('es-DO'),
            user: req.session.user
        });
    } catch (error) {
        console.error("Error al ver detalle del pedido:", error);
        res.redirect("/commerce");
    }
};


export const postAssignDelivery = async (req, res) => {
    const { orderId } = req.body;

    try {
        // 1. Buscar el primer delivery disponible (isBusy: false) y activo
        const delivery = await User.findOne({
            role: userRoles.DELIVERY,
            isBusy: false,
            isActive: true
        });


        if (!delivery) {
            const order = await Order.findById(orderId).lean();
            return res.render("commerce/order-detail", {
                layout: "commerce-layout",
                order,
                isPending: true,
                error: "No hay repartidores disponibles en este momento. Intente más tarde.",
                user: req.session.user
            });
        }


        await Order.findByIdAndUpdate(orderId, {
            state: orderStatus.IN_PROGRESS,
            delivery: {
                deliveryId: delivery._id,
                firstName: delivery.firstName,
                lastName: delivery.lastName,
                phone: delivery.phone
            }
        });


        await User.findByIdAndUpdate(delivery._id, { isBusy: true });


        res.redirect("/commerce");

    } catch (error) {
        console.error("Error en el proceso de asignación:", error);
        res.redirect("/commerce");
    }
};