import User from "../../models/User.js";
import Order from "../../models/Order.js";
import UserRoles from "../../models/enums/userRoles.js";
import OrderStatus from "../../models/enums/orderStatus.js";

export const getDeliveryList = async (req, res) => {
    try {

        const deliveryData = await User.find({ role: UserRoles.DELIVERY }).lean();


        const deliveredCounts = await Order.aggregate([
            { $match: { status: OrderStatus.COMPLETED, "delivery.userId": { $ne: null } } },
            { $group: { _id: "$delivery.userId", count: { $sum: 1 } } }
        ]);


        const countMap = deliveredCounts.reduce((acc, item) => {
            acc[item._id.toString()] = item.count;
            return acc;
        }, {});


        const deliveries = deliveryData.map(delivery => ({
            ...delivery,
            deliveredCount: countMap[delivery._id.toString()] || 0
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