import Config from "../../models/Config.js";

// 1. Pantalla Inicial: Mostrar ITBIS actual
export const getConfigHome = async (req, res) => {
    try {
        // Buscamos la configuración de ITBIS
        let config = await Config.findOne({ key: "ITEBIS" }).lean();

        // Si no existe, la creamos con valor inicial
        if (!config) {
            config = await Config.create({
                key: "ITEBIS",
                value: "18"
            });
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
        const config = await Config.findOne({ key: "ITEBIS" }).lean();
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
    const { itebis } = req.body; // input name="itebis"

    try {
        await Config.findOneAndUpdate(
            { key: "ITEBIS" },
            { value: String(itebis) },
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