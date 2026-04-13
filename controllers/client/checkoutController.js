import mongoose from "mongoose";
import Address from "../../models/Address.js";
import Config from "../../models/Config.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";

function getCart(req) {
    return req.session.cart || { commerceId: null, items: [], subtotal: 0 };
}

function calcTotal(subtotal, itebis) {
    const rate = (itebis || 0) / 100;
    return (subtotal * rate) + subtotal;
}

export async function getCheckout(req, res) {
    try {
        const cart = getCart(req);

        if (!cart.commerceId || !(cart.items || []).length) {
            req.flash("errors", "Tu pedido está vacío");
            return res.redirect("/client/home");
        }

        const [addresses, config, commerce] = await Promise.all([
            Address.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean(),
            Config.findOne().lean(),
            User.findOne({ _id: cart.commerceId, role: "commerce" }).select("commerceName commerceLogo").lean()
        ]);

        const itebis = config?.itebis ?? 18;
        const subtotal = cart.subtotal || 0;
        const total = calcTotal(subtotal, itebis);

        return res.render("client/checkout", {
            "page-title": "Checkout",
            addresses,
            hasAddresses: addresses.length > 0,
            itebis,
            subtotal,
            total,
            cart,
            commerce,
            canPlaceOrder: addresses.length > 0
        });
    } catch (error) {
        console.error("Error loading checkout:", error);
        req.flash("errors", "Error al cargar el checkout");
        return res.redirect("/client/home");
    }
}

export async function postCheckout(req, res) {
    try {
        const { addressId } = req.body;
        const cart = getCart(req);

        if (!cart.commerceId || !(cart.items || []).length) {
            req.flash("errors", "Tu pedido está vacío");
            return res.redirect("/client/home");
        }

        if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
            req.flash("errors", "Debes seleccionar una dirección válida");
            return res.redirect("/client/checkout");
        }

        const [address, config, commerce] = await Promise.all([
            Address.findOne({ _id: addressId, userId: req.session.user.id }).lean(),
            Config.findOne().lean(),
            User.findOne({ _id: cart.commerceId, role: "commerce" }).select("commerceName commerceLogo").lean()
        ]);

        if (!address) {
            req.flash("errors", "Dirección no encontrada");
            return res.redirect("/client/checkout");
        }

        if (!commerce) {
            req.flash("errors", "Comercio no encontrado");
            return res.redirect("/client/home");
        }

        const itebis = config?.itebis ?? 18;
        const subtotal = cart.subtotal || 0;
        const total = calcTotal(subtotal, itebis);

        await Order.create({
            products: cart.items.map(p => ({
                productId: p.productId,
                name: p.name,
                image: p.image,
                price: p.price
            })),
            client: {
                userId: req.session.user.id,
                firstName: req.session.user.firstName,
                lastName: req.session.user.lastName,
                email: req.session.user.email,
                phone: req.session.user.phone
            },
            address: {
                title: address.title,
                description: address.description
            },
            commerce: {
                commerceId: cart.commerceId,
                businessName: commerce.commerceName,
                logo: commerce.commerceLogo
            },
            subtotal,
            itebis,
            total
        });

        req.session.cart = {
            commerceId: null,
            items: [],
            subtotal: 0
        };

        req.flash("success", "Pedido creado correctamente");
        return res.redirect("/client/home");
    } catch (error) {
        console.error("Error creating order:", error);
        req.flash("errors", "Error al crear el pedido");
        return res.redirect("/client/checkout");
    }
}
