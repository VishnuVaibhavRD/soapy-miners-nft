/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const parentDir = path.join(__dirname, "..");

// Shared project secrets (e.g. PINATA_JWT in ../.env.local)
loadEnvConfig(parentDir);
// Admin-panel-specific overrides
loadEnvConfig(__dirname);

const nextConfig = {};

export default nextConfig;
