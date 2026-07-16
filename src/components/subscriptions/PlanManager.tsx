"use client";

import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  isActive: boolean;
  _count: { subscriptions: number };
};

export function PlanManager({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [newPlan, setNewPlan] = useState({ name: "", price: "", description: "" });
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const activePlans = plans.filter((p) => p.isActive);

  async function createPlan() {
    if (!newPlan.name || !newPlan.price) {
      alert("プラン名と価格は必須です");
      return;
    }
    const price = parseInt(newPlan.price);
    if (isNaN(price) || price < 100 || price > 10000) {
      alert("価格は100円〜10,000円で入力してください");
      return;
    }
    setLoading("create");
    try {
      const res = await fetch("/api/subscriptions/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlan.name,
          price,
          description: newPlan.description || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlans((prev) => [...prev, { ...data, _count: { subscriptions: 0 } }]);
        setNewPlan({ name: "", price: "", description: "" });
      } else {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  async function updatePlan() {
    if (!editingPlan) return;
    setLoading(`edit-${editingPlan.id}`);
    try {
      const res = await fetch(`/api/subscriptions/plans/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingPlan.name,
          price: editingPlan.price,
          description: editingPlan.description,
        }),
      });
      if (res.ok) {
        setPlans((prev) =>
          prev.map((p) => (p.id === editingPlan.id ? { ...editingPlan } : p))
        );
        setEditingPlan(null);
      } else {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  async function deactivatePlan(id: string) {
    if (!confirm("このプランを無効化しますか？既存の購読者は期間終了まで有効です。")) return;
    setLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/subscriptions/plans/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
      } else {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass rounded-xl p-4">
      <h2 className="text-sm font-semibold gradient-text mb-4">サブスクリプションプラン</h2>

      {/* 新規作成フォーム */}
      {activePlans.length < 3 && (
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-komapara-border">
          <input
            type="text"
            placeholder="プラン名"
            value={newPlan.name}
            onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
            maxLength={50}
            className="flex-1 min-w-[100px] px-2 py-1.5 text-sm rounded-lg border border-komapara-border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="価格"
              value={newPlan.price}
              onChange={(e) => setNewPlan((p) => ({ ...p, price: e.target.value }))}
              min={100}
              max={10000}
              className="w-24 px-2 py-1.5 text-sm rounded-lg border border-komapara-border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
            <span className="text-xs text-komapara-muted">円/月</span>
          </div>
          <input
            type="text"
            placeholder="説明（任意）"
            value={newPlan.description}
            onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
            maxLength={500}
            className="w-full px-2 py-1.5 text-sm rounded-lg border border-komapara-border focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
          />
          <button
            onClick={createPlan}
            disabled={loading === "create"}
            className="px-4 py-1.5 text-sm font-medium text-white bg-linear-to-r from-blue-500 to-blue-500 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            追加
          </button>
        </div>
      )}

      {/* プラン一覧 */}
      <div className="space-y-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`flex items-center gap-2 py-2 border-b border-komapara-border/30 last:border-b-0 ${!plan.isActive ? "opacity-50" : ""}`}
          >
            {editingPlan?.id === plan.id ? (
              <>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan((p) => p ? { ...p, name: e.target.value } : null)}
                  className="flex-1 px-2 py-1 text-sm rounded-sm border border-komapara-border"
                />
                <input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan((p) => p ? { ...p, price: parseInt(e.target.value) || 0 } : null)}
                  className="w-20 px-2 py-1 text-sm rounded-sm border border-komapara-border"
                />
                <button
                  onClick={updatePlan}
                  disabled={loading === `edit-${plan.id}`}
                  className="text-xs px-2 py-1 rounded-sm bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingPlan(null)}
                  className="text-xs px-2 py-1 rounded-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{plan.name}</span>
                <span className="text-sm font-bold bg-linear-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent">
                  {plan.price.toLocaleString()}円/月
                </span>
                <span className="text-xs text-komapara-muted">
                  {plan._count.subscriptions}人
                </span>
                {plan.isActive ? (
                  <>
                    <button
                      onClick={() => setEditingPlan(plan)}
                      className="text-xs px-2 py-1 rounded-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deactivatePlan(plan.id)}
                      disabled={loading === `delete-${plan.id}`}
                      className="text-xs px-2 py-1 rounded-sm bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      無効化
                    </button>
                  </>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-sm bg-gray-100 text-gray-500">無効</span>
                )}
              </>
            )}
          </div>
        ))}
        {plans.length === 0 && (
          <p className="text-sm text-komapara-muted text-center py-4">
            プランを作成してサブスク収益を始めましょう
          </p>
        )}
      </div>
    </div>
  );
}
