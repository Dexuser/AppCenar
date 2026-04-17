import Favorite from "../../models/Favorite.js";
import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import { normalizeAssetPath, getCurrentUrl } from "./clientHelpers.js";

export async function getFavorites(req, res) {
  try {
    const favorites = await Favorite.find({ userId: req.session.user.id })
      .sort({ createdAt: -1 })
      .populate({
        path: "commerceId",
        match: {
          role: UserRoles.COMMERCE,
          isActive: true,
        },
        populate: {
          path: "commerceTypeId",
        },
      })
      .lean();

    const favoriteCards = favorites
      .filter((favorite) => favorite.commerceId)
      .map((favorite) => ({
        _id: favorite._id,
        commerceId: favorite.commerceId._id.toString(),
        commerceName: favorite.commerceId.commerceName,
        commerceLogo: normalizeAssetPath(favorite.commerceId.commerceLogo),
        commerceType: favorite.commerceId.commerceTypeId?.title || "Sin tipo",
      }));

    res.render("client/favorites", {
      layout: "client-layout",
      pageTitle: "Mis favoritos",
      favorites: favoriteCards,
      hasFavorites: favoriteCards.length > 0,
      currentUrl: req.originalUrl,
    });
  } catch (error) {
    console.error("Error al cargar favoritos:", error);
    req.flash("errors", "No se pudieron cargar tus favoritos.");
    res.redirect("/client");
  }
}

export async function postToggleFavorite(req, res) {
  const { commerceId } = req.params;
  const returnTo = getCurrentUrl(req, "/client/favorites");

  try {
    const commerce = await User.findOne({
      _id: commerceId,
      role: UserRoles.COMMERCE,
    }).lean();

    if (!commerce) {
      req.flash("errors", "El comercio seleccionado no existe.");
      return res.redirect(returnTo);
    }

    const existingFavorite = await Favorite.findOne({
      userId: req.session.user.id,
      commerceId,
    });

    if (existingFavorite) {
      await Favorite.deleteOne({ _id: existingFavorite._id });
      req.flash("success", "El comercio fue removido de tus favoritos.");
      return res.redirect(returnTo);
    }

    await Favorite.create({
      userId: req.session.user.id,
      commerceId,
    });

    req.flash("success", "El comercio fue agregado a tus favoritos.");
    return res.redirect(returnTo);
  } catch (error) {
    console.error("Error al actualizar favoritos:", error);
    req.flash("errors", "No se pudo actualizar la lista de favoritos.");
    res.redirect(returnTo);
  }
}
