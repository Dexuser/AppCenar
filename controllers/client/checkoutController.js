import mongoose from "mongoose";
import Address from "../../models/Address.js";
import Config from "../../models/Config.js";
import Order from "../../models/Order.js";
import User from "../../models/User.js";

function getCart(req) {
    return req.session.cart || { commerceId: null, items: [], subtotal: 0 };
}

function calcItbis(subtotal, itbisPercentage) {
    const rate = (itbisPercentage || 0) / 100;
    return Math.round(subtotal * rate * 100) / 100;
}

function calcTotal(subtotal, itbisAmount) {
    return subtotal + itbisAmount;
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

        // Support both legacy itebis field and new key/value config
        let itbisPercentage = 18;
        if (config?.key === "ITBIS" && config?.value) {
            itbisPercentage = Number(config.value) || 18;
        } else if (config?.itebis != null) {
            itbisPercentage = config.itebis;
        }
        const subtotal = cart.subtotal || 0;
        const itbisAmount = calcItbis(subtotal, itbisPercentage);
        const total = calcTotal(subtotal, itbisAmount);

        return res.render("client/checkout", {
            "page-title": "Checkout",
            addresses,
            hasAddresses: addresses.length > 0,
            itbisPercentage,
            itbisAmount,
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

        // Support both legacy itebis field and new key/value config
        let itbisPercentage = 18;
        if (config?.key === "ITBIS" && config?.value) {
            itbisPercentage = Number(config.value) || 18;
        } else if (config?.itebis != null) {
            itbisPercentage = config.itebis;
        }
        const subtotal = cart.subtotal || 0;
        const itbisAmount = calcItbis(subtotal, itbisPercentage);
        const total = calcTotal(subtotal, itbisAmount);

        await Order.create({
            items: cart.items.map(p => ({
                productId: p.productId,
                name: p.name,
                image: p.image,
                price: p.price,
                quantity: 1,
                lineTotal: p.price
            })),
            client: {
                userId: req.session.user.id,
                firstName: req.session.user.firstName,
                lastName: req.session.user.lastName,
                email: req.session.user.email,
                phone: req.session.user.phone
            },
            addressId: address._id,
            address: {
                label: address.label || address.title || "Dirección",
                street: address.street || "",
                sector: address.sector || "",
                city: address.city || "",
                reference: address.reference || address.description || ""
            },
            commerce: {
                commerceId: cart.commerceId,
                name: commerce.commerceName,
                logo: commerce.commerceLogo,
                phone: commerce.phone || null
            },
            subtotal,
            itbisPercentage,
            itbisAmount,
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
