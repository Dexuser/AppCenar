import User from "../../models/User.js";
import Order from "../../models/Order.js";
import UserRoles from "../../models/enums/userRoles.js";

export const getDeliveryList = async (req, res) => {
    try {
        const deliveryData = await User.find({ role: UserRoles.DELIVERY }).lean();

        // Mapeamos para obtener la cantidad de pedidos entregados por cada uno
        const deliveries = await Promise.all(deliveryData.map(async (delivery) => {
            // CORRECCIÓN: El campo en el Schema de Order es "delivery.userId"
            // Opcionalmente, podrías filtrar solo los entregados agregando: status: 'completed'
            const deliveredCount = await Order.countDocuments({
                "delivery.userId": delivery._id
            });

            return {
                ...delivery,
                deliveredCount
            };
        }));

        res.render("admin/users/delivery-list", {
            pageTitle: "Listado de Delivery",
            deliveries,
            hasDeliveries: deliveries.length > 0
        });
    } catch (error) {
        console.error("Error al obtener listado de delivery:", error);
        res.redirect("/admin");
    }
};

export const postToggleDeliveryStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user || user.role !== UserRoles.DELIVERY) {
            return res.redirect("/admin/delivery");
        }

        user.isActive = !user.isActive;
        await user.save();

        req.flash("success", `Repartidor ${user.isActive ? 'activado' : 'inactivado'} correctamente.`);
        res.redirect("/admin/delivery");
    } catch (error) {
        console.error("Error al cambiar estado del delivery:", error);
        res.redirect("/admin/delivery");
    }
};