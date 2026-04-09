import Config from "../../models/Config.js";

// 1. Pantalla Inicial: Mostrar ITBIS actual
export const getConfigHome = async (req, res) => {
    try {
        // Buscamos el primer registro (o único)
        let config = await Config.findOne().lean();

        // Si no existe (primera vez), creamos uno por defecto
        if (!config) {
            config = await Config.create({ itebis: 18 });
        }

        res.render("admin/config/index", {
            pageTitle: "Configuración del Sistema",
            config
        });
    } catch (error) {
        console.error(error);
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

// 3. Accion de Guardar
export const postEditConfig = async (req, res) => {
    const { itebis } = req.body;
    try {
        await Config.findOneAndUpdate({}, { itebis }, { upsert: true });
        req.flash("success", "Configuración actualizada correctamente.");
        res.redirect("/admin/config");
    } catch (error) {
        req.flash("errors", "Hubo un error al guardar la configuración.");
        res.redirect("/admin/config/edit");
    }
};