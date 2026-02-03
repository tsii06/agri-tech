import { PinataSDK } from "pinata";
import config from "../config.js";

const myPinataSDK = new PinataSDK({
  pinataJwt: config.pinataJwt,
  pinataGateway: config.pinataGateway,
});

export default myPinataSDK;