import CommerceType from "../models/CommerceType.js";

const seedCommerceTypes = async () => {
    const commerceTypes = [
        {
            title: "Restaurantes",
            description: "Restaurantes y comida preparada",
            image: "defaultNullImage"
        },
        {
            title: "Farmacias",
            description: "Farmacias y productos de salud",
            image: "defaultNullImage"
        },
        {
            title: "Supermercados",
            description: "Supermercados y productos de consumo diario",
            image: "defaultNullImage"
        }
    ];

    for (const commerceType of commerceTypes) {
        const existingCommerceType = await CommerceType.findOne({
            title: commerceType.title
        });

        if (!existingCommerceType) {
            await CommerceType.create(commerceType);
            console.log(`Commerce type '${commerceType.title}' inserted`);
        }
    }
};

export default seedCommerceTypes;