// controllers/admin/clientController.js
import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import Order from "../../models/Order.js";

export const getClientsList = async (req, res) => {
    try {
        // 1. Busco solo usuarios con rol 'client'
        const clientsData = await User.find({ role: UserRoles.CLIENT }).lean();

        // 2. Agregamos el conteo de pedidos para cada cliente
        const clients = await Promise.all(clientsData.map(async (client) => {
            // Contamos cuantas ordenes tiene este cliente en la colección Orders
            const orderCount = await Order.countDocuments({ userId: client._id });
            return {
                ...client,
                orderCount
            };
        }));

        res.render("admin/users/clients-list", {
            pageTitle: "Listado de Clientes",
            clients,
            hasClients: clients.length > 0
        });
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.redirect("/admin");
    }
};

export const postToggleClientStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.redirect("/admin/clients");

        user.isActive = !user.isActive;
        await user.save();

        res.redirect("/admin/clients");
    } catch (error) {
        console.error("Error al cambiar estado:", error);
        res.redirect("/admin/clients");
    }
};