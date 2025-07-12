import { PinataSDK } from "pinata";



const JWT_PINATA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkY2FkMTBiOS1kNDliLTQzZmQtYjIzNy0yM2RkMjJlMTJlZGIiLCJlbWFpbCI6InZhbHlhbmRyaWFuaW1wYW5hbmFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjE5OTJhN2U2YmZiMzU0NmM1NWNkIiwic2NvcGVkS2V5U2VjcmV0IjoiZDlkYTk3ZTliZTk0ZGViMTM0ZDliYmYyY2M0ZjEzYWIwM2EyYmRhMTI0NWY3YjQ3ZDkzYjljY2NhN2ZmOTcwMSIsImV4cCI6MTc4MzUxODQ2NH0.tSpNJQOCyh8-PB5nH_cvZrS1xU1ZmhZkY0chq9uIT4M";

const GATEWAY_PINATA = "https://bronze-kind-spider-769.mypinata.cloud";

const myPinataSDK = new PinataSDK({
    pinataJwt: JWT_PINATA,
    pinataGateway: GATEWAY_PINATA,
});

export default myPinataSDK;

export const uploadFile = async (file, metadata) => {
    try {
        const res = await myPinataSDK.upload.public.file(file).keyvalues(metadata);

        // si le fichier a ete deja dans ipfs, on declenche une erreur
        if (res.is_duplicate) {
            throw new Error("Le certificat phytosanitaire a déjà été téléchargé.");
        }

        return res;
    } catch (e) {
        console.error("Erreur lors de l'upload du fichier : ", e.message);
        if (e.message === "Le certificat phytosanitaire a déjà été téléchargé.")
            alert("Le certificat phytosanitaire a déjà été utilisé.");
        else
            alert("Erreur lors de l'upload du certificat. Veuillez réessayer plus tard.");
        return false;
    }
};