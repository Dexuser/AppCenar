import CommerceType from "../../models/CommerceType.js";
import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import {
  getClientCart,
  buildCartSummary,
  normalizeAssetPath,
  escapeRegExp,
  getFavoriteIds,
} from "./clientHelpers.js";

export async function getHome(req, res) {
  try {
    const [commerceTypes, clientCart] = await Promise.all([
      CommerceType.find({ isActive: true }).sort({ title: 1 }).lean(),
      Promise.resolve(getClientCart(req)),
    ]);

    const typeCards = await Promise.all(
      commerceTypes.map(async (type) => {
        const commerceCount = await User.countDocuments({
          role: UserRoles.COMMERCE,
          isActive: true,
          commerceTypeId: type._id,
        });

        return {
          ...type,
          image: normalizeAssetPath(type.image),
          commerceCount,
        };
      })
    );

    const cartSummary = buildCartSummary(clientCart);

    res.render("client/index", {
      layout: "client-layout",
      pageTitle: "Home del Cliente",
      commerceTypes: typeCards,
      hasCommerceTypes: typeCards.length > 0,
      hasPendingCart: cartSummary.hasItems,
      resumeCartUrl: cartSummary.hasItems
        ? `/client/catalog/${cartSummary.commerceId}`
        : null,
      pendingCartCount: cartSummary.itemCount,
    });
  } catch (error) {
    console.error("Error al cargar el home del cliente:", error);
    req.flash("errors", "No se pudo cargar el home del cliente.");
    res.redirect("/");
  }
}

export async function getCommerces(req, res) {
  const { typeId } = req.params;
  const search = (req.query.search || "").trim();

  try {
    const commerceType = await CommerceType.findById(typeId).lean();
    if (!commerceType) {
      req.flash("errors", "El tipo de comercio seleccionado no existe.");
      return res.redirect("/client");
    }

    const filter = {
      role: UserRoles.COMMERCE,
      isActive: true,
      commerceTypeId: typeId,
    };

    if (search) {
      filter.commerceName = {
        $regex: escapeRegExp(search),
        $options: "i",
      };
    }

    const [favoriteIds, commerces, totalCount] = await Promise.all([
      getFavoriteIds(req.session.user.id),
      User.find(filter).sort({ commerceName: 1 }).lean(),
      User.countDocuments(filter),
    ]);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const commerceCards = commerces.map((c) => {
      let isOpen = false;
      if (c.openTime && c.closeTime) {
        const [openH, openM] = c.openTime.split(":").map(Number);
        const [closeH, closeM] = c.closeTime.split(":").map(Number);
        const openMinutes = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;

        if (openMinutes < closeMinutes) {
          // Misma jornada: ej. 08:00 - 21:00
          isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
        } else {
          // Cruza medianoche: ej. 22:00 - 02:00
          isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
        }
      }

      return {
        ...c,
        commerceLogo: normalizeAssetPath(c.commerceLogo),
        isFavorite: favoriteIds.has(c._id.toString()),
        isOpen,
      };
    });

    res.render("client/commerces", {
      layout: "client-layout",
      pageTitle: "Listado de comercios",
      commerceType: {
        ...commerceType,
        image: normalizeAssetPath(commerceType.image),
      },
      commerces: commerceCards,
      hasCommerces: commerceCards.length > 0,
      commerceCount: commerceCards.length,
      totalCount,
      search,
      currentUrl: req.originalUrl,
    });
  } catch (error) {
    console.error("Error al cargar el listado de comercios:", error);
    req.flash("errors", "No se pudo cargar el listado de comercios.");
    res.redirect("/client");
  }
}
