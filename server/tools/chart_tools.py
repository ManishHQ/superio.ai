"""
Chart Analysis Tools - Using Chart-IMG API for TradingView chart analysis with Gemini AI
"""
import requests
import os
from typing import Dict, Any, Optional
import google.generativeai as genai
import base64
import tempfile
import hashlib


class ChartAnalyzer:
    """Chart analysis using Chart-IMG API and Gemini AI"""
    
    BASE_URL = "https://api.chart-img.com"
    
    @staticmethod
    def get_chart_image(
        symbol: str,
        interval: str = "1D",
        style: str = "candle",
        width: int = 640,
        height: int = 480,
        indicator: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> Optional[str]:
        """
        Get TradingView chart image from Chart-IMG API
        
        Args:
            symbol: TradingView symbol (e.g., 'BINANCE:ETHUSDT', 'NASDAQ:AAPL')
            interval: Chart interval (1m, 5m, 15m, 1h, 4h, 1D, etc.)
            style: Chart style (candle, bar, line, area, etc.)
            width: Image width
            height: Image height
            indicator: Optional indicator to overlay (RSI, MACD, etc.)
            api_key: Chart-IMG API key
        
        Returns:
            Local file path or None
        """
        try:
            if not api_key:
                api_key = os.getenv("CHART_IMG_API_KEY")
            
            print(f"🔑 Chart-IMG API Key present: {bool(api_key and api_key != 'your_chart_img_api_key_here')}")
            
            if not api_key or api_key == "your_chart_img_api_key_here":
                print("⚠️ Chart-IMG API key not configured")
                return None
            
            # Build URL (using v2 advanced chart endpoint)
            url = f"{ChartAnalyzer.BASE_URL}/v2/tradingview/advanced-chart"
            headers = {
                "x-api-key": api_key,
                "Content-Type": "application/json"
            }
            
            # Build request payload according to Chart-IMG API v2
            payload = {
                "symbol": symbol,
                "interval": interval,
                "width": width,
                "height": height,
                "hide_volume": False,
                "hide_top_toolbar": False,
                "hide_side_toolbar": False
            }
            
            # Add indicator if specified
            if indicator == "RSI":
                payload["studies"] = [{"name": "RSI", "overrides": {}}]
            elif indicator == "MACD":
                payload["studies"] = [{"name": "MACD", "overrides": {}}]
            elif indicator == "BB":
                payload["studies"] = [{"name": "Bollinger Bands", "overrides": {}}]
            
            print(f"📊 Fetching chart for {symbol} from Chart-IMG...")
            print(f"🔗 URL: {url}")
            print(f"📦 Payload: {payload}")
            print(f"🔑 Headers: {list(headers.keys())}")
            
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            
            print(f"📋 Response status: {response.status_code}")
            print(f"📋 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                # Save PNG to temporary file
                symbol_hash = hashlib.md5(f"{symbol}_{interval}".encode()).hexdigest()[:8]
                temp_file = tempfile.NamedTemporaryFile(suffix='.png', prefix=f'chart_{symbol_hash}_', delete=False)
                temp_file.write(response.content)
                temp_file.close()
                
                print(f"✅ Saved PNG image ({len(response.content)} bytes) to: {temp_file.name}")
                return temp_file.name
            else:
                error_text = response.text[:1000] if response.text else "No error message"
                print(f"❌ Chart API error: {response.status_code}")
                print(f"📋 Error response: {error_text}")
                print(f"📋 Full response headers: {dict(response.headers)}")
                return None
                
        except requests.exceptions.Timeout:
            print("❌ Chart API request timed out")
            return None
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error fetching chart: {e}")
            import traceback
            traceback.print_exc()
            return None
        except Exception as e:
            print(f"❌ Unexpected error fetching chart: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @staticmethod
    def analyze_chart_with_ai(
        symbol: str,
        chart_image_path: str,
        indicators: Optional[list] = None
    ) -> str:
        """
        Analyze chart using Google Gemini Vision
        
        Args:
            symbol: Trading symbol
            chart_image_path: Local file path to the chart image
            indicators: List of indicators to analyze
        
        Returns:
            AI-generated analysis text
        """
        try:
            # Configure Gemini
            gemini_key = os.getenv("GOOGLE_API_KEY")
            if not gemini_key or gemini_key == "your_google_api_key_here":
                print("⚠️ Google API key not configured")
                return "Gemini API key not configured"
            
            genai.configure(api_key=gemini_key)
            
            # Build analysis prompt
            analysis_prompt = f"""You are an expert cryptocurrency and stock market analyst. Analyze this {symbol} chart and provide actionable trading insights.

CRITICAL: Provide concrete, actionable recommendations. Do NOT say "this is not financial advice" or "do your own research" - instead give specific, confident analysis based on what you see.

Analyze the following:
1. **Trend Direction**: Is the price in an uptrend, downtrend, or consolidation?
2. **Key Support/Resistance Levels**: Identify critical price levels
3. **Chart Patterns**: Note any recognizable patterns (head & shoulders, triangles, flags, etc.)
4. **Price Action**: Analyze candlestick formations
5. **Indicators Analysis**: Review any visible technical indicators
6. **Volume**: Comment on volume patterns if visible
7. **Trading Recommendation**: Provide a specific recommendation (BUY, SELL, or HOLD) with:
   - Entry price target
   - Stop loss level
   - Take profit targets
   - Risk/Reward ratio

Be confident and specific in your analysis. Use technical trading terms and provide actionable insights."""

            # Load the image
            import PIL.Image
            image = PIL.Image.open(chart_image_path)
            
            # Use Gemini 2.0 Flash
            model = genai.GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content([
                analysis_prompt,
                image
            ])
            
            analysis = response.text
            print(f"✅ Generated AI analysis for {symbol}")
            return analysis
            
        except Exception as e:
            print(f"❌ Error analyzing chart with Gemini: {e}")
            import traceback
            traceback.print_exc()
            return f"Analysis error: {str(e)}"
    
    @staticmethod
    def get_full_chart_analysis(
        symbol: str,
        interval: str = "1D",
        api_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get complete chart analysis with image and AI insights
        
        Args:
            symbol: TradingView symbol
            interval: Chart interval
            api_key: Chart-IMG API key
        
        Returns:
            Dictionary with chart_url, analysis, and recommendation
        """
        try:
            print(f"🔄 Starting full chart analysis for {symbol} (interval: {interval})")
            
            # Get chart image
            print(f"📥 Step 1: Fetching chart image...")
            chart_path = ChartAnalyzer.get_chart_image(
                symbol=symbol,
                interval=interval,
                api_key=api_key
            )
            
            if not chart_path:
                print("❌ Failed to fetch chart image")
                return {
                    "error": "Failed to generate chart image",
                    "chart_url": None,
                    "analysis": "Could not fetch chart data."
                }
            
            print(f"✅ Chart image fetched: {chart_path}")
            
            # Analyze with Gemini
            print(f"🤖 Step 2: Analyzing chart with Gemini...")
            analysis = ChartAnalyzer.analyze_chart_with_ai(
                symbol=symbol,
                chart_image_path=chart_path
            )
            
            print(f"✅ Analysis complete: {len(analysis) if analysis else 0} characters")
            
            # Extract recommendation from analysis
            if "BUY" in analysis.upper():
                recommendation = "BUY"
            elif "SELL" in analysis.upper():
                recommendation = "SELL"
            else:
                recommendation = "HOLD"
            
            result = {
                "symbol": symbol,
                "interval": interval,
                "chart_url": chart_path,
                "analysis": analysis,
                "recommendation": recommendation
            }
            
            print(f"✅ Full analysis complete")
            return result
            
        except Exception as e:
            print(f"❌ Error in full chart analysis: {e}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "chart_url": None,
                "analysis": "Analysis failed."
            }
