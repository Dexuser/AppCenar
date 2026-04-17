import User from "../../models/User.js";
import Order from "../../models/Order.js";
import UserRoles from "../../models/enums/userRoles.js";

export const getCommerceList = async (req, res) => {
    try {
        // 1. Buscamos usuarios con rol comercio y traemos la info de su categoría
        const commerceData = await User.find({ role: UserRoles.COMMERCE })
            .populate("commerceTypeId")
            .lean();

        // 2. Mapeamos para contar los pedidos de cada comercio
        const commerces = await Promise.all(commerceData.map(async (commerce) => {
            // CORRECCIÓN: El campo en el Schema de Order es "commerce.commerceId"
            const orderCount = await Order.countDocuments({
                "commerce.commerceId": commerce._id
            });

            return {
                ...commerce,
                orderCount
            };
        }));

        res.render("admin/users/commerce-list", {
            pageTitle: "Mantenimiento de Comercios",
            commerces,
            hasCommerces: commerces.length > 0
        });
    } catch (error) {
        console.error("Error al obtener listado de comercios:", error);
        res.redirect("/admin");
    }
};

// Activar/Inactivar Comercio
export const postToggleCommerceStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);

        // Verificamos existencia y que sea un comercio
        if (!user || user.role !== UserRoles.COMMERCE) {
            return res.redirect("/admin/commerces");
        }

        user.isActive = !user.isActive;
        await user.save();

        req.flash("success", `Comercio "${user.commerceName}" ${user.isActive ? 'activado' : 'inactivado'} correctamente.`);
        res.redirect("/admin/commerces");
    } catch (error) {
        console.error("Error al cambiar estado del comercio:", error);
        res.redirect("/admin/commerces");
    }
};