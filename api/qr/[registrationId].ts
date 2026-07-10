import type { VercelRequest, VercelResponse } from "@vercel/node";
import QRCode from "qrcode";

const getAppOrigin = () => {
  const configuredBaseUrl = process.env.MTA_PUBLIC_BASE_URL;
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/+$/, "");

  const deploymentHost = process.env.VERCEL_URL || process.env.VERCEL_BRANCH_URL;
  if (deploymentHost) return `https://${deploymentHost}`;

  return "https://mta.heartbeatofgod.ca";
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method not allowed");
  }

  const { registrationId } = req.query;
  const rawId = Array.isArray(registrationId) ? registrationId[0] : registrationId;
  const id = typeof rawId === "string" ? rawId.replace(/\.png$/i, "") : rawId;

  if (!id || typeof id !== "string" || !/^[0-9a-fA-F-]{32,36}$/.test(id)) {
    return res.status(400).json({ error: "Invalid registrationId" });
  }

  const checkInUrl = `${getAppOrigin()}/checkin/${id}`;
  const png = await QRCode.toBuffer(checkInUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 480,
    color: {
      dark: "#1A0533",
      light: "#FFFFFF",
    },
  });

  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  return res.status(200).send(png);
}
