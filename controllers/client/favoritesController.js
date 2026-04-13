import mongoose from "mongoose";
import User from "../../models/User.js";
import Favorite from "../../models/Favorite.js";

export async function getFavorites(req, res) {
    try {
        const favorites = await Favorite.find({ userId: req.session.user.id })
            .populate("commerceId", "commerceName commerceLogo")
            .sort({ createdAt: -1 })
            .lean();

        return res.render("client/favorites/index", {
            "page-title": "Mis favoritos",
            favorites,
            hasFavorites: favorites.length > 0
        });
    } catch (error) {
        console.error("Error loading favorites:", error);
        req.flash("errors", "Error al cargar favoritos");
        return res.redirect("/client/home");
    }
}

export async function removeFromFavorites(req, res) {
    try {
        const { commerceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(commerceId)) {
            req.flash("errors", "Comercio inválido");
            return res.redirect("/client/favorites");
        }

        const commerce = await User.findOne({ _id: commerceId, role: "commerce" });
        if (!commerce) {
            req.flash("errors", "Comercio no encontrado");
            return res.redirect("/client/favorites");
        }

        const deleted = await Favorite.deleteOne({ userId: req.session.user.id, commerceId });

        if (!deleted) {
            req.flash("errors", "No se pudo eliminar de favoritos");
            return res.redirect("/client/favorites");
        }

        req.flash("success", "Comercio eliminado de favoritos");
        return res.redirect("/client/favorites");
    } catch (error) {
        console.error("Error removing from favorites:", error);
        req.flash("errors", "Error al eliminar de favoritos");
        return res.redirect("/client/favorites");
    }
}
