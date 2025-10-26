"""
Trading Agent - Handles chart analysis and trading recommendations
"""
from typing import Dict, Any, Optional
from tools.chart_tools import ChartAnalyzer


class TradingAgent:
    """AI Trading Agent for chart analysis"""
    
    def __init__(self, asi_client=None, chart_api_key: Optional[str] = None):
        """
        Initialize trading agent
        
        Args:
            asi_client: OpenAI/ASI client (kept for compatibility)
            chart_api_key: Chart-IMG API key
        """
        self.chart_api_key = chart_api_key
    
    def analyze_symbol(
        self,
        symbol: str,
        interval: str = "1D",
        exchange: str = "BINANCE"
    ) -> Dict[str, Any]:
        """
        Analyze a trading symbol
        
        Args:
            symbol: Trading symbol (e.g., 'ETH', 'BTC', 'AAPL')
            interval: Chart interval (1m, 5m, 15m, 1h, 4h, 1D)
            exchange: Exchange name (BINANCE, NASDAQ, etc.)
        
        Returns:
            Analysis result with chart, insights, and recommendations
        """
        try:
            # Format symbol for TradingView
            if exchange == "BINANCE" or exchange == "CRYPTO":
                tv_symbol = f"BINANCE:{symbol.upper()}USDT"
            elif exchange == "NASDAQ" or exchange == "NYSE":
                tv_symbol = f"{exchange}:{symbol.upper()}"
            else:
                tv_symbol = f"{exchange}:{symbol.upper()}"
            
            print(f"📈 Analyzing {tv_symbol} on {interval} timeframe...")
            
            # Get full chart analysis (now uses Gemini)
            result = ChartAnalyzer.get_full_chart_analysis(
                symbol=tv_symbol,
                interval=interval,
                api_key=self.chart_api_key
            )
            
            print(f"📊 Chart analysis result keys: {result.keys() if result else 'None'}")
            
            # Add additional context
            result["request"] = {
                "original_symbol": symbol,
                "exchange": exchange,
                "interval": interval
            }
            
            return result
            
        except Exception as e:
            print(f"❌ Error in trading agent: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "symbol": symbol,
                "analysis": "Failed to analyze chart."
            }
    
    def compare_symbols(
        self,
        symbols: list,
        interval: str = "1D"
    ) -> Dict[str, Any]:
        """
        Compare multiple symbols
        
        Args:
            symbols: List of symbols to compare
            interval: Chart interval
        
        Returns:
            Comparison analysis
        """
        try:
            results = []
            
            for symbol_data in symbols:
                if isinstance(symbol_data, str):
                    # Simple symbol
                    symbol = symbol_data
                    exchange = "BINANCE"
                else:
                    # Dict with symbol and exchange
                    symbol = symbol_data.get("symbol")
                    exchange = symbol_data.get("exchange", "BINANCE")
                
                analysis = self.analyze_symbol(symbol, interval, exchange)
                results.append({
                    "symbol": symbol,
                    "exchange": exchange,
                    "analysis": analysis
                })
            
            return {
                "comparison": results,
                "count": len(results),
                "interval": interval
            }
            
        except Exception as e:
            print(f"❌ Error comparing symbols: {e}")
            return {
                "error": str(e),
                "comparison": []
            }
    
    def get_supported_intervals(self) -> list:
        """Get list of supported chart intervals"""
        return [
            "1m", "5m", "15m", "30m", "1h", "4h", 
            "6h", "12h", "1D", "1W", "1M"
        ]
    
    def get_supported_exchanges(self) -> dict:
        """Get list of supported exchanges"""
        return {
            "crypto": ["BINANCE", "COINBASE", "KRAKEN", "GEMINI"],
            "stocks_us": ["NASDAQ", "NYSE", "AMEX"],
            "forex": ["FX_IDC"]
        }


def get_trading_agent(asi_client, chart_api_key: Optional[str] = None):
    """Factory function to create trading agent"""
    return TradingAgent(asi_client=asi_client, chart_api_key=chart_api_key)
