import { handleApi } from "../../server/api";
export const onRequestGet = ({
  request,
  env,
}: {
  request: Request;
  env: { BRAPI_API_KEY?: string };
}) => handleApi(request, env.BRAPI_API_KEY);
