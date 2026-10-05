/**
 * Pre-packaged sample datasets to allow instant testing and onboarding
 * without requiring the user to have a local file ready.
 */

export interface SampleDataset {
    id: string;
    name: string;
    filename: string;
    description: string;
    icon: string;
    badge: string;
    defaultSql: string;
    csvContent: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
    {
        id: 'ecommerce',
        name: 'E-Commerce Orders',
        filename: 'ecommerce_orders.csv',
        description: 'Orders with currency strings, categories, and timestamps (great for testing Auto-Cast)',
        icon: 'ShoppingBag',
        badge: 'Sales & Revenue',
        defaultSql: `SELECT 
    order_id,
    customer_name,
    category,
    amount,
    status,
    order_date
FROM data
LIMIT 50;`,
        csvContent: `order_id,customer_name,category,amount,status,order_date
ORD-1001,Alice Johnson,Electronics,"$1,299.99",Completed,2026-03-15
ORD-1002,Bob Smith,Furniture,"$450.00",Completed,2026-03-16
ORD-1003,Charlie Davis,Apparel,"$79.50",Shipped,2026-03-17
ORD-1004,Diana Evans,Electronics,"$2,499.00",Completed,2026-03-18
ORD-1005,Evan Wright,Home & Kitchen,"$135.25",Processing,2026-03-19
ORD-1006,Fiona Gallagher,Apparel,"$249.00",Completed,2026-03-20
ORD-1007,George Miller,Electronics,"$899.95",Shipped,2026-03-21
ORD-1008,Hannah Abbott,Furniture,"$1,120.00",Pending,2026-03-22
ORD-1009,Ian Malcolm,Home & Kitchen,"$45.00",Completed,2026-03-22
ORD-1010,Julia Roberts,Electronics,"$3,100.50",Completed,2026-03-23
ORD-1011,Kevin Bacon,Apparel,"$129.99",Shipped,2026-03-24
ORD-1012,Laura Croft,Furniture,"$680.00",Cancelled,2026-03-24
ORD-1013,Michael Scott,Office Supplies,"$84.20",Completed,2026-03-25
ORD-1014,Nina Simone,Electronics,"$1,450.00",Completed,2026-03-26
ORD-1015,Oscar Martinez,Office Supplies,"$310.00",Shipped,2026-03-27
ORD-1016,Pam Beesly,Art & Design,"$195.00",Completed,2026-03-28
ORD-1017,Quinn Fabray,Apparel,"$340.00",Completed,2026-03-29
ORD-1018,Ryan Howard,Electronics,"$780.00",Pending,2026-03-30
ORD-1019,Stanley Hudson,Home & Kitchen,"$89.90",Completed,2026-03-31
ORD-1020,Toby Flenderson,Office Supplies,"$22.50",Completed,2026-04-01`
    },
    {
        id: 'customers',
        name: 'SaaS User Profiles',
        filename: 'saas_customers.csv',
        description: 'Customer records with roles, plans, MRR, and country codes',
        icon: 'Users',
        badge: 'Product & Users',
        defaultSql: `SELECT 
    user_id,
    full_name,
    email,
    plan,
    monthly_spend,
    country,
    is_active
FROM data
ORDER BY monthly_spend DESC;`,
        csvContent: `user_id,full_name,email,plan,monthly_spend,country,is_active,created_at
USR-001,Elena Rostova,elena@apextech.io,Enterprise,1200,US,true,2025-01-12
USR-002,Marcus Vance,m.vance@solaris.co,Pro,250,UK,true,2025-02-04
USR-003,Sarah Chen,schen@quantumbit.net,Enterprise,3400,SG,true,2025-02-18
USR-004,Devon Patel,devon@cloudmatrix.in,Growth,650,IN,true,2025-03-01
USR-005,Chloe Dubois,cdubois@lumiere.fr,Starter,79,FR,false,2025-03-10
USR-006,Lukas Weber,weber@kraftwerk.de,Pro,250,DE,true,2025-03-15
USR-007,Aarav Sharma,aarav@indusflow.io,Growth,650,IN,true,2025-03-22
USR-008,Maya Lin,mlin@pacificdata.ca,Enterprise,2100,CA,true,2025-04-02
USR-009,Mateo Rossi,mateo@veloce.it,Starter,79,IT,true,2025-04-14
USR-010,Sofia Al-Mansoor,sofia@duneai.ae,Enterprise,4500,AE,true,2025-04-20
USR-011,Kenji Sato,kenji@tokyosync.jp,Growth,650,JP,true,2025-05-01
USR-012,Olivia Taylor,olivia@horizonlabs.au,Pro,250,AU,false,2025-05-11
USR-013,Carlos Silva,csilva@paulista.br,Starter,79,BR,true,2025-05-25
USR-014,Amara Okafor,amara@naijatech.ng,Growth,650,NG,true,2025-06-03
USR-015,Zoe Kravitz,zkravitz@beaconhq.com,Enterprise,1800,US,true,2025-06-19`
    },
    {
        id: 'financial',
        name: 'Financial Ledger & FX',
        filename: 'financial_ledger.csv',
        description: 'Multi-currency ledger with amounts, FX rates, department cost centers',
        icon: 'BarChart2',
        badge: 'Finance',
        defaultSql: `SELECT 
    department,
    currency,
    COUNT(*) AS total_txns,
    ROUND(SUM(amount_clean), 2) AS total_volume_usd
FROM (
    SELECT 
        department,
        currency,
        TRY_CAST(REPLACE(REPLACE(raw_amount, '$', ''), ',', '') AS DOUBLE) AS amount_clean
    FROM data
)
GROUP BY department, currency
ORDER BY total_volume_usd DESC;`,
        csvContent: `txn_id,account_code,department,currency,raw_amount,fx_rate,status,post_date
TXN-901,GL-4010,Engineering,USD,"$14,250.00",1.000,Approved,2026-01-15
TXN-902,GL-4020,Marketing,USD,"$8,700.50",1.000,Approved,2026-01-16
TXN-903,GL-4010,Engineering,EUR,"$5,400.00",1.085,Approved,2026-01-18
TXN-904,GL-4030,Operations,GBP,"$3,250.00",1.265,Pending,2026-01-19
TXN-905,GL-4040,Legal,USD,"$12,000.00",1.000,Approved,2026-01-20
TXN-906,GL-4020,Marketing,USD,"$22,150.75",1.000,Approved,2026-01-22
TXN-907,GL-4010,Engineering,USD,"$9,800.00",1.000,Approved,2026-01-24
TXN-908,GL-4050,Human Resources,EUR,"$4,100.00",1.085,Approved,2026-01-25
TXN-909,GL-4030,Operations,USD,"$1,890.20",1.000,Pending,2026-01-27
TXN-910,GL-4020,Marketing,GBP,"$7,600.00",1.265,Approved,2026-01-28
TXN-911,GL-4010,Engineering,USD,"$31,500.00",1.000,Approved,2026-01-30
TXN-912,GL-4040,Legal,USD,"$6,400.00",1.000,Approved,2026-02-01`
    },
    {
        id: 'taxi',
        name: 'NYC Taxi Trips',
        filename: 'nyc_taxi_trips.csv',
        description: 'Vendor trips with pickup timestamps, distance, fares and tip amounts',
        icon: 'Car',
        badge: 'Transit & Geo',
        defaultSql: `SELECT 
    vendor_id,
    COUNT(*) AS total_trips,
    ROUND(AVG(trip_distance), 2) AS avg_dist_mi,
    ROUND(AVG(fare_amount), 2) AS avg_fare,
    ROUND(SUM(total_amount), 2) AS total_revenue
FROM data
GROUP BY vendor_id
ORDER BY total_trips DESC;`,
        csvContent: `vendor_id,pickup_time,dropoff_time,passenger_count,trip_distance,fare_amount,tip_amount,total_amount
1 (Creative),2026-03-15 08:30:00,2026-03-15 08:45:00,1,3.84,18.45,3.50,21.95
2 (VeriFone),2026-03-15 09:15:00,2026-03-15 09:35:00,2,4.12,20.10,4.00,24.10
1 (Creative),2026-03-15 10:00:00,2026-03-15 10:20:00,1,3.65,17.80,0.00,17.80
2 (VeriFone),2026-03-15 11:10:00,2026-03-15 11:32:00,3,3.90,19.25,3.80,23.05
2 (VeriFone),2026-03-15 12:05:00,2026-03-15 12:28:00,1,4.45,21.50,4.30,25.80
1 (Creative),2026-03-15 13:40:00,2026-03-15 14:02:00,2,4.80,22.90,4.50,27.40
2 (VeriFone),2026-03-15 14:50:00,2026-03-15 15:15:00,1,5.10,24.00,4.80,28.80
1 (Creative),2026-03-15 16:10:00,2026-03-15 16:38:00,4,5.35,25.10,5.00,30.10
2 (VeriFone),2026-03-15 17:25:00,2026-03-15 17:50:00,1,6.20,28.50,5.70,34.20
1 (Creative),2026-03-15 18:30:00,2026-03-15 18:55:00,2,3.40,16.50,3.30,19.80`
    },
    {
        id: 'weblogs',
        name: 'API Weblogs',
        filename: 'api_access_logs.csv',
        description: 'HTTP request telemetry with status codes, latency ms, IP and endpoints',
        icon: 'Server',
        badge: 'DevOps & Logs',
        defaultSql: `SELECT 
    method,
    status_code,
    COUNT(*) AS request_count,
    ROUND(AVG(latency_ms), 1) AS avg_latency_ms
FROM data
GROUP BY method, status_code
ORDER BY request_count DESC;`,
        csvContent: `timestamp,method,endpoint,status_code,latency_ms,ip_address,user_agent
2026-03-15T12:00:01Z,GET,/api/v1/convert,200,18.4,192.168.1.104,Mozilla/5.0
2026-03-15T12:00:02Z,POST,/api/v1/query,200,42.1,10.0.0.45,curl/8.4.0
2026-03-15T12:00:03Z,GET,/api/v1/health,200,2.1,127.0.0.1,DatadogAgent
2026-03-15T12:00:05Z,POST,/api/v1/query,400,8.6,192.168.1.112,DataMorphX-Client
2026-03-15T12:00:08Z,GET,/api/v1/schema,200,12.3,10.0.0.88,Mozilla/5.0
2026-03-15T12:00:10Z,POST,/api/v1/convert,200,64.8,172.16.0.21,Python-requests
2026-03-15T12:00:12Z,GET,/api/v1/telemetry,200,5.2,127.0.0.1,DatadogAgent
2026-03-15T12:00:15Z,POST,/api/v1/query,500,128.9,192.168.1.140,curl/8.4.0
2026-03-15T12:00:18Z,GET,/api/v1/convert,200,22.0,10.0.0.12,Mozilla/5.0`
    }
];
