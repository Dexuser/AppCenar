import mongoose from "mongoose";
import Order from "../../models/Order.js";

function formatDate(date) {
    try {
        return new Date(date).toLocaleString();
    } catch {
        return "";
    }
}

function statusLabel(status) {
    switch (status) {
        case "pending":
            return "Pendiente";
        case "in_progress":
            return "En proceso";
        case "complete":
            return "Completado";
        default:
            return status;
    }
}

function statusBadgeClass(status) {
    switch (status) {
        case "pending":
            return "bg-warning text-dark";
        case "in_progress":
            return "bg-primary";
        case "complete":
            return "bg-success";
        default:
            return "bg-secondary";
    }
}

export async function getOrders(req, res) {
    try {
        const orders = await Order.find({ "client.userId": req.session.user.id })
            .sort({ createdAt: -1 })
            .lean();

        const mapped = orders.map(o => ({
            ...o,
            itemsCount: (o.items || []).length,
            createdAtFormatted: formatDate(o.createdAt),
            statusLabel: statusLabel(o.status),
            statusBadgeClass: statusBadgeClass(o.status)
        }));

        return res.render("client/orders/index", {
            "page-title": "Mis pedidos",
            orders: mapped,
            hasOrders: mapped.length > 0
        });
    } catch (error) {
        console.error("Error loading orders:", error);
        req.flash("errors", "Error al cargar pedidos");
        return res.redirect("/client/home");
    }
}

export async function getOrderDetail(req, res) {
    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            req.flash("errors", "Pedido inválido");
            return res.redirect("/client/orders");
        }

        const order = await Order.findOne({ _id: orderId, "client.userId": req.session.user.id }).lean();

        if (!order) {
            req.flash("errors", "Pedido no encontrado");
            return res.redirect("/client/orders");
        }

        const viewModel = {
            ...order,
            itemsCount: (order.items || []).length,
            createdAtFormatted: formatDate(order.createdAt),
            statusLabel: statusLabel(order.status),
            statusBadgeClass: statusBadgeClass(order.status)
        };

        return res.render("client/orders/detail", {
            "page-title": "Detalle del pedido",
            order: viewModel,
            hasItems: (order.items || []).length > 0
        });
    } catch (error) {
        console.error("Error loading order detail:", error);
        req.flash("errors", "Error al cargar el pedido");
        return res.redirect("/client/orders");
    }
}
