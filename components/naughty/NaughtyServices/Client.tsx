// components/naughty/NaughtyServices/Client.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor"), {
  ssr: false,
});

interface Props {
  myProfileId: string | null;
  pageProfileId: string | null;
  services?: {
    id: string;
    text: string;
    extra_price?: number | null;
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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !pageProfileId) return;

    const fetchMeta = async () => {
      const { data: meta } = await supabase
        .from("fantasy_menu_meta")
        .select("description, price")
        .eq("user_id", pageProfileId)
        .single();

      if (meta?.description) setDescription(meta.description);
      if (meta?.price != null) setBasePrice(meta.price);
    };

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("fantasy_menu_orders")
        .select("id, text, price, buyer_id, status")
        .eq("seller_id", pageProfileId)
        .eq("status", "ordered");

      if (!error && data) setIncomingOrders(data);
    };

    fetchMeta();
    fetchOrders();
  }, [pageProfileId, hasMounted]);

  const handleOrder = async (service: { id: string; text: string; extra_price?: number | null }) => {
    if (!myProfileId || !pageProfileId) return;
    const price = service.extra_price != null ? service.extra_price : basePrice ?? 0;

    const { error } = await supabase.from("fantasy_menu_orders").insert({
      buyer_id: myProfileId,
      seller_id: pageProfileId,
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

  const totalPrice = incomingOrders.reduce((sum, order) => sum + order.price, 0);

  return (
    <div className="space-y-6">
      {incomingOrders.length > 0 && myProfileId === pageProfileId && (
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
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-800">
              <p className="font-semibold mb-2">
                Sådan, Stine – du er nu officielt købt og bestilt til fræk fornøjelse!
              </p>
              <p>
                Du er lækker, du er eksklusiv, og fra nu af er du på arbejde… på den helt sjove måde.
              </p>
              <p className="mt-2">
                Bare rolig: Det er ikke bare okay at tage imod betaling for at være så fristende – det er faktisk kun rimeligt.
                Du styrer showet fra nu af – og jeg lover at nyde hver en krone, jeg “bruger” på dig.
              </p>
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

      <h2 className="text-2xl font-semibold text-pink-700">
        Seksuelle ydelser hun tilbyder
      </h2>

      {(services || []).map((ydelse) => (
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
          {myProfileId && myProfileId !== pageProfileId && (
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
  );
}
