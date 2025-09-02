import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDetailsExpeditionByRef } from "../../utils/contrat/exportateurClient";

const DetailsExpedition = ({}) => {
  const { reference } = useParams();
  const [expedition, setExpedition] = useState({});

  const chargerDetailsExpedition = async () => {
    const detailsExpedition = await getDetailsExpeditionByRef(reference);
    setExpedition(detailsExpedition);
  };

  useEffect(() => {
    chargerDetailsExpedition();
  }, []);
};

export default DetailsExpedition;
