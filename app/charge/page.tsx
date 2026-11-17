"use client";

import { useState } from "react";
import { Check, Gem } from "lucide-react";
import { useStoneWalletBalance } from "../../lib/stones/useStoneWalletBalance";

type Product = {
  id: number;
  quantity: number;
  price: number;
  bonus?: number;
  best?: boolean;
};

type PaymentMethod = {
  id: "kakao" | "card" | "transfer";
  label: string;
  description: string;
};

const products: Product[] = [
  { id: 1, quantity: 1, price: 990 },
  { id: 2, quantity: 3, price: 2970 },
  { id: 3, quantity: 6, price: 4950, bonus: 1, best: true },
  { id: 4, quantity: 13, price: 9900, bonus: 3 },
];

const paymentMethods: PaymentMethod[] = [
  { id: "kakao", label: "카카오페이", description: "빠르고 간편하게 결제" },
  { id: "card", label: "신용·체크카드", description: "국내 주요 카드로 결제" },
  { id: "transfer", label: "계좌이체", description: "계좌에서 바로 결제" },
];

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function ChargePage() {
  const { walletBalance, status: walletStatus } = useStoneWalletBalance();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PaymentMethod["id"] | null
  >(null);

  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ?? null;
  const canPay = selectedProduct !== null && selectedPaymentMethod !== null;

  const handlePayment = () => {
    if (!canPay || !selectedProduct) return;
    alert("결제 기능은 준비 중이에요.");
  };

  return (
    <main className="min-h-full bg-[#F5F2FF]">
      <div className="mx-auto min-h-full w-full bg-[#FAFAFA] pb-[128px]">

        <div className="px-5 pb-8 pt-6">
          <h1 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#241B63]">
            로그 상점
          </h1>

          <section
            aria-label="현재 보유 운석"
            className="mt-5 flex items-center gap-4 rounded-[22px] bg-white px-5 py-5 shadow-[0_7px_22px_rgba(77,60,138,0.06)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#F0EDFF]">
              <Gem size={23} strokeWidth={1.8} className="text-[#6656C9]" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-[#918B99]">현재 보유 운석</p>
              <p
                aria-live="polite"
                className="mt-1 text-[20px] font-extrabold text-[#302863]"
              >
                {walletStatus === "loading"
                  ? "불러오는 중"
                  : walletStatus === "error"
                    ? "—"
                    : `${walletBalance ?? 0}개`}
              </p>
            </div>
          </section>

          <section className="mt-8" aria-labelledby="product-title">
            <h2 id="product-title" className="text-[17px] font-extrabold text-[#393344]">
              운석 충전하기
            </h2>
            <div className="mt-4 space-y-3">
              {products.map((product) => {
                const isSelected = selectedProductId === product.id;

                return (
                  <button
                    key={product.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedProductId(product.id)}
                    className={`relative flex min-h-[76px] w-full items-center justify-between rounded-[20px] border px-4 py-4 text-left transition-colors ${
                      isSelected
                        ? "border-[#7969DA] bg-[#F4F1FF]"
                        : product.best
                          ? "border-[#D8D0F8] bg-[#FCFBFF]"
                          : "border-[#ECE9F1] bg-white"
                    }`}
                  >
                    {product.best && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-[#7562D3] px-2.5 py-1 text-[9px] font-extrabold tracking-[0.04em] text-white">
                        BEST
                      </span>
                    )}

                    <span className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${isSelected ? "bg-white" : "bg-[#F2EFFF]"}`}>
                        <Gem size={21} strokeWidth={1.8} className="text-[#6656C9]" />
                      </span>
                      <span>
                        <span className="block text-[15px] font-extrabold text-[#393344]">
                          운석 {product.quantity}개
                        </span>
                        {product.bonus && (
                          <span className="mt-1 inline-flex rounded-full bg-[#F8E9F5] px-2 py-0.5 text-[10px] font-bold text-[#B45793]">
                            보너스 +{product.bonus}
                          </span>
                        )}
                      </span>
                    </span>

                    <span className="ml-3 flex items-center gap-2">
                      <span className="whitespace-nowrap text-[15px] font-extrabold text-[#302863]">
                        {formatPrice(product.price)}
                      </span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-[#6656C9] bg-[#6656C9]" : "border-[#D7D2DE] bg-white"}`}>
                        {isSelected && <Check size={13} strokeWidth={3} className="text-white" />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-8" aria-labelledby="payment-title">
            <h2 id="payment-title" className="text-[17px] font-extrabold text-[#393344]">
              결제수단
            </h2>
            <div className="mt-4 overflow-hidden rounded-[20px] border border-[#ECE9F1] bg-white px-4">
              {paymentMethods.map((method, index) => {
                const isSelected = selectedPaymentMethod === method.id;

                return (
                  <label
                    key={method.id}
                    className={`flex min-h-[72px] cursor-pointer items-center gap-3 ${index > 0 ? "border-t border-[#F0EDF3]" : ""}`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => setSelectedPaymentMethod(method.id)}
                      className="sr-only"
                    />
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-[#6656C9]" : "border-[#CFCAD5]"}`}>
                      {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-[#6656C9]" />}
                    </span>
                    <span>
                      <span className="block text-[14px] font-bold text-[#393344]">{method.label}</span>
                      <span className="mt-1 block text-[11px] font-medium text-[#918B99]">{method.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {selectedProduct && (
            <section className="mt-8 rounded-[20px] bg-[#F3F0FC] px-5 py-5" aria-labelledby="order-title">
              <h2 id="order-title" className="text-[15px] font-extrabold text-[#393344]">결제 정보</h2>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] font-medium text-[#918B99]">선택한 상품</dt>
                  <dd className="text-[14px] font-bold text-[#393344]">운석 {selectedProduct.quantity}개</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[13px] font-medium text-[#918B99]">결제금액</dt>
                  <dd className="text-[16px] font-extrabold text-[#5949B9]">{formatPrice(selectedProduct.price)}</dd>
                </div>
              </dl>
              <button type="button" className="mt-5 text-[11px] font-bold text-[#756C82] underline-offset-2 hover:underline">
                결제 및 환불 안내 &gt;
              </button>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 z-40 w-full border-t border-[#ECE9F1] bg-white/95 px-5 pb-3 pt-3 backdrop-blur-md">
          <button
            type="button"
            disabled={!canPay}
            onClick={handlePayment}
            className="flex h-[56px] w-full items-center justify-center rounded-[18px] bg-[#6656C9] text-[16px] font-extrabold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#DDD9E7] disabled:text-[#AAA4B1]"
          >
            {selectedProduct ? `${formatPrice(selectedProduct.price)} 결제하기` : "상품을 선택해 주세요"}
          </button>
          <p className="mt-2 text-center text-[10px] font-medium text-[#918B99]">
            운석은 구매 후 유효기간 없이 사용할 수 있어요.
          </p>
        </div>

      </div>
    </main>
  );
}
