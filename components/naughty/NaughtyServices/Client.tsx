// components/naughty/NaughtyServices/Client.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
});

const STINE_ID = "5687c342-1a13-441c-86ca-f7e87e1edbd5";

interface Props {
  myProfileId: string | null;
  pageProfileId: string | null;
  services?: {
    id: string;
    text: string;
    extra_price?: number | null;
    is_addon?: boolean;
  }[];
}

interface Order {
  id: string;
  text: string;
  price: number;
  buyer_id: string;
  status: string;
}

export default function NaughtyServices({ myProfileId, pageProfileId, services = [] }: Props) {
  const [hasMounted, setHasMounted] = useState(false);
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [ordered, setOrdered] = useState<string[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [showConfirmationBox, setShowConfirmationBox] = useState(true);
  const [totalServices, setTotalServices] = useState<number>(0);
  const [acceptedCount, setAcceptedCount] = useState<number>(0);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !pageProfileId) return;

    const fetchMeta = async () => {
      const { data: meta } = await supabase
        .from("fantasy_menu_meta")
        .select("description, price")
        .eq("user_id", STINE_ID)
        .single();

      if (meta?.description) setDescription(meta.description);
      if (meta?.price != null) setBasePrice(meta.price);
    };

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("fantasy_menu_orders")
        .select("id, text, price, buyer_id, status")
        .eq("seller_id", STINE_ID)
        .eq("status", "ordered");

      if (!error && data) setIncomingOrders(data);
    };

    const fetchFrækhedData = async () => {
      const [{ count: total }, { count: accepted }] = await Promise.all([
        supabase.from("fantasy_menu_options").select("id", { count: "exact", head: true }),
        supabase
          .from("fantasy_menu_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", STINE_ID)
          .eq("choice", "yes"),
      ]);
      setTotalServices(total ?? 0);
      setAcceptedCount(accepted ?? 0);
    };

    fetchMeta();
    fetchOrders();
    fetchFrækhedData();

    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fantasy_menu_orders",
          filter: `seller_id=eq.${STINE_ID}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          if (newOrder.status === "ordered") {
            setIncomingOrders((prev) => [...prev, newOrder]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageProfileId, hasMounted]);

  useEffect(() => {
    if (!paymentConfirmed) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowConfirmationBox(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentConfirmed]);

  const handleOrder = async (service: { id: string; text: string; extra_price?: number | null }) => {
    if (!myProfileId) return;
    const price = service.extra_price != null ? service.extra_price : basePrice ?? 0;

    const { error } = await supabase.from("fantasy_menu_orders").insert({
      buyer_id: myProfileId,
      seller_id: STINE_ID,
      service_id: service.id,
      text: service.text,
      price,
    });

    if (error) {
      console.error("Fejl ved bestilling:", error);
    } else {
      setOrdered((prev) => [...prev, service.id]);
    }
  };

  if (!hasMounted) return null;

  const frækhedsProcent = totalServices > 0 ? Math.round((acceptedCount / totalServices) * 100) : 0;
  const niveau =
    frækhedsProcent < 10 ? "😇 Uskyldig engel" :
    frækhedsProcent < 20 ? "💄 Pirrende prinsesse" :
    frækhedsProcent < 30 ? "💃 Legesyg forfører" :
    frækhedsProcent < 40 ? "💋 Forførende frækkert" :
    frækhedsProcent < 50 ? "🔥 Sensuel sirene" :
    frækhedsProcent < 60 ? "💎 Lystfuld luksus" :
    frækhedsProcent < 70 ? "🧨 Eksplosiv elskerinde" :
    frækhedsProcent < 80 ? "🖤 Kinky kælenkat" :
    frækhedsProcent < 90 ? "👠 Dominerende darling" :
    "💋 Uimodståelig bad girl";

  const totalPrice = incomingOrders.reduce((sum, order) => sum + order.price, 0);

  const selectedServices = (services || []).filter((s) => !s.is_addon);
  const selectedAddons = (services || []).filter((s) => s.is_addon);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-6 md:p-8">
        <p className="text-pink-700 font-semibold">Frækhedsniveau: {niveau}</p>
        <div className="w-full bg-pink-100 rounded-full h-5 overflow-hidden shadow-inner my-2">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-pink-600 text-right pr-3 text-white text-xs font-bold flex items-center justify-end rounded-full"
            style={{ width: `${frækhedsProcent}%` }}
          >
            {frækhedsProcent}%
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Baseret på {acceptedCount} ud af {totalServices} mulige ydelser
        </p>
      </div>

      {incomingOrders.length > 0 && myProfileId === STINE_ID && (showConfirmationBox || !paymentConfirmed) && (
        <div className="bg-white border border-red-300 p-5 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-red-600 mb-3">Du har en ny bestilling</h3>

          {!paymentConfirmed ? (
            <>
              <div className="space-y-3">
                {incomingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-red-200 rounded-xl p-4 bg-red-50 text-sm text-red-800 shadow-sm"
                  >
                    <div className="font-medium">{order.text}</div>
                    <div className="text-xs mt-1">Pris: {order.price} kr.</div>
                  </div>
                ))}
                <div className="text-right text-sm font-semibold text-red-700 pt-2 border-t border-red-200">
                  Samlet pris: {totalPrice} kr.
                </div>
              </div>
              <button
                onClick={() => setPaymentConfirmed(true)}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-red-700"
              >
                Jeg har modtaget pengene
              </button>
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800 relative">
              <p className="font-semibold mb-2">
                Sådan, Stine – du er nu officielt købt og bestilt til fræk fornøjelse!
              </p>
              <p>
                Du er lækker, du er eksklusiv, og fra nu af er du på arbejde… på den helt sjove måde.
              </p>
              <p className="mt-2">
                Bare rolig: Det er ikke bare okay at tage imod betaling for at være så fristende – det er faktisk kun rimeligt.
                Du styrer showet fra nu af ❤️.
              </p>
              <p className="mt-4 text-xs text-gray-500">Denne besked forsvinder om {countdown} sekunder.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 shadow">
        {editing ? (
          <div className="space-y-2">
            <RichTextEditor value={description} onChange={setDescription} />
            <div className="flex gap-2">
              <button
                className="bg-pink-500 text-white px-4 py-1.5 rounded-lg text-sm shadow hover:bg-pink-600"
                onClick={() => setEditing(false)}
              >
                Gem
              </button>
              <button
                className="text-sm text-gray-600 underline"
                onClick={() => setEditing(false)}
              >
                Annuller
              </button>
            </div>
          </div>
        ) : (
          <div>
            {description ? (
              <div
                className="text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            ) : (
              <p className="italic text-sm text-gray-500">Ingen beskrivelse endnu.</p>
            )}
            <button
              className="mt-2 inline-block text-xs text-pink-600 underline rounded hover:text-pink-800 transition"
              onClick={() => setEditing(true)}
            >
              Rediger beskrivelse
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-pink-700">Ydelser</h2>
        {selectedServices.map((ydelse) => (
          <div
            key={ydelse.id}
            className="bg-white border border-pink-300 rounded-lg p-4 shadow-sm flex items-center justify-between"
          >
            <div className="text-gray-800 font-medium">{ydelse.text}</div>
            <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
              {ydelse.extra_price != null
                ? `${ydelse.extra_price} kr.`
                : basePrice != null
                ? `${basePrice} kr.`
                : ""}
            </div>
            {myProfileId && myProfileId !== STINE_ID && (
              <button
                onClick={() => handleOrder(ydelse)}
                className="ml-4 text-sm text-pink-600 underline hover:text-pink-800"
                disabled={ordered.includes(ydelse.id)}
              >
                {ordered.includes(ydelse.id) ? "Bestilt" : "Bestil"}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-pink-700">Tilkøb</h2>
        {selectedAddons.map((tilkøb) => (
          <div
            key={tilkøb.id}
            className="bg-white border border-pink-300 rounded-lg p-4 shadow-sm flex items-center justify-between"
          >
            <div className="text-gray-800 font-medium">{tilkøb.text}</div>
            <div className="text-sm text-gray-500 ml-4 whitespace-nowrap">
              {tilkøb.extra_price != null
                ? `${tilkøb.extra_price} kr.`
                : basePrice != null
                ? `${basePrice} kr.`
                : ""}
            </div>
            {myProfileId && myProfileId !== STINE_ID && (
              <button
                onClick={() => handleOrder(tilkøb)}
                className="ml-4 text-sm text-pink-600 underline hover:text-pink-800"
                disabled={ordered.includes(tilkøb.id)}
              >
                {ordered.includes(tilkøb.id) ? "Bestilt" : "Bestil"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
