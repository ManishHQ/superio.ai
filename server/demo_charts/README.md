# Demo Charts for Hackathon

This directory contains pre-downloaded chart images for the hackathon demo.

## Charts Included

- **eth_chart.png**: Ethereum daily chart
- **btc_chart.png**: Bitcoin daily chart  
- **sol_chart.png**: Solana daily chart

## How It Works

When `CHART_DEMO_MODE=true` is set in `.env`, the system uses these local images instead of making API calls to Chart-IMG. This ensures:

1. **Fast responses** - No API latency
2. **Reliable demo** - Works offline or with API issues
3. **Consistent results** - Same charts every time

## Regenerating Charts

To update the charts with fresh data:

```bash
# Fetch ETH chart
curl -X POST "https://api.chart-img.com/v2/tradingview/advanced-chart" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BINANCE:ETHUSDT","interval":"1D","width":800,"height":600}' \
  -o eth_chart.png

# Repeat for BTC and SOL
```

## File Sizes

- eth_chart.png: ~44KB
- btc_chart.png: ~47KB
- sol_chart.png: ~38KB

Total: ~129KB
