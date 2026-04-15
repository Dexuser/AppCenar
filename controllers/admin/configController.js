import Config from "../../models/Config.js";

// 1. Pantalla Inicial: Mostrar ITBIS actual
export const getConfigHome = async (req, res) => {
    try {
        // Buscamos el registro principal. Usamos findOne sin filtro para obtener el único que existe.
        let config = await Config.findOne().lean();

        // Si no existe (primera vez), lo creamos con valores iniciales
        if (!config) {
            config = await Config.create({
                key: "SYSTEM_SETTINGS",
                itebis: 18,
                value: "Default Config"
            });
            // Convertimos a objeto plano para Handlebars después de crear
            config = config.toObject();
        }

        res.render("admin/config/index", {
            pageTitle: "Configuración del Sistema",
            config
        });
    } catch (error) {
        console.error("Error en getConfigHome:", error);
        res.redirect("/admin");
    }
};

// 2. Pantalla de Edición: Formulario
export const getEditConfig = async (req, res) => {
    try {
        const config = await Config.findOne().lean();
        res.render("admin/config/edit", {
            pageTitle: "Editar Configuración",
            config
        });
    } catch (error) {
        res.redirect("/admin/config");
    }
};

// 3. Acción de Guardar
export const postEditConfig = async (req, res) => {
    // Recibimos itebis del body (asegúrate que el input se llame name="itebis")
    const { itebis } = req.body;

    try {
        // Usamos findOneAndUpdate con un objeto vacío para afectar al primer/único registro
        // { upsert: true } asegura que si no existe, lo cree.
        await Config.findOneAndUpdate(
            {},
            { itebis: Number(itebis) },
            { upsert: true, new: true }
        );

        req.flash("success", "Configuración de ITBIS actualizada correctamente.");
        res.redirect("/admin/config");
    } catch (error) {
        console.error("Error en postEditConfig:", error);
        req.flash("errors", "Hubo un error al guardar la configuración.");
        res.redirect("/admin/config/edit");
    }
};