import CommerceType from "../../models/CommerceType.js";
import User from "../../models/User.js";
import Favorite from "../../models/Favorite.js";
import mongoose from "mongoose";

export async function getHome(req, res, next) {
    return res.redirect("/client/home");
}

export async function getClientHome(req, res) {
    try {
        const commerceTypes = await CommerceType.find().lean();

        return res.render("client/home", {
            "page-title": "Home",
            commerceTypes,
            hasCommerceTypes: commerceTypes.length > 0,
        });
    } catch (error) {
        console.error("Error loading client home:", error);
        return res.redirect("/");
    }
}

export async function getCommerces(req, res) {
    try {
        const { typeId, q } = req.query;

        // Validar que typeId sea un ObjectId válido
        if (!typeId || !mongoose.Types.ObjectId.isValid(typeId)) {
            req.flash("errors", "Categoría inválida");
            return res.redirect("/client/home");
        }

        // Verificar que la categoría exista
        const categoryExists = await CommerceType.findById(typeId);
        if (!categoryExists) {
            req.flash("errors", "Categoría no encontrada");
            return res.redirect("/client/home");
        }

        // Construir filtro para comercios
        const filter = { role: "commerce", commerceTypeId: typeId };
        if (q) {
            filter.commerceName = { $regex: q, $options: "i" };
        }

        // Obtener comercios y contar total
        const [commerces, totalCount] = await Promise.all([
            User.find(filter)
                .select("commerceName commerceLogo commerceTypeId")
                .lean(),
            User.countDocuments(filter)
        ]);

        // Obtener favoritos del usuario actual
        const favorites = await Favorite.find({ userId: req.session.user.id })
            .select("commerceId")
            .lean();
        const favoriteCommerceIds = favorites.map(fav => fav.commerceId.toString());

        // Marcar si cada comercio es favorito
        const commercesWithFavorite = commerces.map(commerce => ({
            ...commerce,
            isFavorite: favoriteCommerceIds.includes(commerce._id.toString())
        }));

        return res.render("client/commerces", {
            "page-title": "Comercios",
            commerces: commercesWithFavorite,
            totalCount,
            searchQuery: q || "",
            selectedTypeId: typeId,
            categoryTitle: categoryExists.title,
            hasCommerces: commerces.length > 0
        });
    } catch (error) {
        console.error("Error loading commerces:", error);
        req.flash("errors", "Error al cargar comercios");
        return res.redirect("/client/home");
    }
}

export async function toggleFavorite(req, res) {
    try {
        const { commerceId } = req.params;
        const userId = req.session.user.id;

        // Validar que commerceId sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(commerceId)) {
            req.flash("errors", "Comercio inválido");
            return res.redirect("/client/home");
        }

        // Verificar que el comercio exista
        const commerce = await User.findOne({ _id: commerceId, role: "commerce" });
        if (!commerce) {
            req.flash("errors", "Comercio no encontrado");
            return res.redirect("/client/home");
        }

        // Verificar si ya es favorito
        const existingFavorite = await Favorite.findOne({ userId, commerceId });

        if (existingFavorite) {
            // Eliminar favorito
            await Favorite.deleteOne({ _id: existingFavorite._id });
            req.flash("success", "Comercio eliminado de favoritos");
        } else {
            // Agregar favorito
            await Favorite.create({ userId, commerceId });
            req.flash("success", "Comercio agregado a favoritos");
        }

        // Redirigir de vuelta a la lista de comercios
        const referer = req.get("Referer") || "/client/home";
        return res.redirect(referer);
    } catch (error) {
        console.error("Error toggling favorite:", error);
        req.flash("errors", "Error al actualizar favoritos");
        return res.redirect("/client/home");
    }
}