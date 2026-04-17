import Address from "../../models/Address.js";
import Config from "../../models/Config.js";
import Favorite from "../../models/Favorite.js";
import OrderStatus from "../../models/enums/orderStatus.js";

const ITBIS_CONFIG_KEY = "ITEBIS";
const DEFAULT_ITBIS_PERCENTAGE = 18;

export function formatMoney(value) {
  return Number(value ?? 0).toFixed(2);
}

export function formatDateShort(value) {
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function normalizeAssetPath(assetPath) {
  if (!assetPath) {
    return null;
  }

  const normalized = assetPath.replace(/\\/g, "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function getReadableOrderStatus(status) {
  switch (status) {
    case OrderStatus.PENDING:
      return "Pendiente";
    case OrderStatus.IN_PROGRESS:
      return "En proceso";
    case OrderStatus.COMPLETED:
      return "Completado";
    default:
      return status;
  }
}

export function getAddressDescription(address) {
  if (!address) {
    return "";
  }

  if (address.description && address.description.trim()) {
    return address.description.trim();
  }

  return [address.street, address.sector, address.city, address.reference]
    .filter(Boolean)
    .join(", ");
}

export function mapAddressForView(address) {
  const description = getAddressDescription(address);

  return {
    ...address,
    description,
    label: address.label || "Dirección sin nombre",
  };
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

export function getEmptyCart(commerceId = null) {
  return {
    commerceId,
    items: [],
  };
}

export function getClientCart(req) {
  return req.session.clientCart || getEmptyCart();
}

export function getCartForCommerce(req, commerceId) {
  const cart = getClientCart(req);

  if (!cart.commerceId || cart.commerceId === commerceId) {
    return cart;
  }

  return getEmptyCart(commerceId);
}

export function buildCartSummary(cart) {
  const items = (cart.items || []).map((item) => ({
    ...item,
    image: normalizeAssetPath(item.image),
    formattedPrice: formatMoney(item.price),
    formattedLineTotal: formatMoney(item.lineTotal),
  }));

  const subtotal = items.reduce((total, item) => total + Number(item.lineTotal), 0);

  return {
    commerceId: cart.commerceId || null,
    items,
    itemCount: items.length,
    subtotal,
    formattedSubtotal: formatMoney(subtotal),
    hasItems: items.length > 0,
  };
}

export function buildOrderItem(product) {
  const price = Number(product.price);

  return {
    productId: product._id.toString(),
    name: product.name,
    description: product.description,
    image: normalizeAssetPath(product.image),
    price,
    quantity: 1,
    lineTotal: price,
  };
}

export function getCurrentUrl(req, fallback) {
  return req.body.returnTo || req.originalUrl || fallback;
}

export function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function persistCart(req, cart) {
  if (!cart.items.length) {
    delete req.session.clientCart;
  } else {
    req.session.clientCart = cart;
  }

  await saveSession(req);
}

export async function updateSessionUser(req, updates) {
  req.session.user = {
    ...req.session.user,
    ...updates,
  };

  await saveSession(req);
}

export async function getFavoriteIds(userId) {
  const favorites = await Favorite.find({ userId }).select("commerceId").lean();
  return new Set(favorites.map((favorite) => favorite.commerceId.toString()));
}

export async function getItbisPercentage() {
  let config = await Config.findOne({ key: ITBIS_CONFIG_KEY }).lean();

  if (!config) {
    config = await Config.create({
      key: ITBIS_CONFIG_KEY,
      value: String(DEFAULT_ITBIS_PERCENTAGE),
    });
    config = config.toObject();
  }

  const numericValue = Number(config.value);
  return Number.isFinite(numericValue) ? numericValue : DEFAULT_ITBIS_PERCENTAGE;
}

export function buildCheckoutSummary(cartSummary, itbisPercentage) {
  const itbisAmount = Number(
    (cartSummary.subtotal * (itbisPercentage / 100)).toFixed(2)
  );
  const total = Number((cartSummary.subtotal + itbisAmount).toFixed(2));

  return {
    ...cartSummary,
    itbisPercentage,
    itbisAmount,
    total,
    formattedItbisAmount: formatMoney(itbisAmount),
    formattedTotal: formatMoney(total),
  };
}
