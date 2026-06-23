import { stackrefConfig } from 'src/config';

export async function StackCashPurchase(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/stackCashPurchase`;
  const user = payload.user;

  const purchasePayload = {
    action: payload.action,
    purchase_details: {
      method: payload.method,
      quantity: payload.quantity,
    },
  };

  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.token}`,
      'Content-Type': 'application/json',
      'x-sr-application': `SR/UI/${stackrefConfig.uiVersion}`,
    },
    mode: 'cors',
    body: JSON.stringify(purchasePayload),
  };

  try {
    const response = await fetch(srAPIUrl, requestOptions);
    if (!response.ok) {
      throw await response.text();
    }
    const data = await response.json();
    _callback(data);
  } catch (error) {
    console.error(`>> StackCashPurchase: ${error}`);
    _callback(JSON.parse(error));
  }
}

export default StackCashPurchase;
