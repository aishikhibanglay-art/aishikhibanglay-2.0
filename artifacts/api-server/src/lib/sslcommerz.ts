import axios from "axios";

const STORE_ID = process.env["SSLCOMMERZ_STORE_ID"] || "testbox";
const STORE_PASSWORD = process.env["SSLCOMMERZ_STORE_PASSWORD"] || "qwerty";
const IS_LIVE = process.env["SSLCOMMERZ_IS_LIVE"] === "true";

const BASE_URL = IS_LIVE
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

export interface SSLCommerzInitParams {
  tran_id: string;
  total_amount: number;
  currency: "BDT" | "USD";
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  product_name: string;
  product_category: string;
}

export interface SSLCommerzInitResponse {
  status: string;
  GatewayPageURL?: string;
  failedreason?: string;
  sessionkey?: string;
}

export async function initSSLCommerz(params: SSLCommerzInitParams): Promise<SSLCommerzInitResponse> {
  const formData = new URLSearchParams({
    store_id: STORE_ID,
    store_passwd: STORE_PASSWORD,
    tran_id: params.tran_id,
    total_amount: params.total_amount.toString(),
    currency: params.currency,
    success_url: params.success_url,
    fail_url: params.fail_url,
    cancel_url: params.cancel_url,
    ipn_url: params.ipn_url,
    cus_name: params.cus_name,
    cus_email: params.cus_email,
    cus_phone: params.cus_phone || "N/A",
    cus_add1: "Bangladesh",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    product_name: params.product_name,
    product_category: params.product_category,
    product_profile: "non-physical-goods",
    shipping_method: "NO",
    num_of_item: "1",
    weight_of_items: "0",
    product_amount: params.total_amount.toString(),
    vat: "0",
    discount_amount: "0",
    convenience_fee: "0",
  });

  const response = await axios.post<SSLCommerzInitResponse>(
    `${BASE_URL}/gwprocess/v4/api.php`,
    formData.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return response.data;
}

export async function validateSSLCommerz(val_id: string): Promise<{ status: string; amount: string; currency: string; tran_id: string; val_id: string }> {
  const response = await axios.get(`${BASE_URL}/validator/api/validationserverAPI.php`, {
    params: {
      val_id,
      store_id: STORE_ID,
      store_passwd: STORE_PASSWORD,
      format: "json",
    },
  });
  return response.data;
}
