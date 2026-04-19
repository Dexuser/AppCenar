import { projectRoot } from "./Paths.js";
import path from "path";
import dotenv from "dotenv";

const envPath = path.join(
  projectRoot,
  `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`
);

console.log(`Loading environment variables from ${envPath}`);
console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`MONGO_URI: ${process.env.MONGO_URI}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`Email User: ${process.env.EMAIL_USER}`);
console.log(`Email Service: ${process.env.EMAIL_SERVICE}`);
console.log(`Email Pass: ${process.env.EMAIL_PASS}`);

// load environment variables from the .env file
dotenv.config({ path: envPath });
