from backend.app import app

with app.test_client() as c:
    paths=['/stats/today_stats','/stats/revenue_trend','/stats/brand_share','/stats/top_products','/invoices']
    for p in paths:
        r=c.get(p)
        print(p, r.status_code, r.get_json())
