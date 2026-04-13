import mongoose from "mongoose";
import User from "../../models/User.js";
import Category from "../../models/Category.js";
import Product from "../../models/Product.js";

function ensureCart(req) {
    if (!req.session.cart) {
        req.session.cart = {
            commerceId: null,
            items: [],
            subtotal: 0
        };
    }
    return req.session.cart;
}

function recalcSubtotal(cart) {
    cart.subtotal = (cart.items || []).reduce((sum, item) => sum + (item.price || 0), 0);
}

export async function getCatalog(req, res) {
    try {
        const { commerceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(commerceId)) {
            req.flash("errors", "Comercio inválido");
            return res.redirect("/client/home");
        }

        const commerce = await User.findOne({ _id: commerceId, role: "commerce" })
            .select("commerceName commerceLogo")
            .lean();

        if (!commerce) {
            req.flash("errors", "Comercio no encontrado");
            return res.redirect("/client/home");
        }

        const [categories, products] = await Promise.all([
            Category.find({ commerceId }).sort({ name: 1 }).lean(),
            Product.find({ commerceId }).sort({ name: 1 }).lean()
        ]);

        const cart = ensureCart(req);

        // Si el carrito es de otro comercio, no se mezcla (se mantiene la regla por flujo)
        if (cart.commerceId && cart.commerceId.toString() !== commerceId.toString()) {
            req.flash("errors", "Tu pedido actual pertenece a otro comercio. Elimínalo antes de continuar.");
        }

        const cartProductIds = new Set((cart.items || []).map(i => i.productId.toString()));

        const productsByCategoryId = new Map();
        for (const p of products) {
            const key = p.categoryId.toString();
            if (!productsByCategoryId.has(key)) {
                productsByCategoryId.set(key, []);
            }
            productsByCategoryId.get(key).push({
                ...p,
                inCart: cartProductIds.has(p._id.toString())
            });
        }

        const catalog = categories.map(c => ({
            ...c,
            products: productsByCategoryId.get(c._id.toString()) || [],
            hasProducts: (productsByCategoryId.get(c._id.toString()) || []).length > 0
        }));

        // Productos sin categoría (por si hay data inconsistente)
        const uncategorized = products.filter(p => !categories.some(c => c._id.toString() === p.categoryId.toString()))
            .map(p => ({
                ...p,
                inCart: cartProductIds.has(p._id.toString())
            }));

        return res.render("client/catalog", {
            "page-title": commerce.commerceName || "Catálogo",
            commerce,
            catalog,
            hasCatalog: catalog.length > 0,
            uncategorized,
            hasUncategorized: uncategorized.length > 0,
            cart,
            hasCartItems: (cart.items || []).length > 0
        });
    } catch (error) {
        console.error("Error loading catalog:", error);
        req.flash("errors", "Error al cargar el catálogo");
        return res.redirect("/client/home");
    }
}

export async function addToCart(req, res) {
    try {
        const { commerceId } = req.params;
        const { productId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(commerceId) || !mongoose.Types.ObjectId.isValid(productId)) {
            req.flash("errors", "Producto inválido");
            return res.redirect(`/client/catalog/${commerceId}`);
        }

        const cart = ensureCart(req);

        if (cart.commerceId && cart.commerceId.toString() !== commerceId.toString()) {
            req.flash("errors", "Tu pedido actual pertenece a otro comercio. Elimínalo antes de agregar productos aquí.");
            return res.redirect(`/client/catalog/${commerceId}`);
        }

        const exists = (cart.items || []).some(i => i.productId.toString() === productId.toString());
        if (exists) {
            return res.redirect(`/client/catalog/${commerceId}`);
        }

        const product = await Product.findOne({ _id: productId, commerceId }).lean();
        if (!product) {
            req.flash("errors", "Producto no encontrado");
            return res.redirect(`/client/catalog/${commerceId}`);
        }

        cart.commerceId = commerceId;
        cart.items.push({
            productId: product._id,
            name: product.name,
            image: product.image,
            price: product.price
        });

        recalcSubtotal(cart);
        req.session.cart = cart;

        return res.redirect(`/client/catalog/${commerceId}`);
    } catch (error) {
        console.error("Error adding to cart:", error);
        req.flash("errors", "Error al agregar al pedido");
        return res.redirect("/client/home");
    }
}

export async function removeFromCart(req, res) {
    try {
        const { commerceId } = req.params;
        const { productId } = req.body;

        const cart = ensureCart(req);

        cart.items = (cart.items || []).filter(i => i.productId.toString() !== (productId || "").toString());
        if ((cart.items || []).length === 0) {
            cart.commerceId = null;
        }

        recalcSubtotal(cart);
        req.session.cart = cart;

        return res.redirect(`/client/catalog/${commerceId}`);
    } catch (error) {
        console.error("Error removing from cart:", error);
        req.flash("errors", "Error al quitar del pedido");
        return res.redirect("/client/home");
    }
}

export async function clearCart(req, res) {
    try {
        req.session.cart = {
            commerceId: null,
            items: [],
            subtotal: 0
        };

        const referer = req.get("Referer") || "/client/home";
        return res.redirect(referer);
    } catch (error) {
        console.error("Error clearing cart:", error);
        req.flash("errors", "Error al limpiar el pedido");
        return res.redirect("/client/home");
    }
}
