import soap from "soap";
import type { NumberWordsGateway } from "../../domain/invoice/invoice.types.js";
const WSDL =
  "https://www.dataaccess.com/webservicesserver/NumberConversion.wso?WSDL";
export class DataFlexNumberWordsGateway implements NumberWordsGateway {
  async toWords(value: number) {
    const client = await soap.createClientAsync(WSDL, {
      wsdl_options: { timeout: 5000 },
    });
    const [response] = await client.NumberToWordsAsync({
      ubiNum: Math.round(value),
    });
    return String(response.NumberToWordsResult).trim();
  }
}
