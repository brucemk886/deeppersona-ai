import { isAdminRequest } from "@/app/admin-auth";
import { deleteAffiliateProduct, listAffiliateProducts, saveAffiliateProduct } from "@/db/quiz-store";
import type { AffiliateProduct } from "@/lib/quiz";

export const dynamic = "force-dynamic";

function isValidProduct(value: AffiliateProduct) {
  if (!value || typeof value.id !== "string" || !value.id.trim() || value.id.length > 100) return false;
  if (![value.name, value.description, value.url, value.buttonLabel].every((item) => typeof item === "string" && item.trim())) return false;
  if (value.name.length > 140 || value.description.length > 1000 || value.buttonLabel.length > 100) return false;
  if (!Number.isFinite(value.position) || typeof value.active !== "boolean") return false;
  try {
    const url = new URL(value.url);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("all") === "1";
  if (includeInactive && !await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return Response.json({ products: await listAffiliateProducts(includeInactive) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load affiliate products" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as AffiliateProduct;
  if (!isValidProduct(body)) return Response.json({ error: "Invalid affiliate product" }, { status: 400 });
  await saveAffiliateProduct({ ...body, id: body.id.trim(), name: body.name.trim(), description: body.description.trim(), url: body.url.trim(), buttonLabel: body.buttonLabel.trim(), position: Math.round(body.position) });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id || id.length > 100) return Response.json({ error: "Invalid product id" }, { status: 400 });
  await deleteAffiliateProduct(id);
  return Response.json({ ok: true });
}