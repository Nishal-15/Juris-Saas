import { useEffect, useState } from "react";
import API from "../api/axios";

function Lawyers() {

  const [lawyers, setLawyers] = useState([]);

  useEffect(() => {
    API.get("/lawyers")
      .then((res) => setLawyers(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Lawyers</h2>

      {lawyers.map((lawyer) => (
        <div key={lawyer._id}>
          <h3>{lawyer.name}</h3>
          <p>{lawyer.specialization}</p>
        </div>
      ))}
    </div>
  );
}

export default Lawyers;