/**
 * Centralized strings for the Wallet / Offline Mountain Pay flows.
 *
 * Kept separate from `lib/strings.ts` so this module never edits planner /
 * hotels / onboarding copy. English-only for the demo. If the project later
 * wires payment strings into the shared i18n, point these keys there.
 */

export const PAYMENT_STRINGS = {
  walletTitle: 'Tabylga Wallet',
  walletSubtitle: 'Powered by KICB Demo',
  currency: 'KGS',

  statusOnline: 'Online · KICB Demo',
  statusOfflineReady: 'Offline Pay ready',
  statusNoOfflineReserve: 'Offline Pay not activated',

  totalBalance: 'Remaining spendable balance',
  availableOnline: 'Available online',
  offlineReserve: 'Reserved for future offline payments',
  lockedOffline: 'Already deducted and waiting',
  pendingSync: 'Offline payments waiting for internet',

  actionTopUp: 'Top up',
  actionPayOnlineQr: 'Pay Online QR',
  actionActivateOffline: 'Activate Offline Pay',
  actionPayOffline: 'Pay Offline',
  actionMerchantMode: 'Merchant Mode',
  actionSync: 'Sync Payments',

  recentTitle: 'Recent activity',
  emptyRecent: 'No payments yet. Top up your wallet to start.',

  explanationTitle: 'Offline Mountain Pay',
  explanationBody:
    'Offline Mountain Pay lets you reserve money before going to remote areas. When there is no internet, you can pay verified merchants with a KICB Demo signed QR or Bluetooth token.',

  prototypeNoteTitle: 'Prototype note',
  prototypeNoteBody:
    'In production, offline tokens would be issued and settled by a licensed banking partner. This prototype uses KICB Demo tokens.',

  comingNextTitle: 'Coming in next phase',
  comingNextBody: 'This screen will be enabled in a later integration step.',

  syncNothingTitle: 'Nothing to sync',
  syncNothingBody: 'You have no offline payments waiting to settle.',
  syncDoneTitle: 'Payments synced',
  syncDoneBody: (count: number, amount: string) =>
    `Settled ${count} offline payment${count === 1 ? '' : 's'} (${amount} KGS) in demo mode.`,
  syncFailedTitle: 'Sync failed',

  txTypeLabels: {
    top_up: 'Top up',
    online_qr_payment: 'Online QR payment',
    offline_reserve: 'Offline Pay activated',
    offline_qr_payment: 'Offline QR payment',
    offline_bluetooth_payment: 'Bluetooth payment',
    sync: 'Sync settlement',
  } as const,

  statusLabels: {
    completed_online: 'Completed online',
    waiting_merchant_acceptance: 'Waiting merchant',
    accepted_offline: 'Accepted offline',
    synced: 'Synced',
    expired: 'Expired',
    failed_demo: 'Failed (demo)',
  } as const,

  // Top up screen
  topUpTitle: 'Top up wallet',
  topUpAmountLabel: 'Choose amount',
  topUpCustomChip: 'Custom',
  topUpCustomLabel: 'Custom amount (KGS)',
  topUpMethodLabel: 'Payment method',
  topUpMethodCard: 'International card demo',
  topUpMethodCardSub: 'Visa, Mastercard, UnionPay (demo)',
  topUpMethodLocalQr: 'Local QR demo',
  topUpMethodLocalQrSub: 'MBank-style QR top-up (demo)',
  topUpCardNumber: 'Card number',
  topUpCardExpiry: 'MM / YY',
  topUpCardCvc: 'CVC',
  topUpConfirm: (amount: string) => `Top up ${amount} KGS`,
  topUpProcessing: 'Processing top up…',
  topUpSuccessTitle: 'Top up complete',
  topUpInvalidAmount: 'Enter a valid amount in KGS.',

  // Pay online QR screen
  payTitle: 'Pay Online QR',
  payScannerHint: 'Scan a merchant QR or pick from the list below',
  payMerchantLabel: 'Choose merchant',
  payAmountLabel: 'Amount (KGS)',
  payAmountPlaceholder: '0',
  payConfirm: (amount: string) => `Pay ${amount} KGS`,
  payProcessing: 'Confirming payment…',
  paySuccessTitle: 'Payment sent',
  payInsufficient: 'Amount exceeds available online balance.',
  payNoMerchant: 'Please choose a merchant first.',
  payMerchantNotSupported: 'This merchant does not support online QR.',

  // Activate Offline Pay screen
  activateTitle: 'Activate Offline Pay',
  activateSubtitle:
    'Reserve part of your balance before going to remote places. KICB Demo will issue signed offline tokens for this reserve.',
  activateAmountLabel: 'Reserve amount',
  activateCustomLabel: 'Custom amount (KGS)',
  activateHowTitle: 'How Offline Pay works',
  activateHow1: 'Reserve money while you still have internet.',
  activateHow2: 'KICB Demo issues signed offline tokens.',
  activateHow3:
    'In remote areas, you can pay verified merchants by QR or Bluetooth demo.',
  activateSafetyNote:
    'Offline payments are backed by reserved balance. After a merchant accepts a token, the customer cannot cancel it.',
  activatePrototypeNote:
    'This is a demo. In production, offline tokens would be issued and settled by a licensed banking partner.',
  activateConfirm: (amount: string) => `Activate Offline Pay · ${amount} KGS`,
  activateProcessing: 'Issuing KICB Demo tokens…',
  activateSuccessTitle: 'KICB Demo tokens issued',
  activateSuccessSub: 'Offline Pay is ready',
  activateReservedAmount: 'Reserved amount',
  activateNewReserve: 'New offline reserve',
  activateNewAvailable: 'New available online',
  activateStatusReady: 'Status: Offline Pay ready',
  activateNeedTopUp: 'Top up your wallet before activating Offline Pay.',
  activateExceeds: 'Amount exceeds available online balance.',
  activatePayLater: 'Pay Offline later',

  // Pay Offline screen
  payOfflineTitle: 'Pay Offline',
  payOfflineSubtitle:
    'Use this when you have no internet. Enter the merchant’s amount and generate a KICB Demo signed QR.',
  payOfflineStatusLabel: 'Offline status',
  payOfflineNoReserveTitle: 'Activate Offline Pay first',
  payOfflineNoReserveBody:
    'Reserve money while you still have internet before using offline payments.',
  payOfflineGoActivate: 'Activate Offline Pay',
  payOfflineAmountLabel: 'Amount (KGS)',
  payOfflineAmountInvalid: 'Enter a valid amount in KGS.',
  payOfflineExceeds: 'Amount exceeds offline reserve.',
  payOfflineWarningTitle: 'Cannot be cancelled',
  payOfflineWarningBody:
    'You are creating an offline payment QR. After the merchant accepts it, this payment cannot be cancelled. It will sync when internet is available.',
  payOfflineTrustBody:
    'This QR is backed by your reserved offline balance and marked as a KICB Demo signed token.',
  payOfflineGenerate: (amount: string) => `Generate Offline QR · ${amount} KGS`,
  payOfflineProcessing: 'Generating KICB Demo signed token…',

  qrReadyTitle: 'Offline QR ready',
  qrLabelAmount: 'Amount',
  qrLabelCurrency: 'Currency',
  qrLabelIssuer: 'Issuer',
  qrLabelSignature: 'Signature',
  qrLabelStatus: 'Status',
  qrLabelTokenId: 'Token ID',
  qrLabelTransactionId: 'Transaction ID',
  qrLabelExpiresAt: 'Expires at',
  qrIssuerKicbDemo: 'KICB Demo',
  qrSignatureReady: 'Ready',
  qrStatusWaiting: 'Waiting for merchant scan',
  qrPlaceholder: 'KICB DEMO QR',
  qrPayloadPreviewLabel: 'Payload preview',
  qrOpenMerchantMode: 'Open Merchant Mode',
  qrSendBluetooth: 'Send via Bluetooth demo',
  qrMerchantPhase6Title: 'Merchant Mode',
  qrMerchantPhase6Body:
    'Merchant scan + accept will be enabled in the next phase. The QR you just generated is already saved and visible to the merchant.',
  qrBluetoothPhase8Title: 'Bluetooth demo',
  qrBluetoothPhase8Body:
    'Bluetooth demo will be connected to this token in a later phase.',

  // Generic
  backToWallet: 'Back to Wallet',
  receiptCode: 'Receipt code',
  receiptMethod: 'Method',
  receiptMerchant: 'Merchant',
  receiptStatus: 'Status',
  receiptAmount: 'Amount',
};

export function formatKgs(value: number): string {
  if (!Number.isFinite(value)) return '0 KGS';
  return `${Math.round(value).toLocaleString('en-US')} KGS`;
}
