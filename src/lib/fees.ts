/**
 * プラットフォーム手数料・価格の一元管理。
 * 複数ファイル（stripe checkout / webhook）で個別定義すると、
 * 料率変更時に乖離して過小・過大請求の原因になるため、ここに集約する。
 */
export const PLATFORM_SUB_FEE_RATE = 0.15; // クリエイターサブスク手数料 15%
export const PREMIUM_PRICE = 300; // 広告非表示プレミアム 月額（円）
