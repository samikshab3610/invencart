// Dynamically loads the Razorpay checkout script.
// Returns a function that opens the Razorpay payment popup.
export function useRazorpay() {
  function loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      // If script already loaded, resolve immediately
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';

      // Script loaded successfully
      script.onload = () => resolve(true);

      // Script failed to load (no internet, blocked, etc.)
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }

  // Opens the Razorpay checkout popup with the given options.
  // Returns a promise that resolves when payment succeeds
  // or rejects when payment fails/is dismissed.
  async function openCheckout(options: {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
      name?: string;
      email?: string;
    };
    onSuccess: (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => void;
    onDismiss: () => void;
  }) {
    const loaded = await loadScript();

    if (!loaded) {
      alert('Failed to load payment gateway. Please check your internet connection.');
      return;
    }

    // window.Razorpay is available after the script loads
    const rzp = new (window as any).Razorpay({
      key: options.key,
      amount: options.amount,
      currency: options.currency,
      name: options.name,
      description: options.description,
      order_id: options.order_id,
      prefill: options.prefill,
      theme: { color: '#4F46E5' }, // indigo — matches our app color
      modal: {
        // Called when user closes the popup without paying
        ondismiss: options.onDismiss,
      },
      handler: options.onSuccess, // called when payment succeeds
    });

    rzp.open();
  }

  return { openCheckout };
}