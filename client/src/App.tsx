import { useState } from "react";

function Home() {
  return (
    <div>
      <h1>Sākums</h1>
      <p>CRM sistēma darbojas.</p>
    </div>
  );
}

function Trips() {
  return (
    <div>
      <h1>Braucieni</h1>
      <p>Šeit būs braucienu saraksts</p>
    </div>
  );
}

function Users() {
  return (
    <div>
      <h1>Lietotāji</h1>
      <p>Šeit būs lietotāji</p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<"home" | "trips" | "users">("home");

  return (
    <div style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <button onClick={() => setPage("home")}>Sākums</button>{" "}
        <button onClick={() => setPage("trips")}>Braucieni</button>{" "}
        <button onClick={() => setPage("users")}>Lietotāji</button>
      </nav>

      {page === "home" && <Home />}
      {page === "trips" && <Trips />}
      {page === "users" && <Users />}
    </div>
  );
}
