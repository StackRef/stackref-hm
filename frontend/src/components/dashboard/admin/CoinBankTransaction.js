import { stackrefConfig } from 'src/config';

export async function CoinBankTransaction(payload, _callback) {
  const srAPIUrl = `${stackrefConfig.apiUrl}/coinBankUpdate`;
  const user = payload.user;

  const createPayload = {
    action: payload.action,
    transaction: {
      sending_entity_uuid: payload.sending_entity_uuid,
      receiving_entity_uuid: payload.receiving_entity_uuid,
      transaction_value: payload.transaction_value,
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
    body: JSON.stringify(createPayload),
  };

  try {
    await fetch(srAPIUrl, requestOptions)
      .then((response) => {
        if (!response.ok) throw new Error(response.status);
        else return response.json();
      })
      .then((data) => {
        _callback(data);
      })
      .catch((error) => {
        console.error(`>> CoinBankTransaction fetch: ${error}`);
        throw error;
      });
  } catch (error) {
    console.error(`>> CoinBankTransaction: ${error}`);
    _callback(null);
  }
}

export default CoinBankTransaction;
