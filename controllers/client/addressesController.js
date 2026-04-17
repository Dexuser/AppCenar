import Address from "../../models/Address.js";
import { mapAddressForView, getAddressDescription } from "./clientHelpers.js";

export async function getAddresses(req, res) {
  try {
    const addresses = await Address.find({ userId: req.session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const addressCards = addresses.map(mapAddressForView);

    res.render("client/addresses/index", {
      layout: "client-layout",
      pageTitle: "Mis direcciones",
      addresses: addressCards,
      hasAddresses: addressCards.length > 0,
    });
  } catch (error) {
    console.error("Error al cargar las direcciones:", error);
    req.flash("errors", "No se pudieron cargar tus direcciones.");
    res.redirect("/client");
  }
}

export function getCreateAddress(req, res) {
  res.render("client/addresses/save", {
    layout: "client-layout",
    pageTitle: "Crear dirección",
    editMode: false,
    address: {
      label: "",
      description: "",
      street: "",
      sector: "",
      city: "",
      reference: "",
    },
  });
}

export async function postCreateAddress(req, res) {
  const { label, description, street, sector, city, reference } = req.body;

  try {
    await Address.create({
      userId: req.session.user.id,
      label: label.trim(),
      description: description.trim(),
      street: street?.trim() || null,
      sector: sector?.trim() || null,
      city: city?.trim() || null,
      reference: reference?.trim() || null,
    });

    req.flash("success", "Dirección creada correctamente.");
    res.redirect("/client/addresses");
  } catch (error) {
    console.error("Error al crear dirección:", error);
    req.flash("errors", "No se pudo crear la dirección.");
    res.redirect("/client/addresses/create");
  }
}

export async function getEditAddress(req, res) {
  const { id } = req.params;

  try {
    const address = await Address.findOne({
      _id: id,
      userId: req.session.user.id,
    }).lean();

    if (!address) {
      req.flash("errors", "La dirección seleccionada no existe.");
      return res.redirect("/client/addresses");
    }

    res.render("client/addresses/save", {
      layout: "client-layout",
      pageTitle: "Editar dirección",
      editMode: true,
      address: mapAddressForView(address),
    });
  } catch (error) {
    console.error("Error al cargar la edición de dirección:", error);
    req.flash("errors", "No se pudo cargar la dirección.");
    res.redirect("/client/addresses");
  }
}

export async function postEditAddress(req, res) {
  const { id } = req.params;
  const { label, description, street, sector, city, reference } = req.body;

  try {
    const updated = await Address.findOneAndUpdate(
      {
        _id: id,
        userId: req.session.user.id,
      },
      {
        label: label.trim(),
        description: description.trim(),
        street: street?.trim() || null,
        sector: sector?.trim() || null,
        city: city?.trim() || null,
        reference: reference?.trim() || null,
      },
      { new: true }
    ).lean();

    if (!updated) {
      req.flash("errors", "La dirección seleccionada no existe.");
      return res.redirect("/client/addresses");
    }

    req.flash("success", "Dirección actualizada correctamente.");
    res.redirect("/client/addresses");
  } catch (error) {
    console.error("Error al actualizar dirección:", error);
    req.flash("errors", "No se pudo actualizar la dirección.");
    res.redirect(`/client/addresses/edit/${id}`);
  }
}

export async function getDeleteAddress(req, res) {
  const { id } = req.params;

  try {
    const address = await Address.findOne({
      _id: id,
      userId: req.session.user.id,
    }).lean();

    if (!address) {
      req.flash("errors", "La dirección seleccionada no existe.");
      return res.redirect("/client/addresses");
    }

    res.render("client/addresses/delete-confirm", {
      layout: "client-layout",
      pageTitle: "Eliminar dirección",
      address: mapAddressForView(address),
    });
  } catch (error) {
    console.error("Error al cargar la confirmación de borrado:", error);
    req.flash("errors", "No se pudo cargar la dirección.");
    res.redirect("/client/addresses");
  }
}

export async function postDeleteAddress(req, res) {
  const { id } = req.body;

  try {
    await Address.deleteOne({
      _id: id,
      userId: req.session.user.id,
    });

    req.flash("success", "Dirección eliminada correctamente.");
    res.redirect("/client/addresses");
  } catch (error) {
    console.error("Error al eliminar dirección:", error);
    req.flash("errors", "No se pudo eliminar la dirección.");
    res.redirect("/client/addresses");
  }
}
