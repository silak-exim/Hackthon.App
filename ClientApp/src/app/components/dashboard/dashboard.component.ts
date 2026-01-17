import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Currency pair interface for TradingView charts
 */
interface CurrencyPair {
  symbol: string;
  name: string;
  flag: string;
}

/**
 * Quick service interface for dashboard services
 */
interface QuickService {
  icon: string;
  title: string;
  desc: string;
}

/**
 * Dashboard component displaying EXIM Bank services, charts, and announcements.
 * Uses signals for reactive state management.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Static data - readonly arrays
  readonly quickServices: readonly QuickService[] = [
    { icon: '💳', title: 'สินเชื่อส่งออก', desc: 'สนับสนุนการส่งออก' },
    { icon: '🏭', title: 'สินเชื่อนำเข้า', desc: 'สนับสนุนการนำเข้า' },
    { icon: '🌐', title: 'โอนเงินต่างประเทศ', desc: 'บริการโอนเงินระหว่างประเทศ' },
    { icon: '📊', title: 'Letter of Credit', desc: 'L/C และ Trust Receipt' },
    { icon: '🛡️', title: 'ประกันการส่งออก', desc: 'คุ้มครองความเสี่ยง' },
    { icon: '📈', title: 'Forward Contract', desc: 'ป้องกันความเสี่ยงค่าเงิน' },
  ] as const;

  // Currency pairs for selection - using valid TradingView symbols
  readonly currencyPairs: readonly CurrencyPair[] = [
    { symbol: 'OANDA:USDTHB', name: 'USD/THB', flag: '🇺🇸' },
    { symbol: 'OANDA:EURTHB', name: 'EUR/THB', flag: '🇪🇺' },
    { symbol: 'OANDA:GBPTHB', name: 'GBP/THB', flag: '🇬🇧' },
    { symbol: 'ICE:JPYTHB', name: 'JPY/THB', flag: '🇯🇵' },
    { symbol: 'FX:EURUSD', name: 'EUR/USD', flag: '🇪🇺' },
    { symbol: 'FX:USDJPY', name: 'USD/JPY', flag: '🇺🇸' },
    { symbol: 'FX:GBPUSD', name: 'GBP/USD', flag: '🇬🇧' },
    { symbol: 'FX:AUDUSD', name: 'AUD/USD', flag: '🇦🇺' },
    { symbol: 'FX:USDCNY', name: 'USD/CNY', flag: '🇨🇳' },
    { symbol: 'TVC:GOLD', name: 'Gold (XAU)', flag: '🥇' },
    { symbol: 'TVC:SILVER', name: 'Silver (XAG)', flag: '🥈' },
    { symbol: 'TVC:USOIL', name: 'Crude Oil', flag: '🛢️' },
  ] as const;

  // Signals for reactive state
  readonly selectedCurrency = signal('OANDA:USDTHB');
  readonly currentTime = signal(new Date());

  // Computed values for chart URLs
  readonly mainChartUrl = computed(() => this.buildChartUrl(this.selectedCurrency()));
  readonly marketOverviewUrl: SafeResourceUrl;
  readonly forexCrossRatesUrl: SafeResourceUrl;

  // Timer reference for cleanup
  private timeIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {
    // Market overview URL is static, compute once
    this.marketOverviewUrl = this.buildMarketOverviewUrl();
    this.forexCrossRatesUrl = this.buildForexCrossRatesUrl();
  }

  ngOnInit(): void {
    this.startTimeUpdater();
  }

  ngOnDestroy(): void {
    this.stopTimeUpdater();
  }

  /**
   * Handle currency selection change
   */
  onCurrencyChange(symbol: string): void {
    this.selectedCurrency.set(symbol);
  }

  /**
   * Update selected currency (for ngModel binding)
   */
  updateSelectedCurrency(symbol: string): void {
    this.selectedCurrency.set(symbol);
  }

  /**
   * Track services by title for ngFor optimization
   */
  trackByTitle(_index: number, service: QuickService): string {
    return service.title;
  }

  /**
   * Track currency pairs by symbol for ngFor optimization
   */
  trackBySymbol(_index: number, pair: CurrencyPair): string {
    return pair.symbol;
  }

  /**
   * Start the time updater interval
   */
  private startTimeUpdater(): void {
    this.timeIntervalId = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  /**
   * Stop the time updater interval
   */
  private stopTimeUpdater(): void {
    if (this.timeIntervalId) {
      clearInterval(this.timeIntervalId);
      this.timeIntervalId = null;
    }
  }

  /**
   * Build TradingView chart URL for a given symbol
   */
  private buildChartUrl(symbol: string): SafeResourceUrl {
    const encodedSymbol = encodeURIComponent(symbol);
    const studies = encodeURIComponent(JSON.stringify(['RSI@tv-basicstudies', 'MACD@tv-basicstudies']));
    const url = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_main&symbol=${encodedSymbol}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=${studies}&theme=light&style=1&timezone=Asia%2FBangkok&withdateranges=1&showpopupbutton=1&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=th&utm_source=localhost&utm_medium=widget&utm_campaign=chart`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Build TradingView market overview widget URL
   */
  private buildMarketOverviewUrl(): SafeResourceUrl {
    const config = {
      colorTheme: 'light',
      dateRange: '1D',
      showChart: true,
      width: '100%',
      height: '100%',
      largeChartUrl: '',
      isTransparent: false,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      tabs: [
        {
          title: 'Forex',
          symbols: [
            { s: 'FX:EURUSD', d: 'EUR/USD' },
            { s: 'FX:USDJPY', d: 'USD/JPY' },
            { s: 'FX:GBPUSD', d: 'GBP/USD' },
            { s: 'FX:AUDUSD', d: 'AUD/USD' },
            { s: 'FX:USDCAD', d: 'USD/CAD' }
          ]
        },
        {
          title: 'Indices',
          symbols: [
            { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
            { s: 'FOREXCOM:NSXUSD', d: 'NASDAQ' },
            { s: 'INDEX:NKY', d: 'Nikkei 225' },
            { s: 'INDEX:HSI', d: 'Hang Seng' }
          ]
        },
        {
          title: 'Commodities',
          symbols: [
            { s: 'TVC:GOLD', d: 'Gold' },
            { s: 'TVC:SILVER', d: 'Silver' },
            { s: 'TVC:USOIL', d: 'Crude Oil' }
          ]
        }
      ]
    };
    const encodedConfig = encodeURIComponent(JSON.stringify(config));
    const url = `https://s.tradingview.com/embed-widget/market-overview/?locale=th#${encodedConfig}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Build TradingView Timeline Widget URL for news
   */
  private buildForexCrossRatesUrl(): SafeResourceUrl {
    const config = {
      width: '100%',
      height: '100%',
      currencies: ['EUR', 'USD', 'JPY', 'GBP', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY'],
      isTransparent: false,
      colorTheme: 'light',
      locale: 'en'
    };
    const encodedConfig = encodeURIComponent(JSON.stringify(config));
    const url = `https://s.tradingview.com/embed-widget/forex-cross-rates/?locale=en#${encodedConfig}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
