"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminJson, sendAdminJson } from "@/app/admin/_lib/api";
import { PageHeading, Toast, useNotice } from "@/app/admin/_components/ui";
import type { AffiliateProduct } from "@/lib/quiz";

export function AffiliatesPanel() {
  const { notice, showNotice } = useNotice();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminJson<{ products: AffiliateProduct[] }>("/api/admin/affiliates");
      setProducts(result.products ?? []);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "联盟产品读取失败");
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateProduct(id: string, next: Partial<AffiliateProduct>) {
    setProducts((current) => current.map((product) => (product.id === id ? { ...product, ...next } : product)));
  }

  function addProduct() {
    const id = `affiliate-${Date.now()}`;
    setProducts((current) => [
      ...current,
      {
        id,
        name: "",
        description: "",
        url: "",
        buttonLabel: "View recommendation",
        active: false,
        position: Math.max(0, ...current.map((product) => product.position)) + 1,
      },
    ]);
  }

  async function saveProduct(product: AffiliateProduct) {
    setSavingId(product.id);
    try {
      await sendAdminJson("/api/admin/affiliates", "PUT", product);
      showNotice(product.active ? "联盟产品已保存并上架" : "联盟产品草稿已保存");
      await load();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "保存联盟产品失败");
    } finally {
      setSavingId("");
    }
  }

  async function removeProduct(product: AffiliateProduct) {
    if (!window.confirm(`确定删除“${product.name || "未命名产品"}”吗？已关联的结果将不再展示此推荐。`)) return;
    try {
      await sendAdminJson(`/api/admin/affiliates?id=${encodeURIComponent(product.id)}`, "DELETE");
      setProducts((current) => current.filter((item) => item.id !== product.id));
      showNotice("联盟产品已删除");
    } catch {
      showNotice("删除联盟产品失败");
    }
  }

  return (
    <>
      <Toast message={notice} />
      <PageHeading
        action={
          <button className="admin-primary-button" onClick={addProduct}>
            ＋ 新增联盟产品
          </button>
        }
        description="建立可复用的联盟产品库；再到「测试内容」按结果下拉关联。下架产品会从前台隐藏，但保留后台配置。"
        kicker="商业化配置"
        title="联盟产品"
      />

      {loading ? <p style={{ color: "var(--admin-muted)" }}>正在加载…</p> : null}

      <div className="test-manager-grid affiliate-products-grid">
        {products.map((product) => (
          <article className="test-editor-card affiliate-product-editor" key={product.id}>
            <div className="test-editor-fields">
              <div className="test-editor-status">
                <small>ID: {product.id}</small>
                <label className="status-switch">
                  <input checked={product.active} onChange={(event) => updateProduct(product.id, { active: event.target.checked })} type="checkbox" />
                  <i />
                  <span>{product.active ? "已上架" : "已下架"}</span>
                </label>
              </div>
              <label>
                产品名称（英文）
                <input
                  placeholder="e.g. Guided communication journal"
                  value={product.name}
                  onChange={(event) => updateProduct(product.id, { name: event.target.value })}
                />
              </label>
              <label>
                推荐说明（英文）
                <textarea
                  rows={4}
                  placeholder="Why this product fits the reader"
                  value={product.description}
                  onChange={(event) => updateProduct(product.id, { description: event.target.value })}
                />
              </label>
              <label>
                联盟跳转链接
                <input
                  type="url"
                  placeholder="https://..."
                  value={product.url}
                  onChange={(event) => updateProduct(product.id, { url: event.target.value })}
                />
              </label>
              <div className="field-row two">
                <label>
                  按钮文案（英文）
                  <input value={product.buttonLabel} onChange={(event) => updateProduct(product.id, { buttonLabel: event.target.value })} />
                </label>
                <label>
                  排序
                  <input
                    min="0"
                    type="number"
                    value={product.position}
                    onChange={(event) => updateProduct(product.id, { position: Number(event.target.value) })}
                  />
                </label>
              </div>
              <div className="affiliate-product-actions">
                <button className="admin-primary-button" disabled={savingId === product.id} onClick={() => void saveProduct(product)}>
                  {savingId === product.id ? "保存中…" : "保存产品"}
                </button>
                <button className="admin-ghost-button danger-button" onClick={() => void removeProduct(product)}>
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!loading && !products.length ? (
        <div className="admin-empty-state">
          <strong>还没有联盟产品</strong>
          <p>先新增一个产品，之后即可在测试结果中选择它。</p>
        </div>
      ) : null}
    </>
  );
}
