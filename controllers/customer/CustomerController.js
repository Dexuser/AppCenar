import CommerceType from "../../models/CommerceType.js";

export async function getHome(req, res) {
  try {
    const commerceTypes = await CommerceType.find().lean();

    return res.render("customer/home", {
      "page-title": "Home",
      commerceTypes,
      hasCommerceTypes: commerceTypes.length > 0,
    });
  } catch (error) {
    console.error("Error loading customer home:", error);
    return res.redirect("/");
  }
}
