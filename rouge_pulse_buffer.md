
# RougePulse Analysis Buffer

## 📊 Economic Data
```json

You are RougePulse, an expert economic calendar analyst with a deep understanding of market narratives.

TASK:
Analyze the economic events and news context to provide a strategic market assessment.
Focus on the "WHY" - why does this data matter for Bitcoin (BTC) and S&P 500 (ES)?

ECONOMIC EVENTS:
[
  {
    "id": "ff83cfc9-c886-426d-ba16-40e55393bfee",
    "event_date": "2025-11-25T13:15:00.000Z",
    "country": "United States",
    "event_name": "ADP Employment Change Weekly",
    "importance": 0,
    "actual": "-13.5K",
    "forecast": "",
    "previous": "-2.5K",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.761Z"
  },
  {
    "id": "3bac6e79-a2f5-404d-82dc-4cb2e9fe1bf3",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI MoM",
    "importance": 0,
    "actual": "0.3%",
    "forecast": "0.5%",
    "previous": "-0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.763Z"
  },
  {
    "id": "97d0e623-0af7-4f16-87aa-6cfa44930eef",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales MoM",
    "importance": 0,
    "actual": "0.2%",
    "forecast": "0.3%",
    "previous": "0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.765Z"
  },
  {
    "id": "7d7181d6-b43f-4799-aa65-c111572b627d",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Core PPI YoY",
    "importance": 0,
    "actual": "2.6%",
    "forecast": "2.8%",
    "previous": "2.9%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.773Z"
  },
  {
    "id": "8697e3aa-3e61-4ab5-9e2f-6b63f12f4b95",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Core PPI MoM",
    "importance": 0,
    "actual": "0.1%",
    "forecast": "0.2%",
    "previous": "-0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.767Z"
  },
  {
    "id": "eccdf347-2431-4aad-b057-535c3731858c",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales Control Group MoM",
    "importance": 0,
    "actual": "-0.1%",
    "forecast": "0.4%",
    "previous": "0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.769Z"
  },
  {
    "id": "78191068-5273-4423-8902-d220ea482b82",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI",
    "importance": 0,
    "actual": "149.779",
    "forecast": "149.4",
    "previous": "149.316",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.775Z"
  },
  {
    "id": "5c9d0384-6dd4-41c1-b976-b2f6484fc58d",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI Ex Food, Energy and Trade MoM",
    "importance": 0,
    "actual": "0.1%",
    "forecast": "0.2%",
    "previous": "0.3%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.777Z"
  },
  {
    "id": "fc80bca6-55d0-4d34-ad9e-64e1ff168663",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI Ex Food, Energy and Trade YoY",
    "importance": 0,
    "actual": "2.9%",
    "forecast": "2.7%",
    "previous": "2.9%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.779Z"
  },
  {
    "id": "85a597f9-8721-4a78-81cc-4db9e1002ce3",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "PPI YoY",
    "importance": 0,
    "actual": "2.7%",
    "forecast": "2.6%",
    "previous": "2.7%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.781Z"
  },
  {
    "id": "17a39023-21f8-4247-abcd-6cba8632fe76",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales Ex Gas/Autos MoM",
    "importance": 0,
    "actual": "0.1%",
    "forecast": "-0.5%",
    "previous": "0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.783Z"
  },
  {
    "id": "41d5b5fd-879a-4b11-a87f-7ba833ebf8bb",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales YoY",
    "importance": 0,
    "actual": "4.3%",
    "forecast": "3.9%",
    "previous": "5%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.785Z"
  },
  {
    "id": "314aba8d-f597-445b-a405-bbefc83a74a5",
    "event_date": "2025-11-25T13:30:00.000Z",
    "country": "United States",
    "event_name": "Retail Sales Ex Autos MoM",
    "importance": 0,
    "actual": "0.3%",
    "forecast": "0.4%",
    "previous": "0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.771Z"
  },
  {
    "id": "11fea91b-276b-4da5-b95d-b6e08939fe9f",
    "event_date": "2025-11-25T13:55:00.000Z",
    "country": "United States",
    "event_name": "Redbook YoY",
    "importance": 0,
    "actual": "5.9%",
    "forecast": "",
    "previous": "6.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.787Z"
  },
  {
    "id": "75c46455-a10a-4613-9c90-7f84d3cd1ac1",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "House Price Index YoY",
    "importance": 0,
    "actual": "1.7%",
    "forecast": "1.5%",
    "previous": "2.4%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.795Z"
  },
  {
    "id": "5f4d9f76-b0bb-46c1-851d-8a12c1f8a530",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "S&P/Case-Shiller Home Price YoY",
    "importance": 0,
    "actual": "1.4%",
    "forecast": "1.6%",
    "previous": "1.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.788Z"
  },
  {
    "id": "4d5ad6b2-7441-4fb7-998d-1441243cc5cc",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "House Price Index",
    "importance": 0,
    "actual": "435.4",
    "forecast": "436.6",
    "previous": "435.6",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.790Z"
  },
  {
    "id": "1e944be6-32d6-425b-a556-db636f839b69",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "House Price Index MoM",
    "importance": 0,
    "actual": "0%",
    "forecast": "0.3%",
    "previous": "0.4%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.793Z"
  },
  {
    "id": "44d56e11-0bf7-4e99-bc8f-e8ef7885a484",
    "event_date": "2025-11-25T14:00:00.000Z",
    "country": "United States",
    "event_name": "S&P/Case-Shiller Home Price MoM",
    "importance": 0,
    "actual": "-0.5%",
    "forecast": "-0.4%",
    "previous": "-0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.797Z"
  },
  {
    "id": "ec1d13bb-68c8-42ff-ab37-80678e91d8e8",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Pending Home Sales MoM",
    "importance": 0,
    "actual": "1.9%",
    "forecast": "-0.4%",
    "previous": "0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.803Z"
  },
  {
    "id": "ad27ce93-b574-421f-b225-97d3a65aea7c",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Pending Home Sales YoY",
    "importance": 0,
    "actual": "-0.4%",
    "forecast": "-2.4%",
    "previous": "-0.9%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.805Z"
  },
  {
    "id": "e911462a-6123-4c11-aab0-26f36ae6c074",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Retail Inventories Ex Autos MoM",
    "importance": 0,
    "actual": "0%",
    "forecast": "0.3%",
    "previous": "0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.807Z"
  },
  {
    "id": "eb52d0a1-f246-4fc8-bf04-fbe93ef6219e",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Richmond Fed Manufacturing Index",
    "importance": 0,
    "actual": "-15",
    "forecast": "-1",
    "previous": "-4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.808Z"
  },
  {
    "id": "d6d6192e-cefc-4002-8831-efa72fea5a47",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Richmond Fed Manufacturing Shipments Index",
    "importance": 0,
    "actual": "-14",
    "forecast": "6",
    "previous": "4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.810Z"
  },
  {
    "id": "6368df00-5183-4824-8665-8d18e3744980",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Richmond Fed Services Revenues Index",
    "importance": 0,
    "actual": "-4",
    "forecast": "5",
    "previous": "4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.812Z"
  },
  {
    "id": "df5ba88b-74b2-4279-9467-8b9a9d0bb954",
    "event_date": "2025-11-25T15:00:00.000Z",
    "country": "United States",
    "event_name": "Business Inventories MoM",
    "importance": 0,
    "actual": "0%",
    "forecast": "0.1%",
    "previous": "0.1%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.799Z"
  },
  {
    "id": "79dc3c58-b09c-46f6-8aaf-0e72466927a2",
    "event_date": "2025-11-25T15:30:00.000Z",
    "country": "United States",
    "event_name": "Dallas Fed Services Revenues Index",
    "importance": 0,
    "actual": "-2.5",
    "forecast": "-3",
    "previous": "-6.4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.815Z"
  },
  {
    "id": "b095e336-b6cc-456a-83c3-3d10e9f73359",
    "event_date": "2025-11-25T15:30:00.000Z",
    "country": "United States",
    "event_name": "Dallas Fed Services Index",
    "importance": 0,
    "actual": "-2.3",
    "forecast": "-6",
    "previous": "-9.4",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.813Z"
  },
  {
    "id": "fe86d44f-cacf-4ab9-8fa8-ede408fb4c7e",
    "event_date": "2025-11-25T16:30:00.000Z",
    "country": "United States",
    "event_name": "52-Week Bill Auction",
    "importance": 0,
    "actual": "3.460%",
    "forecast": "",
    "previous": "3.445%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.817Z"
  },
  {
    "id": "151c73b7-8841-416f-969a-5bf96824ed0f",
    "event_date": "2025-11-25T18:00:00.000Z",
    "country": "United States",
    "event_name": "5-Year Note Auction",
    "importance": 0,
    "actual": "3.562%",
    "forecast": "",
    "previous": "3.625%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.819Z"
  },
  {
    "id": "1febb06e-b098-45a8-b2a1-2e5b91e41d8a",
    "event_date": "2025-11-25T18:00:00.000Z",
    "country": "United States",
    "event_name": "Money Supply",
    "importance": 0,
    "actual": "$22.3T",
    "forecast": "",
    "previous": "$22.21T",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.821Z"
  },
  {
    "id": "c5e88f52-1d19-43c9-b2df-308a259f2d75",
    "event_date": "2025-11-25T19:30:00.000Z",
    "country": "United States",
    "event_name": "Monthly Budget Statement",
    "importance": 0,
    "actual": "$284B",
    "forecast": "$-250.0B",
    "previous": "$198B",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-25T22:58:20.928Z"
  },
  {
    "id": "cf52cf83-1969-49e0-bffe-b0400d89323f",
    "event_date": "2025-11-25T21:30:00.000Z",
    "country": "United States",
    "event_name": "API Crude Oil Stock Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "4.4M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.823Z"
  },
  {
    "id": "542422bf-988b-47c3-81d8-d2338bce628a",
    "event_date": "2025-11-25T22:30:00.000Z",
    "country": "United States",
    "event_name": "API Crude Oil Stock Change",
    "importance": 0,
    "actual": "-1.9M",
    "forecast": "",
    "previous": "4.4M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-25T22:58:20.931Z"
  },
  {
    "id": "3c2e1050-1ba3-4d6f-9314-4cbf09d464ad",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Building Permits Prel",
    "importance": 0,
    "actual": "",
    "forecast": "1.35M",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.884Z"
  },
  {
    "id": "da579f35-4c56-4a4f-91a0-ff224957daf3",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Goods Trade Balance Adv",
    "importance": 0,
    "actual": "",
    "forecast": "$-89.0B",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.890Z"
  },
  {
    "id": "d434439d-fd17-4178-9c21-864f7d43e1e2",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Building Permits MoM Prel",
    "importance": 0,
    "actual": "",
    "forecast": "0.7%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.887Z"
  },
  {
    "id": "2dc90ea6-eb44-451a-846a-fda6a43634f2",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Non Defense Goods Orders Ex Air",
    "importance": 0,
    "actual": "",
    "forecast": "-0.1%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.900Z"
  },
  {
    "id": "6869fcb5-2029-467e-8c9c-0c244e75ea84",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Wholesale Inventories MoM Adv",
    "importance": 0,
    "actual": "",
    "forecast": "-0.4%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.896Z"
  },
  {
    "id": "2a1f20af-1a4b-40d8-bdb6-a96649fb316f",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "New Home Sales MoM",
    "importance": 0,
    "actual": "",
    "forecast": "1.4%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.903Z"
  },
  {
    "id": "8fe0cb92-2e0f-4f5b-830a-92bbb9992a79",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Building Permits MoM Final",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.881Z"
  },
  {
    "id": "48947705-d7c2-4761-96ab-d7b7f19c72b9",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Retail Inventories Ex Autos MoM Adv",
    "importance": 0,
    "actual": "",
    "forecast": "-0.1%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.893Z"
  },
  {
    "id": "76e2a7bc-19f7-47da-92b6-2f0244583b6e",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Durable Goods Orders ex Defense MoM",
    "importance": 0,
    "actual": "",
    "forecast": "-0.8%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.899Z"
  },
  {
    "id": "0a5a2402-7ae5-4ecf-91a2-0593121fd8f9",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Durable Goods Orders Ex Transp MoM",
    "importance": 0,
    "actual": "",
    "forecast": "-0.1%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.889Z"
  },
  {
    "id": "6eebc418-0b62-4e8e-ba6f-c46d2fc6909b",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Building Permits Final",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.879Z"
  },
  {
    "id": "2a32466e-6ff9-48d5-9379-2a7c044d5ba8",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Durable Goods Orders MoM",
    "importance": 0,
    "actual": "",
    "forecast": "-0.3%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.886Z"
  },
  {
    "id": "5dc4d8ba-7374-4401-809b-c3bbe206900c",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "Retail Inventories Ex Autos MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.2%",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.905Z"
  },
  {
    "id": "4fef45ee-6860-4e31-9b1f-9ae38fcac08b",
    "event_date": "2025-11-26T05:00:00.000Z",
    "country": "United States",
    "event_name": "New Home Sales",
    "importance": 0,
    "actual": "",
    "forecast": "0.7M",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.901Z"
  },
  {
    "id": "c9e92f5f-0859-498e-a525-f5efe5d756b3",
    "event_date": "2025-11-26T12:00:00.000Z",
    "country": "United States",
    "event_name": "MBA Purchase Index",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "168.7",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.834Z"
  },
  {
    "id": "a5fe1936-52eb-40f7-a449-3c3e72e4b1af",
    "event_date": "2025-11-26T12:00:00.000Z",
    "country": "United States",
    "event_name": "MBA Mortgage Refinance Index",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "1156.8",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.832Z"
  },
  {
    "id": "f634085b-11e5-47a4-ac3f-04186d455b7a",
    "event_date": "2025-11-26T12:00:00.000Z",
    "country": "United States",
    "event_name": "MBA Mortgage Market Index",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "316.9",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.830Z"
  },
  {
    "id": "bcbf3834-530e-4bbb-8cb1-f95c6241c7ac",
    "event_date": "2025-11-26T12:00:00.000Z",
    "country": "United States",
    "event_name": "MBA Mortgage Applications",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-5.2%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.828Z"
  },
  {
    "id": "d041fb34-6536-416b-a5e4-30f44890e212",
    "event_date": "2025-11-26T12:00:00.000Z",
    "country": "United States",
    "event_name": "MBA 30-Year Mortgage Rate",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "6.37%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.826Z"
  },
  {
    "id": "f30029ec-d768-4b8e-91cb-9b495303bd2b",
    "event_date": "2025-11-26T13:30:00.000Z",
    "country": "United States",
    "event_name": "Durable Goods Orders ex Defense MoM",
    "importance": 0,
    "actual": "",
    "forecast": "1.3%",
    "previous": "1.9%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.842Z"
  },
  {
    "id": "9003ed55-3631-40b0-9401-ac0f1af4ef29",
    "event_date": "2025-11-26T13:30:00.000Z",
    "country": "United States",
    "event_name": "Durable Goods Orders MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.2%",
    "previous": "2.9%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.835Z"
  },
  {
    "id": "e9388cba-0267-48a6-9271-bf32180400fb",
    "event_date": "2025-11-26T13:30:00.000Z",
    "country": "United States",
    "event_name": "Durable Goods Orders Ex Transp MoM",
    "importance": 0,
    "actual": "",
    "forecast": "0.2%",
    "previous": "0.4%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.837Z"
  },
  {
    "id": "c3356e00-ef10-49cd-9b1c-cf89ff9516bc",
    "event_date": "2025-11-26T13:30:00.000Z",
    "country": "United States",
    "event_name": "Initial Jobless Claims",
    "importance": 0,
    "actual": "",
    "forecast": "224.0K",
    "previous": "220K",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.839Z"
  },
  {
    "id": "6788c2f2-3a5c-46b5-9aea-649bd2d98a04",
    "event_date": "2025-11-26T13:30:00.000Z",
    "country": "United States",
    "event_name": "Continuing Jobless Claims",
    "importance": 0,
    "actual": "",
    "forecast": "1975.0K",
    "previous": "1974K",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.840Z"
  },
  {
    "id": "c0fa0325-f81f-480e-8686-12a36951a8fe",
    "event_date": "2025-11-26T13:30:00.000Z",
    "country": "United States",
    "event_name": "Jobless Claims 4-week Average",
    "importance": 0,
    "actual": "",
    "forecast": "225.0K",
    "previous": "224.25K",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.844Z"
  },
  {
    "id": "ab4ee8e4-1652-4de5-af82-392794703f57",
    "event_date": "2025-11-26T13:30:00.000Z",
    "country": "United States",
    "event_name": "Non Defense Goods Orders Ex Air",
    "importance": 0,
    "actual": "",
    "forecast": "0.1%",
    "previous": "0.6%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.846Z"
  },
  {
    "id": "bcd27db0-3488-4428-a332-704edac00a75",
    "event_date": "2025-11-26T14:45:00.000Z",
    "country": "United States",
    "event_name": "Chicago PMI",
    "importance": 0,
    "actual": "",
    "forecast": "46",
    "previous": "43.8",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.847Z"
  },
  {
    "id": "b68ac3e3-2fca-4773-84a6-71992e6e498d",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Refinery Crude Runs Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "0.259M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.862Z"
  },
  {
    "id": "9f4eeb3f-b1c0-42fb-a8f7-93b5c3bd4d6f",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Heating Oil Stocks Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-0.494M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.860Z"
  },
  {
    "id": "746ff0c4-9bae-48b6-a33a-e384922fd811",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Gasoline Production Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-0.662M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.858Z"
  },
  {
    "id": "c65c9d3c-ad0f-4d1f-a5da-af4fe15ef8bc",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Distillate Stocks Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "0.171M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.856Z"
  },
  {
    "id": "039acf93-1590-4c83-9244-c289b24e2360",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Distillate Fuel Production Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-0.117M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.854Z"
  },
  {
    "id": "09507e30-7d71-48ca-827e-5c9f60d4a511",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Cushing Crude Oil Stocks Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-0.698M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.853Z"
  },
  {
    "id": "2caa0c59-8681-4e6d-833f-7a25c1b9eef7",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Crude Oil Imports Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-0.614M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.851Z"
  },
  {
    "id": "dde78b6f-d3ea-48ff-8b69-ccacf7452418",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Gasoline Stocks Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "2.327M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.850Z"
  },
  {
    "id": "9348a34a-b495-40e9-9210-9852934d0b04",
    "event_date": "2025-11-26T15:30:00.000Z",
    "country": "United States",
    "event_name": "EIA Crude Oil Stocks Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-3.426M",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.848Z"
  },
  {
    "id": "33e3c59c-caae-4dc2-81ed-d7c2a8a2c0ad",
    "event_date": "2025-11-26T16:30:00.000Z",
    "country": "United States",
    "event_name": "7-Year Note Auction",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "3.790%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.868Z"
  },
  {
    "id": "aa936a58-5ae3-42da-9d3a-c1e60354b364",
    "event_date": "2025-11-26T16:30:00.000Z",
    "country": "United States",
    "event_name": "8-Week Bill Auction",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "3.850%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.870Z"
  },
  {
    "id": "c7d8d019-1a10-4420-a785-9b24a03b6b7f",
    "event_date": "2025-11-26T16:30:00.000Z",
    "country": "United States",
    "event_name": "17-Week Bill Auction",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "3.750%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.864Z"
  },
  {
    "id": "965fb8db-8abd-4e41-a2b8-ffa54b7580d9",
    "event_date": "2025-11-26T16:30:00.000Z",
    "country": "United States",
    "event_name": "4-Week Bill Auction",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "3.890%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.866Z"
  },
  {
    "id": "294c6368-b69f-4ede-906a-b27f996afda7",
    "event_date": "2025-11-26T17:00:00.000Z",
    "country": "United States",
    "event_name": "15-Year Mortgage Rate",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "5.54%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.871Z"
  },
  {
    "id": "c85a9944-9f2c-4abd-9e62-e74ca784382c",
    "event_date": "2025-11-26T17:00:00.000Z",
    "country": "United States",
    "event_name": "30-Year Mortgage Rate",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "6.26%",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.872Z"
  },
  {
    "id": "43d50336-64bb-43fb-82d1-56de63e3cb78",
    "event_date": "2025-11-26T17:00:00.000Z",
    "country": "United States",
    "event_name": "EIA Natural Gas Stocks Change",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "-14Bcf",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.874Z"
  },
  {
    "id": "7534be7f-1776-43e8-9b7a-5704acb5e313",
    "event_date": "2025-11-26T18:00:00.000Z",
    "country": "United States",
    "event_name": "Baker Hughes Total Rigs Count",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "554",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.877Z"
  },
  {
    "id": "6d58cb2f-2f84-489d-956c-7c29203ef357",
    "event_date": "2025-11-26T18:00:00.000Z",
    "country": "United States",
    "event_name": "Baker Hughes Oil Rig Count",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "419",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.875Z"
  },
  {
    "id": "a09f8747-db50-495d-9865-47228705c796",
    "event_date": "2025-11-26T19:00:00.000Z",
    "country": "United States",
    "event_name": "Fed Beige Book",
    "importance": 0,
    "actual": "",
    "forecast": "",
    "previous": "",
    "currency": "USD",
    "source": "TradingEconomics",
    "created_at": "2025-11-24T23:37:29.878Z"
  }
]

MARKET NEWS CONTEXT (ZeroHedge/FinancialJuice):
- MarketWatch: Home sellers face a tough choice: Cut their asking price or remove the listing
- MarketWatch: 4:51p
                                            
                                                Dell rides a boom in AI servers to deliver an upbeat forecast
- MarketWatch: 4:42p
                                            
                                                Urban Outfitters shares rally as turnaround at namesake stores pays off
- MarketWatch: 4:32p
                                            
                                                Is making ‘Rush Hour 4’ Trump’s latest executive order? Paramount looks to be onboard.
- MarketWatch: What the Nasdaq's best day since May means for this holiday trading week
- MarketWatch: 5:44p
                                            
                                                Nasdaq has best day since May as Alphabet drives AI rebound. Here’s what it means for the rest of Thanksgiving week.
- MarketWatch: 5:09p
                                            
                                                Trump’s healthcare plan could extend Obamacare subsidies. Here’s what we know so far.
- MarketWatch: 4:57p
                                            
                                                There’s still hope GLP-1 drugs could slow the second-biggest type of dementia

INSTRUCTIONS:
1. **Score the Impact**: Instead of just High/Low, assign an "Impact Score" (0-100) for the session.
2. **Narrative Analysis**: Explain what the "Smart Money" or market pundits are saying. Does this data confirm a trend (e.g., "Soft Landing", "Reflation", "Recession")?
3. **Asset Specifics**: Explicitly state the likely impact on Bitcoin (BTC) and ES Futures.
4. **Cross-Reference**: If a news headline matches an event, use it to validate the sentiment.

REQUIRED JSON OUTPUT:
{
  "impact_score": number, // 0-100 (100 = Extreme Volatility/Importance)
  "market_narrative": "Detailed explanation of the current market story (e.g. 'Inflation is sticky, bad for tech').",
  "high_impact_events": [
    { 
      "event": "Name", 
      "actual_vs_forecast": "Description of deviation", 
      "significance": "Why this specific number matters now" 
    }
  ],
  "asset_analysis": {
    "ES_Futures": { "bias": "BULLISH|BEARISH", "reasoning": "..." },
    "Bitcoin": { "bias": "BULLISH|BEARISH", "reasoning": "..." }
  },
  "trading_recommendation": "Actionable advice based on the data + narrative."
}

```

## 🤖 Instructions
Analyze the data above and return ONLY the requested JSON.
