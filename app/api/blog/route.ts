import { isAdminRequest } from "@/app/admin-auth";
import { deleteBlogPost, getBlogPost, listBlogPosts, saveBlogPost } from "@/db/blog-store";
import { paymentError, requireSameOrigin } from "@/lib/payment-http";
import { normalizeBlogPost, type BlogPost } from "@/lib/blog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const includeInactive = new URL(request.url).searchParams.get("all") === "1";
  if (includeInactive && !await isAdminRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return Response.json(
      { posts: await listBlogPosts(includeInactive) },
      { headers: { "Cache-Control": "no-store", Vary: "Cookie" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load blog posts" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireSameOrigin(request);
    const body = (await request.json()) as Partial<BlogPost> & { previousSlug?: string };
    const post = normalizeBlogPost(body);
    if (typeof post === "string") return Response.json({ error: post }, { status: 400 });
    const previousSlug = typeof body.previousSlug === "string" ? body.previousSlug.trim().toLowerCase() : post.slug;
    if (previousSlug && previousSlug !== post.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(previousSlug)) {
      return Response.json({ error: "Invalid previous slug" }, { status: 400 });
    }
    await saveBlogPost(post, previousSlug || post.slug);
    return Response.json({ ok: true, post });
  } catch (error) {
    if (error instanceof Error && error.message.includes("URL")) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return paymentError(error);
  }
}

export async function DELETE(request: Request) {
  if (!await isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireSameOrigin(request);
    const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase() ?? "";
    if (!slug || slug.length > 120) return Response.json({ error: "Invalid slug" }, { status: 400 });
    const existing = await getBlogPost(slug, true);
    if (existing) await deleteBlogPost(slug);
    return Response.json({ ok: true });
  } catch (error) {
    return paymentError(error);
  }
}
