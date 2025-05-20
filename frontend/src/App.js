import { useState, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [products, setProducts] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    checkLogin();
  }, []);

  async function checkLogin() {
    const res = await fetch(`${API_URL}/api/products`, {
      credentials: "include"
    });
    if (res.ok) {
      setLoggedIn(true);
      const data = await res.json();
      setProducts(data);
    }
  }

  async function login(e) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include"
    });
    if (res.ok) {
      setUsername("");
      setPassword("");
      setLoggedIn(true);
      checkLogin();
    }
  }

  async function register(e) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include"
    });
    if (res.ok) {
      alert("Registrierung erfolgreich!");
      setShowRegister(false);
      setUsername("");
      setPassword("");
    }
  }

  async function logout() {
    await fetch(`${API_URL}/api/logout`, {
      method: "POST",
      credentials: "include"
    });
    setLoggedIn(false);
    setProducts([]);
  }

  return (
    <div>
      {!loggedIn ? (
        <div>
          {showRegister ? (
            <form onSubmit={register}>
              <h2>Registrieren</h2>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Benutzername"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort"
              />
              <button>Registrieren</button>
              <p>
                Schon registriert?{" "}
                <button type="button" onClick={() => setShowRegister(false)}>
                  Zum Login
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={login}>
              <h2>Login</h2>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Benutzername"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort"
              />
              <button>Login</button>
              <p>
                Noch kein Account?{" "}
                <button type="button" onClick={() => setShowRegister(true)}>
                  Registrieren
                </button>
              </p>
            </form>
          )}
        </div>
      ) : (
        <div>
          <h2>Produkte</h2>
          <button onClick={logout}>🚪 Logout</button>
          <UploadForm onUploaded={checkLogin} />
          <ul>
            {products.map((p) => (
              <ProductItem key={p._id} product={p} onDeleted={checkLogin} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UploadForm({ onUploaded }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("image", image);

    const res = await fetch(`${API_URL}/api/products`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    if (res.ok) {
      onUploaded();
      setName("");
      setPrice("");
      setImage(null);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="number"
        placeholder="Preis"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        step="0.01"
      />
      <input
        key={Date.now()}
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button>Hinzufügen</button>
    </form>
  );
}

function ProductItem({ product, onDeleted }) {
  async function handleDelete() {
    const res = await fetch(`${API_URL}/api/products/${product._id}`, {
      method: "DELETE",
      credentials: "include"
    });
    if (res.ok) onDeleted();
  }

  return (
    <li>
      <strong>{product.name}</strong> – {product.price} €
      {product.imagePath && (
        <div>
          <img src={product.imagePath} alt={product.name} width={150} />
        </div>
      )}
      <button onClick={handleDelete}>🗑️ Löschen</button>
    </li>
  );
}

export default App;
