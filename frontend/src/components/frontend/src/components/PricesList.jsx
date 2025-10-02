import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function PricesList({ appid }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    setItems(null);
    fetch(`${API}/api/prices/${appid}`).then(r => r.json()).then(d => {
      setItems(d);
    }).catch(console.error);
  }, [appid]);

  if (!items) return <div>Загрузка прайсов...</div>;
  if (!items.data) return <div>Нет данных.</div>;

  // Отображаем упрощённо
  const body = items.data.assets || items.data.result || items.data;
  // попытка парсинга разных форматов
  const list = body.assets ? Object.values(body.assets) : (body.result && body.result.assets ? Object.values(body.result.assets) : []);

  return (
    <div>
      <h3>Прайсы (источник: {items.source})</h3>
      <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #eee", padding: 8 }}>
        {list.length === 0 ? <div>Список пуст или нет данных от API</div> :
          list.slice(0,200).map((it, idx) => (
            <div key={idx} style={{ padding: "6px 0", borderBottom: "1px dashed #f0f0f0" }}>
              <div style={{ fontWeight: 600 }}>{it.name || it.market_hash_name || it.market_name}</div>
              <div style={{ fontSize: 13, color:"#555" }}>
                {it.price ? `Цена: ${(it.price/100).toFixed(2)} ${items.data.result ? items.data.result.currency : ""}` : it.price_text || JSON.stringify(it).slice(0,40)}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
