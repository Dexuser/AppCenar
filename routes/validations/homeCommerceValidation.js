import { body, validationResult } from "express-validator";
import Order from "../../models/Order.js";
import orderStatus from "../../models/enums/orderStatus.js";

export const validateAssignDelivery = [
    // 1. Validamos que el ID del pedido sea un formato de MongoDB válido
    body("orderId")
        .notEmpty()
        .withMessage("El identificador del pedido es obligatorio.")
        .isMongoId()
        .withMessage("ID de pedido no válido."),

    // 2. Validación de lógica de negocio (Custom)
    async (req, res, next) => {
        const errors = validationResult(req);
        const { orderId } = req.body;

        if (!errors.isEmpty()) {
            // Si hay errores de formato, volvemos al home
            return res.redirect("/commerce");
        }

        try {
            // Verificamos que el pedido pertenezca al comercio logueado
            const order = await Order.findOne({
                _id: orderId,
                "commerce.commerceId": req.session.user.id
            });

            if (!order) {
                return res.status(403).send("No tienes permiso para gestionar este pedido.");
            }

            // Verificamos que el pedido esté PENDIENTE
            // No podemos asignar delivery a algo ya completado o en proceso
            if (order.state !== orderStatus.PENDING) {
                return res.status(400).send("Este pedido ya ha sido procesado o no está pendiente.");
            }

            next();
        } catch (error) {
            console.error("Error en validación de asignación:", error);
            res.redirect("/commerce");
        }
    }
];