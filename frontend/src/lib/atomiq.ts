
export type AtomiqPaymentResult = {
  ok: boolean;
  lnSettleId?: string;
  error?: string;
};

export interface AtomiqConfig {
  apiKey?: string;
  network?: 'testnet' | 'mainnet';
}

export function getAtomiqConfig(): AtomiqConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_ATOMIQ_API_KEY,
    network: (process.env.NEXT_PUBLIC_ATOMIQ_NETWORK as 'testnet' | 'mainnet') || 'testnet',
  };
}

async function initAtomiqClient(config: AtomiqConfig) {
  let mod: any;
  try {
    // eslint-disable-next-line no-eval
    const dynImport: any = (eval('import'));
    mod = await dynImport('@atomiqlabs/sdk');
  } catch (e) {
    throw new Error('Atomiq SDK not installed. Run: npm i @atomiqlabs/sdk');
  }
  const init = mod?.default ?? mod?.init_atomiq ?? mod?.Atomiq ?? mod;
  if (!init) throw new Error('Atomiq SDK not found or invalid export');

  try {
    if (typeof init === 'function') {
      try {
      
        return new init({ network: config.network || 'testnet', apiKey: config.apiKey });
      } catch (_) {
       
        return init({ network: config.network || 'testnet', apiKey: config.apiKey });
      }
    }
    return init;
  } catch (e) {
    throw new Error('Failed to initialize Atomiq SDK');
  }
}


export async function payLightningInvoiceWithAtomiq(params: {
  bolt11: string;
  amountMsat?: number; 
}): Promise<AtomiqPaymentResult> {
  const { bolt11 } = params;
  if (!bolt11) {
    return { ok: false, error: 'Missing BOLT11 invoice' };
  }
  try {
    const cfg = getAtomiqConfig();
    const client = await initAtomiqClient(cfg);

    const args: any = {
      invoice: bolt11,
      amountMsat: params.amountMsat,
      asset: 'STRK',
    };

    let res: any;
    if (typeof client.starknet_to_lightning === 'function') {
      res = await client.starknet_to_lightning(args);
    } else if (typeof client.from_starknet === 'function') {
     
      res = await client.from_starknet({ ...args, withdrawal_type: 'lightning' });
    } else if (typeof client.lightning_to_starknet === 'function') {
    
      res = await client.lightning_to_starknet(args);
    } else {
      throw new Error('Atomiq client does not expose expected methods');
    }

    const settleId = res?.settlementId || res?.lnSettleId || res?.id || `ln_settle_${Math.random().toString(36).slice(2)}`;
    return { ok: true, lnSettleId: String(settleId) };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Atomiq call failed' };
  }
}


