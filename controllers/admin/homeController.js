import Order from "../../models/Order.js";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import UserRoles from "../../models/enums/userRoles.js";

export const getDashboard = async (req, res) => {
    try {
        // Definir el inicio del día de hoy (00:00:00)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Ejecutamos todas las consultas al mismo tiempo
        const [
            totalOrders,
            todayOrders,
            totalProducts,
            // Clientes
            activeClients, inactiveClients,
            // Deliveries
            activeDeliveries, inactiveDeliveries,
            // Comercios
            activeCommerces, inactiveCommerces
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: startOfDay } }),
            Product.countDocuments(),
            // Conteo Clientes
            User.countDocuments({ role: UserRoles.CLIENT, isActive: true }),
            User.countDocuments({ role: UserRoles.CLIENT, isActive: false }),
            // Conteo Deliveries
            User.countDocuments({ role: UserRoles.DELIVERY, isActive: true }),
            User.countDocuments({ role: UserRoles.DELIVERY, isActive: false }),
            // Conteo Comercios
            User.countDocuments({ role: UserRoles.COMMERCE, isActive: true }),
            User.countDocuments({ role: UserRoles.COMMERCE, isActive: false }),
        ]);

        res.render("admin/dashboard", {
            pageTitle: "Dashboard Administrativo",
            stats: {
                orders: { total: totalOrders, today: todayOrders },
                products: totalProducts,
                clients: { active: activeClients, inactive: inactiveClients },
                deliveries: { active: activeDeliveries, inactive: inactiveDeliveries },
                commerces: { active: activeCommerces, inactive: inactiveCommerces }
            }
        });
    } catch (error) {
        console.error("Error en Dashboard:", error);
        res.status(500).render("errors/500");
    }
};