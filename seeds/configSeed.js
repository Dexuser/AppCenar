import Config from "../models/Config.js";

const DEFAULT_CONFIGURATIONS = [
  {
    key: "ITBIS",
    value: "18",
  },
];

const seedDefaultConfigurations = async () => {
  for (const configuration of DEFAULT_CONFIGURATIONS) {
    const existingConfiguration = await Config.findOne({
      $or: [
        { key: configuration.key },
        configuration.key === "ITBIS" ? { itebis: { $ne: null } } : null,
      ].filter(Boolean),
    });

    if (existingConfiguration) {
      if (!existingConfiguration.key) {
        existingConfiguration.key = configuration.key;
      }

      if (!existingConfiguration.value) {
        existingConfiguration.value =
          configuration.key === "ITBIS" && existingConfiguration.itebis !== null
            ? String(existingConfiguration.itebis)
            : configuration.value;
      }

      if (
        configuration.key === "ITBIS" &&
        (existingConfiguration.itebis === null ||
          existingConfiguration.itebis === undefined)
      ) {
        existingConfiguration.itebis = Number(existingConfiguration.value);
      }

      await existingConfiguration.save();
      continue;
    }

    await Config.create({
      key: configuration.key,
      value: configuration.value,
      itebis: configuration.key === "ITBIS" ? Number(configuration.value) : null,
    });
  }
};

export default seedDefaultConfigurations;
