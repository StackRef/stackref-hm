const warn = (...args) => {
  /*
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  */

  console.warn(...args);
};

class GA {
  constructor() {
    this.MEASUREMENT_ID = null;

    this.initialized = false;
  }

  configure(config) {
    this.MEASUREMENT_ID = config.measurementId;
  }

  initialize(config) {
    if (this.initialized) {
      warn('GA can only be initialized once.');
      return;
    }

    if (!document) {
      warn('GA can be initialized only on client side.');
      return;
    }

    if (!config.measurementId) {
      warn('GA requires a Measurement ID to be loaded.');
      return;
    }

    this.configure(config);

    const script1 = document.createElement('script');
    const script2 = document.createElement('script');

    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${this.MEASUREMENT_ID}`;

    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', '${this.MEASUREMENT_ID}');
    `;

    document.head.appendChild(script1);
    document.head.appendChild(script2);
  }

  // eslint-disable-next-line class-methods-use-this
  push(...args) {
    if (!window) {
      warn('GA push works only on client side.');
      return;
    }

    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    window.dataLayer.push(...args);
  }
}

// Singleton
const googleAnalytics = new GA();

export default googleAnalytics;
