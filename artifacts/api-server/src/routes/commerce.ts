import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { createQuickBooksPaymentRequest } from "../lib/quickbooks";
import { sendSmtpMessage } from "../lib/smtp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, "../../commerce-data.json");

interface CommerceStore {
  purchaseIntents: PurchaseIntent[];
  contactMessages: ContactMessage[];
}

interface PurchaseIntent {
  id: string;
  productId: string;
  productTitle: string;
  productType: string;
  priceLabel: string;
  quantity: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  deliveryPreference: string;
  notes: string;
  paymentStatus: string;
  paymentUrl?: string;
  submittedAt: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
  submittedAt: string;
}

let store: CommerceStore = { purchaseIntents: [], contactMessages: [] };

async function loadStore() {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CommerceStore>;
    store.purchaseIntents = Array.isArray(parsed.purchaseIntents) ? parsed.purchaseIntents : [];
    store.contactMessages = Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [];
  } catch {
    // fresh store
  }
}

async function saveStore() {
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

loadStore().catch(() => {});

function text(value: unknown, max = 500) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function requireText(value: unknown, label: string, max = 500) {
  const result = text(value, max);
  if (!result) throw new Error(`${label} is required`);
  return result;
}

function notificationRecipient() {
  return process.env["ORDER_NOTIFICATION_TO"] || process.env["CONTACT_NOTIFICATION_TO"] || "dandsiron@gmail.com";
}

function purchaseEmail(order: PurchaseIntent) {
  return [
    `New pre-made item purchase request: ${order.productTitle}`,
    "",
    `Order ID: ${order.id}`,
    `Item: ${order.productTitle}`,
    `Type: ${order.productType}`,
    `Price: ${order.priceLabel}`,
    `Quantity: ${order.quantity}`,
    `Payment status: ${order.paymentStatus}`,
    order.paymentUrl ? `Payment URL: ${order.paymentUrl}` : "",
    "",
    "Customer",
    `Name: ${order.customer.name}`,
    `Email: ${order.customer.email}`,
    `Phone: ${order.customer.phone}`,
    "",
    "Shipping",
    order.shipping.address1,
    order.shipping.address2,
    `${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}`,
    `Delivery preference: ${order.deliveryPreference}`,
    "",
    "Notes",
    order.notes || "None",
  ].filter(Boolean).join("\n");
}

function contactEmail(message: ContactMessage) {
  return [
    "New D&S Iron Works contact form submission",
    "",
    `Message ID: ${message.id}`,
    `Name: ${message.name}`,
    `Email: ${message.email}`,
    `Phone: ${message.phone || "Not provided"}`,
    `Project type: ${message.projectType || "Not provided"}`,
    "",
    message.message,
  ].join("\n");
}

const router = Router();

router.post("/commerce/purchase-intents", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const customer = (body["customer"] || {}) as Record<string, unknown>;
    const shipping = (body["shipping"] || {}) as Record<string, unknown>;
    const quantity = Math.max(1, Math.min(10, Number(body["quantity"] || 1)));

    const order: PurchaseIntent = {
      id: `ord_${randomUUID()}`,
      productId: requireText(body["productId"], "Product", 120),
      productTitle: requireText(body["productTitle"], "Product title", 160),
      productType: requireText(body["productType"], "Product type", 80),
      priceLabel: requireText(body["priceLabel"], "Price label", 80),
      quantity,
      customer: {
        name: requireText(customer["name"], "Name", 120),
        email: requireText(customer["email"], "Email", 180),
        phone: requireText(customer["phone"], "Phone", 80),
      },
      shipping: {
        address1: requireText(shipping["address1"], "Address", 180),
        address2: text(shipping["address2"], 180),
        city: requireText(shipping["city"], "City", 120),
        state: requireText(shipping["state"], "State", 80),
        postalCode: requireText(shipping["postalCode"], "ZIP", 40),
      },
      deliveryPreference: text(body["deliveryPreference"], 120) || "Ship it",
      notes: text(body["notes"], 1000),
      paymentStatus: "pending",
      submittedAt: new Date().toISOString(),
    };

    const payment = await createQuickBooksPaymentRequest({
      orderId: order.id,
      productTitle: order.productTitle,
      priceLabel: order.priceLabel,
      quantity: order.quantity,
      customerEmail: order.customer.email,
      paymentUrl: text(body["paymentUrl"], 2000),
    });
    order.paymentStatus = payment.status;
    order.paymentUrl = payment.paymentUrl;

    store.purchaseIntents.unshift(order);
    store.purchaseIntents = store.purchaseIntents.slice(0, 500);
    await saveStore();

    const email = await sendSmtpMessage({
      to: notificationRecipient(),
      replyTo: order.customer.email,
      subject: `New purchase request: ${order.productTitle}`,
      text: purchaseEmail(order),
    });

    res.json({
      ok: true,
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      paymentUrl: order.paymentUrl,
      emailSent: email.sent,
      message: payment.message,
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err instanceof Error ? err.message : "Invalid purchase request" });
  }
});

router.post("/commerce/contact", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const message: ContactMessage = {
      id: `msg_${randomUUID()}`,
      name: requireText(body["name"], "Name", 120),
      email: requireText(body["email"], "Email", 180),
      phone: text(body["phone"], 80),
      projectType: text(body["projectType"], 120),
      message: requireText(body["message"], "Message", 1200),
      submittedAt: new Date().toISOString(),
    };

    store.contactMessages.unshift(message);
    store.contactMessages = store.contactMessages.slice(0, 500);
    await saveStore();

    const email = await sendSmtpMessage({
      to: notificationRecipient(),
      replyTo: message.email,
      subject: `New contact form message from ${message.name}`,
      text: contactEmail(message),
    });

    res.json({ ok: true, messageId: message.id, emailSent: email.sent });
  } catch (err) {
    res.status(400).json({ ok: false, error: err instanceof Error ? err.message : "Invalid contact request" });
  }
});

export default router;
